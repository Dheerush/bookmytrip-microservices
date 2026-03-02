import { redisClient } from '../config/redis';
import crypto from 'crypto';

const OTP_TTL = 60; // seconds

export const generateOtp = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export const storeOtp = async (userId: string, otp: string) => {
  await redisClient.set(
    `otp:${userId}`,
    otp,
    'EX',
    OTP_TTL
  );
};

export const verifyOtp = async (userId: string, otp: string) => {
  const storedOtp = await redisClient.get(`otp:${userId}`);

  if (!storedOtp) {
    return false;
  }

  return storedOtp === otp;
};

export const deleteOtp = async (userId: string) => {
  await redisClient.del(`otp:${userId}`);
};