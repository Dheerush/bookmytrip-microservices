import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('5007').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGINS: z.string().default('http://localhost:3000').transform((v) => v.split(',').map((part) => part.trim()).filter(Boolean)),
  REQUEST_TIMEOUT_MS: z.string().default('5000').transform(Number),
  FLIGHT_SERVICE_URL: z.string().url().default('http://localhost:5003'),
  TRAIN_SERVICE_URL: z.string().url().default('http://localhost:5004'),
  HOTEL_SERVICE_URL: z.string().url().default('http://localhost:5005'),
  CAB_SERVICE_URL: z.string().url().default('http://localhost:5006'),
  BOOKING_SERVICE_URL: z.string().url().default('http://localhost:5008'),
  USER_SERVICE_URL: z.string().url().default('http://localhost:5002'),
  ADMIN_SERVICE_URL: z.string().url().default('http://localhost:5011'),
  TOUR_SERVICE_URL: z.string().url().default('http://localhost:5012'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
