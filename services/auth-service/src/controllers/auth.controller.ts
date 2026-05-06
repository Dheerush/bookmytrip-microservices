
import { Request, Response } from 'express';
import crypto from 'crypto';
import { registerUser, loginUser } from '../services/auth.service';
import {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken
} from '../services/token.service';
import { RefreshToken } from '../models/RefreshToken';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { generateCsrfToken } from '../utils/csrf';
import {
  generateOtp,
  storeOtp,
  verifyOtp,
  deleteOtp,
  resolveSession,
} from '../services/otp.service';
import { User } from '../models/User';
import { publishEvent, publishUserProfileEvent } from '../config/rabbitmq';
import { redisClient } from '../config/redis';
import { hashPassword } from '../utils/hash';
import { v4 as uuidv4 } from 'uuid';


/** ─────────────────────────────────────────────────────────────────────────
 *  📝  REGISTER
 *  ─────────────────────────────────────────────────────────────────────────
 *  Happy path  → creates user, sends OTP, returns sessionToken
 *  EMAIL_UNVERIFIED → user exists but never verified: re-sends OTP, returns
 *                     a new sessionToken so frontend can go straight to /otp
 *  EMAIL_EXISTS     → verified user already: tell them to log in
 * ────────────────────────────────────────────────────────────────────────── */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password, phone, role } = req.body;

  let userId: string;
  let userEmail: string;

  try {
    const user = await registerUser(fullName, email, password, phone, role);
    userId    = user.id;
    userEmail = user.email;
  } catch (err: any) {
    // Unverified account already exists → re-send OTP, return sessionToken
    if (err.code === 'EMAIL_UNVERIFIED') {
      const { userId: existingId, email: existingEmail } = err.data as {
        userId: string; email: string;
      };

      const otp          = generateOtp();
      const sessionToken = await storeOtp(existingId, otp);

      await publishEvent({
        type: 'SEND_OTP',
        data: { email: existingEmail, otp },
      });

      // 202 Accepted — not a new resource, but action was taken
      return res.status(202).json(
        apiResponse(
          { sessionToken, code: 'EMAIL_UNVERIFIED' },
          'Account pending verification. A new OTP has been sent to your email.'
        )
      );
    }

    // Re-throw everything else (EMAIL_EXISTS, validation errors, etc.)
    throw err;
  }

  // New user — generate + send OTP
  const otp          = generateOtp();
  const sessionToken = await storeOtp(userId, otp);

  await publishEvent({
    type: 'SEND_OTP',
    data: { email: userEmail, otp },
  });

  res.status(201).json(
    apiResponse(
      { sessionToken },
      'Registration successful. Please verify the OTP sent to your email.'
    )
  );
});


/** ─────────────────────────────────────────────────────────────────────────
 *  🔐  VERIFY EMAIL OTP
 *  ─────────────────────────────────────────────────────────────────────────
 *  Body: { sessionToken, otp }
 *  – sessionToken resolves to userId server-side (frontend never sends userId/email)
 *  – Tracks attempts; locks after MAX_ATTEMPTS wrong guesses
 *  – Deletes OTP + session on success (single use)
 * ────────────────────────────────────────────────────────────────────────── */
