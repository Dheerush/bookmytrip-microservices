import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_ENV = [
  'RABBITMQ_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM'
];

REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
});

export const env = {
  PORT: process.env.PORT || '5003',
  SOCKET_PORT: parseInt(process.env.SOCKET_PORT || '5099', 10),
  RABBITMQ_URL: process.env.RABBITMQ_URL as string,
  SMTP_HOST: process.env.SMTP_HOST as string,
  SMTP_PORT: process.env.SMTP_PORT as string,
  SMTP_USER: process.env.SMTP_USER as string,
  SMTP_PASS: process.env.SMTP_PASS as string,
  SMTP_FROM: process.env.SMTP_FROM as string,
  JWT_SECRET: process.env.JWT_SECRET || 'bookmytrip-dev-secret-changeme',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
};
