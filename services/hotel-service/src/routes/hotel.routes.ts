import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { mutationLimiter, searchLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { createHotelHandler, deleteHotelHandler, getHotelByIdHandler, listAllHotelsHandler, searchHotelsHandler, updateHotelHandler } from '../controllers/hotel.controller';
import { createHotelSchema, searchHotelsSchema, updateHotelSchema } from '../validators/hotel.validators';

const router: Router = Router();

router.get('/search', searchLimiter, validate(searchHotelsSchema, 'query'), searchHotelsHandler);
router.get('/all-hotels', authenticate, authorizeRoles('admin'), listAllHotelsHandler);
router.post('/create-hotel', authenticate, authorizeRoles('admin'), mutationLimiter, validate(createHotelSchema), createHotelHandler);
router.patch('/update-hotel/:hotelId', authenticate, authorizeRoles('admin'), mutationLimiter, validate(updateHotelSchema), updateHotelHandler);
router.delete('/delete-hotel/:hotelId', authenticate, authorizeRoles('admin'), mutationLimiter, deleteHotelHandler);

router.get('/:hotelId', searchLimiter, getHotelByIdHandler);


export default router;
