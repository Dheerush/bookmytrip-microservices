import { Document, Schema, model } from 'mongoose';

export interface IOffer extends Document {
  title: string;
  headline: string;
  details: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  startsAt: Date;
  endsAt: Date;
  active: boolean;
  createdBy: string;
}

const offerSchema = new Schema<IOffer>(
  {
    title: { type: String, required: true },
    headline: { type: String, required: true },
    details: { type: String, required: true },
    imageUrl: { type: String },
    ctaLabel: { type: String },
    ctaUrl: { type: String },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

export const Offer = model<IOffer>('Offer', offerSchema);
