import { FilterQuery, SortOrder } from 'mongoose';
import { Flight, IFlight } from '../models/Flight';
import { SearchFlightsQuery, CreateFlightDto, UpdateFlightDto } from '../validators/flight.validators';
import { AppError } from '../utils/AppError';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CabinClass = 'economy' | 'premiumEconomy' | 'business';
export type PassengerType = 'adult' | 'child' | 'infant' | 'seniorCitizen' | 'military';

export interface FlightSearchResult {
  flight: IFlight;
  unitPrice: number;       // per passenger, selected class + passengerType
  totalPrice: number;      // unitPrice × passengers
  cabinClass: CabinClass;
  passengerType: PassengerType;
}

export interface PaginatedFlights {
  results: FlightSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Helper ────────────────────────────────────────────────────────────────────

const parseDurationMinutes = (duration: string): number => {
  const match = duration.match(/(\d+)h\s*(?:(\d+)m)?/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 60 + parseInt(match[2] ?? '0', 10);
};

// ── Service ───────────────────────────────────────────────────────────────────

export const searchFlights = async (query: SearchFlightsQuery): Promise<PaginatedFlights> => {
  const {
    from, to, date, passengers, class: cabinClass, passengerType,
    airlines, maxPrice, stops, refundable, meals, sort, page, limit,
  } = query;

  const dayToken = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' });

  const filter: FilterQuery<IFlight> = {
    fromCode: from,
    toCode: to,
    isActive: true,
    operatingDays: dayToken,
  };

  if (airlines) {
    const airlineList = airlines.split(',').map((a) => a.trim());
    filter.airline = { $in: airlineList };
  }
  if (maxPrice !== undefined) {
    filter[`fare.${cabinClass}`] = { $lte: maxPrice };
  }
  if (stops !== undefined) {
    filter.stops = stops;
  }
  if (refundable) {
    filter.refundable = true;
  }
  if (meals) {
    filter.meals = true;
  }

  // Fetch all matching (sort in-memory for calculated totalPrice when sort=price_*,
  // otherwise let Mongo sort)
  let mongoSort: Record<string, SortOrder> = {};
  if (sort === 'rating') mongoSort = { rating: -1 };
  else if (sort === 'duration') mongoSort = {};  // will sort in-memory after parsing

  const allFlights = await Flight.find(filter).sort(mongoSort).lean();

  // Calculate prices and apply price-based filtering
  const results: FlightSearchResult[] = allFlights.map((flight) => {
    const unitPrice =
      (flight.fareCategories as Record<CabinClass, Record<PassengerType, number>>)
        [cabinClass]?.[passengerType] ?? flight.fare[cabinClass];
    return {
      flight: flight as unknown as IFlight,
      unitPrice,
      totalPrice: unitPrice * passengers,
      cabinClass,
      passengerType,
    };
  });

  // Apply maxPrice filter on calculated totalPrice (optional — already filtered by base fare above)

  // Sort
  if (sort === 'price_asc')  results.sort((a, b) => a.unitPrice - b.unitPrice);
  if (sort === 'price_desc') results.sort((a, b) => b.unitPrice - a.unitPrice);
  if (sort === 'duration')   results.sort((a, b) =>
    parseDurationMinutes((a.flight as unknown as { duration: string }).duration) -
    parseDurationMinutes((b.flight as unknown as { duration: string }).duration),
  );

  const total = results.length;
  const skip  = (page - 1) * limit;
  const paginated = results.slice(skip, skip + limit);

  return { results: paginated, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getFlightById = async (flightId: string): Promise<IFlight> => {
  const flight = await Flight.findById(flightId).lean();
  if (!flight || !flight.isActive) {
    throw new AppError('Flight not found', 404, 'FLIGHT_NOT_FOUND');
  }
  return flight as unknown as IFlight;
};

export const getFlightByCode = async (flightCode: string): Promise<IFlight> => {
  const flight = await Flight.findOne({ flightCode: flightCode.toUpperCase(), isActive: true }).lean();
  if (!flight) {
    throw new AppError('Flight not found', 404, 'FLIGHT_NOT_FOUND');
  }
  return flight as unknown as IFlight;
};

// ── Admin operations ──────────────────────────────────────────────────────────

const buildFareCategories = (fare: CreateFlightDto['fare']) => {
  const make = (base: number) => ({
    adult:        base,
    child:        Math.round(base * 0.5),
    infant:       Math.round(base * 0.1),
    seniorCitizen:Math.round(base * 0.85),
    military:     Math.round(base * 0.75),
  });
  return {
    economy:       make(fare.economy),
    premiumEconomy:make(fare.premiumEconomy),
    business:      make(fare.business),
  };
};

export const createFlight = async (dto: CreateFlightDto): Promise<IFlight> => {
  const fareCategories = dto.fareCategories ?? buildFareCategories(dto.fare);
  const flight = await Flight.create({ ...dto, fareCategories });
  return flight;
};

export const updateFlight = async (flightId: string, dto: UpdateFlightDto): Promise<IFlight> => {
  // If fare changes but fareCategories not provided, recalculate
  if (dto.fare && !dto.fareCategories) {
    dto.fareCategories = buildFareCategories(dto.fare as CreateFlightDto['fare']);
  }
  const flight = await Flight.findByIdAndUpdate(
    flightId,
    { $set: dto },
    { new: true, runValidators: true },
  ).lean();
  if (!flight) throw new AppError('Flight not found', 404, 'FLIGHT_NOT_FOUND');
  return flight as unknown as IFlight;
};

export const deleteFlight = async (flightId: string): Promise<void> => {
  const flight = await Flight.findByIdAndUpdate(
    flightId,
    { $set: { isActive: false } },
    { new: true },
  );
  if (!flight) throw new AppError('Flight not found', 404, 'FLIGHT_NOT_FOUND');
};

export const deductFlightSeats = async (flightId: string, count: number): Promise<void> => {
  const flight = await Flight.findByIdAndUpdate(
    flightId,
    { $inc: { seatsLeft: -count } },
    { new: true },
  );
  if (!flight) throw new AppError('Flight not found', 404, 'FLIGHT_NOT_FOUND');
};

export const listAllFlights = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [flights, total] = await Promise.all([
    Flight.find().skip(skip).limit(limit).lean(),
    Flight.countDocuments(),
  ]);
  return { flights, total, page, limit, totalPages: Math.ceil(total / limit) };
};
