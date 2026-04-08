import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { mutationLimiter, searchLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { createCabHandler, deleteCabHandler, getCabByIdHandler, listAllCabsHandler, searchCabsHandler, updateCabHandler } from '../controllers/cab.controller';
import { createCabSchema, searchCabsSchema, updateCabSchema } from '../validators/cab.validators';

const router: Router = Router();

router.get('/search', searchLimiter, validate(searchCabsSchema, 'query'), searchCabsHandler);
router.get('/', authenticate, authorizeRoles('admin'), listAllCabsHandler);
router.post('/', authenticate, authorizeRoles('admin'), mutationLimiter, validate(createCabSchema), createCabHandler);
router.get('/:cabId', searchLimiter, getCabByIdHandler);
router.patch('/:cabId', authenticate, authorizeRoles('admin'), mutationLimiter, validate(updateCabSchema), updateCabHandler);
router.delete('/:cabId', authenticate, authorizeRoles('admin'), mutationLimiter, deleteCabHandler);


export default router;
