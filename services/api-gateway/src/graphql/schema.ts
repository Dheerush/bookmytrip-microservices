import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  enum CabinClass {
    economy
    premiumEconomy
    business
  }

  enum PassengerType {
    adult
    child
    infant
    seniorCitizen
    military
  }

  enum SortOption {
    price_asc
    price_desc
    duration
    rating
  }

  type Fare {
    economy: Int!
    premiumEconomy: Int!
    business: Int!
  }

  type FareCategory {
    adult: Int!
    child: Int!
    infant: Int!
    seniorCitizen: Int!
    military: Int!
  }

  type FareCategories {
    economy: FareCategory!
    premiumEconomy: FareCategory!
    business: FareCategory!
  }

  type Flight {
    id: ID!
    flightCode: String!
    airline: String!
    fromCode: String!
    toCode: String!
    departure: String!
    arrival: String!
    duration: String!
    stops: Int!
    seatsLeft: Int!
    rating: Float!
    refundable: Boolean!
    meals: Boolean!
    fare: Fare!
    fareCategories: FareCategories
    operatingDays: [String!]!
    daysOfWeek: [String!]!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type FlightSearchResult {
    flight: Flight!
    unitPrice: Int!
    totalPrice: Int!
    cabinClass: CabinClass!
    passengerType: PassengerType!
  }

  type PaginatedFlights {
    results: [FlightSearchResult!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  # ─── Hotel Types ───────────────────────────────────────────────────────────

  type Hotel {
    id: ID!
    name: String!
    city: String!
    stars: Int!
    rating: Float!
    pricePerNight: Int!
    amenities: [String!]!
    images: [String!]!
    roomTypes: [String!]!
    wifi: Boolean!
    pool: Boolean!
    foodIncluded: String
    isActive: Boolean!
  }

  type HotelSearchResult {
    hotel: Hotel!
  }

  type PaginatedHotels {
    results: [HotelSearchResult!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  # ─── Train Types ──────────────────────────────────────────────────────────

  type TrainFareResult {
    general: Int!
    sleeper: Int!
    ac3Tier: Int!
    ac2Tier: Int!
    ac1st: Int!
  }

  type TrainSeatsResult {
    general: Int!
    sleeper: Int!
    ac3Tier: Int!
    ac2Tier: Int!
    ac1st: Int!
  }

  type TrainResult {
    id: ID!
    trainNumber: String!
    name: String!
    from: String!
    fromCode: String!
    to: String!
    toCode: String!
    departureTime: String!
    arrivalTime: String!
    duration: String!
    type: String!
    stops: Int!
    rating: Float!
    fare: TrainFareResult!
    seatsAvailable: TrainSeatsResult!
    daysOfWeek: [String!]!
    isActive: Boolean!
  }

  type TrainSearchResult {
    train: TrainResult!
  }

  type PaginatedTrains {
    results: [TrainSearchResult!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  # ─── Cab Types ────────────────────────────────────────────────────────────

  type CabResult {
    id: ID!
    carModel: String!
    brand: String!
    type: String!
    city: String!
    fuelType: String!
    ac: Boolean!
    seatingCapacity: Int!
    baseFare: Int!
    pricePerKm: Float!
    rating: Float!
    driverName: String!
    driverRating: Float!
    features: [String!]!
    image: String!
    isActive: Boolean!
  }

  type CabSearchResult {
    cab: CabResult!
  }

  type PaginatedCabs {
    results: [CabSearchResult!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  type Query {
    """
    Search available flights
    """
    searchFlights(
      from: String!
      to: String!
      date: String!
      passengers: Int
      cabinClass: CabinClass
      passengerType: PassengerType
      airlines: String
      maxPrice: Int
      stops: Int
      refundable: Boolean
      meals: Boolean
      sort: SortOption
      page: Int
      limit: Int
    ): PaginatedFlights!

    """
    Get flight details by ID
    """
    flightById(id: ID!): Flight!

    """
    Get flight details by flight code
    """
    flightByCode(code: String!): Flight!

    """
    List all flights (admin only)
    """
    allFlights(page: Int, limit: Int): PaginatedFlights! @requiresAuth

    """
    Search available hotels
    """
    searchHotels(
      city: String!
      checkIn: String!
      checkOut: String!
      sort: String
      wifi: Boolean
      pool: Boolean
      foodIncluded: String
      page: Int
      limit: Int
    ): PaginatedHotels!

    """
    Search available trains
    """
    searchTrains(
      from: String!
      to: String!
      date: String!
      class: String
      sort: String
      trainType: String
      page: Int
      limit: Int
    ): PaginatedTrains!

    """
    Search available cabs
    """
    searchCabs(
      city: String!
      distanceKm: Int
      sort: String
      type: String
      fuelType: String
      ac: Boolean
      page: Int
      limit: Int
    ): PaginatedCabs!
  }

  type Mutation {
    """
    Create a new flight (admin only)
    """
    createFlight(
      flightCode: String!
      airline: String!
      fromCode: String!
      toCode: String!
      departure: String!
      arrival: String!
      duration: String!
      stops: Int!
      seatsLeft: Int!
      rating: Float!
      refundable: Boolean!
      meals: Boolean!
      economy: Int!
      premiumEconomy: Int!
      business: Int!
      operatingDays: [String!]!
      daysOfWeek: [String!]!
    ): Flight! @requiresAuth

    """
    Update flight details (admin only)
    """
    updateFlight(
      id: ID!
      airline: String
      departure: String
      arrival: String
      duration: String
      stops: Int
      seatsLeft: Int
      rating: Float
      refundable: Boolean
      meals: Boolean
      economy: Int
      premiumEconomy: Int
      business: Int
      operatingDays: [String!]
      daysOfWeek: [String!]
    ): Flight! @requiresAuth

    """
    Deactivate/delete a flight (admin only)
    """
    deleteFlight(id: ID!): String! @requiresAuth
  }

  directive @requiresAuth on FIELD_DEFINITION
`;
