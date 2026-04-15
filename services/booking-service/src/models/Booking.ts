import { Document, Schema, model } from 'mongoose';

export type BookingType = 'flight' | 'hotel' | 'train' | 'cab' | 'tour';
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled' | 'pending' | 'failed';

export interface IBookingContact {
  name: string;
  email: string;
  phone: string;
}

export interface IBookingPassenger {
  name: string;
  age?: number;
  gender?: string;
  email?: string;
  seatNumber?: string;
}

export interface IBooking extends Document {
  userId: string;
  bookingRef: string;
  type: BookingType;
  itemId: string;
  title: string;
  city?: string;
  fromCode?: string;
  toCode?: string;
  bookingDate: Date;
  startDate: Date;
  endDate?: Date;
  scheduleTime?: string;
  quantity: number;
  amount: number;
  status: BookingStatus;
  contact: IBookingContact;
  passengers: IBookingPassenger[];
  metadata: Record<string, unknown>;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IBookingContact>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false },
);

const passengerSchema = new Schema<IBookingPassenger>(
  {
    name: { type: String, required: true },
    age: { type: Number },
    gender: { type: String },
    email: { type: String },
    seatNumber: { type: String },
  },
  { _id: false },
);

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: String, required: true, index: true },
    bookingRef: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, enum: ['flight', 'hotel', 'train', 'cab', 'tour'], index: true },
    itemId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    city: { type: String },
    fromCode: { type: String },
    toCode: { type: String },
    bookingDate: { type: Date, required: true, default: Date.now },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    quantity: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    scheduleTime: { type: String },
    status: { type: String, required: true, enum: ['confirmed', 'completed', 'cancelled', 'pending', 'failed'], default: 'pending', index: true },
    contact: { type: contactSchema, required: true },
    passengers: { type: [passengerSchema], default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
  },
  { timestamps: true },
);

bookingSchema.index({ userId: 1, type: 1, status: 1, createdAt: -1 });

export const Booking = model<IBooking>('Booking', bookingSchema);
