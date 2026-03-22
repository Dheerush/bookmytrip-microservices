import { Router } from 'express';
import {
  cancelBookingHandler,
  createBookingHandler,
  getBookingByIdHandler,
  getInvoiceHandler,
  listAllBookingsHandler,
  listMyBookingsHandler,
} from '../controllers/booking.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { bookingLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { cancelBookingSchema, createBookingSchema, listBookingsSchema } from '../validators/booking.validators';

export const bookingRouter: Router = Router();

bookingRouter.use(authenticate);
bookingRouter.use(bookingLimiter);

bookingRouter.post('/', validate(createBookingSchema), createBookingHandler);
bookingRouter.get('/me', validate(listBookingsSchema, 'query'), listMyBookingsHandler);
bookingRouter.get('/admin', authorizeRoles('admin'), listAllBookingsHandler);
bookingRouter.get('/:bookingId', getBookingByIdHandler);
bookingRouter.post('/:bookingId/cancel', validate(cancelBookingSchema), cancelBookingHandler);
bookingRouter.get('/:bookingId/invoice', getInvoiceHandler);
