import mongoose from 'mongoose';
import { env } from './env';
import logger from '../utils/logger';

export const connectMongoDB = async (): Promise<void> => {
  await mongoose.connect(env.MONGO_URI);
  logger.info('MongoDB connected (booking-service)');
};

export const disconnectMongoDB = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected (booking-service)');
};

export const connectDB = connectMongoDB;
export const disconnectDB = disconnectMongoDB;
