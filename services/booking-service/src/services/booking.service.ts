import { FilterQuery } from 'mongoose';
import { Booking, BookingType, IBooking } from '../models/Booking';
import { env } from '../config/env';
import { publishEvent } from '../config/rabbitmq';
import { AppError } from '../utils/AppError';
import { CancelBookingDto, CreateBookingDto, ListBookingsQuery } from '../validators/booking.validators';

interface InvoicePayload {
  bookingRef: string;
  customer: { name: string; email: string; phone: string };
  item: { type: BookingType; title: string; startDate: string; endDate?: string };
  amount: number;
  status: string;
  issuedAt: string;
}

const typeCodeMap: Record<BookingType, string> = {
  flight: 'FL',
  hotel: 'HT',
  train: 'TR',
  cab: 'CB',
};

const serviceEndpointMap: Record<BookingType, string> = {
  flight: env.FLIGHT_SERVICE_URL,
  hotel: env.HOTEL_SERVICE_URL,
  train: env.TRAIN_SERVICE_URL,
  cab: env.CAB_SERVICE_URL,
};

const servicePathMap: Record<BookingType, string> = {
  flight: '/api/flights/',
  hotel: '/api/hotels/',
  train: '/api/trains/',
  cab: '/api/cabs/',
};

const ensureInventoryItemExists = async (type: BookingType, itemId: string): Promise<void> => {
  const url = new URL(`${servicePathMap[type]}${itemId}`, serviceEndpointMap[type]).toString();
  const response = await fetch(url);
  if (!response.ok) {
    throw new AppError(`Unable to validate ${type} inventory`, 400, 'INVENTORY_NOT_FOUND');
  }
};

const generateBookingRef = async (type: BookingType, bookingDate: Date): Promise<string> => {
  const datePart = bookingDate.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `BMT-${typeCodeMap[type]}-${datePart}`;
  const count = await Booking.countDocuments({ bookingRef: { $regex: `^${prefix}` } });
  const suffix = String(count + 1).padStart(2, '0');
  return `${prefix}${suffix}`;
};

export const createBooking = async (userId: string, dto: CreateBookingDto): Promise<IBooking> => {
  await ensureInventoryItemExists(dto.type, dto.itemId);

  const bookingDate = new Date();
  const bookingRef = await generateBookingRef(dto.type, bookingDate);

  const booking = await Booking.create({
    userId,
    bookingRef,
    type: dto.type,
    itemId: dto.itemId,
    title: dto.title,
    city: dto.city,
    fromCode: dto.fromCode,
    toCode: dto.toCode,
    bookingDate,
    startDate: new Date(dto.startDate),
    endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    quantity: dto.quantity,
    amount: dto.amount,
    status: 'confirmed',
    contact: dto.contact,
    passengers: dto.passengers,
    metadata: dto.metadata,
  });

  publishEvent('booking.created', {
    userId,
    bookingRef: booking.bookingRef,
    type: booking.type,
    amount: booking.amount,
    title: booking.title,
  });

  return booking;
};

export const listUserBookings = async (userId: string, query: ListBookingsQuery) => {
  const { type, status, page, limit } = query;
  const skip = (page - 1) * limit;

  const filter: FilterQuery<IBooking> = { userId };
  if (type) filter.type = type;
  if (status) filter.status = status;

  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Booking.countDocuments(filter),
  ]);

  return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const listAllBookings = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    Booking.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Booking.countDocuments(),
  ]);
  return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getBookingById = async (bookingId: string, userId?: string, isAdmin = false): Promise<IBooking> => {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }
  if (!isAdmin && booking.userId !== userId) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }
  return booking as unknown as IBooking;
};

export const cancelBooking = async (bookingId: string, userId: string, dto: CancelBookingDto, isAdmin = false): Promise<IBooking> => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  }
  if (!isAdmin && booking.userId !== userId) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }
  if (booking.status === 'cancelled') {
    throw new AppError('Booking already cancelled', 400, 'BOOKING_ALREADY_CANCELLED');
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancellationReason = dto.reason;
  await booking.save();

  publishEvent('booking.cancelled', {
    bookingRef: booking.bookingRef,
    userId: booking.userId,
    reason: dto.reason,
  });

  return booking;
};

export const getBookingInvoice = async (bookingId: string, userId?: string, isAdmin = false): Promise<InvoicePayload> => {
  const booking = await getBookingById(bookingId, userId, isAdmin);
  return {
    bookingRef: booking.bookingRef,
    customer: booking.contact,
    item: {
      type: booking.type,
      title: booking.title,
      startDate: booking.startDate.toISOString(),
      ...(booking.endDate ? { endDate: booking.endDate.toISOString() } : {}),
    },
    amount: booking.amount,
    status: booking.status,
    issuedAt: new Date().toISOString(),
  };
};
