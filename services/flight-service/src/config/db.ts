import mongoose from 'mongoose';
import { env } from './env';
import logger from '../utils/logger';

export const connectMongoDB = async (): Promise<void> => {
  await mongoose.connect(env.MONGO_URI);
  logger.info('✅ MongoDB connected (flight-service)');
};

export const disconnectMongoDB = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected (flight-service)');
};
