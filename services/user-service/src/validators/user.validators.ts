import { z } from 'zod';

const genderEnum = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);

// ── Profile ───────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  fullName:    z.string().min(2).max(80).trim().optional(),
  phone:       z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number').optional(),
  avatarUrl:   z.string().url('Invalid avatar URL').optional(),
  gender:      genderEnum.optional(),
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().min(2).max(60).trim().optional(),
});

// ── Traveler ──────────────────────────────────────────────────────────────

export const addTravelerSchema = z.object({
  firstName:          z.string().min(1).max(50).trim(),
  lastName:           z.string().min(1).max(50).trim(),
  gender:             genderEnum,
  dateOfBirth:        z.coerce.date(),
  nationality:        z.string().min(2).max(60).trim(),
  passportNumber:     z.string().max(20).trim().optional(),
  passportExpiryDate: z.coerce.date().optional(),
});

export const updateTravelerSchema = addTravelerSchema.partial();

// ── Address ───────────────────────────────────────────────────────────────

export const addAddressSchema = z.object({
  label:      z.string().min(1).max(30).trim(),
  line1:      z.string().min(1).max(100).trim(),
  line2:      z.string().max(100).trim().optional(),
  city:       z.string().min(1).max(60).trim(),
  state:      z.string().min(1).max(60).trim(),
  country:    z.string().min(1).max(60).trim(),
  postalCode: z.string().min(1).max(12).trim(),
  isDefault:  z.boolean().optional(),
});

export const updateAddressSchema = addAddressSchema.partial();

// ── Preferences ───────────────────────────────────────────────────────────

export const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications:   z.boolean().optional(),
  pushNotifications:  z.boolean().optional(),
  marketingEmails:    z.boolean().optional(),
  currency:           z.string().length(3, 'Currency must be ISO 4217 (3 chars)').toUpperCase().optional(),
  language:           z.string().min(2).max(10).optional(),
});
