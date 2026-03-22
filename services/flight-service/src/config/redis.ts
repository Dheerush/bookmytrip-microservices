import Redis from 'ioredis';
import { env } from './env';
import logger from '../utils/logger';

export const redisClient = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redisClient.on('error', (err) => {
  logger.error('Redis error (flight-service)', { err: err.message });
});
