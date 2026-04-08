import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { mutationLimiter, searchLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createTrainHandler,
  deleteTrainHandler,
  deductTrainSeatsHandler,
  getTrainByIdHandler,
  getTrainByNumberHandler,
  listAllTrainsHandler,
  searchTrainsHandler,
  updateTrainHandler,
} from '../controllers/train.controller';
import { createTrainSchema, searchTrainsSchema, updateTrainSchema } from '../validators/train.validators';

const router: Router = Router();

/**
 * @openapi
 * /api/trains/search:
 *   get:
 *     summary: Search available trains
 *     tags: [Trains]
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, example: NDLS }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, example: BCT }
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date, example: "2026-04-01" }
 *       - in: query
 *         name: passengers
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: class
 *         schema: { type: string, enum: [general, sleeper, ac3Tier, ac2Tier, ac1st], default: sleeper }
 *       - in: query
 *         name: passengerType
 *         schema: { type: string, enum: [adult, child, seniorCitizen, military], default: adult }
 *       - in: query
 *         name: trainType
 *         schema: { type: string, enum: [Superfast, Express, Rajdhani, Shatabdi, Duronto, Garib Rath, Mail] }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: integer }
 *       - in: query
 *         name: maxStops
 *         schema: { type: integer }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [price_asc, price_desc, duration, rating, departure], default: price_asc }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated train search results
 */
router.get('/search', searchLimiter, validate(searchTrainsSchema, 'query'), searchTrainsHandler);
router.get('/number/:trainNumber', searchLimiter, getTrainByNumberHandler);
router.get('/', authenticate, authorizeRoles('admin'), listAllTrainsHandler);
router.post('/', authenticate, authorizeRoles('admin'), mutationLimiter, validate(createTrainSchema), createTrainHandler);
router.get('/:trainId', searchLimiter, getTrainByIdHandler);
// Internal route: deduct seats after booking confirmed (no JWT; uses x-service-secret header)
router.patch('/:trainId/deduct-seats', deductTrainSeatsHandler);

router.patch('/:trainId', authenticate, authorizeRoles('admin'), mutationLimiter, validate(updateTrainSchema), updateTrainHandler);
router.delete('/:trainId', authenticate, authorizeRoles('admin'), mutationLimiter, deleteTrainHandler);

export default router;
