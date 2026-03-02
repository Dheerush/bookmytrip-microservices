import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';

const createRedisStore = (prefix: string) =>
  new RedisStore({
    sendCommand: (...args: string[]) =>
      redisClient.call(args[0], ...args.slice(1)) as any,
    prefix
  });

export const loginLimiter = rateLimit({
  store: createRedisStore('login:'),
  windowMs: 60 * 1000,
  max: 5
});

export const registerLimiter = rateLimit({
  store: createRedisStore('register:'),
  windowMs: 5 * 60 * 1000,
  max: 25 // change it later
});

export const refreshLimiter = rateLimit({
  store: createRedisStore('refresh:'),
  windowMs: 60 * 1000,
  max: 10
});