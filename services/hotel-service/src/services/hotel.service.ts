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

  const filter: FilterQuery<IHotel> = {
    city: { $regex: new RegExp(`^${city}$`, 'i') },
    isActive: true,
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
