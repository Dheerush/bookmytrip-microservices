import { z } from 'zod';

export const aggregateSearchSchema = z.object({
  categories: z.string().optional().default('all'),
  from: z.string().optional(),
  to: z.string().optional(),
  date: z.string().optional(),
  passengers: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1).max(9)),
  flightClass: z.enum(['economy', 'premiumEconomy', 'business']).optional().default('economy'),
  flightPassengerType: z.enum(['adult', 'child', 'infant', 'seniorCitizen', 'military']).optional().default('adult'),
  trainClass: z.enum(['general', 'sleeper', 'ac3Tier', 'ac2Tier', 'ac1st']).optional().default('sleeper'),
  trainPassengerType: z.enum(['adult', 'child', 'seniorCitizen', 'military']).optional().default('adult'),
  city: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.string().optional().default('2').transform(Number).pipe(z.number().int().min(1).max(10)),
  rooms: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1).max(5)),
  cabCity: z.string().optional(),
  distanceKm: z.string().optional().transform((value) => value ? Number(value) : undefined),
  cabPassengers: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1).max(8)),
});

export type AggregateSearchQuery = z.infer<typeof aggregateSearchSchema>;
