import { Document, Schema, model } from 'mongoose';

interface TourOffer {
  title: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  isActive: boolean;
  startsAt?: Date;
  endsAt?: Date;
}

export interface ITour extends Document {
  title: string;
  slug: string;
  city: string;
  country: string;
  durationDays: number;
  basePrice: number;
  discountPrice?: number;
  heroImage: string;
  images: string[];
  description: string;
  tags: string[];
  inclusions: string[];
  exclusions: string[];
  hotel?: string;
  hotelRating?: number;
  food?: string[];
  transport?: string[];
  activities?: string[];
  bestSeason?: string;
  groupSize?: string;
  tripType?: 'Leisure' | 'Adventure' | 'Cultural' | 'Honeymoon' | 'Family' | 'Spiritual';
  hospitality?: string;
  documents?: string[];
  highlights?: string[];
  guide?: {
    name: string;
    contact: string;
    languages: string[];
    rating: number;
    experience: string;
    speciality: string;
    photo: string;
    bio: string;
  };
  offers: TourOffer[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<TourOffer>(
  {
    title: { type: String, required: true },
    code: { type: String, required: true, uppercase: true },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  { _id: false },
);

const tourSchema = new Schema<ITour>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    city: { type: String, required: true, index: true },
    country: { type: String, required: true, default: 'India' },
    durationDays: { type: Number, required: true, min: 1 },
    basePrice: { type: Number, required: true, min: 0, index: true },
    discountPrice: { type: Number, min: 0 },
    heroImage: { type: String, required: true },
    images: [{ type: String, required: true }],
    description: { type: String, required: true },
    tags: [{ type: String }],
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    hotel: { type: String },
    hotelRating: { type: Number, min: 0, max: 5 },
    food: [{ type: String }],
    transport: [{ type: String }],
    activities: [{ type: String }],
    bestSeason: { type: String },
    groupSize: { type: String },
    tripType: {
      type: String,
      enum: ['Leisure', 'Adventure', 'Cultural', 'Honeymoon', 'Family', 'Spiritual'],
    },
    hospitality: { type: String },
    documents: [{ type: String }],
    highlights: [{ type: String }],
    guide: {
      name: { type: String },
      contact: { type: String },
      languages: [{ type: String }],
      rating: { type: Number, min: 0, max: 5 },
      experience: { type: String },
      speciality: { type: String },
      photo: { type: String },
      bio: { type: String },
    },
    offers: [offerSchema],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

tourSchema.index({ city: 1, isActive: 1 });

export const Tour = model<ITour>('Tour', tourSchema);
