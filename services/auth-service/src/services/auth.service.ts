import { IUser, User } from '../models/User';
import { hashPassword, comparePassword } from '../utils/hash';
import { AppError } from '../utils/AppError';
import { UserRole } from '../types/auth.types';

// ── Register ───────────────────────────────────────────────────────────────
export const registerUser = async (
  fullName: string,
  email: string,
  password: string,
  phone?: string,
  role?: UserRole,
) => {
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.isVerified) {
      throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
    } else {
      throw new AppError(
        'Account exists but email is not verified. A new OTP has been sent.',
        409,
        'EMAIL_UNVERIFIED',
        { userId: existing._id.toString(), email: existing.email }
      );
    }
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    phone:    phone ?? null,
    role:     role ?? 'user',
  });

  return {
    id:       user._id.toString(),
    fullName: user.fullName,
    email:    user.email,
    phone:    user.phone,
    role:     user.role,
  };
};

// ── Login ──────────────────────────────────────────────────────────────────
export const loginUser = async (
  email: string,
  password: string,
): Promise<IUser> => {
  const user = await User.findOne({ email });

  if (!user) throw new AppError('Invalid credentials', 401);

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new AppError('Invalid credentials', 401);

  return user;
};