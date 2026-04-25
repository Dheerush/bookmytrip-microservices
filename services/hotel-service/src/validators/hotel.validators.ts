import { z } from 'zod';

const normalizeFoodIncluded = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'all meals') return 'all-meals';
  return normalized;
};

const normalizeRefundPolicy = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'non refundable') return 'non-refundable';
  return normalized;
};

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
}).superRefine((value, ctx) => {
  const checkIn = toDateOnly(value.checkIn);
  const checkOut = toDateOnly(value.checkOut);
  const today = todayDateOnly();

  if (!checkIn) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['checkIn'],
      message: 'checkIn must be a valid date',
    });
  }

  if (!checkOut) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['checkOut'],
      message: 'checkOut must be a valid date',
    });
  }

  if (!checkIn || !checkOut) return;

  if (checkIn < today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['checkIn'],
      message: 'checkIn cannot be in the past',
    });
  }

  if (checkOut <= checkIn) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['checkOut'],
      message: 'checkOut must be after checkIn',
    });
  }
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
  foodIncluded: z.preprocess(normalizeFoodIncluded, z.enum(['breakfast', 'all-meals', 'none'])),
  wifi: z.boolean(),
  parking: z.boolean(),
  pool: z.boolean(),
  gym: z.boolean(),
  spa: z.boolean(),
  petFriendly: z.boolean(),
  refundPolicy: z.preprocess(normalizeRefundPolicy, z.enum(['full', 'partial', 'non-refundable'])),
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
