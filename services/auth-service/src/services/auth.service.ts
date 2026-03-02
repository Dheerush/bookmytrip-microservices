import { IUser, User } from '../models/User';
import { hashPassword, comparePassword } from '../utils/hash';
import { AppError } from '../utils/AppError';
import { UserRole } from '../types/auth.types';


export const registerUser = async (
  email: string,
  password: string,
  role?: UserRole
) => {

  const existing = await User.findOne({ email });

  if (existing) {
    throw new AppError('Email already registered', 400);
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    email,
    password: hashedPassword,
    role: role || 'user' // default role
  });

  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  };
};



export const loginUser = async (
  email: string,
  password: string
): Promise<IUser> => {

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // compare password here

  return user;
};