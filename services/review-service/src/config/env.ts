import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(5011),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGO_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment for review-service', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const raw = parsed.data;
export const env = {
  ...raw,
  CORS_ORIGINS: raw.CORS_ORIGINS.split(',').map((v) => v.trim()).filter(Boolean),
};
