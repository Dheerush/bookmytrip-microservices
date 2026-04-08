import { FilterQuery, SortOrder } from 'mongoose';
import { AppError } from '../utils/AppError';
import { ITrain, PassengerType, Train, TrainClass } from '../models/Train';
import { CreateTrainDto, SearchTrainsQuery, UpdateTrainDto } from '../validators/train.validators';

export interface TrainSearchResult {
  train: ITrain;
  unitPrice: number;
  totalPrice: number;
  travelClass: TrainClass;
  passengerType: PassengerType;
}

export interface PaginatedTrains {
  results: TrainSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const parseDurationMinutes = (duration: string): number => {
  const match = duration.match(/(\d+)h\s*(?:(\d+)m)?/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 60 + parseInt(match[2] ?? '0', 10);
};

const parseDepartureMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
};

const buildFareCategories = (fare: CreateTrainDto['fare']) => {
  const make = (price: number) => ({
    adult: price,
    child: Math.round(price * 0.5),
    seniorCitizen: Math.round(price * 0.6),
    military: Math.round(price * 0.75),
  });

  return {
    sleeper: make(fare.sleeper),
    ac3Tier: make(fare.ac3Tier),
    ac2Tier: make(fare.ac2Tier),
    ac1st: make(fare.ac1st),
  };
};

export const searchTrains = async (query: SearchTrainsQuery): Promise<PaginatedTrains> => {
  const {
    from,
    to,
    passengers,
    class: travelClass,
    passengerType,
    trainType,
    maxPrice,
    maxStops,
    sort,
    page,
    limit,
  } = query;

  const filter: FilterQuery<ITrain> = {
    fromCode: from,
    toCode: to,
    isActive: true,
  };

  if (trainType) {
    filter.type = trainType;
  }

  if (maxStops !== undefined) {
    filter.stops = { $lte: maxStops };
  }

  if (maxPrice !== undefined) {
    filter[`fare.${travelClass}`] = { $lte: maxPrice };
  }

  let mongoSort: Record<string, SortOrder> = {};
  if (sort === 'rating') mongoSort = { rating: -1 };

  const trains = await Train.find(filter).sort(mongoSort).lean();

  const results: TrainSearchResult[] = trains.map((train) => {
    const categoryPrice = (train.fareCategories as Record<Exclude<TrainClass, 'general'>, Record<PassengerType, number>>)[travelClass as Exclude<TrainClass, 'general'>]?.[passengerType];
    const unitPrice = categoryPrice ?? train.fare[travelClass];

    return {
      train: train as unknown as ITrain,
      unitPrice,
      totalPrice: unitPrice * passengers,
      travelClass,
      passengerType,
    };
  });

  if (sort === 'price_asc') results.sort((a, b) => a.unitPrice - b.unitPrice);
  if (sort === 'price_desc') results.sort((a, b) => b.unitPrice - a.unitPrice);
  if (sort === 'duration') results.sort((a, b) => parseDurationMinutes(a.train.duration) - parseDurationMinutes(b.train.duration));
  if (sort === 'departure') results.sort((a, b) => parseDepartureMinutes(a.train.departureTime) - parseDepartureMinutes(b.train.departureTime));

  const total = results.length;
  const skip = (page - 1) * limit;
  const paginated = results.slice(skip, skip + limit);

  return {
    results: paginated,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getTrainById = async (trainId: string): Promise<ITrain> => {
  const train = await Train.findById(trainId).lean();
  if (!train || !train.isActive) {
    throw new AppError('Train not found', 404, 'TRAIN_NOT_FOUND');
  }
  return train as unknown as ITrain;
};

export const getTrainByNumber = async (trainNumber: string): Promise<ITrain> => {
  const train = await Train.findOne({ trainNumber, isActive: true }).lean();
  if (!train) {
    throw new AppError('Train not found', 404, 'TRAIN_NOT_FOUND');
  }
  return train as unknown as ITrain;
};

export const listAllTrains = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [trains, total] = await Promise.all([
    Train.find().skip(skip).limit(limit).lean(),
    Train.countDocuments(),
  ]);

  return { trains, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const createTrain = async (dto: CreateTrainDto): Promise<ITrain> => {
  const fareCategories = dto.fareCategories ?? buildFareCategories(dto.fare);
  const train = await Train.create({ ...dto, fareCategories });
  return train;
};

export const updateTrain = async (trainId: string, dto: UpdateTrainDto): Promise<ITrain> => {
  if (dto.fare && !dto.fareCategories) {
    dto.fareCategories = buildFareCategories(dto.fare as CreateTrainDto['fare']);
  }

  const train = await Train.findByIdAndUpdate(
    trainId,
    { $set: dto },
    { new: true, runValidators: true },
  ).lean();

  if (!train) {
    throw new AppError('Train not found', 404, 'TRAIN_NOT_FOUND');
  }

  return train as unknown as ITrain;
};

export const deleteTrain = async (trainId: string): Promise<void> => {
  const train = await Train.findByIdAndUpdate(trainId, { $set: { isActive: false } }, { new: true });
  if (!train) {
    throw new AppError('Train not found', 404, 'TRAIN_NOT_FOUND');
  }
};

export const deductTrainSeats = async (trainId: string, seatClass: string, count: number): Promise<void> => {
  const validClasses = ['general', 'sleeper', 'ac3Tier', 'ac2Tier', 'ac1st'];
  if (!validClasses.includes(seatClass)) {
    throw new AppError('Invalid seat class', 400, 'INVALID_SEAT_CLASS');
  }
  const train = await Train.findByIdAndUpdate(
    trainId,
    { $inc: { [`seatsAvailable.${seatClass}`]: -count } },
    { new: true },
  );
  if (!train) throw new AppError('Train not found', 404, 'TRAIN_NOT_FOUND');
};
