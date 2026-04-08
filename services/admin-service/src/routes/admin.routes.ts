import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { Coupon } from '../models/Coupon';
import { Offer } from '../models/Offer';
import { AppError } from '../shared';

const router: Router = Router();

const couponSchema = z.object({
  code: z.string().min(3).max(30),
  description: z.string().min(5),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().positive(),
  minOrderValue: z.number().nonnegative().default(0),
  maxDiscount: z.number().nonnegative().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  usageLimit: z.number().int().min(1).default(1000),
  oneTimePerUser: z.boolean().default(false),
  active: z.boolean().default(true),
  applicableOn: z.array(z.string()).default([]),
});

const offerSchema = z.object({
  title: z.string().min(2),
  headline: z.string().min(5),
  details: z.string().min(10),
  imageUrl: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  active: z.boolean().default(true),
});

router.get('/offers/public', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const items = await Offer.find({ active: true, startsAt: { $lte: now }, endsAt: { $gte: now } }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, message: 'Offers fetched', data: { items } });
  } catch (error) {
    next(error);
  }
});

router.get('/coupons/public', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const items = await Coupon.find({ active: true, startsAt: { $lte: now }, endsAt: { $gte: now } })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, message: 'Coupons fetched', data: { items } });
  } catch (error) {
    next(error);
  }
});

router.post('/coupons/validate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase();
    const amount = Number(req.body?.amount || 0);
    const serviceType = String(req.body?.serviceType || '').trim();
    const userId = req.user?.id;
    if (!code || amount <= 0) throw new AppError('Invalid payload', 400, 'VALIDATION_ERROR');
    if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');

    const now = new Date();
    const coupon = await Coupon.findOne({ code, active: true, startsAt: { $lte: now }, endsAt: { $gte: now } }).lean();
    if (!coupon) throw new AppError('Coupon not found or expired', 404, 'COUPON_INVALID');
    if (coupon.usageLimit <= coupon.usedCount) throw new AppError('Coupon usage exhausted', 400, 'COUPON_EXHAUSTED');
    if (amount < coupon.minOrderValue) throw new AppError('Order value below minimum for coupon', 400, 'MIN_ORDER_NOT_MET');
    if (coupon.applicableOn.length > 0 && serviceType && !coupon.applicableOn.includes(serviceType)) {
      throw new AppError('Coupon not applicable on selected service', 400, 'COUPON_NOT_APPLICABLE');
    }
    if (coupon.oneTimePerUser && coupon.usedBy.includes(userId)) {
      throw new AppError('Coupon already used by this account', 400, 'COUPON_ALREADY_USED');
    }

    let discount = coupon.discountType === 'percent' ? (amount * coupon.discountValue) / 100 : coupon.discountValue;
    if (coupon.maxDiscount !== undefined) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
    discount = Math.max(0, Math.min(discount, amount));

    res.status(200).json({
      success: true,
      message: 'Coupon validated',
      data: {
        couponId: coupon._id,
        code: coupon.code,
        discount,
        payableAmount: amount - discount,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/coupons/redeem', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase();
    const userId = req.user?.id;
    if (!code) throw new AppError('Coupon code is required', 400, 'VALIDATION_ERROR');
    if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');

    const now = new Date();
    const coupon = await Coupon.findOne({ code, active: true, startsAt: { $lte: now }, endsAt: { $gte: now } });
    if (!coupon) throw new AppError('Coupon not found or expired', 404, 'COUPON_INVALID');
    if (coupon.usageLimit <= coupon.usedCount) throw new AppError('Coupon usage exhausted', 400, 'COUPON_EXHAUSTED');
    if (coupon.oneTimePerUser && coupon.usedBy.includes(userId)) {
      throw new AppError('Coupon already used by this account', 400, 'COUPON_ALREADY_USED');
    }

    coupon.usedCount += 1;
    if (coupon.oneTimePerUser && !coupon.usedBy.includes(userId)) {
      coupon.usedBy.push(userId);
    }
    await coupon.save();

    res.status(200).json({ success: true, message: 'Coupon redeemed', data: { code: coupon.code, usedCount: coupon.usedCount } });
  } catch (error) {
    next(error);
  }
});

router.use(authenticate, authorizeRoles('admin'));

router.get('/coupons', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, message: 'Coupons fetched', data: { items } });
  } catch (error) {
    next(error);
  }
});

router.post('/coupons', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = couponSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');

    const item = await Coupon.create({
      ...parsed.data,
      code: parsed.data.code.toUpperCase(),
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      createdBy: req.user?.id,
    });

    res.status(201).json({ success: true, message: 'Coupon created', data: item });
  } catch (error) {
    next(error);
  }
});

router.patch('/coupons/:couponId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = couponSchema.partial().safeParse(req.body);
    if (!parsed.success) throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');

    const updatePayload = {
      ...parsed.data,
      ...(parsed.data.code ? { code: parsed.data.code.toUpperCase() } : {}),
      ...(parsed.data.startsAt ? { startsAt: new Date(parsed.data.startsAt) } : {}),
      ...(parsed.data.endsAt ? { endsAt: new Date(parsed.data.endsAt) } : {}),
    };

    const item = await Coupon.findByIdAndUpdate(req.params.couponId, { $set: updatePayload }, { new: true }).lean();
    if (!item) throw new AppError('Coupon not found', 404, 'NOT_FOUND');
    res.status(200).json({ success: true, message: 'Coupon updated', data: item });
  } catch (error) {
    next(error);
  }
});

router.get('/offers', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await Offer.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, message: 'Offers fetched', data: { items } });
  } catch (error) {
    next(error);
  }
});

router.post('/offers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = offerSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');

    const item = await Offer.create({
      ...parsed.data,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      createdBy: req.user?.id,
    });

    res.status(201).json({ success: true, message: 'Offer created', data: item });
  } catch (error) {
    next(error);
  }
});

router.patch('/offers/:offerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = offerSchema.partial().safeParse(req.body);
    if (!parsed.success) throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');

    const updatePayload = {
      ...parsed.data,
      ...(parsed.data.startsAt ? { startsAt: new Date(parsed.data.startsAt) } : {}),
      ...(parsed.data.endsAt ? { endsAt: new Date(parsed.data.endsAt) } : {}),
    };

    const item = await Offer.findByIdAndUpdate(req.params.offerId, { $set: updatePayload }, { new: true }).lean();
    if (!item) throw new AppError('Offer not found', 404, 'NOT_FOUND');
    res.status(200).json({ success: true, message: 'Offer updated', data: item });
  } catch (error) {
    next(error);
  }
});

export default router;
