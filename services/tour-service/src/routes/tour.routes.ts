import { Router } from 'express';
import { SortOrder } from 'mongoose';
import slugify from 'slugify';
import { z } from 'zod';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { Tour } from '../models/Tour';
import { AppError } from '../shared';

const router: Router = Router();

const tourSchema = z.object({
  title: z.string().min(3),
  city: z.string().min(2),
  country: z.string().default('India'),
  durationDays: z.number().int().min(1),
  basePrice: z.number().nonnegative(),
  discountPrice: z.number().nonnegative().optional(),
  heroImage: z.string().min(1),
  images: z.array(z.string()).min(1),
  description: z.string().min(20),
  tags: z.array(z.string()).default([]),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  hotel: z.string().optional(),
  hotelRating: z.number().min(0).max(5).optional(),
  food: z.array(z.string()).default([]),
  transport: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
  bestSeason: z.string().optional(),
  groupSize: z.string().optional(),
  tripType: z.enum(['Leisure', 'Adventure', 'Cultural', 'Honeymoon', 'Family', 'Spiritual']).optional(),
  hospitality: z.string().optional(),
  documents: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  guide: z.object({
    name: z.string(),
    contact: z.string(),
    languages: z.array(z.string()).default([]),
    rating: z.number().min(0).max(5),
    experience: z.string(),
    speciality: z.string(),
    photo: z.string().optional().default(''),
    bio: z.string(),
  }).optional(),
  isActive: z.boolean().optional(),
  offers: z.array(z.object({
    title: z.string(),
    code: z.string(),
    discountType: z.enum(['percent', 'fixed']),
    discountValue: z.number().nonnegative(),
    isActive: z.boolean().default(true),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
  })).default([]),
});

router.get('/search', async (req, res, next) => {
  try {
    const city = String(req.query.city || '').trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const sort = String(req.query.sort || 'price_asc');

    const filter: Record<string, unknown> = { isActive: true };
    if (city) filter.city = { $regex: new RegExp(city, 'i') };
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.basePrice = {
        ...(minPrice !== undefined ? { $gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
      };
    }

    const sortRule: Record<string, SortOrder> =
      sort === 'price_desc'
        ? { basePrice: -1 }
        : sort === 'duration'
          ? { durationDays: 1 }
          : { basePrice: 1 };

    const [items, total] = await Promise.all([
      Tour.find(filter).sort(sortRule).skip((page - 1) * limit).limit(limit).lean(),
      Tour.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, message: 'Tours fetched', data: { items, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/list', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const city = String(req.query.city || '').trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const includeInactive = String(req.query.includeInactive || '').toLowerCase() === 'true';

    const filter: Record<string, unknown> = {};
    if (!includeInactive) {
      filter.isActive = true;
    }
    if (city) {
      filter.city = { $regex: new RegExp(city, 'i') };
    }

    const [items, total] = await Promise.all([
      Tour.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Tour.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Tours listed for admin',
      data: { items, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:tourId', async (req, res, next) => {
  try {
    const item = await Tour.findOne({ _id: req.params.tourId, isActive: true }).lean();
    if (!item) throw new AppError('Tour not found', 404, 'NOT_FOUND');
    res.status(200).json({ success: true, message: 'Tour fetched', data: item });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const parsed = tourSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    const payload = parsed.data;
    const slug = slugify(payload.title, { lower: true, strict: true });
    const item = await Tour.create({ ...payload, slug, offers: payload.offers.map((offer) => ({ ...offer, code: offer.code.toUpperCase() })) });
    res.status(201).json({ success: true, message: 'Tour created', data: item });
  } catch (error) {
    next(error);
  }
});

router.patch('/:tourId', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const parsed = tourSchema.partial().safeParse(req.body);
    if (!parsed.success) throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    const payload = parsed.data;
    const updatePayload = {
      ...payload,
      ...(payload.title ? { slug: slugify(payload.title, { lower: true, strict: true }) } : {}),
    };
    const item = await Tour.findByIdAndUpdate(req.params.tourId, { $set: updatePayload }, { new: true }).lean();
    if (!item) throw new AppError('Tour not found', 404, 'NOT_FOUND');
    res.status(200).json({ success: true, message: 'Tour updated', data: item });
  } catch (error) {
    next(error);
  }
});

router.delete('/:tourId', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const item = await Tour.findByIdAndUpdate(req.params.tourId, { $set: { isActive: false } }, { new: true }).lean();
    if (!item) throw new AppError('Tour not found', 404, 'NOT_FOUND');
    res.status(200).json({ success: true, message: 'Tour removed', data: { id: req.params.tourId } });
  } catch (error) {
    next(error);
  }
});

export default router;
