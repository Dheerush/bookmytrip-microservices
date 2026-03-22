import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { mutationLimiter, searchLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { createHotelHandler, deleteHotelHandler, getHotelByIdHandler, listAllHotelsHandler, searchHotelsHandler, updateHotelHandler } from '../controllers/hotel.controller';
import { createHotelSchema, searchHotelsSchema, updateHotelSchema } from '../validators/hotel.validators';

const router: Router = Router();

router.get('/search', searchLimiter, validate(searchHotelsSchema, 'query'), searchHotelsHandler);
router.get('/:hotelId', searchLimiter, getHotelByIdHandler);
router.get('/', authenticate, authorizeRoles('admin'), listAllHotelsHandler);
router.post('/', authenticate, authorizeRoles('admin'), mutationLimiter, validate(createHotelSchema), createHotelHandler);
router.patch('/:hotelId', authenticate, authorizeRoles('admin'), mutationLimiter, validate(updateHotelSchema), updateHotelHandler);
router.delete('/:hotelId', authenticate, authorizeRoles('admin'), mutationLimiter, deleteHotelHandler);

export default router;
