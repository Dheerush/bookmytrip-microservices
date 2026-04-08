import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { QueryHookOptions } from '@apollo/client/react';

// ── Type Definitions ──────────────────────────────────────────────────────

export interface Flight {
  id: string;
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
  fare: {
    economy: number;
    premiumEconomy: number;
    business: number;
  };
  fareCategories?: {
    economy: { adult: number; child: number; infant: number; seniorCitizen: number; military: number };
    premiumEconomy: { adult: number; child: number; infant: number; seniorCitizen: number; military: number };
    business: { adult: number; child: number; infant: number; seniorCitizen: number; military: number };
  };
  operatingDays: string[];
  daysOfWeek: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlightSearchResult {
  flight: Flight;
  unitPrice: number;
  totalPrice: number;
  cabinClass: 'economy' | 'premiumEconomy' | 'business';
  passengerType: 'adult' | 'child' | 'infant' | 'seniorCitizen' | 'military';
}

export interface PaginatedFlights {
  results: FlightSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SearchFlightsVariables = {
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
};

type CreateFlightVariables = {
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
};

type UpdateFlightVariables = {
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
};

// ── GraphQL Queries ──────────────────────────────────────────────────────

export const SEARCH_FLIGHTS_QUERY = gql`
  query SearchFlights(
    $from: String!
    $to: String!
    $date: String!
    $passengers: Int
    $cabinClass: CabinClass
    $passengerType: PassengerType
    $airlines: String
    $maxPrice: Int
    $stops: Int
    $refundable: Boolean
    $meals: Boolean
    $sort: SortOption
    $page: Int
    $limit: Int
  ) {
    searchFlights(
      from: $from
      to: $to
      date: $date
      passengers: $passengers
      cabinClass: $cabinClass
      passengerType: $passengerType
      airlines: $airlines
      maxPrice: $maxPrice
      stops: $stops
      refundable: $refundable
      meals: $meals
      sort: $sort
      page: $page
      limit: $limit
    ) {
      results {
        flight {
          id
          flightCode
          airline
          fromCode
          toCode
          departure
          arrival
          duration
          stops
          seatsLeft
          rating
          refundable
          meals
          fare {
            economy
            premiumEconomy
            business
          }
          operatingDays
          daysOfWeek
          isActive
          createdAt
          updatedAt
        }
        unitPrice
        totalPrice
        cabinClass
        passengerType
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const GET_FLIGHT_BY_ID_QUERY = gql`
  query GetFlightById($id: ID!) {
    flightById(id: $id) {
      id
      flightCode
      airline
      fromCode
      toCode
      departure
      arrival
      duration
      stops
      seatsLeft
      rating
      refundable
      meals
      fare {
        economy
        premiumEconomy
        business
      }
      fareCategories {
        economy {
          adult
          child
          infant
          seniorCitizen
          military
        }
        premiumEconomy {
          adult
          child
          infant
          seniorCitizen
          military
        }
        business {
          adult
          child
          infant
          seniorCitizen
          military
        }
      }
      operatingDays
      daysOfWeek
      isActive
      createdAt
      updatedAt
    }
  }
`;

// ── GraphQL Mutations ──────────────────────────────────────────────────────

export const CREATE_FLIGHT_MUTATION = gql`
  mutation CreateFlight(
    $flightCode: String!
    $airline: String!
    $fromCode: String!
    $toCode: String!
    $departure: String!
    $arrival: String!
    $duration: String!
    $stops: Int!
    $seatsLeft: Int!
    $rating: Float!
    $refundable: Boolean!
    $meals: Boolean!
    $economy: Int!
    $premiumEconomy: Int!
    $business: Int!
    $operatingDays: [String!]!
    $daysOfWeek: [String!]!
  ) {
    createFlight(
      flightCode: $flightCode
      airline: $airline
      fromCode: $fromCode
      toCode: $toCode
      departure: $departure
      arrival: $arrival
      duration: $duration
      stops: $stops
      seatsLeft: $seatsLeft
      rating: $rating
      refundable: $refundable
      meals: $meals
      economy: $economy
      premiumEconomy: $premiumEconomy
      business: $business
      operatingDays: $operatingDays
      daysOfWeek: $daysOfWeek
    ) {
      id
      flightCode
      airline
    }
  }
`;

export const UPDATE_FLIGHT_MUTATION = gql`
  mutation UpdateFlight(
    $id: ID!
    $airline: String
    $departure: String
    $arrival: String
    $duration: String
    $stops: Int
    $seatsLeft: Int
    $rating: Float
    $refundable: Boolean
    $meals: Boolean
    $economy: Int
    $premiumEconomy: Int
    $business: Int
    $operatingDays: [String!]
    $daysOfWeek: [String!]
  ) {
    updateFlight(
      id: $id
      airline: $airline
      departure: $departure
      arrival: $arrival
      duration: $duration
      stops: $stops
      seatsLeft: $seatsLeft
      rating: $rating
      refundable: $refundable
      meals: $meals
      economy: $economy
      premiumEconomy: $premiumEconomy
      business: $business
      operatingDays: $operatingDays
      daysOfWeek: $daysOfWeek
    ) {
      id
      flightCode
      airline
    }
  }
`;

export const DELETE_FLIGHT_MUTATION = gql`
  mutation DeleteFlight($id: ID!) {
    deleteFlight(id: $id)
  }
`;

// ── React Hooks ──────────────────────────────────────────────────────────

export const useSearchFlights = (
  variables: SearchFlightsVariables,
  options?: Omit<
    QueryHookOptions<{ searchFlights: PaginatedFlights }, SearchFlightsVariables>,
    'variables'
  >,
) => {
  return useQuery<{ searchFlights: PaginatedFlights }, SearchFlightsVariables>(
    SEARCH_FLIGHTS_QUERY,
    {
      ...options,
      variables,
    },
  );
};

export const useGetFlightById = (flightId: string) => {
  return useQuery<{ flightById: Flight }>(GET_FLIGHT_BY_ID_QUERY, {
    variables: { id: flightId },
    skip: !flightId,
  });
};

export const useCreateFlight = () => {
  const [mutate, result] = useMutation<{ createFlight: Flight }, CreateFlightVariables>(
    CREATE_FLIGHT_MUTATION,
  );

  return {
    createFlight: (variables: CreateFlightVariables) => mutate({ variables }),
    ...result,
  };
};

export const useUpdateFlight = () => {
  const [mutate, result] = useMutation<{ updateFlight: Flight }, UpdateFlightVariables>(
    UPDATE_FLIGHT_MUTATION,
  );

  return {
    updateFlight: (variables: UpdateFlightVariables) => mutate({ variables }),
    ...result,
  };
};

export const useDeleteFlight = () => {
  const [mutate, result] = useMutation<{ deleteFlight: string }>(DELETE_FLIGHT_MUTATION);

  return {
    deleteFlight: (flightId: string) => mutate({ variables: { id: flightId } }),
    ...result,
  };
};

// ── Hotel Types & Queries ─────────────────────────────────────────────────

export interface GqlHotel {
  id: string;
  name: string;
  city: string;
  stars: number;
  rating: number;
  pricePerNight: number;
  amenities: string[];
  images: string[];
  roomTypes: string[];
  wifi: boolean;
  pool: boolean;
  foodIncluded?: string;
  isActive: boolean;
}

export interface HotelSearchResult {
  hotel: GqlHotel;
}

export interface PaginatedHotels {
  results: HotelSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SearchHotelsVariables = {
  city: string;
  checkIn: string;
  checkOut: string;
  sort?: string;
  wifi?: boolean;
  pool?: boolean;
  foodIncluded?: string;
  page?: number;
  limit?: number;
};

export const SEARCH_HOTELS_QUERY = gql`
  query SearchHotels(
    $city: String!
    $checkIn: String!
    $checkOut: String!
    $sort: String
    $wifi: Boolean
    $pool: Boolean
    $foodIncluded: String
    $page: Int
    $limit: Int
  ) {
    searchHotels(
      city: $city
      checkIn: $checkIn
      checkOut: $checkOut
      sort: $sort
      wifi: $wifi
      pool: $pool
      foodIncluded: $foodIncluded
      page: $page
      limit: $limit
    ) {
      results {
        hotel {
          id
          name
          city
          stars
          rating
          pricePerNight
          amenities
          images
          roomTypes
          wifi
          pool
          foodIncluded
          isActive
        }
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const useSearchHotels = (
  variables: SearchHotelsVariables,
  options?: Omit<QueryHookOptions<{ searchHotels: PaginatedHotels }, SearchHotelsVariables>, 'variables'>,
) => {
  return useQuery<{ searchHotels: PaginatedHotels }, SearchHotelsVariables>(SEARCH_HOTELS_QUERY, {
    ...options,
    variables,
  });
};

// ── Train Types & Queries ─────────────────────────────────────────────────

export interface GqlTrain {
  id: string;
  trainNumber: string;
  name: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  type: string;
  stops: number;
  rating: number;
  fare: {
    general: number;
    sleeper: number;
    ac3Tier: number;
    ac2Tier: number;
    ac1st: number;
  };
  seatsAvailable: {
    general: number;
    sleeper: number;
    ac3Tier: number;
    ac2Tier: number;
    ac1st: number;
  };
  daysOfWeek: string[];
  isActive: boolean;
}

export interface TrainSearchResult {
  train: GqlTrain;
}

export interface PaginatedTrains {
  results: TrainSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SearchTrainsVariables = {
  from: string;
  to: string;
  date: string;
  class?: string;
  sort?: string;
  trainType?: string;
  page?: number;
  limit?: number;
};

export const SEARCH_TRAINS_QUERY = gql`
  query SearchTrains(
    $from: String!
    $to: String!
    $date: String!
    $class: String
    $sort: String
    $trainType: String
    $page: Int
    $limit: Int
  ) {
    searchTrains(
      from: $from
      to: $to
      date: $date
      class: $class
      sort: $sort
      trainType: $trainType
      page: $page
      limit: $limit
    ) {
      results {
        train {
          id
          trainNumber
          name
          from
          fromCode
          to
          toCode
          departureTime
          arrivalTime
          duration
          type
          stops
          rating
          fare {
            general
            sleeper
            ac3Tier
            ac2Tier
            ac1st
          }
          seatsAvailable {
            general
            sleeper
            ac3Tier
            ac2Tier
            ac1st
          }
          daysOfWeek
          isActive
        }
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const useSearchTrains = (
  variables: SearchTrainsVariables,
  options?: Omit<QueryHookOptions<{ searchTrains: PaginatedTrains }, SearchTrainsVariables>, 'variables'>,
) => {
  return useQuery<{ searchTrains: PaginatedTrains }, SearchTrainsVariables>(SEARCH_TRAINS_QUERY, {
    ...options,
    variables,
  });
};

// ── Cab Types & Queries ────────────────────────────────────────────────────

export interface GqlCab {
  id: string;
  carModel: string;
  brand: string;
  type: string;
  city: string;
  fuelType: string;
  ac: boolean;
  seatingCapacity: number;
  baseFare: number;
  pricePerKm: number;
  rating: number;
  driverName: string;
  driverRating: number;
  features: string[];
  image: string;
  isActive: boolean;
}

export interface CabSearchResult {
  cab: GqlCab;
}

export interface PaginatedCabs {
  results: CabSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SearchCabsVariables = {
  city: string;
  distanceKm?: number;
  sort?: string;
  type?: string;
  fuelType?: string;
  ac?: boolean;
  page?: number;
  limit?: number;
};

export const SEARCH_CABS_QUERY = gql`
  query SearchCabs(
    $city: String!
    $distanceKm: Int
    $sort: String
    $type: String
    $fuelType: String
    $ac: Boolean
    $page: Int
    $limit: Int
  ) {
    searchCabs(
      city: $city
      distanceKm: $distanceKm
      sort: $sort
      type: $type
      fuelType: $fuelType
      ac: $ac
      page: $page
      limit: $limit
    ) {
      results {
        cab {
          id
          carModel
          brand
          type
          city
          fuelType
          ac
          seatingCapacity
          baseFare
          pricePerKm
          rating
          driverName
          driverRating
          features
          image
          isActive
        }
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const useSearchCabs = (
  variables: SearchCabsVariables,
  options?: Omit<QueryHookOptions<{ searchCabs: PaginatedCabs }, SearchCabsVariables>, 'variables'>,
) => {
  return useQuery<{ searchCabs: PaginatedCabs }, SearchCabsVariables>(SEARCH_CABS_QUERY, {
    ...options,
    variables,
  });
};
