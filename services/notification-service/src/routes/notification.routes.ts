import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  listNotificationsForActor,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notification.store';

const router: ExpressRouter = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const actor = (req as AuthenticatedRequest).authUser;
    if (!actor) {
      res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const type = String(req.query.type || '').trim() || undefined;
    const data = await listNotificationsForActor(actor.id, actor.role, { page, limit, type });
    res.status(200).json({ success: true, message: 'Notifications fetched', data });
  } catch (error) {
    next(error);
  }
});

router.patch('/:notificationId/read', async (req, res, next) => {
  try {
    const actor = (req as AuthenticatedRequest).authUser;
    if (!actor) {
      res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    const item = await markNotificationRead(actor.id, actor.role, req.params.notificationId);
    res.status(200).json({ success: true, message: 'Notification marked as read', data: item });
  } catch (error) {
    next(error);
  }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    const actor = (req as AuthenticatedRequest).authUser;
    if (!actor) {
      res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    const result = await markAllNotificationsRead(actor.id, actor.role);
    res.status(200).json({ success: true, message: 'Notifications marked as read', data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
