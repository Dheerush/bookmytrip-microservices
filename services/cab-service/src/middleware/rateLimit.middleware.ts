import { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';

const makeStore = (prefix: string) => new RedisStore({
  // @ts-expect-error signature mismatch in library types
  sendCommand: (...args: string[]) => redisClient.call(...args),
  prefix: `rl:cab-svc:${prefix}:`,
});

export const searchLimiter: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req: any) => `ip:${req.ip}`,
  store: makeStore('search'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
}) as unknown as RequestHandler;

export const mutationLimiter: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req: any) => `user:${req.user?.id ?? req.ip}`,
  store: makeStore('mutation'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
}) as unknown as RequestHandler;
