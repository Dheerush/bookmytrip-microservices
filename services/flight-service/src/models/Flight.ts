import { Schema, model, Document } from 'mongoose';

// ── Sub-schemas ─────────────────────────────────────────────────────────────

export interface IFareCategory {
  adult: number;
  child: number;
  infant: number;
  seniorCitizen: number;
  military: number;
}

export interface IFare {
  economy: number;
  premiumEconomy: number;
  business: number;
}

export interface IFareCategories {
  economy: IFareCategory;
  premiumEconomy: IFareCategory;
  business: IFareCategory;
}

export interface IBaggage {
  cabin: string;
  checkin: string;
}

// ── Main document interface ──────────────────────────────────────────────────

export interface IFlight extends Document {
  flightCode: string;
  airline: string;
  airlineLogo: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  departureTime: string;   // "HH:MM" — schedule-relative, date applied at search time
  arrivalTime: string;
  duration: string;
  stops: number;
  stopCities: string[];
  originalPrice: number;
  discountedPrice: number;
  fare: IFare;
  fareCategories: IFareCategories;
  seatsLeft: number;
  aircraft: string;
  baggage: IBaggage;
  meals: boolean;
  refundable: boolean;
  rating: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Sub-schema factories ─────────────────────────────────────────────────────

const fareCategorySchema = new Schema<IFareCategory>(
  {
    adult:        { type: Number, required: true },
    child:        { type: Number, required: true },
    infant:       { type: Number, required: true },
    seniorCitizen:{ type: Number, required: true },
    military:     { type: Number, required: true },
  },
  { _id: false },
);

const fareSchema = new Schema<IFare>(
  {
    economy:       { type: Number, required: true },
    premiumEconomy:{ type: Number, required: true },
    business:      { type: Number, required: true },
  },
  { _id: false },
);

const fareCategSchema = new Schema<IFareCategories>(
  {
    economy:       { type: fareCategorySchema, required: true },
    premiumEconomy:{ type: fareCategorySchema, required: true },
    business:      { type: fareCategorySchema, required: true },
  },
  { _id: false },
);

const baggageSchema = new Schema<IBaggage>(
  { cabin: String, checkin: String },
  { _id: false },
);

// ── Main schema ──────────────────────────────────────────────────────────────

const flightSchema = new Schema<IFlight>(
  {
    flightCode:    { type: String, required: true, unique: true, uppercase: true, trim: true },
    airline:       { type: String, required: true, trim: true },
    airlineLogo:   { type: String, default: '' },
    from:          { type: String, required: true },
    fromCode:      { type: String, required: true, uppercase: true, length: 3, index: true },
    to:            { type: String, required: true },
    toCode:        { type: String, required: true, uppercase: true, length: 3, index: true },
    departureTime: { type: String, required: true },
    arrivalTime:   { type: String, required: true },
    duration:      { type: String, required: true },
    stops:         { type: Number, required: true, min: 0, default: 0 },
    stopCities:    [{ type: String }],
    originalPrice: { type: Number, required: true, min: 0 },
    discountedPrice:{ type: Number, required: true, min: 0 },
    fare:          { type: fareSchema, required: true },
    fareCategories:{ type: fareCategSchema, required: true },
    seatsLeft:     { type: Number, required: true, min: 0, default: 0 },
    aircraft:      { type: String, required: true },
    baggage:       { type: baggageSchema, required: true },
    meals:         { type: Boolean, default: false },
    refundable:    { type: Boolean, default: false },
    rating:        { type: Number, min: 0, max: 5, default: 0 },
    isActive:      { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

// Compound index for search
flightSchema.index({ fromCode: 1, toCode: 1, isActive: 1 });

export const Flight = model<IFlight>('Flight', flightSchema);
