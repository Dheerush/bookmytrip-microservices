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

// ── Search query ──────────────────────────────────────────────────────────────

export const searchFlightsSchema = z.object({
  from:          z.string().length(3, 'fromCode must be 3 characters').toUpperCase(),
  to:            z.string().length(3, 'toCode must be 3 characters').toUpperCase(),
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .refine((value) => {
      const date = toDateOnly(value);
      if (!date) return false;
      return date >= todayDateOnly();
    }, 'date cannot be in the past'),
  passengers:    z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1).max(9)),
  class:         z.enum(['economy', 'premiumEconomy', 'business']).optional().default('economy'),
  passengerType: z.enum(['adult', 'child', 'infant', 'seniorCitizen', 'military']).optional().default('adult'),
  // filters
  airlines:      z.string().optional(),   // comma-separated airline names
  maxPrice:      z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  stops:         z.string().optional().transform((v) => (v !== undefined ? Number(v) : undefined)),
  refundable:    z.string().optional().transform((v) => v === 'true'),
  meals:         z.string().optional().transform((v) => v === 'true'),
  // sort
  sort:          z.enum(['price_asc', 'price_desc', 'duration', 'rating']).optional().default('price_asc'),
  // pagination
  page:          z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit:         z.string().optional().default('10').transform(Number).pipe(z.number().int().min(1).max(200)),
}).superRefine((value, ctx) => {
  if (value.from === value.to) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['to'],
      message: 'Destination cannot be the same as source',
    });
  }
});

export type SearchFlightsQuery = z.infer<typeof searchFlightsSchema>;

// ── Admin: create flight ──────────────────────────────────────────────────────

const fareCategorySchema = z.object({
  adult:         z.number().int().min(0),
  child:         z.number().int().min(0),
  infant:        z.number().int().min(0),
  seniorCitizen: z.number().int().min(0),
  military:      z.number().int().min(0),
});

const fareSchema = z.object({
  economy:        z.number().int().min(0),
  premiumEconomy: z.number().int().min(0),
  business:       z.number().int().min(0),
});

export const createFlightSchema = z.object({
  flightCode:     z.string().min(3).toUpperCase(),
  airline:        z.string().min(2),
  airlineLogo:    z.string().url().optional().or(z.literal('')).optional(),
  from:           z.string().min(2),
  fromCode:       z.string().length(3).toUpperCase(),
  boardingAirport:z.string().min(2).optional(),
  boardingTerminal:z.string().min(1).optional(),
  boardingTime:   z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format required').optional(),
  to:             z.string().min(2),
  toCode:         z.string().length(3).toUpperCase(),
  departureTime:  z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format required'),
  arrivalTime:    z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format required'),
  duration:       z.string().min(2),
  stops:          z.number().int().min(0).default(0),
  stopCities:     z.array(z.string()).optional().default([]),
  operatingDays:  z.array(z.string()).optional().default(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
  originalPrice:  z.number().int().min(0),
  discountedPrice:z.number().int().min(0),
  fare:           fareSchema,
  fareCategories: z.object({ economy: fareCategorySchema, premiumEconomy: fareCategorySchema, business: fareCategorySchema }).optional(),
  seatsLeft:      z.number().int().min(0),
  aircraft:       z.string().min(2),
  baggage:        z.object({ cabin: z.string(), checkin: z.string() }),
  meals:          z.boolean().default(false),
  refundable:     z.boolean().default(false),
  rating:         z.number().min(0).max(5).default(0),
});

export type CreateFlightDto = z.infer<typeof createFlightSchema>;

// ── Admin: update flight ──────────────────────────────────────────────────────

export const updateFlightSchema = createFlightSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateFlightDto = z.infer<typeof updateFlightSchema>;
