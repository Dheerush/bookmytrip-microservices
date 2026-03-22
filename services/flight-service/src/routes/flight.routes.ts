import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { searchLimiter, mutationLimiter } from '../middleware/rateLimit.middleware';
import {
  searchFlightsSchema,
  createFlightSchema,
  updateFlightSchema,
} from '../validators/flight.validators';
import {
  searchFlightsHandler,
  getFlightByIdHandler,
  getFlightByCodeHandler,
  listAllFlightsHandler,
  createFlightHandler,
  updateFlightHandler,
  deleteFlightHandler,
} from '../controllers/flight.controller';

const router: Router = Router();

/**
 * @openapi
 * /api/flights/search:
 *   get:
 *     summary: Search available flights
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, example: DEL }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, example: BOM }
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date, example: "2026-04-01" }
 *       - in: query
 *         name: passengers
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: class
 *         schema: { type: string, enum: [economy, premiumEconomy, business], default: economy }
 *       - in: query
 *         name: passengerType
 *         schema: { type: string, enum: [adult, child, infant, seniorCitizen, military], default: adult }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [price_asc, price_desc, duration, rating], default: price_asc }
 *       - in: query
 *         name: stops
 *         schema: { type: integer }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: integer }
 *       - in: query
 *         name: refundable
 *         schema: { type: boolean }
 *       - in: query
 *         name: meals
 *         schema: { type: boolean }
 *       - in: query
 *         name: airlines
 *         schema: { type: string, description: "Comma-separated airline names" }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated flight search results with calculated prices
 */
router.get('/search', searchLimiter, validate(searchFlightsSchema, 'query'), searchFlightsHandler);

/**
 * @openapi
 * /api/flights/code/{flightCode}:
 *   get:
 *     summary: Get flight by flight code (e.g. BT-201)
 *     tags: [Flights]
 *     parameters:
 *       - in: path
 *         name: flightCode
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Flight details }
 *       404: { description: Flight not found }
 */
router.get('/code/:flightCode', searchLimiter, getFlightByCodeHandler);

/**
 * @openapi
 * /api/flights/{flightId}:
 *   get:
 *     summary: Get flight by MongoDB ID
 *     tags: [Flights]
 *     parameters:
 *       - in: path
 *         name: flightId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Flight details }
 *       404: { description: Flight not found }
 */
router.get('/:flightId', searchLimiter, getFlightByIdHandler);

// ── Admin routes ──────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/flights:
 *   get:
 *     summary: List all flights (admin)
 *     tags: [Admin - Flights]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated list of all flights }
 */
router.get('/', authenticate, authorizeRoles('admin'), listAllFlightsHandler);

/**
 * @openapi
 * /api/flights:
 *   post:
 *     summary: Create a new flight (admin)
 *     tags: [Admin - Flights]
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateFlight' }
 *     responses:
 *       201: { description: Flight created }
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('admin'),
  mutationLimiter,
  validate(createFlightSchema),
  createFlightHandler,
);

/**
 * @openapi
 * /api/flights/{flightId}:
 *   patch:
 *     summary: Update a flight (admin)
 *     tags: [Admin - Flights]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: flightId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Flight updated }
 */
router.patch(
  '/:flightId',
  authenticate,
  authorizeRoles('admin'),
  mutationLimiter,
  validate(updateFlightSchema),
  updateFlightHandler,
);

/**
 * @openapi
 * /api/flights/{flightId}:
 *   delete:
 *     summary: Soft-delete a flight (admin)
 *     tags: [Admin - Flights]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: flightId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Flight deactivated }
 */
router.delete(
  '/:flightId',
  authenticate,
  authorizeRoles('admin'),
  mutationLimiter,
  deleteFlightHandler,
);

export default router;
