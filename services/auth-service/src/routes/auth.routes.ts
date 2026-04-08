import { RequestHandler, Router } from 'express';
import { register, login, refresh, logout, verifyEmailOtp, resendOtp, requestVerification } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { loginSchema, registerSchema } from '../validators/auth.validator';
import { loginLimiter, refreshLimiter, registerLimiter, verificationRequestLimiter } from '../middleware/rateLimit.middleware';
import { verifyCsrf } from '../middleware/csrf.middleware';

const adaptLimiter = (limiter: unknown): RequestHandler => {
  return (req, res, next) => {
    const handler = limiter as (request: unknown, response: unknown, done: (err?: unknown) => void) => void;
    handler(req, res, next);
  };
};

const router: Router = Router();

router.post('/register', adaptLimiter(registerLimiter), validate(registerSchema), register);
router.post('/login', adaptLimiter(loginLimiter), validate(loginSchema), login);
router.post('/refresh', verifyCsrf, adaptLimiter(refreshLimiter), refresh);
router.post('/logout', verifyCsrf, logout);
router.post('/verify-otp', verifyEmailOtp);
router.post('/resend-otp', resendOtp);
router.post('/request-verification', adaptLimiter(verificationRequestLimiter), requestVerification);

export default router;