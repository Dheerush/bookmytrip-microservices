import { z } from 'zod';

export const searchHotelsSchema = z.object({
  city: z.string().min(2),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.string().optional().default('2').transform(Number).pipe(z.number().int().min(1).max(10)),
  rooms: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1).max(5)),
  stars: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  maxPrice: z.string().optional().transform((v) => (v ? Number(v) : undefined)),
  foodIncluded: z.enum(['breakfast', 'all-meals', 'none']).optional(),
  refundPolicy: z.enum(['full', 'partial', 'non-refundable']).optional(),
  wifi: z.string().optional().transform((v) => v === 'true'),
  parking: z.string().optional().transform((v) => v === 'true'),
  pool: z.string().optional().transform((v) => v === 'true'),
  gym: z.string().optional().transform((v) => v === 'true'),
  spa: z.string().optional().transform((v) => v === 'true'),
  petFriendly: z.string().optional().transform((v) => v === 'true'),
  sort: z.enum(['price_asc', 'price_desc', 'rating', 'stars']).optional().default('price_asc'),
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().optional().default('10').transform(Number).pipe(z.number().int().min(1).max(50)),
});

const roomSchema = z.object({
  type: z.string().min(1),
  price: z.number().int().min(0),
  originalPrice: z.number().int().min(0),
  maxGuests: z.number().int().min(1),
  bedType: z.string().min(1),
  size: z.string().min(1),
  available: z.number().int().min(0),
});

const offerSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  code: z.string().min(1),
  discount: z.string().min(1),
});

export const createHotelSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  address: z.string().min(2),
  image: z.string().min(1),
  images: z.array(z.string()).min(1),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  stars: z.number().int().min(1).max(5),
  pricePerNight: z.number().int().min(0),
  originalPrice: z.number().int().min(0),
  amenities: z.array(z.string()).min(1),
  foodIncluded: z.enum(['breakfast', 'all-meals', 'none']),
  wifi: z.boolean(),
  parking: z.boolean(),
  pool: z.boolean(),
  gym: z.boolean(),
  spa: z.boolean(),
  petFriendly: z.boolean(),
  refundPolicy: z.enum(['full', 'partial', 'non-refundable']),
  refundDescription: z.string().min(2),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/),
  rooms: z.array(roomSchema).min(1),
  offers: z.array(offerSchema),
  description: z.string().min(10),
  tags: z.array(z.string()).min(1),
});

export const updateHotelSchema = createHotelSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type SearchHotelsQuery = z.infer<typeof searchHotelsSchema>;
export type CreateHotelDto = z.infer<typeof createHotelSchema>;
export type UpdateHotelDto = z.infer<typeof updateHotelSchema>;
