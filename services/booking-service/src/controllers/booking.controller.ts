import { Request, RequestHandler, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { cancelBooking, confirmBooking, createBooking, failBooking, getBookingById, getBookingInvoice, listAllBookings, listUserBookings } from '../services/booking.service';
import { CancelBookingDto, CreateBookingDto, ListBookingsQuery } from '../validators/booking.validators';
import { AppError } from '../utils/AppError';

const requireUserId = (req: Request): string => {
  const userId = req.user?.id;
  if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  return userId;
};

export const createBookingHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const booking = await createBooking(requireUserId(req), req.body as CreateBookingDto);
  res.status(201).json(apiResponse(booking, 'Booking created'));
});

export const listMyBookingsHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await listUserBookings(requireUserId(req), req.query as unknown as ListBookingsQuery);
  res.status(200).json(apiResponse(result, 'Bookings fetched'));
});

export const listAllBookingsHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) ?? '1', 10);
  const limit = parseInt((req.query.limit as string) ?? '20', 10);
  const result = await listAllBookings(page, limit);
  res.status(200).json(apiResponse(result, 'All bookings fetched'));
});

export const getBookingByIdHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const booking = await getBookingById(req.params.bookingId, req.user?.id, req.user?.role === 'admin');
  res.status(200).json(apiResponse(booking, 'Booking fetched'));
});

export const cancelBookingHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const booking = await cancelBooking(req.params.bookingId, requireUserId(req), req.body as CancelBookingDto, req.user?.role === 'admin');
  res.status(200).json(apiResponse(booking, 'Booking cancelled'));
});

export const confirmBookingHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const booking = await confirmBooking(req.params.bookingId, requireUserId(req));
  res.status(200).json(apiResponse(booking, 'Booking confirmed'));
});

export const failBookingHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const booking = await failBooking(req.params.bookingId, requireUserId(req));
  res.status(200).json(apiResponse(booking, 'Booking marked as failed'));
});

export const getInvoiceHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await getBookingInvoice(req.params.bookingId, req.user?.id, req.user?.role === 'admin');
  res.status(200).json(apiResponse(invoice, 'Invoice generated'));
});
