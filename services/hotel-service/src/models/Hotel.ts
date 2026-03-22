import { Document, Schema, model } from 'mongoose';

export type FoodIncluded = 'breakfast' | 'all-meals' | 'none';
export type RefundPolicy = 'full' | 'partial' | 'non-refundable';

export interface IHotelRoom {
  type: string;
  price: number;
  originalPrice: number;
  maxGuests: number;
  bedType: string;
  size: string;
  available: number;
}

export interface IHotelOffer {
  title: string;
  description: string;
  code: string;
  discount: string;
}

export interface IHotel extends Document {
  name: string;
  city: string;
  address: string;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stars: number;
  pricePerNight: number;
  originalPrice: number;
  amenities: string[];
  foodIncluded: FoodIncluded;
  wifi: boolean;
  parking: boolean;
  pool: boolean;
  gym: boolean;
  spa: boolean;
  petFriendly: boolean;
  refundPolicy: RefundPolicy;
  refundDescription: string;
  checkInTime: string;
  checkOutTime: string;
  rooms: IHotelRoom[];
  offers: IHotelOffer[];
  description: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IHotelRoom>({
  type: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, required: true, min: 0 },
  maxGuests: { type: Number, required: true, min: 1 },
  bedType: { type: String, required: true },
  size: { type: String, required: true },
  available: { type: Number, required: true, min: 0 },
}, { _id: false });

const offerSchema = new Schema<IHotelOffer>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  code: { type: String, required: true },
  discount: { type: String, required: true },
}, { _id: false });

const hotelSchema = new Schema<IHotel>({
  name: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true, index: true },
  address: { type: String, required: true },
  image: { type: String, required: true },
  images: [{ type: String, required: true }],
  rating: { type: Number, required: true, min: 0, max: 5 },
  reviewCount: { type: Number, required: true, min: 0 },
  stars: { type: Number, required: true, min: 1, max: 5 },
  pricePerNight: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, required: true, min: 0 },
  amenities: [{ type: String, required: true }],
  foodIncluded: { type: String, required: true, enum: ['breakfast', 'all-meals', 'none'] },
  wifi: { type: Boolean, default: false },
  parking: { type: Boolean, default: false },
  pool: { type: Boolean, default: false },
  gym: { type: Boolean, default: false },
  spa: { type: Boolean, default: false },
  petFriendly: { type: Boolean, default: false },
  refundPolicy: { type: String, required: true, enum: ['full', 'partial', 'non-refundable'] },
  refundDescription: { type: String, required: true },
  checkInTime: { type: String, required: true },
  checkOutTime: { type: String, required: true },
  rooms: [roomSchema],
  offers: [offerSchema],
  description: { type: String, required: true },
  tags: [{ type: String, required: true }],
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

hotelSchema.index({ city: 1, stars: 1, isActive: 1 });

export const Hotel = model<IHotel>('Hotel', hotelSchema);