export const verifyEmailOtp = asyncHandler(async (req: Request, res: Response) => {
  const { sessionToken, otp } = req.body;

  if (!sessionToken || !otp) {
    throw new AppError('Session token and OTP are required', 400, 'MISSING_FIELDS');
  }

  // Resolve token → userId (if token is expired/invalid this returns null)
  const userId = await resolveSession(sessionToken);

  if (!userId) {
    throw new AppError(
      'Session expired or invalid. Please register again.',
      401,
      'INVALID_SESSION'
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (user.isVerified) {
    throw new AppError('Email already verified', 400, 'ALREADY_VERIFIED');
  }

  // Verify OTP (handles hashing + attempt counting internally)
  const result = await verifyOtp(userId, otp);

  if (!result.valid) {
    switch (result.reason) {
      case 'TOO_MANY_ATTEMPTS':
        throw new AppError(
          'Too many incorrect attempts. Please request a new OTP.',
          429,
          'TOO_MANY_ATTEMPTS'
        );
      case 'EXPIRED':
        throw new AppError(
          'OTP has expired. Please request a new one.',
          410,
          'OTP_EXPIRED'
        );
      case 'WRONG_OTP':
        throw new AppError(
          `Incorrect OTP. ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? '' : 's'} remaining.`,
          400,
          'WRONG_OTP',
          { attemptsLeft: result.attemptsLeft }
        );
      default:
        throw new AppError('Verification failed', 400, 'VERIFICATION_FAILED');
    }
  }

  // ✅ OTP is correct — mark user as verified
  user.isVerified = true;
  await user.save();

  // Delete OTP + session (single use — can never be replayed)
  await deleteOtp(userId, sessionToken);

  const verifiedEvent = {
    type: 'USER_VERIFIED',
    data: {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };

  await publishEvent(verifiedEvent);
  await publishUserProfileEvent(verifiedEvent);

  res.json(
    apiResponse(null, 'Email verified successfully. You can now log in.')
  );
});


/** ─────────────────────────────────────────────────────────────────────────
 *  🔁  RESEND OTP
 *  ─────────────────────────────────────────────────────────────────────────
 *  Body: { sessionToken }
 *  – Uses existing session to identify the user (no email in body)
 *  – Issues a new sessionToken and invalidates the old one
 * ────────────────────────────────────────────────────────────────────────── */
export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { sessionToken } = req.body;

  if (!sessionToken) {
    throw new AppError('Session token is required', 400, 'MISSING_FIELDS');
  }

  const userId = await resolveSession(sessionToken);

  if (!userId) {
    throw new AppError(
      'Session expired or invalid. Please register again.',
      401,
      'INVALID_SESSION'
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (user.isVerified) {
    throw new AppError('Email already verified', 400, 'ALREADY_VERIFIED');
  }

  // storeOtp issues a fresh OTP + new sessionToken, resets attempt counter
  const otp            = generateOtp();
  const newSessionToken = await storeOtp(userId, otp);

  await publishEvent({
    type: 'SEND_OTP',
    data: { email: user.email, otp },
  });

  res.json(
    apiResponse(
      { sessionToken: newSessionToken },
      'A new OTP has been sent to your email.'
    )
  );
});


/** ─────────────────────────────────────────────────────────────────────────
 *  🔐  LOGIN  (only verified users)
 * ────────────────────────────────────────────────────────────────────────── */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await loginUser(email, password);

  if (!user.isVerified) {
    // Don't leave unverified users stuck — send them a fresh OTP session
    const otp          = generateOtp();
    const sessionToken = await storeOtp(user._id.toString(), otp);

    await publishEvent({
      type: 'SEND_OTP',
      data: { email: user.email, otp },
    });

    throw new AppError(
      'Please verify your email first. A new OTP has been sent.',
      403,
      'EMAIL_UNVERIFIED',
      { sessionToken }  // frontend can redirect straight to /otp
    );
  }

  const accessToken  = generateAccessToken(user.id, user.role, user.email, user.fullName);
  const refreshToken = await generateRefreshToken(user.id);

  await publishEvent({
    type: 'LOGIN_SUCCESS',
    data: {
      userId:    user.id,
      email:     user.email,
      loginTime: new Date().toISOString(),
      ip:        req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  const csrfToken = generateCsrfToken();

  const safeUser = {
    id:    user.id,
    email: user.email,
    role:  user.role,
  };

  res
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    })
    .cookie('csrfToken', csrfToken, {
      httpOnly: false,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })
    .status(200)
    .json(apiResponse({ user: safeUser, accessToken }, 'Login successful'));
});


/** ─────────────────────────────────────────────────────────────────────────
 *  🔄  REFRESH TOKEN
 * ────────────────────────────────────────────────────────────────────────── */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400);
  }

  let newRefreshToken: string;
  try {
    newRefreshToken = await rotateRefreshToken(refreshToken);
  } catch {
    res.clearCookie('refreshToken').clearCookie('csrfToken');
    throw new AppError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED');
  }

  const tokenDoc        = await RefreshToken.findOne({ token: newRefreshToken });

  if (!tokenDoc) {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = await User.findById(tokenDoc.userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const accessToken = generateAccessToken(user.id, user.role, user.email, user.fullName);

  res
    .cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    })
    .json(apiResponse({ accessToken }, 'Token refreshed'));
});


/** ─────────────────────────────────────────────────────────────────────────
 *  🚪  LOGOUT
 * ────────────────────────────────────────────────────────────────────────── */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400);
  }

  await RefreshToken.deleteOne({ token: refreshToken });

  res
    .clearCookie('refreshToken')
    .clearCookie('csrfToken')
    .json(apiResponse(null, 'Logged out successfully'));
});


/** ─────────────────────────────────────────────────────────────────────────
 *  🔑  FORGOT PASSWORD
 * ────────────────────────────────────────────────────────────────────────── */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always return same message to prevent user enumeration
  if (!user) {
    return res.json(apiResponse(null, 'If that email exists, a reset link has been sent.'));
  }

  const rawToken    = uuidv4();
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  await redisClient.set(`reset:${hashedToken}`, user.id, 'EX', 600);

  await publishEvent({
    type: 'PASSWORD_RESET_REQUEST',
    data: { email: user.email, token: rawToken },
  });

  res.json(apiResponse(null, 'If that email exists, a reset link has been sent.'));
});


/** ─────────────────────────────────────────────────────────────────────────
 *  🔑  RESET PASSWORD
 * ────────────────────────────────────────────────────────────────────────── */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const userId      = await redisClient.get(`reset:${hashedToken}`);

  if (!userId) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  // Invalidate reset token + all refresh tokens (force re-login everywhere)
  await redisClient.del(`reset:${hashedToken}`);
  await RefreshToken.deleteMany({ userId: user.id });

  await publishEvent({
    type: 'PASSWORD_CHANGED',
    data: { email: user.email, userId: user.id },
  });

  res.json(apiResponse(null, 'Password reset successful.'));
});


/** ─────────────────────────────────────────────────────
 *  📧  REQUEST VERIFICATION  (no session token needed)
 *  For users who registered but never verified and their
 *  session has long expired. They provide only their email.
 *  Rate limited to prevent abuse.
 * ───────────────────────────────────────────────────── */
export const requestVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400, 'MISSING_FIELDS');
  }

  const user = await User.findOne({ email });

  // Always return same message — prevents user enumeration
  // (attacker can't tell if email exists or not)
  const genericMessage = 'If an unverified account exists, a new OTP has been sent.';

  if (!user) {
    return res.json(apiResponse(null, genericMessage));
  }

  if (user.isVerified) {
    // Don't reveal they're verified — same message, just don't send OTP
    return res.json(apiResponse(null, genericMessage));
  }

  // Generate fresh OTP + session token
  const otp          = generateOtp();
  const sessionToken = await storeOtp(user._id.toString(), otp);

  await publishEvent({
    type: 'SEND_OTP',
    data: { email: user.email, otp },
  });

  // Return sessionToken so frontend can redirect to /otp
  return res.json(
    apiResponse(
      { sessionToken },
      genericMessage
    )
  );
});



