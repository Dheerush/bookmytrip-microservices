import { Document, Schema, model } from 'mongoose';

export type TrainType = 'Superfast' | 'Express' | 'Rajdhani' | 'Shatabdi' | 'Duronto' | 'Garib Rath' | 'Mail';
export type TrainClass = 'general' | 'sleeper' | 'ac3Tier' | 'ac2Tier' | 'ac1st';
export type PassengerType = 'adult' | 'child' | 'seniorCitizen' | 'military';

export interface ITrainFare {
  general: number;
  sleeper: number;
  ac3Tier: number;
  ac2Tier: number;
  ac1st: number;
}

export interface ISeatAvailability {
  general: number;
  sleeper: number;
  ac3Tier: number;
  ac2Tier: number;
  ac1st: number;
}

export interface IFareCategory {
  adult: number;
  child: number;
  seniorCitizen: number;
  military: number;
}

export interface IFareCategories {
  sleeper: IFareCategory;
  ac3Tier: IFareCategory;
  ac2Tier: IFareCategory;
  ac1st: IFareCategory;
}

export interface ITrain extends Document {
  trainNumber: string;
  name: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  daysOfWeek: string[];
  pnr: string;
  fare: ITrainFare;
  fareCategories: IFareCategories;
  seatsAvailable: ISeatAvailability;
  type: TrainType;
  stops: number;
  rating: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const fareSchema = new Schema<ITrainFare>(
  {
    general: { type: Number, required: true, min: 0 },
    sleeper: { type: Number, required: true, min: 0 },
    ac3Tier: { type: Number, required: true, min: 0 },
    ac2Tier: { type: Number, required: true, min: 0 },
    ac1st: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const seatSchema = new Schema<ISeatAvailability>(
  {
    general: { type: Number, required: true, min: 0 },
    sleeper: { type: Number, required: true, min: 0 },
    ac3Tier: { type: Number, required: true, min: 0 },
    ac2Tier: { type: Number, required: true, min: 0 },
    ac1st: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const fareCategorySchema = new Schema<IFareCategory>(
  {
    adult: { type: Number, required: true, min: 0 },
    child: { type: Number, required: true, min: 0 },
    seniorCitizen: { type: Number, required: true, min: 0 },
    military: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const fareCategoriesSchema = new Schema<IFareCategories>(
  {
    sleeper: { type: fareCategorySchema, required: true },
    ac3Tier: { type: fareCategorySchema, required: true },
    ac2Tier: { type: fareCategorySchema, required: true },
    ac1st: { type: fareCategorySchema, required: true },
  },
  { _id: false },
);

const trainSchema = new Schema<ITrain>(
  {
    trainNumber: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    from: { type: String, required: true },
    fromCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    to: { type: String, required: true },
    toCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    duration: { type: String, required: true },
    daysOfWeek: [{ type: String, required: true }],
    pnr: { type: String, required: true },
    fare: { type: fareSchema, required: true },
    fareCategories: { type: fareCategoriesSchema, required: true },
    seatsAvailable: { type: seatSchema, required: true },
    type: {
      type: String,
      required: true,
      enum: ['Superfast', 'Express', 'Rajdhani', 'Shatabdi', 'Duronto', 'Garib Rath', 'Mail'],
    },
    stops: { type: Number, required: true, min: 0 },
    rating: { type: Number, required: true, min: 0, max: 5 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

trainSchema.index({ fromCode: 1, toCode: 1, isActive: 1 });
trainSchema.index({ type: 1, isActive: 1 });

export const Train = model<ITrain>('Train', trainSchema);
