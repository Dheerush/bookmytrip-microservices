import { Document, Schema, model } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  startsAt: Date;
  endsAt: Date;
  usageLimit: number;
  usedCount: number;
  oneTimePerUser: boolean;
  usedBy: string[];
  active: boolean;
  applicableOn: string[];
  createdBy: string;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, required: true },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    usageLimit: { type: Number, default: 1000, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    oneTimePerUser: { type: Boolean, default: false },
    usedBy: [{ type: String }],
    active: { type: Boolean, default: true, index: true },
    applicableOn: [{ type: String, default: [] }],
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

export const Coupon = model<ICoupon>('Coupon', couponSchema);
