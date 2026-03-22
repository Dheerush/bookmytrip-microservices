import Redis from 'ioredis';
import { env } from './env';
import logger from '../utils/logger';

export const redisClient = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redisClient.on('error', (error) => {
  logger.error('Redis error (booking-service)', { error: error.message });
});

export const connectRedis = async (): Promise<void> => {
  if (redisClient.status !== 'ready') {
    await redisClient.connect();
  }
  logger.info('Redis connected (booking-service)');
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient.status !== 'end') {
    await redisClient.quit();
  }
  logger.info('Redis disconnected (booking-service)');
};
