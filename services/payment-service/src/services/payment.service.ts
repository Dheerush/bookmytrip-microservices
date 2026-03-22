import { FilterQuery } from 'mongoose';
import { env } from '../config/env';
import { publishEvent } from '../config/rabbitmq';
import { Payment, IPayment } from '../models/Payment';
import { AppError } from '../utils/AppError';
import { CreatePaymentDto, ListPaymentsQuery, RefundPaymentDto } from '../validators/payment.validators';

interface BookingResponse {
  _id: string;
  userId: string;
  bookingRef: string;
  amount: number;
  status: 'confirmed' | 'completed' | 'cancelled' | 'pending';
  title: string;
  type: 'flight' | 'hotel' | 'train' | 'cab';
}

const getBooking = async (bookingId: string, userId: string, isAdmin = false): Promise<BookingResponse> => {
  const url = new URL(`/api/bookings/${bookingId}`, env.BOOKING_SERVICE_URL).toString();
  const response = await fetch(url, {
    headers: {
      'x-user-id': userId,
      ...(isAdmin ? { 'x-user-role': 'admin' } : {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new AppError('Booking not found or inaccessible', response.status || 404, 'BOOKING_NOT_FOUND');
  }

  return payload.data as BookingResponse;
};

const generatePaymentRef = async (): Promise<string> => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `BMT-PAY-${datePart}`;
  const count = await Payment.countDocuments({ paymentRef: { $regex: `^${prefix}` } });
  return `${prefix}${String(count + 1).padStart(2, '0')}`;
};

const createTransactionId = (): string => `TXN-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

export const createPayment = async (userId: string, dto: CreatePaymentDto): Promise<IPayment> => {
  const booking = await getBooking(dto.bookingId, userId);

  if (booking.status === 'cancelled') {
    throw new AppError('Cannot pay for a cancelled booking', 400, 'BOOKING_CANCELLED');
  }

  if (dto.amount > booking.amount) {
    throw new AppError('Payment amount exceeds booking amount', 400, 'INVALID_PAYMENT_AMOUNT');
  }

  const existingSuccess = await Payment.findOne({
    bookingId: dto.bookingId,
    userId,
    status: { $in: ['succeeded', 'processing', 'pending'] },
  });

  if (existingSuccess) {
    throw new AppError('Payment already exists for this booking', 409, 'PAYMENT_ALREADY_EXISTS');
  }

  const paymentRef = await generatePaymentRef();
  const isFailure = dto.simulateFailure;

  const payment = await Payment.create({
    userId,
    bookingId: dto.bookingId,
    bookingRef: booking.bookingRef,
    paymentRef,
    transactionId: isFailure ? undefined : createTransactionId(),
    amount: dto.amount,
    currency: dto.currency,
    method: dto.method,
    provider: dto.provider,
    status: isFailure ? 'failed' : 'succeeded',
    couponCode: dto.couponCode,
    discountAmount: dto.discountAmount,
    failureReason: isFailure ? 'Payment authorization failed' : undefined,
    paidAt: isFailure ? undefined : new Date(),
    metadata: {
      ...dto.metadata,
      bookingTitle: booking.title,
      bookingType: booking.type,
      originalBookingAmount: booking.amount,
    },
  });

  publishEvent(isFailure ? 'payment.failed' : 'payment.completed', {
    paymentRef: payment.paymentRef,
    bookingId: payment.bookingId,
    bookingRef: payment.bookingRef,
    userId,
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
  });

  return payment;
};

export const listUserPayments = async (userId: string, query: ListPaymentsQuery) => {
  const { status, method, page, limit } = query;
  const skip = (page - 1) * limit;

  const filter: FilterQuery<IPayment> = { userId };
  if (status) filter.status = status;
  if (method) filter.method = method;

  const [payments, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Payment.countDocuments(filter),
  ]);

  return { payments, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const listAllPayments = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    Payment.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Payment.countDocuments(),
  ]);
  return { payments, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getPaymentById = async (paymentId: string, userId?: string, isAdmin = false): Promise<IPayment> => {
  const payment = await Payment.findById(paymentId).lean();
  if (!payment) {
    throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  }
  if (!isAdmin && payment.userId !== userId) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }
  return payment as unknown as IPayment;
};

export const getPaymentByBookingId = async (bookingId: string, userId?: string, isAdmin = false): Promise<IPayment[]> => {
  const filter: FilterQuery<IPayment> = { bookingId };
  if (!isAdmin) {
    filter.userId = userId;
  }
  const payments = await Payment.find(filter).sort({ createdAt: -1 }).lean();
  return payments as unknown as IPayment[];
};

export const refundPayment = async (paymentId: string, userId: string, dto: RefundPaymentDto, isAdmin = false): Promise<IPayment> => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  }
  if (!isAdmin && payment.userId !== userId) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }
  if (payment.status !== 'succeeded') {
    throw new AppError('Only successful payments can be refunded', 400, 'PAYMENT_NOT_REFUNDABLE');
  }

  payment.status = 'refunded';
  payment.refundedAt = new Date();
  payment.refundReason = dto.reason;
  await payment.save();

  publishEvent('payment.refunded', {
    paymentRef: payment.paymentRef,
    bookingId: payment.bookingId,
    bookingRef: payment.bookingRef,
    userId: payment.userId,
    amount: payment.amount,
    reason: dto.reason,
  });

  return payment;
};