import axios, { AxiosError } from 'axios';
import { env } from '../config/env';
import { Request } from 'express';
import logger from '../config/logger';

// ── GraphQL Context Type ──────────────────────────────────────────────────────

export interface GraphQLContext {
  req: Request;
  user?: {
    sub: string;
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  requestId: string;
}

// ── Flight Service Client ─────────────────────────────────────────────────────

const flightServiceClient = axios.create({
  baseURL: `${env.FLIGHT_SERVICE_URL}`,
  timeout: env.REQUEST_TIMEOUT_MS || 30000,
});

// ── Hotel Service Client ──────────────────────────────────────────────────────

const hotelServiceClient = axios.create({
  baseURL: `${env.HOTEL_SERVICE_URL}`,
  timeout: env.REQUEST_TIMEOUT_MS || 30000,
});

// ── Train Service Client ──────────────────────────────────────────────────────

const trainServiceClient = axios.create({
  baseURL: `${env.TRAIN_SERVICE_URL}`,
  timeout: env.REQUEST_TIMEOUT_MS || 30000,
});

// ── Cab Service Client ────────────────────────────────────────────────────────

const cabServiceClient = axios.create({
  baseURL: `${env.CAB_SERVICE_URL}`,
  timeout: env.REQUEST_TIMEOUT_MS || 30000,
});

// Forward headers to flight service
const buildRequestHeaders = (context: GraphQLContext) => {
  const headers: Record<string, string> = {
    'x-request-id': context.requestId,
  };

  if (context.user?.sub || context.user?.id) {
    headers['x-user-id'] = context.user.sub || context.user.id;
  }
  if (context.user?.email) {
    headers['x-user-email'] = context.user.email;
  }
  if (context.user?.role) {
    headers['x-user-role'] = context.user.role;
  }

  return headers;
};

// ── Resolvers ─────────────────────────────────────────────────────────────────

export const resolvers = {
  Query: {
    searchFlights: async (
      _parent: unknown,
      args: {
        from: string;
        to: string;
        date: string;
        passengers?: number;
        cabinClass?: 'economy' | 'premiumEconomy' | 'business';
        passengerType?: 'adult' | 'child' | 'infant' | 'seniorCitizen' | 'military';
        airlines?: string;
        maxPrice?: number;
        stops?: number;
        refundable?: boolean;
        meals?: boolean;
        sort?: 'price_asc' | 'price_desc' | 'duration' | 'rating';
        page?: number;
        limit?: number;
      },
      context: GraphQLContext,
    ) => {
      try {
        const params = new URLSearchParams({
          from: args.from,
          to: args.to,
          date: args.date,
          passengers: String(args.passengers || 1),
          class: args.cabinClass || 'economy',
          passengerType: args.passengerType || 'adult',
          ...(args.airlines && { airlines: args.airlines }),
          ...(args.maxPrice && { maxPrice: String(args.maxPrice) }),
          ...(args.stops !== undefined && { stops: String(args.stops) }),
          ...(args.refundable && { refundable: String(args.refundable) }),
          ...(args.meals && { meals: String(args.meals) }),
          ...(args.sort && { sort: args.sort }),
          page: String(args.page || 1),
          limit: String(args.limit || 10),
        });

        const response = await flightServiceClient.get('/api/flights/search', {
          params,
          headers: buildRequestHeaders(context),
        });

        return response.data.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        logger.error('GraphQL: searchFlights error', {
          error: axiosError.message,
          status: axiosError.response?.status,
        });
        throw new Error(`Failed to search flights: ${axiosError.message}`);
      }
    },

    flightById: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      try {
        const response = await flightServiceClient.get(`/api/flights/${args.id}`, {
          headers: buildRequestHeaders(context),
        });
        return response.data.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        logger.error('GraphQL: flightById error', {
          id: args.id,
          error: axiosError.message,
        });
        throw new Error(`Flight not found: ${args.id}`);
      }
    },

    flightByCode: async (
      _parent: unknown,
      args: { code: string },
      context: GraphQLContext,
    ) => {
      try {
        const response = await flightServiceClient.get(
          `/api/flights/code/${args.code.toUpperCase()}`,
          {
            headers: buildRequestHeaders(context),
          },
        );
        return response.data.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        logger.error('GraphQL: flightByCode error', {
          code: args.code,
          error: axiosError.message,
        });
        throw new Error(`Flight not found: ${args.code}`);
      }
    },

    allFlights: async (
      _parent: unknown,
      args: { page?: number; limit?: number },
      context: GraphQLContext,
    ) => {
      // Verify user is authenticated with admin role
      if (!context.user) {
        throw new Error('Authentication required');
      }
      if (context.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      try {
        const params = new URLSearchParams({
          page: String(args.page || 1),
          limit: String(args.limit || 20),
        });

        const response = await flightServiceClient.get('/api/flights', {
          params,
          headers: buildRequestHeaders(context),
        });

        return response.data.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        logger.error('GraphQL: allFlights error', {
          error: axiosError.message,
        });
        throw new Error(`Failed to fetch flights: ${axiosError.message}`);
      }
    },

    searchHotels: async (
      _parent: unknown,
      args: {
        city: string;
        checkIn: string;
        checkOut: string;
        sort?: string;
        wifi?: boolean;
        pool?: boolean;
        foodIncluded?: string;
        page?: number;
        limit?: number;
      },
      context: GraphQLContext,
    ) => {
      try {
        const params = new URLSearchParams({
          city: args.city,
          checkIn: args.checkIn,
          checkOut: args.checkOut,
          sort: args.sort || 'price_asc',
          page: String(args.page || 1),
          limit: String(args.limit || 10),
        });
        if (args.wifi) params.set('wifi', 'true');
        if (args.pool) params.set('pool', 'true');
        if (args.foodIncluded) params.set('foodIncluded', args.foodIncluded);

        const response = await hotelServiceClient.get('/api/hotels/search', {
          params,
          headers: buildRequestHeaders(context),
        });
        return response.data.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        logger.error('GraphQL: searchHotels error', { error: axiosError.message });
        throw new Error(`Failed to search hotels: ${axiosError.message}`);
      }
    },

    searchTrains: async (
      _parent: unknown,
      args: {
        from: string;
        to: string;
        date: string;
        class?: string;
        sort?: string;
        trainType?: string;
        page?: number;
        limit?: number;
      },
      context: GraphQLContext,
    ) => {
      try {
        const params = new URLSearchParams({
          from: args.from,
          to: args.to,
          date: args.date,
          sort: args.sort || 'price_asc',
          page: String(args.page || 1),
          limit: String(args.limit || 10),
        });
        if (args.class) params.set('class', args.class);
        if (args.trainType) params.set('trainType', args.trainType);

        const response = await trainServiceClient.get('/api/trains/search', {
          params,
          headers: buildRequestHeaders(context),
        });
        return response.data.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        logger.error('GraphQL: searchTrains error', { error: axiosError.message });
        throw new Error(`Failed to search trains: ${axiosError.message}`);
      }
    },

    searchCabs: async (
      _parent: unknown,
      args: {
        city: string;
        distanceKm?: number;
        sort?: string;
        type?: string;
        fuelType?: string;
        ac?: boolean;
        page?: number;
        limit?: number;
      },
      context: GraphQLContext,
    ) => {
      try {
        const params = new URLSearchParams({
          city: args.city,
          distanceKm: String(args.distanceKm || 20),
          sort: args.sort || 'price_asc',
          page: String(args.page || 1),
          limit: String(args.limit || 10),
        });
        if (args.type) params.set('type', args.type);
        if (args.fuelType) params.set('fuelType', args.fuelType);
        if (args.ac) params.set('ac', 'true');

        const response = await cabServiceClient.get('/api/cabs/search', {
          params,
          headers: buildRequestHeaders(context),
        });
        return response.data.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        logger.error('GraphQL: searchCabs error', { error: axiosError.message });
        throw new Error(`Failed to search cabs: ${axiosError.message}`);
      }
    },
  },

  Mutation: {
    createFlight: async (
      _parent: unknown,
      args: {
        flightCode: string;
        airline: string;
        fromCode: string;
        toCode: string;
        departure: string;
        arrival: string;
        duration: string;
        stops: number;
        seatsLeft: number;
        rating: number;
        refundable: boolean;
        meals: boolean;
        economy: number;
        premiumEconomy: number;
        business: number;
        operatingDays: string[];
        daysOfWeek: string[];
      },
      context: GraphQLContext,
    ) => {
      // Verify admin access
      if (!context.user) {
        throw new Error('Authentication required');
      }
      if (context.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      try {
        const payload = {
          flightCode: args.flightCode,
          airline: args.airline,
          fromCode: args.fromCode,
          toCode: args.toCode,
          departure: args.departure,
          arrival: args.arrival,
          duration: args.duration,
          stops: args.stops,
          seatsLeft: args.seatsLeft,
          rating: args.rating,
          refundable: args.refundable,
          meals: args.meals,
          fare: {
            economy: args.economy,
            premiumEconomy: args.premiumEconomy,
            business: args.business,
          },
          operatingDays: args.operatingDays,
          daysOfWeek: args.daysOfWeek,
        };

        const response = await flightServiceClient.post('/api/flights', payload, {
          headers: buildRequestHeaders(context),
        });

        return response.data.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        logger.error('GraphQL: createFlight error', {
          error: axiosError.message,
          details: axiosError.response?.data,
        });
        throw new Error(`Failed to create flight: ${axiosError.message}`);
      }
    },

    updateFlight: async (
      _parent: unknown,
      args: {
        id: string;
        airline?: string;
        departure?: string;
        arrival?: string;
        duration?: string;
        stops?: number;
        seatsLeft?: number;
        rating?: number;
        refundable?: boolean;
        meals?: boolean;
        economy?: number;
        premiumEconomy?: number;
        business?: number;
        operatingDays?: string[];
        daysOfWeek?: string[];
      },
      context: GraphQLContext,
    ) => {
      // Verify admin access
      if (!context.user) {
        throw new Error('Authentication required');
      }
      if (context.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      try {
        const payload: Record<string, unknown> = {};

        if (args.airline) payload.airline = args.airline;
        if (args.departure) payload.departure = args.departure;
        if (args.arrival) payload.arrival = args.arrival;
        if (args.duration) payload.duration = args.duration;
        if (args.stops !== undefined) payload.stops = args.stops;
        if (args.seatsLeft !== undefined) payload.seatsLeft = args.seatsLeft;
        if (args.rating !== undefined) payload.rating = args.rating;
        if (args.refundable !== undefined) payload.refundable = args.refundable;
        if (args.meals !== undefined) payload.meals = args.meals;
        if (args.operatingDays) payload.operatingDays = args.operatingDays;
        if (args.daysOfWeek) payload.daysOfWeek = args.daysOfWeek;

        // Handle fare separately
        if (
          args.economy ||
          args.premiumEconomy ||
          args.business
        ) {
          payload.fare = {
            economy: args.economy,
            premiumEconomy: args.premiumEconomy,
            business: args.business,
          };
        }

        const response = await flightServiceClient.patch(
          `/api/flights/${args.id}`,
          payload,
          {
            headers: buildRequestHeaders(context),
          },
        );

        return response.data.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        logger.error('GraphQL: updateFlight error', {
          id: args.id,
          error: axiosError.message,
        });
        throw new Error(`Failed to update flight: ${axiosError.message}`);
      }
    },

    deleteFlight: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      // Verify admin access
      if (!context.user) {
        throw new Error('Authentication required');
      }
      if (context.user.role !== 'admin') {
        throw new Error('Admin access required');
      }

      try {
        await flightServiceClient.delete(`/api/flights/${args.id}`, {
          headers: buildRequestHeaders(context),
        });

        return `Flight ${args.id} deactivated successfully`;
      } catch (error) {
        const axiosError = error as AxiosError;
        logger.error('GraphQL: deleteFlight error', {
          id: args.id,
          error: axiosError.message,
        });
        throw new Error(`Failed to delete flight: ${axiosError.message}`);
      }
    },
  },
};
