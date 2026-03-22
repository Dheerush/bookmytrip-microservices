import { Document, Schema, model } from 'mongoose';

export type CabType = 'Sedan' | 'SUV' | 'MUV' | 'Hatchback' | 'Luxury';
export type FuelType = 'Petrol' | 'Diesel' | 'CNG' | 'Electric';

export interface ICab extends Document {
  carModel: string;
  brand: string;
  type: CabType;
  image: string;
  seatingCapacity: number;
  fuelType: FuelType;
  ac: boolean;
  baseFare: number;
  pricePerKm: number;
  rating: number;
  reviewCount: number;
  driverName: string;
  driverRating: number;
  city: string;
  features: string[];
  luggage: string;
  available: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const cabSchema = new Schema<ICab>({
  carModel: { type: String, required: true },
  brand: { type: String, required: true },
  type: { type: String, required: true, enum: ['Sedan', 'SUV', 'MUV', 'Hatchback', 'Luxury'] },
  image: { type: String, required: true },
  seatingCapacity: { type: Number, required: true, min: 1 },
  fuelType: { type: String, required: true, enum: ['Petrol', 'Diesel', 'CNG', 'Electric'] },
  ac: { type: Boolean, default: true },
  baseFare: { type: Number, required: true, min: 0 },
  pricePerKm: { type: Number, required: true, min: 0 },
  rating: { type: Number, required: true, min: 0, max: 5 },
  reviewCount: { type: Number, required: true, min: 0 },
  driverName: { type: String, required: true },
  driverRating: { type: Number, required: true, min: 0, max: 5 },
  city: { type: String, required: true, index: true },
  features: [{ type: String, required: true }],
  luggage: { type: String, required: true },
  available: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

cabSchema.index({ city: 1, type: 1, isActive: 1 });

export const Cab = model<ICab>('Cab', cabSchema);
