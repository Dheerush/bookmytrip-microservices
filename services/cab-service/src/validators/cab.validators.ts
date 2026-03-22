import { z } from 'zod';

export const searchCabsSchema = z.object({
  city: z.string().min(2),
  distanceKm: z.string().transform(Number).pipe(z.number().positive().max(500)),
  passengers: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1).max(8)),
  type: z.enum(['Sedan', 'SUV', 'MUV', 'Hatchback', 'Luxury']).optional(),
  fuelType: z.enum(['Petrol', 'Diesel', 'CNG', 'Electric']).optional(),
  ac: z.string().optional().transform((v) => v === 'true'),
  maxPrice: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  sort: z.enum(['price_asc', 'price_desc', 'rating', 'driver_rating']).optional().default('price_asc'),
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().optional().default('10').transform(Number).pipe(z.number().int().min(1).max(50)),
});

export const createCabSchema = z.object({
  carModel: z.string().min(2),
  brand: z.string().min(2),
  type: z.enum(['Sedan', 'SUV', 'MUV', 'Hatchback', 'Luxury']),
  image: z.string().min(1),
  seatingCapacity: z.number().int().min(1).max(8),
  fuelType: z.enum(['Petrol', 'Diesel', 'CNG', 'Electric']),
  ac: z.boolean(),
  baseFare: z.number().int().min(0),
  pricePerKm: z.number().int().min(0),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  driverName: z.string().min(2),
  driverRating: z.number().min(0).max(5),
  city: z.string().min(2),
  features: z.array(z.string()).min(1),
  luggage: z.string().min(1),
  available: z.boolean().default(true),
});

export const updateCabSchema = createCabSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type SearchCabsQuery = z.infer<typeof searchCabsSchema>;
export type CreateCabDto = z.infer<typeof createCabSchema>;
export type UpdateCabDto = z.infer<typeof updateCabSchema>;
