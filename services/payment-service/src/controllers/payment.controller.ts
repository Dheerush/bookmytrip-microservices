import { Request, RequestHandler, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import {
  createPayment,
  getPaymentByBookingId,
  getPaymentById,
  listAllPayments,
  listUserPayments,
  refundPayment,
} from '../services/payment.service';
import { CreatePaymentDto, ListPaymentsQuery, RefundPaymentDto } from '../validators/payment.validators';

const requireUserId = (req: Request): string => {
  const userId = req.user?.id;
  if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  return userId;
};

export const createPaymentHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const payment = await createPayment(requireUserId(req), req.body as CreatePaymentDto);
  res.status(201).json(apiResponse(payment, 'Payment processed'));
});

export const listMyPaymentsHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await listUserPayments(requireUserId(req), req.query as unknown as ListPaymentsQuery);
  res.status(200).json(apiResponse(result, 'Payments fetched'));
});

export const listAllPaymentsHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) ?? '1', 10);
  const limit = parseInt((req.query.limit as string) ?? '20', 10);
  const result = await listAllPayments(page, limit);
  res.status(200).json(apiResponse(result, 'All payments fetched'));
});

export const getPaymentByIdHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const payment = await getPaymentById(req.params.paymentId, req.user?.id, req.user?.role === 'admin');
  res.status(200).json(apiResponse(payment, 'Payment fetched'));
});

export const getPaymentsByBookingHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const payments = await getPaymentByBookingId(req.params.bookingId, req.user?.id, req.user?.role === 'admin');
  res.status(200).json(apiResponse(payments, 'Booking payments fetched'));
});

export const refundPaymentHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const payment = await refundPayment(req.params.paymentId, requireUserId(req), req.body as RefundPaymentDto, req.user?.role === 'admin');
  res.status(200).json(apiResponse(payment, 'Payment refunded'));
});