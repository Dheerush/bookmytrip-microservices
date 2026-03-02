import mongoose from 'mongoose';
import { env } from './env';

export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.info('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

export const disconnectMongoDB = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log('🔌 MongoDB disconnected');
};