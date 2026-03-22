import mongoose, { Schema, Document } from 'mongoose';
import { Gender, IAddressDoc, ITravelerDoc, UserRole } from '../types/user.types';

// ── Embedded sub-schemas ──────────────────────────────────────────────────

const travelerSchema = new Schema<ITravelerDoc>(
  {
    firstName:           { type: String, required: true, trim: true },
    lastName:            { type: String, required: true, trim: true },
    gender:              { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], required: true },
    dateOfBirth:         { type: Date, required: true },
    nationality:         { type: String, required: true, trim: true },
    passportNumber:      { type: String, trim: true },
    passportExpiryDate:  { type: Date },
  },
  { _id: true },
);

const addressSchema = new Schema<IAddressDoc>(
  {
    label:      { type: String, required: true, trim: true },
    line1:      { type: String, required: true, trim: true },
    line2:      { type: String, trim: true },
    city:       { type: String, required: true, trim: true },
    state:      { type: String, required: true, trim: true },
    country:    { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    isDefault:  { type: Boolean, default: false },
  },
  { _id: true },
);

// ── Main UserProfile document ─────────────────────────────────────────────

export interface IUserProfile extends Document {
  // auth-service user _id — links identity → profile
  authId:        string;
  email:         string;
  fullName:      string;
  phone?:        string;
  avatarUrl?:    string;
  role:          UserRole;
  gender?:       Gender;
  dateOfBirth?:  Date;
  nationality?:  string;

  travelers:     ITravelerDoc[];
  addresses:     IAddressDoc[];

  // Notification preferences
  preferences: {
    emailNotifications:  boolean;
    smsNotifications:    boolean;
    pushNotifications:   boolean;
    marketingEmails:     boolean;
    currency:            string;
    language:            string;
  };

  createdAt:  Date;
  updatedAt:  Date;
}

const preferencesSchema = new Schema(
  {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications:   { type: Boolean, default: true },
    pushNotifications:  { type: Boolean, default: true },
    marketingEmails:    { type: Boolean, default: false },
    currency:           { type: String, default: 'INR' },
    language:           { type: String, default: 'en' },
  },
  { _id: false },
);

const userProfileSchema = new Schema<IUserProfile>(
  {
    authId:        { type: String, required: true, unique: true, index: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName:      { type: String, required: true, trim: true },
    phone:         { type: String, trim: true },
    avatarUrl:     { type: String },
    role:          { type: String, enum: ['user', 'vendor', 'admin'], default: 'user' },
    gender:        { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    dateOfBirth:   { type: Date },
    nationality:   { type: String, trim: true },

    travelers:     { type: [travelerSchema], default: [] },
    addresses:     { type: [addressSchema], default: [] },
    preferences:   { type: preferencesSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', userProfileSchema);
