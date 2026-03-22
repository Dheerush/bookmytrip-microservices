import { Document, Schema, model } from 'mongoose';

export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

export interface IPayment extends Document {
  userId: string;
  bookingId: string;
  bookingRef: string;
  paymentRef: string;
  transactionId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider?: string;
  status: PaymentStatus;
  couponCode?: string;
  discountAmount: number;
  failureReason?: string;
  refundReason?: string;
  paidAt?: Date;
  refundedAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: { type: String, required: true, index: true },
    bookingId: { type: String, required: true, index: true },
    bookingRef: { type: String, required: true, index: true },
    paymentRef: { type: String, required: true, unique: true, index: true },
    transactionId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
    method: { type: String, required: true, enum: ['card', 'upi', 'netbanking', 'wallet'], index: true },
    provider: { type: String },
    status: { type: String, required: true, enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded'], default: 'pending', index: true },
    couponCode: { type: String },
    discountAmount: { type: Number, required: true, default: 0, min: 0 },
    failureReason: { type: String },
    refundReason: { type: String },
    paidAt: { type: Date },
    refundedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

paymentSchema.index({ userId: 1, bookingId: 1, createdAt: -1 });

export const Payment = model<IPayment>('Payment', paymentSchema);