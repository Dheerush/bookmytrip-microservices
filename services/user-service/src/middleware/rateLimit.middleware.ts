import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';

const makeStore = (prefix: string) =>
  new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)) as any,
    prefix,
  });

export const generalLimiter = rateLimit({
  store: makeStore('user:general:'),
  windowMs: 60_000,
  max: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

export const mutationLimiter = rateLimit({
  store: makeStore('user:mutation:'),
  windowMs: 60_000,
  max: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
