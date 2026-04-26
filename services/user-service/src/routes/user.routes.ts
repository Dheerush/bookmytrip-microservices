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
import { AppError } from '../utils/AppError';
import { publishEvent } from '../config/rabbitmq';
import { SupportIssue } from '../models/SupportIssue';

const router: Router = Router();

// Public route — does NOT require authentication
router.post('/newsletter/subscribe', mutationLimiter, asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('A valid email address is required', 400, 'VALIDATION_ERROR');
  }
  await publishEvent({ type: 'NEWSLETTER_SUBSCRIPTION', data: { email } });
  res.status(200).json({ success: true, message: 'Subscribed successfully' });
}));

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

// ── Issues / Complaints ───────────────────────────────────────────────────
router.get('/me/issues', generalLimiter, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

  const items = await SupportIssue.find({ userId }).sort({ createdAt: -1 }).lean();
  res.status(200).json({ success: true, message: 'Issues fetched', data: { items } });
}));

router.post('/me/issues', mutationLimiter, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

  const subject = String(req.body?.subject || '').trim();
  const description = String(req.body?.description || '').trim();
  const bookingRef = String(req.body?.bookingRef || '').trim() || undefined;

  if (!subject || subject.length < 5) {
    throw new AppError('Subject must be at least 5 characters', 400, 'VALIDATION_ERROR');
  }
  if (!description || description.length < 10) {
    throw new AppError('Description must be at least 10 characters', 400, 'VALIDATION_ERROR');
  }

  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ISS-${datePart}`;
  const seq = (await SupportIssue.countDocuments({ issueRef: { $regex: `^${prefix}` } })) + 1;
  const issueRef = `${prefix}-${String(seq).padStart(3, '0')}`;

  const item = await SupportIssue.create({
    userId,
    userEmail: req.user?.email,
    userName: req.user?.fullName,
    subject,
    description,
    bookingRef,
    status: 'open',
    issueRef,
    messages: [{ by: 'user', text: description, createdAt: new Date() }],
  });

  await publishEvent({
    type: 'COMPLAINT_RAISED',
    data: {
      email: req.user?.email,
      userId,
      ticketId: issueRef,
      subject,
      description,
      userName: req.user?.fullName,
    },
  });

  res.status(201).json({ success: true, message: 'Issue created', data: item });
}));

router.patch('/me/issues/:issueId/reopen', mutationLimiter, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

  const comment = String(req.body?.comment || '').trim();
  if (!comment || comment.length < 5) {
    throw new AppError('Reopen comment must be at least 5 characters', 400, 'VALIDATION_ERROR');
  }

  const issue = await SupportIssue.findOne({ _id: req.params.issueId, userId });
  if (!issue) throw new AppError('Issue not found', 404, 'NOT_FOUND');
  if (issue.status !== 'resolved' && issue.status !== 'closed') {
    throw new AppError('Only resolved/closed issues can be reopened', 400, 'INVALID_STATE');
  }

  issue.status = 'open';
  issue.reopenedCount += 1;
  issue.messages.push({ by: 'user', text: comment, createdAt: new Date() });
  await issue.save();

  await publishEvent({
    type: 'COMPLAINT_REOPENED',
    data: {
      email: req.user?.email,
      userId,
      ticketId: issue.issueRef,
      subject: issue.subject,
      status: issue.status,
      comment,
    },
  });

  res.status(200).json({ success: true, message: 'Issue reopened', data: issue });
}));

router.get('/issues/admin', authorizeRoles('admin'), generalLimiter, asyncHandler(async (_req, res) => {
  const items = await SupportIssue.find().sort({ createdAt: -1 }).lean();
  res.status(200).json({ success: true, message: 'All issues fetched', data: { items } });
}));

router.patch('/issues/admin/:issueId/status', authorizeRoles('admin'), mutationLimiter, asyncHandler(async (req, res) => {
  const status = String(req.body?.status || '').trim();
  const adminNote = String(req.body?.adminNote || '').trim();

  if (!['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
    throw new AppError('Invalid status', 400, 'VALIDATION_ERROR');
  }

  const issue = await SupportIssue.findById(req.params.issueId);
  if (!issue) throw new AppError('Issue not found', 404, 'NOT_FOUND');

  issue.status = status as 'open' | 'in-progress' | 'resolved' | 'closed';
  if (adminNote) {
    issue.adminNote = adminNote;
    issue.messages.push({ by: 'admin', text: adminNote, createdAt: new Date() });
  }
  await issue.save();

  await publishEvent({
    type: 'COMPLAINT_STATUS_UPDATED',
    data: {
      email: issue.userEmail,
      userId: issue.userId,
      ticketId: issue.issueRef,
      subject: issue.subject,
      status: issue.status,
      adminNote,
    },
  });

  res.status(200).json({ success: true, message: 'Issue status updated', data: issue });
}));

// ── Admin-only ─────────────────────────────────────────────────────────────
router.get('/:profileId', authorizeRoles('admin'), generalLimiter, asyncHandler(profileController.getByIdAdmin));

export default router;
