import { z } from 'zod';

const toDateOnly = (value: string): Date | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const todayDateOnly = (): Date => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

export const searchTrainsSchema = z.object({
  from: z.string().min(3).max(4).transform((value) => value.toUpperCase()),
  to: z.string().min(3).max(4).transform((value) => value.toUpperCase()),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .refine((value) => {
      const date = toDateOnly(value);
      if (!date) return false;
      return date >= todayDateOnly();
    }, 'date cannot be in the past'),
  passengers: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1).max(9)),
  class: z.enum(['general', 'sleeper', 'ac3Tier', 'ac2Tier', 'ac1st']).optional().default('sleeper'),
  passengerType: z.enum(['adult', 'child', 'seniorCitizen', 'military']).optional().default('adult'),
  trainType: z.enum(['Superfast', 'Express', 'Rajdhani', 'Shatabdi', 'Duronto', 'Garib Rath', 'Mail']).optional(),
  maxPrice: z.string().optional().transform((value) => (value ? Number(value) : undefined)),
  maxStops: z.string().optional().transform((value) => (value ? Number(value) : undefined)),
  sort: z.enum(['price_asc', 'price_desc', 'duration', 'rating', 'departure']).optional().default('price_asc'),
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().optional().default('10').transform(Number).pipe(z.number().int().min(1).max(50)),
});

const fareSchema = z.object({
  general: z.number().int().min(0),
  sleeper: z.number().int().min(0),
  ac3Tier: z.number().int().min(0),
  ac2Tier: z.number().int().min(0),
  ac1st: z.number().int().min(0),
});

const fareCategorySchema = z.object({
  adult: z.number().int().min(0),
  child: z.number().int().min(0),
  seniorCitizen: z.number().int().min(0),
  military: z.number().int().min(0),
});

const seatSchema = z.object({
  general: z.number().int().min(0),
  sleeper: z.number().int().min(0),
  ac3Tier: z.number().int().min(0),
  ac2Tier: z.number().int().min(0),
  ac1st: z.number().int().min(0),
});

export const createTrainSchema = z.object({
  trainNumber: z.string().min(3),
  name: z.string().min(2),
  from: z.string().min(2),
  fromCode: z.string().min(3).max(4).transform((value) => value.toUpperCase()),
  fromStationName: z.string().min(2).optional(),
  fromStationCode: z.string().min(3).max(4).transform((value) => value.toUpperCase()).optional(),
  to: z.string().min(2),
  toCode: z.string().min(3).max(4).transform((value) => value.toUpperCase()),
  toStationName: z.string().min(2).optional(),
  toStationCode: z.string().min(3).max(4).transform((value) => value.toUpperCase()).optional(),
  platformNumber: z.string().min(1).optional(),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format required'),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format required'),
  duration: z.string().min(2),
  daysOfWeek: z.array(z.string()).min(1),
  pnr: z.string().min(4),
  fare: fareSchema,
  fareCategories: z.object({
    sleeper: fareCategorySchema,
    ac3Tier: fareCategorySchema,
    ac2Tier: fareCategorySchema,
    ac1st: fareCategorySchema,
  }).optional(),
  seatsAvailable: seatSchema,
  type: z.enum(['Superfast', 'Express', 'Rajdhani', 'Shatabdi', 'Duronto', 'Garib Rath', 'Mail']),
  stops: z.number().int().min(0),
  rating: z.number().min(0).max(5),
});

export const updateTrainSchema = createTrainSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type SearchTrainsQuery = z.infer<typeof searchTrainsSchema>;
export type CreateTrainDto = z.infer<typeof createTrainSchema>;
export type UpdateTrainDto = z.infer<typeof updateTrainSchema>;
