import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';
import { RequestHandler } from 'express';

const makeStore = (prefix: string) =>
  new RedisStore({
    // @ts-expect-error — rate-limit-redis sendCommand signature
    sendCommand: (...args: string[]) => redisClient.call(...args),
    prefix: `rl:flight-svc:${prefix}:`,
  });

/** Public search — 60 req/min per IP */
export const searchLimiter: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req: any) => `ip:${req.ip}`,
  store: makeStore('search'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
}) as unknown as RequestHandler;

/** Authenticated mutations — 30 req/min per user */
export const mutationLimiter: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req: any) => `user:${req.user?.id ?? req.ip}`,
  store: makeStore('mutation'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
}) as unknown as RequestHandler;
