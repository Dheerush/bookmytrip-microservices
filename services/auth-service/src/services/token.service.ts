import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { RefreshToken } from '../models/RefreshToken';
import { UserRole } from '../types/auth.types';

export const generateAccessToken = (id: string, role: UserRole) => {
  return jwt.sign({ id, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m'
  });
};

export const generateRefreshToken = async (id: string) => {
  const token = crypto.randomBytes(40).toString('hex');

  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  await RefreshToken.create({
    userId: id,
    token,
    expiresAt: expires
  });

  return token;
};

export const rotateRefreshToken = async (oldToken: string) => {
  const existing = await RefreshToken.findOne({ token: oldToken });

  if (!existing) {
    throw new Error('Invalid refresh token');
  }

  await RefreshToken.deleteOne({ token: oldToken });

  return generateRefreshToken(existing.userId);
};