import { Router } from 'express';
import { aggregateSearchHandler } from '../controllers/search.controller';
import { validate } from '../middleware/validate.middleware';
import { aggregateSearchSchema } from '../validators/search.validators';

const router: Router = Router();

/**
 * @openapi
 * /api/search/aggregate:
 *   get:
 *     summary: Aggregate search across flights, trains, hotels, and cabs
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Aggregated result payload with per-category success state
 */
router.get('/aggregate', validate(aggregateSearchSchema, 'query'), aggregateSearchHandler);

export default router;
