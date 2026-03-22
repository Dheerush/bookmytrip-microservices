import dotenv from 'dotenv';

dotenv.config();

const REQUIRED = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'REDIS_URL', 'RABBITMQ_URL'];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

export const env = {
  PORT: process.env.PORT || '5002',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI as string,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
  REDIS_URL: process.env.REDIS_URL as string,
  RABBITMQ_URL: process.env.RABBITMQ_URL as string,
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5000')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
};
