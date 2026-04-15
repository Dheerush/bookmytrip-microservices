import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z
    .string()
    .transform((value) => value.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{10}$/)),
});

const passengerSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().min(0).optional(),
  gender: z.string().min(1).optional(),
  email: z.string().email().optional(),
  seatNumber: z.string().min(1).max(20).optional(),
});

export const createBookingSchema = z.object({
  type: z.enum(['flight', 'hotel', 'train', 'cab', 'tour']),
  itemId: z.string().min(1),
  title: z.string().min(3),
  city: z.string().optional(),
  fromCode: z.string().optional(),
  toCode: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  scheduleTime: z.string().optional(),
  quantity: z.number().int().min(1).max(9),
  amount: z.number().int().min(0),
  contact: contactSchema,
  passengers: z.array(passengerSchema).optional().default([]),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export const listBookingsSchema = z.object({
  type: z.enum(['flight', 'hotel', 'train', 'cab', 'tour']).optional(),
  status: z.enum(['confirmed', 'completed', 'cancelled', 'pending', 'failed']).optional(),
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().optional().default('20').transform(Number).pipe(z.number().int().min(1).max(100)),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(3).max(200).optional(),
});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsSchema>;
export type CancelBookingDto = z.infer<typeof cancelBookingSchema>;
