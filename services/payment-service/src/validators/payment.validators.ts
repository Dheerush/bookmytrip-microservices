import { z } from 'zod';

export const createPaymentSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.number().int().positive(),
  currency: z.string().trim().min(3).max(3).optional().default('INR').transform((value) => value.toUpperCase()),
  method: z.enum(['card', 'upi', 'netbanking', 'wallet']),
  provider: z.string().min(2).max(50).optional(),
  couponCode: z.string().min(3).max(20).optional(),
  discountAmount: z.number().int().min(0).optional().default(0),
  simulateFailure: z.boolean().optional().default(false),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export const listPaymentsSchema = z.object({
  status: z.enum(['pending', 'processing', 'succeeded', 'failed', 'refunded']).optional(),
  method: z.enum(['card', 'upi', 'netbanking', 'wallet']).optional(),
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().optional().default('20').transform(Number).pipe(z.number().int().min(1).max(100)),
});

export const refundPaymentSchema = z.object({
  reason: z.string().min(3).max(200).optional(),
});

export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsSchema>;
export type RefundPaymentDto = z.infer<typeof refundPaymentSchema>;