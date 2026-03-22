import { Document, Schema, model } from 'mongoose';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type ReviewItemType = 'flight' | 'hotel' | 'train' | 'cab' | 'tour' | 'package';

export interface IReview extends Document {
  itemType: ReviewItemType;
  itemId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    itemType: { type: String, enum: ['flight', 'hotel', 'train', 'cab', 'tour', 'package'], required: true, index: true },
    itemId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    comment: { type: String, required: true, trim: true, maxlength: 1500 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true },
);

reviewSchema.index({ itemType: 1, itemId: 1, userId: 1 }, { unique: true });

export const Review = model<IReview>('Review', reviewSchema);
