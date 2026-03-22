import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { generalLimiter, mutationLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  addAddressSchema,
  addTravelerSchema,
  updateAddressSchema,
  updatePreferencesSchema,
  updateProfileSchema,
  updateTravelerSchema,
} from '../validators/user.validators';
import { asyncHandler } from '../utils/asyncHandler';

const router: Router = Router();

// All user routes require authentication
router.use(authenticate);

// ── Profile ────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *       401:
 *         description: Unauthorized
 */
router.get('/me', generalLimiter, asyncHandler(profileController.getMe));

/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               nationality:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.patch('/me', mutationLimiter, validate(updateProfileSchema), asyncHandler(profileController.updateMe));

// ── Travelers ──────────────────────────────────────────────────────────────
router.get('/me/travelers', generalLimiter, asyncHandler(profileController.getTravelers));
router.post('/me/travelers', mutationLimiter, validate(addTravelerSchema), asyncHandler(profileController.addTraveler));
router.patch('/me/travelers/:travelerId', mutationLimiter, validate(updateTravelerSchema), asyncHandler(profileController.updateTraveler));
router.delete('/me/travelers/:travelerId', mutationLimiter, asyncHandler(profileController.deleteTraveler));

// ── Addresses ──────────────────────────────────────────────────────────────
router.get('/me/addresses', generalLimiter, asyncHandler(profileController.getAddresses));
router.post('/me/addresses', mutationLimiter, validate(addAddressSchema), asyncHandler(profileController.addAddress));
router.patch('/me/addresses/:addressId', mutationLimiter, validate(updateAddressSchema), asyncHandler(profileController.updateAddress));
router.delete('/me/addresses/:addressId', mutationLimiter, asyncHandler(profileController.deleteAddress));

// ── Preferences ────────────────────────────────────────────────────────────
router.get('/me/preferences', generalLimiter, asyncHandler(profileController.getPreferences));
router.patch('/me/preferences', mutationLimiter, validate(updatePreferencesSchema), asyncHandler(profileController.updatePreferences));

// ── Admin-only ─────────────────────────────────────────────────────────────
router.get('/:profileId', authorizeRoles('admin'), generalLimiter, asyncHandler(profileController.getByIdAdmin));

export default router;
