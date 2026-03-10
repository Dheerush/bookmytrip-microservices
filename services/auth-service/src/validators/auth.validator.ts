import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .min(2, 'Full name must be at least 2 characters')
    .trim(),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .trim(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),

  phone: z
    .string()
    .trim()
    .optional(),

  role: z.enum(['user', 'vendor']).optional(),
});

export const loginSchema = z.object({
  email:    z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});