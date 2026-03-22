import { env } from '../config/env';
import { AggregateSearchQuery } from '../validators/search.validators';

interface SearchCategoryResult<T = unknown> {
  ok: boolean;
  items: T[];
  total: number;
  error?: string;
}

interface AggregateResponse {
  flights: SearchCategoryResult;
  trains: SearchCategoryResult;
  hotels: SearchCategoryResult;
  cabs: SearchCategoryResult;
}

const withTimeout = async (url: string): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const buildUrl = (baseUrl: string, path: string, params: Record<string, string | number | undefined>): string => {
  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const mapResponse = async (promise: Promise<Response>): Promise<SearchCategoryResult> => {
  try {
    const response = await promise;
    if (!response.ok) {
      return { ok: false, items: [], total: 0, error: `Upstream responded with ${response.status}` };
    }

    const json = await response.json() as { data?: { results?: unknown[]; total?: number } };
    const items = json.data?.results ?? [];
    const total = json.data?.total ?? (Array.isArray(items) ? items.length : 0);
    return { ok: true, items, total };
  } catch (error) {
    return { ok: false, items: [], total: 0, error: error instanceof Error ? error.message : 'Unknown upstream error' };
  }
};

const normalizeCategories = (raw: string): Set<string> => {
  if (raw === 'all') {
    return new Set(['flights', 'trains', 'hotels', 'cabs']);
  }
  return new Set(raw.split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean));
};

export const aggregateSearch = async (query: AggregateSearchQuery): Promise<AggregateResponse> => {
  const categories = normalizeCategories(query.categories);

  const flightsPromise = categories.has('flights') && query.from && query.to && query.date
    ? mapResponse(withTimeout(buildUrl(env.FLIGHT_SERVICE_URL, '/api/flights/search', {
        from: query.from,
        to: query.to,
        date: query.date,
        passengers: query.passengers,
        class: query.flightClass,
        passengerType: query.flightPassengerType,
      })))
    : Promise.resolve({ ok: true, items: [], total: 0 });

  const trainsPromise = categories.has('trains') && query.from && query.to && query.date
    ? mapResponse(withTimeout(buildUrl(env.TRAIN_SERVICE_URL, '/api/trains/search', {
        from: query.from,
        to: query.to,
        date: query.date,
        passengers: query.passengers,
        class: query.trainClass,
        passengerType: query.trainPassengerType,
      })))
    : Promise.resolve({ ok: true, items: [], total: 0 });

  const hotelsPromise = categories.has('hotels') && query.city && query.checkIn && query.checkOut
    ? mapResponse(withTimeout(buildUrl(env.HOTEL_SERVICE_URL, '/api/hotels/search', {
        city: query.city,
        checkIn: query.checkIn,
        checkOut: query.checkOut,
        guests: query.guests,
        rooms: query.rooms,
      })))
    : Promise.resolve({ ok: true, items: [], total: 0 });

  const cabsPromise = categories.has('cabs') && (query.cabCity || query.city) && query.distanceKm !== undefined
    ? mapResponse(withTimeout(buildUrl(env.CAB_SERVICE_URL, '/api/cabs/search', {
        city: query.cabCity ?? query.city,
        distanceKm: query.distanceKm,
        passengers: query.cabPassengers,
      })))
    : Promise.resolve({ ok: true, items: [], total: 0 });

  const [flights, trains, hotels, cabs] = await Promise.all([flightsPromise, trainsPromise, hotelsPromise, cabsPromise]);

  return { flights, trains, hotels, cabs };
};
