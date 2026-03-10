// import { redisClient } from '../config/redis';
// import crypto from 'crypto';

// const OTP_TTL = 60; // seconds

// export const generateOtp = (): string => {
//   return crypto.randomInt(100000, 999999).toString();
// };

// export const storeOtp = async (userId: string, otp: string) => {
//   await redisClient.set(
//     `otp:${userId}`,
//     otp,
//     'EX',
//     OTP_TTL
//   );
// };

// export const verifyOtp = async (userId: string, otp: string) => {
//   const storedOtp = await redisClient.get(`otp:${userId}`);

//   if (!storedOtp) {
//     return false;
//   }

//   return storedOtp === otp;
// };

// export const deleteOtp = async (userId: string) => {
//   await redisClient.del(`otp:${userId}`);
// };


import { redisClient } from '../config/redis';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// ── Constants ──────────────────────────────────────────────────────────────
const OTP_TTL_SECONDS   = 2 * 60;   // (OTP valid for 2 minutes)
const MAX_ATTEMPTS      = 5;          // lock after 5 wrong guesses
const SESSION_TTL       = 10 * 60;   // session token lives same as OTP
const BCRYPT_ROUNDS     = 10;

// ── Redis key helpers ──────────────────────────────────────────────────────
const otpKey      = (userId: string) => `otp:${userId}`;
const attemptsKey = (userId: string) => `otp_attempts:${userId}`;
const sessionKey  = (token: string)  => `otp_session:${token}`;

// ── Generate a 6-digit OTP ─────────────────────────────────────────────────
export const generateOtp = (): string => {
  // crypto.randomInt is cryptographically secure
  return crypto.randomInt(100000, 999999).toString();
};

// ── Store OTP (hashed) + return a session token ────────────────────────────
// The session token is what the frontend stores (in sessionStorage).
// It maps back to the userId server-side so the frontend never sends userId/email.
export const storeOtp = async (
  userId: string,
  otp: string
): Promise<string> => {
  // Hash the OTP before storing — plain text OTPs in Redis are a liability
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);

  // Store hashed OTP
  await redisClient.set(otpKey(userId), otpHash, 'EX', OTP_TTL_SECONDS);

  // Reset attempt counter
  await redisClient.del(attemptsKey(userId));

  // Generate an opaque session token (this goes to the frontend)
  const sessionToken = crypto.randomBytes(32).toString('hex');

  // Map sessionToken → userId (server-side only)
  await redisClient.set(sessionKey(sessionToken), userId, 'EX', SESSION_TTL);

  return sessionToken;
};

// ── Resolve session token → userId ─────────────────────────────────────────
// Returns null if token is missing or expired
export const resolveSession = async (sessionToken: string): Promise<string | null> => {
  if (!sessionToken) return null;
  const userId = await redisClient.get(sessionKey(sessionToken));
  return userId ?? null;
};

// ── Verify OTP (with attempt tracking) ────────────────────────────────────
export type OtpVerifyResult =
  | { valid: true }
  | { valid: false; reason: 'INVALID_SESSION' }
  | { valid: false; reason: 'EXPIRED' }
  | { valid: false; reason: 'TOO_MANY_ATTEMPTS' }
  | { valid: false; reason: 'WRONG_OTP'; attemptsLeft: number };

export const verifyOtp = async (
  userId: string,
  otp: string
): Promise<OtpVerifyResult> => {
  // Check attempt count first — don't even hit the OTP if locked
  const attemptsRaw = await redisClient.get(attemptsKey(userId));
  const attempts    = attemptsRaw ? parseInt(attemptsRaw, 10) : 0;

  if (attempts >= MAX_ATTEMPTS) {
    return { valid: false, reason: 'TOO_MANY_ATTEMPTS' };
  }

  // Fetch stored hash
  const storedHash = await redisClient.get(otpKey(userId));

  if (!storedHash) {
    return { valid: false, reason: 'EXPIRED' };
  }

  // Compare submitted OTP against hash
  const isMatch = await bcrypt.compare(otp, storedHash);

  if (!isMatch) {
    // Increment attempt counter (TTL matches OTP TTL)
    await redisClient.set(
      attemptsKey(userId),
      (attempts + 1).toString(),
      'EX',
      OTP_TTL_SECONDS
    );

    const attemptsLeft = MAX_ATTEMPTS - (attempts + 1);
    return { valid: false, reason: 'WRONG_OTP', attemptsLeft };
  }

  return { valid: true };
};

// ── Delete OTP + session after successful verification ─────────────────────
export const deleteOtp = async (userId: string, sessionToken?: string) => {
  await redisClient.del(otpKey(userId));
  await redisClient.del(attemptsKey(userId));
  if (sessionToken) {
    await redisClient.del(sessionKey(sessionToken));
  }
};