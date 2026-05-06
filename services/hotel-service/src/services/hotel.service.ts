import { FilterQuery, SortOrder } from 'mongoose';
import { AppError } from '../utils/AppError';
import { Hotel, IHotel, IHotelRoom } from '../models/Hotel';
import { CreateHotelDto, SearchHotelsQuery, UpdateHotelDto } from '../validators/hotel.validators';

export interface HotelSearchResult {
  hotel: IHotel;
  selectedRoom: IHotelRoom;
  nightlyPrice: number;
  totalPrice: number;
  nights: number;
  roomsRequested: number;
}

export interface PaginatedHotels {
  results: HotelSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HotelSuggestion {
  label: string;
  value: string;
  city: string;
  kind: 'city' | 'hotel';
}

const CITY_ALIASES: Record<string, string> = {
  delhi: 'new delhi',
  'new delhi': 'new delhi',
  bombay: 'mumbai',
  bengaluru: 'bangalore',
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolveCityCandidates = (value: string): string[] => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return [];

  const alias = CITY_ALIASES[trimmed];
  return Array.from(new Set([trimmed, alias].filter(Boolean) as string[]));
};

const getNightCount = (checkIn: string, checkOut: string): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffMs = end.getTime() - start.getTime();
  const nights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, nights);
};

const pickRoom = (rooms: IHotelRoom[], guests: number, roomsRequested: number): IHotelRoom | null => {
  const eligible = rooms
    .filter((room) => room.available >= roomsRequested && room.maxGuests >= guests)
    .sort((left, right) => left.price - right.price);

  return eligible[0] ?? null;
};

export const searchHotels = async (query: SearchHotelsQuery): Promise<PaginatedHotels> => {
  const {
    city,
    checkIn,
    checkOut,
    guests,
    rooms,
    stars,
    maxPrice,
    foodIncluded,
    refundPolicy,
    wifi,
    parking,
    pool,
    gym,
    spa,
    petFriendly,
    sort,
    page,
    limit,
  } = query;

  const cityCandidates = resolveCityCandidates(city);
  const cityRegex = cityCandidates.length > 0
    ? new RegExp(cityCandidates.map((candidate) => escapeRegex(candidate)).join('|'), 'i')
    : new RegExp(escapeRegex(city.trim()), 'i');

  const filter: FilterQuery<IHotel> = {
    isActive: true,
    $or: [
      { city: { $regex: cityRegex } },
      { name: { $regex: cityRegex } },
    ],
  };

  if (stars !== undefined) filter.stars = stars;
  if (foodIncluded) filter.foodIncluded = foodIncluded;
  if (refundPolicy) filter.refundPolicy = refundPolicy;
  if (wifi) filter.wifi = true;
  if (parking) filter.parking = true;
  if (pool) filter.pool = true;
  if (gym) filter.gym = true;
  if (spa) filter.spa = true;
  if (petFriendly) filter.petFriendly = true;

  let mongoSort: Record<string, SortOrder> = {};
  if (sort === 'rating') mongoSort = { rating: -1 };
  if (sort === 'stars') mongoSort = { stars: -1, rating: -1 };

  const hotels = await Hotel.find(filter).sort(mongoSort).lean();
  const nights = getNightCount(checkIn, checkOut);

  const results: HotelSearchResult[] = hotels
    .map((hotel) => {
      const selectedRoom = pickRoom(hotel.rooms as IHotelRoom[], guests, rooms);
      if (!selectedRoom) return null;
      if (maxPrice !== undefined && selectedRoom.price > maxPrice) return null;

      return {
        hotel: hotel as unknown as IHotel,
        selectedRoom,
        nightlyPrice: selectedRoom.price,
        totalPrice: selectedRoom.price * rooms * nights,
        nights,
        roomsRequested: rooms,
      };
    })
    .filter((entry): entry is HotelSearchResult => entry !== null);

  if (sort === 'price_asc') results.sort((left, right) => left.nightlyPrice - right.nightlyPrice);
  if (sort === 'price_desc') results.sort((left, right) => right.nightlyPrice - left.nightlyPrice);

  const total = results.length;
  const skip = (page - 1) * limit;

  return {
    results: results.slice(skip, skip + limit),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getHotelById = async (hotelId: string): Promise<IHotel> => {
  const hotel = await Hotel.findById(hotelId).lean();
  if (!hotel || !hotel.isActive) {
    throw new AppError('Hotel not found', 404, 'HOTEL_NOT_FOUND');
  }
  return hotel as unknown as IHotel;
};

export const listHotelSuggestions = async (query: string): Promise<HotelSuggestion[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const candidates = resolveCityCandidates(trimmed);
  const regex = new RegExp(
    (candidates.length > 0 ? candidates : [trimmed]).map((candidate) => escapeRegex(candidate)).join('|'),
    'i',
  );
  const hotels = await Hotel.find({
    isActive: true,
    $or: [{ city: regex }, { name: regex }],
  })
    .sort({ city: 1, name: 1 })
    .limit(10)
    .lean();

  const citySuggestions = Array.from(
    new Map(
      hotels.map((hotel) => [hotel.city.toLowerCase(), {
        label: `${hotel.city} (city)`,
        value: hotel.city,
        city: hotel.city,
        kind: 'city' as const,
      }]),
    ).values(),
  );

  const hotelSuggestions = hotels.map((hotel) => ({
    label: `${hotel.name} - ${hotel.city}`,
    value: hotel.name,
    city: hotel.city,
    kind: 'hotel' as const,
  }));

  return [...citySuggestions, ...hotelSuggestions].slice(0, 8);
};

export const listAllHotels = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [hotels, total] = await Promise.all([
    Hotel.find().skip(skip).limit(limit).lean(),
    Hotel.countDocuments(),
  ]);
  return { hotels, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const createHotel = async (dto: CreateHotelDto): Promise<IHotel> => {
  return Hotel.create(dto);
};

export const updateHotel = async (hotelId: string, dto: UpdateHotelDto): Promise<IHotel> => {
  const hotel = await Hotel.findByIdAndUpdate(hotelId, { $set: dto }, { new: true, runValidators: true }).lean();
  if (!hotel) {
    throw new AppError('Hotel not found', 404, 'HOTEL_NOT_FOUND');
  }
  return hotel as unknown as IHotel;
};

export const deleteHotel = async (hotelId: string): Promise<void> => {
  const hotel = await Hotel.findByIdAndUpdate(hotelId, { $set: { isActive: false } }, { new: true });
  if (!hotel) {
    throw new AppError('Hotel not found', 404, 'HOTEL_NOT_FOUND');
  }
};

export const deductHotelRooms = async (hotelId: string, roomType: string, count: number): Promise<void> => {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel || !hotel.isActive) {
    throw new AppError('Hotel not found', 404, 'HOTEL_NOT_FOUND');
  }

  const room = hotel.rooms.find((entry) => entry.type.toLowerCase() === roomType.toLowerCase());
  if (!room) {
    throw new AppError('Room type not found', 404, 'ROOM_TYPE_NOT_FOUND');
  }

  if (room.available < count) {
    throw new AppError('Not enough rooms available', 400, 'INSUFFICIENT_ROOMS');
  }

  room.available -= count;
  await hotel.save();
};
