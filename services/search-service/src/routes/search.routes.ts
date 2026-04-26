import { Router } from 'express';
import { adminGlobalSearchHandler, aggregateSearchHandler } from '../controllers/search.controller';
import { validate } from '../middleware/validate.middleware';
import { adminGlobalSearchSchema, aggregateSearchSchema } from '../validators/search.validators';

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
router.get('/admin-global', validate(adminGlobalSearchSchema, 'query'), adminGlobalSearchHandler);

export default router;
