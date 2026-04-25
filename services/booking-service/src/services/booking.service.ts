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
  tour: 'TO',
};

const serviceEndpointMap: Record<BookingType, string> = {
  flight: env.FLIGHT_SERVICE_URL,
  hotel: env.HOTEL_SERVICE_URL,
  train: env.TRAIN_SERVICE_URL,
  cab: env.CAB_SERVICE_URL,
  tour: env.TOUR_SERVICE_URL,
};

const servicePathMap: Record<BookingType, string> = {
  flight: '/api/flights/',
  hotel: '/api/hotels/',
  train: '/api/trains/',
  cab: '/api/cabs/',
  tour: '/api/tours/',
};

const ensureInventoryItemExists = async (type: BookingType, itemId: string): Promise<void> => {
  const candidateIds = type === 'flight' && itemId.includes('|')
    ? itemId.split('|').map((entry) => entry.trim()).filter(Boolean)
    : [itemId.trim()];

  // Tour bookings can originate from curated static package cards in the web app.
  // Those ids are not Mongo ObjectIds, so strict service validation would fail.
  if (type === 'tour' && candidateIds.some((id) => !/^[a-fA-F0-9]{24}$/.test(id))) {
    return;
  }

  if (candidateIds.length === 0) {
    throw new AppError(`Invalid ${type} inventory identifier`, 400, 'INVENTORY_NOT_FOUND');
  }

  for (const candidateId of candidateIds) {
    const url = new URL(`${servicePathMap[type]}${candidateId}`, serviceEndpointMap[type]).toString();
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new AppError(`Unable to validate ${type} inventory`, 400, 'INVENTORY_NOT_FOUND');
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Unable to reach ${type} inventory service`, 503, 'INVENTORY_SERVICE_UNAVAILABLE');
    }
  }
};

const generateBookingRef = async (type: BookingType, bookingDate: Date): Promise<string> => {
  const datePart = bookingDate.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `BMT-${typeCodeMap[type]}-${datePart}`;
  const count = await Booking.countDocuments({ bookingRef: { $regex: `^${prefix}` } });
  const suffix = String(count + 1).padStart(2, '0');
  return `${prefix}${suffix}`;
};

const getJson = async (url: string): Promise<any> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new AppError('Unable to validate inventory availability', 503, 'INVENTORY_SERVICE_UNAVAILABLE');
  }

  return response.json();
};

const patchInternal = async (url: string, body: Record<string, unknown>): Promise<void> => {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-service-secret': env.INTERNAL_SERVICE_SECRET },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new AppError('Unable to update inventory availability', 503, 'INVENTORY_UPDATE_FAILED');
  }
};

const ensureAndDeductFlightSeats = async (flightId: string, count: number): Promise<void> => {
  const payload = await getJson(`${env.FLIGHT_SERVICE_URL}/api/flights/${flightId}`);
  const seatsLeft = Number(payload?.data?.seatsLeft ?? 0);
  if (seatsLeft < count) {
    throw new AppError('Selected flight no longer has enough seats', 400, 'INSUFFICIENT_SEATS');
  }

  await patchInternal(`${env.FLIGHT_SERVICE_URL}/api/flights/${flightId}/deduct-seats`, { count });
};

const ensureAndDeductTrainSeats = async (trainId: string, seatClass: string, count: number): Promise<void> => {
  const payload = await getJson(`${env.TRAIN_SERVICE_URL}/api/trains/${trainId}`);
  const available = Number(payload?.data?.seatsAvailable?.[seatClass] ?? 0);
  if (available < count) {
    throw new AppError('Selected train no longer has enough seats', 400, 'INSUFFICIENT_SEATS');
  }

  await patchInternal(`${env.TRAIN_SERVICE_URL}/api/trains/${trainId}/deduct-seats`, { seatClass, count });
};

const ensureAndDeductHotelRooms = async (hotelId: string, roomType: string, count: number): Promise<void> => {
  const payload = await getJson(`${env.HOTEL_SERVICE_URL}/api/hotels/${hotelId}`);
  const rooms = Array.isArray(payload?.data?.rooms) ? payload.data.rooms : [];
  const room = rooms.find((entry: Record<string, unknown>) =>
    String(entry?.type || '').toLowerCase() === roomType.toLowerCase(),
  );
  const available = Number(room?.available ?? 0);
  if (available < count) {
    throw new AppError('Selected hotel room is no longer available', 400, 'INSUFFICIENT_ROOMS');
  }

  await patchInternal(`${env.HOTEL_SERVICE_URL}/api/hotels/${hotelId}/deduct-rooms`, { roomType, count });
};

const ensureAndDeductPackageTravel = async (booking: IBooking): Promise<void> => {
  if (booking.type !== 'tour') return;

  const packageTravel = booking.metadata?.packageTravel as Record<string, unknown> | undefined;
  const selectedOption = packageTravel?.selectedOption as Record<string, unknown> | null | undefined;
  const inventoryType = selectedOption?.inventoryType;
  const inventoryId = selectedOption?.inventoryId;

  if (!inventoryType || !inventoryId) return;

  if (inventoryType === 'flight') {
    await ensureAndDeductFlightSeats(String(inventoryId), booking.quantity);
    return;
  }

  if (inventoryType === 'train') {
    const seatClass = String(selectedOption?.seatClass || 'sleeper');
    await ensureAndDeductTrainSeats(String(inventoryId), seatClass, booking.quantity);
  }
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
    scheduleTime: dto.scheduleTime,
    quantity: dto.quantity,
    amount: dto.amount,
    status: 'pending',
    contact: dto.contact,
    passengers: dto.passengers,
    metadata: dto.metadata,
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

export const confirmBooking = async (bookingId: string, userId: string): Promise<IBooking> => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  if (booking.userId !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  if (booking.status !== 'pending') throw new AppError('Booking cannot be confirmed', 400, 'INVALID_STATUS');

  if (booking.type === 'flight' && booking.itemId) {
    const flightIds = booking.itemId.includes('|')
      ? booking.itemId.split('|').map((entry) => entry.trim()).filter(Boolean)
      : [booking.itemId];
    for (const flightId of flightIds) {
      await ensureAndDeductFlightSeats(flightId, booking.quantity);
    }
  } else if (booking.type === 'train' && booking.itemId) {
    const seatClass = String(booking.metadata?.seatClass || 'sleeper');
    await ensureAndDeductTrainSeats(booking.itemId, seatClass, booking.quantity);
  } else if (booking.type === 'hotel' && booking.itemId) {
    const roomType = (booking.metadata?.hotelStay as Record<string, unknown> | undefined)?.roomType as string | undefined;
    if (roomType) {
      await ensureAndDeductHotelRooms(booking.itemId, roomType, booking.quantity);
    }
  } else if (booking.type === 'tour') {
    await ensureAndDeductPackageTravel(booking);
  }

  booking.status = 'confirmed';
  await booking.save();

  publishEvent('booking.created', {
    userId,
    bookingRef: booking.bookingRef,
    type: booking.type,
    amount: booking.amount,
    title: booking.title,
    email: booking.contact?.email,
    contact: booking.contact,
    passengers: booking.passengers,
    startDate: booking.startDate,
    endDate: booking.endDate,
    scheduleTime: booking.scheduleTime,
    fromCode: booking.fromCode,
    toCode: booking.toCode,
    seatClass: booking.metadata?.seatClass,
    berthPreference: booking.metadata?.berthPreference,
    boardingTerminal: booking.metadata?.boardingTerminal,
    boardingAirport: (booking.metadata?.flightTravel as Record<string, unknown> | undefined)?.boardingAirport,
    destinationAirport: (booking.metadata?.flightTravel as Record<string, unknown> | undefined)?.destinationAirport,
    platformNumber: booking.metadata?.platformNumber,
    trainFromStationName: booking.metadata?.trainFromStationName,
    trainFromStationCode: booking.metadata?.trainFromStationCode,
    trainToStationName: booking.metadata?.trainToStationName,
    trainToStationCode: booking.metadata?.trainToStationCode,
    currentLocation: (booking.metadata?.packageTravel as Record<string, unknown> | undefined)?.currentLocation,
    destinationCity: (booking.metadata?.packageTravel as Record<string, unknown> | undefined)?.destinationCity,
    packageTravelMode: (booking.metadata?.packageTravel as Record<string, unknown> | undefined)?.travelMode,
    packageTravelOptionLabel: ((booking.metadata?.packageTravel as Record<string, unknown> | undefined)?.selectedOption as Record<string, unknown> | undefined)?.label,
    packageTravelOptionMeta: ((booking.metadata?.packageTravel as Record<string, unknown> | undefined)?.selectedOption as Record<string, unknown> | undefined)?.meta,
    cabPickup: (booking.metadata?.cabTravel as Record<string, unknown> | undefined)?.pickup,
    cabDrop: (booking.metadata?.cabTravel as Record<string, unknown> | undefined)?.drop,
    cabPickupCity: (booking.metadata?.cabTravel as Record<string, unknown> | undefined)?.pickupCity,
    cabDropCity: (booking.metadata?.cabTravel as Record<string, unknown> | undefined)?.dropCity,
    cabDistanceKm: (booking.metadata?.cabTravel as Record<string, unknown> | undefined)?.distanceKm,
    cabDriverName: (booking.metadata?.cabTravel as Record<string, unknown> | undefined)?.driverName,
    cabDriverPhone: (booking.metadata?.cabTravel as Record<string, unknown> | undefined)?.driverPhone,
    cabNumber: (booking.metadata?.cabTravel as Record<string, unknown> | undefined)?.cabNumber,
    hotelAddress: (booking.metadata?.hotelStay as Record<string, unknown> | undefined)?.address,
    hotelRoomType: (booking.metadata?.hotelStay as Record<string, unknown> | undefined)?.roomType,
    hotelRoomNumber: (booking.metadata?.hotelStay as Record<string, unknown> | undefined)?.roomNumber,
    hotelCheckInTime: (booking.metadata?.hotelStay as Record<string, unknown> | undefined)?.checkInTime,
    hotelCheckOutTime: (booking.metadata?.hotelStay as Record<string, unknown> | undefined)?.checkOutTime,
    hotelNights: (booking.metadata?.hotelStay as Record<string, unknown> | undefined)?.nights,
    hotelRoomsBooked: (booking.metadata?.hotelStay as Record<string, unknown> | undefined)?.roomsBooked,
  });

  return booking;
};

export const failBooking = async (bookingId: string, userId: string): Promise<IBooking> => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
  if (booking.userId !== userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
  // idempotent: already failed/cancelled → no-op
  if (booking.status !== 'pending') return booking;

  booking.status = 'failed';
  await booking.save();
  return booking;
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
