import { Request } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';

const makeStore = (prefix: string) =>
  new RedisStore({
    // @ts-expect-error signature mismatch in library types
    sendCommand: (...args: string[]) => redisClient.call(...args),
    prefix: `rl:booking-svc:${prefix}:`,
  });

export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  keyGenerator: (req: Request) => `user:${req.user?.id ?? req.ip}`,
  store: makeStore('booking'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
});
