import { FilterQuery, SortOrder } from 'mongoose';
import { AppError } from '../utils/AppError';
import { Cab, ICab } from '../models/Cab';
import { CreateCabDto, SearchCabsQuery, UpdateCabDto } from '../validators/cab.validators';

export interface CabSearchResult {
  cab: ICab;
  totalPrice: number;
  distanceKm: number;
}

export interface PaginatedCabs {
  results: CabSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const calculateTotalPrice = (baseFare: number, pricePerKm: number, distanceKm: number): number =>
  baseFare + (pricePerKm * distanceKm);

export const searchCabs = async (query: SearchCabsQuery): Promise<PaginatedCabs> => {
  const { city, distanceKm, passengers, type, fuelType, ac, maxPrice, sort, page, limit } = query;

  const filter: FilterQuery<ICab> = {
    city: { $regex: new RegExp(`^${city}$`, 'i') },
    available: true,
    isActive: true,
    seatingCapacity: { $gte: passengers },
  };

  if (type) filter.type = type;
  if (fuelType) filter.fuelType = fuelType;
  if (ac) filter.ac = true;

  let mongoSort: Record<string, SortOrder> = {};
  if (sort === 'rating') mongoSort = { rating: -1 };
  if (sort === 'driver_rating') mongoSort = { driverRating: -1 };

  const cabs = await Cab.find(filter).sort(mongoSort).lean();

  const results: CabSearchResult[] = cabs
    .map((cab) => {
      const totalPrice = calculateTotalPrice(cab.baseFare, cab.pricePerKm, distanceKm);
      if (maxPrice !== undefined && totalPrice > maxPrice) return null;
      return { cab: cab as unknown as ICab, totalPrice, distanceKm };
    })
    .filter((entry): entry is CabSearchResult => entry !== null);

  if (sort === 'price_asc') results.sort((left, right) => left.totalPrice - right.totalPrice);
  if (sort === 'price_desc') results.sort((left, right) => right.totalPrice - left.totalPrice);

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

export const getCabById = async (cabId: string): Promise<ICab> => {
  const cab = await Cab.findById(cabId).lean();
  if (!cab || !cab.isActive) {
    throw new AppError('Cab not found', 404, 'CAB_NOT_FOUND');
  }
  return cab as unknown as ICab;
};

export const listAllCabs = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [cabs, total] = await Promise.all([
    Cab.find().skip(skip).limit(limit).lean(),
    Cab.countDocuments(),
  ]);
  return { cabs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const createCab = async (dto: CreateCabDto): Promise<ICab> => Cab.create(dto);

export const updateCab = async (cabId: string, dto: UpdateCabDto): Promise<ICab> => {
  const cab = await Cab.findByIdAndUpdate(cabId, { $set: dto }, { new: true, runValidators: true }).lean();
  if (!cab) {
    throw new AppError('Cab not found', 404, 'CAB_NOT_FOUND');
  }
  return cab as unknown as ICab;
};

export const deleteCab = async (cabId: string): Promise<void> => {
  const cab = await Cab.findByIdAndUpdate(cabId, { $set: { isActive: false } }, { new: true });
  if (!cab) {
    throw new AppError('Cab not found', 404, 'CAB_NOT_FOUND');
  }
};
