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
  deleteOtp
} from '../services/otp.service';
import { User } from '../models/User';
import { publishEvent } from '../config/rabbitmq';
import { redisClient } from '../config/redis';
import { hashPassword } from '../utils/hash';
import { v4 as uuidv4 } from 'uuid';




/** ===================================================== 📝 Register (STRICT OTP) ============================================================= */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  const user = await registerUser(email, password, role);

  // 🚫 DO NOT generate tokens here

  const otp = generateOtp();

  await storeOtp(user.id, otp);

  await publishEvent({
    type: 'SEND_OTP',
    data: {
      email: user.email,
      otp
    }
  });

  res.status(201).json(
    apiResponse(
      null,
      'Registration successful. Please verify OTP sent to your email.'
    )
  );
});

/** ====================================================== 🔐 Verify OTP ============================================================= */
export const verifyEmailOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isValid = await verifyOtp(user.id, otp);

  if (!isValid) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  user.isVerified = true;
  await user.save();
  await publishEvent({
    type: 'USER_VERIFIED',
    data: {
      email: user.email
    }
  });

  await deleteOtp(user.id);

  res.json(
    apiResponse(null, 'Email verified successfully. You can now login.')
  );
});

/** =======================================================🔁 Resend OTP =============================================================== */
export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isVerified) {
    throw new AppError('Email already verified', 400);
  }

  // 🔐 Generate new OTP
  const otp = generateOtp();

  // Store in Redis (overwrites previous OTP)
  await storeOtp(user.id, otp);

  // Publish event to notification-service
  await publishEvent({
    type: 'SEND_OTP',
    data: {
      email: user.email,
      otp
    }
  });

  res.json(
    apiResponse(null, 'New OTP sent successfully')
  );
});

/** ====================================================== 🔐 Login (Only if Verified) =================================================== */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await loginUser(email, password);

  if (!user.isVerified) {
    throw new AppError('Please verify your email first', 403);
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);

  await publishEvent({
    type: 'LOGIN_SUCCESS',
    data: {
      email: user.email,
      loginTime: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  const csrfToken = generateCsrfToken();

  const safeUser = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  res
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    .cookie('csrfToken', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
    .status(200)
    .json(
      apiResponse(
        { user: safeUser, accessToken },
        'Login successful'
      )
    );
});

/** ======================================================== 🔄 Refresh Token ============================================================= */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400);
  }

  const newRefreshToken = await rotateRefreshToken(refreshToken);

  const tokenDoc = await RefreshToken.findOne({ token: newRefreshToken });

  if (!tokenDoc) {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = await User.findById(tokenDoc.userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const accessToken = generateAccessToken(user.id, user.role);

  res
    .cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    .json(
      apiResponse(
        { accessToken },
        'Token refreshed'
      )
    );
});

/** ========================================================= 🚪 Logout =================================================================== */
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

/** ======================================================== Forgot ======================================================== */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.json(apiResponse(null, 'If email exists, reset link will be sent'));
  }

  const rawToken = uuidv4();

  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  await redisClient.set(
    `reset:${hashedToken}`,
    user.id,
    'EX',
    600
  );


  await publishEvent({
    type: 'PASSWORD_RESET_REQUEST',
    data: {
      email: user.email,
      token: rawToken
    }
  });

  res.json(
    apiResponse(null, 'If email exists, reset link will be sent')
  );
});

/**============================================================= Reset Password =========================================================== */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as {
  token: string;
  newPassword: string;
};

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const userId = await redisClient.get(`reset:${hashedToken}`);

  if (!userId) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  await redisClient.del(`reset:${hashedToken}`);

  await RefreshToken.deleteMany({ userId: user.id });

  await publishEvent({
    type: 'PASSWORD_RESET_SUCCESS',
    data: {
      email: user.email
    }
  });

  res.json(apiResponse(null, 'Password reset successful'));
});

