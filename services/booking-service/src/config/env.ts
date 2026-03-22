import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('5008').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  RABBITMQ_URL: z.string().min(1, 'RABBITMQ_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  CORS_ORIGINS: z.string().default('http://localhost:3000').transform((value) => value.split(',').map((part) => part.trim()).filter(Boolean)),
  FLIGHT_SERVICE_URL: z.string().url().default('http://localhost:5003'),
  TRAIN_SERVICE_URL: z.string().url().default('http://localhost:5004'),
  HOTEL_SERVICE_URL: z.string().url().default('http://localhost:5005'),
  CAB_SERVICE_URL: z.string().url().default('http://localhost:5006'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
