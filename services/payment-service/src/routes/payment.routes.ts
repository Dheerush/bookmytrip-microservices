import { RequestHandler, Router } from 'express';
import {
  createPaymentHandler,
  getPaymentByIdHandler,
  getPaymentsByBookingHandler,
  listAllPaymentsHandler,
  listMyPaymentsHandler,
  refundPaymentHandler,
} from '../controllers/payment.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { paymentLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { createPaymentSchema, listPaymentsSchema, refundPaymentSchema } from '../validators/payment.validators';

const paymentLimiterMiddleware: RequestHandler = (req, res, next) => {
  const limiter = paymentLimiter as unknown as (request: unknown, response: unknown, done: (err?: unknown) => void) => void;
  limiter(req, res, next);
};

export const paymentRouter: Router = Router();

paymentRouter.use(authenticate);
paymentRouter.use(paymentLimiterMiddleware);

paymentRouter.post('/', validate(createPaymentSchema), createPaymentHandler);
paymentRouter.get('/me', validate(listPaymentsSchema, 'query'), listMyPaymentsHandler);
paymentRouter.get('/admin', authorizeRoles('admin'), listAllPaymentsHandler);
paymentRouter.get('/booking/:bookingId', getPaymentsByBookingHandler);
paymentRouter.get('/:paymentId', getPaymentByIdHandler);
paymentRouter.post('/:paymentId/refund', validate(refundPaymentSchema), refundPaymentHandler);