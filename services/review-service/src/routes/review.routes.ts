import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { Review } from '../models/Review';
import { AppError } from '../utils';

const router: Router = Router();

const createSchema = z.object({
  itemType: z.enum(['flight', 'hotel', 'train', 'cab', 'tour', 'package']),
  itemId: z.string().min(1),
  rating: z.number().min(1).max(5),
  title: z.string().min(3).max(120),
  comment: z.string().min(10).max(1500),
});

const adminCreateSchema = z.object({
  itemType: z.enum(['flight', 'hotel', 'train', 'cab', 'tour', 'package']),
  itemId: z.string().min(1),
  userId: z.string().min(1).optional(),
  rating: z.number().min(1).max(5),
  title: z.string().min(3).max(120),
  comment: z.string().min(10).max(1500),
  status: z.enum(['approved', 'pending', 'rejected']).optional(),
});

router.get('/featured', async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit || 6)));
    const items = await Review.find({ status: 'approved' })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const mapped = items.map((item) => ({
      id: String(item._id),
      itemType: item.itemType,
      itemId: item.itemId,
      rating: item.rating,
      title: item.title,
      comment: item.comment,
      createdAt: item.createdAt,
      displayName: `Traveller ${String(item.userId || '').slice(-4).toUpperCase() || 'Guest'}`,
    }));

    res.status(200).json({ success: true, message: 'Featured reviews fetched', data: { items: mapped } });
  } catch (error) {
    next(error);
  }
});

router.get('/me/list', authenticate, async (req, res, next) => {
  try {
    const items = await Review.find({ userId: req.user?.id }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, message: 'My reviews fetched', data: { items } });
  } catch (error) {
    next(error);
  }
});

router.get('/:itemType/:itemId', async (req, res, next) => {
  try {
    const itemType = req.params.itemType;
    const itemId = req.params.itemId;
    const status = req.query.status === 'all' ? undefined : 'approved';
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));

    const filter: Record<string, unknown> = { itemType, itemId };
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Review.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, message: 'Reviews fetched', data: { items, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');

    const created = await Review.findOneAndUpdate(
      { itemType: parsed.data.itemType, itemId: parsed.data.itemId, userId: req.user?.id },
      { ...parsed.data, userId: req.user?.id, status: 'pending' },
      { new: true, upsert: true },
    );

    res.status(201).json({ success: true, message: 'Review submitted for moderation', data: created });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/create', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const parsed = adminCreateSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');

    const reviewerUserId = parsed.data.userId || req.user?.id;
    if (!reviewerUserId) throw new AppError('Reviewer user id missing', 400, 'VALIDATION_ERROR');

    const created = await Review.findOneAndUpdate(
      { itemType: parsed.data.itemType, itemId: parsed.data.itemId, userId: reviewerUserId },
      {
        itemType: parsed.data.itemType,
        itemId: parsed.data.itemId,
        userId: reviewerUserId,
        rating: parsed.data.rating,
        title: parsed.data.title,
        comment: parsed.data.comment,
        status: parsed.data.status || 'approved',
      },
      { new: true, upsert: true },
    );

    res.status(201).json({ success: true, message: 'Admin review saved', data: created });
  } catch (error) {
    next(error);
  }
});

router.patch('/:reviewId/status', authenticate, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const status = req.body?.status;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      throw new AppError('Invalid status', 400, 'VALIDATION_ERROR');
    }

    const updated = await Review.findByIdAndUpdate(req.params.reviewId, { $set: { status } }, { new: true }).lean();
    if (!updated) throw new AppError('Review not found', 404, 'NOT_FOUND');

    res.status(200).json({ success: true, message: 'Review status updated', data: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
