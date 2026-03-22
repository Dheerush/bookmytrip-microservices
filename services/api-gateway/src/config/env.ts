import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  AUTH_SERVICE_URL: z.string().url(),
  USER_SERVICE_URL: z.string().url(),
  FLIGHT_SERVICE_URL: z.string().url(),
  TRAIN_SERVICE_URL: z.string().url(),
  HOTEL_SERVICE_URL: z.string().url(),
  CAB_SERVICE_URL: z.string().url(),
  SEARCH_SERVICE_URL: z.string().url(),
  BOOKING_SERVICE_URL: z.string().url(),
  PAYMENT_SERVICE_URL: z.string().url(),
  MEDIA_SERVICE_URL: z.string().url(),
  REVIEW_SERVICE_URL: z.string().url(),
  TOUR_SERVICE_URL: z.string().url(),
  AI_SERVICE_URL: z.string().url(),
  ADMIN_SERVICE_URL: z.string().url(),

  REQUEST_TIMEOUT_MS: z.coerce.number().default(8000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(30),
  RATE_LIMIT_API_MAX: z.coerce.number().default(120),

  CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.coerce.number().default(5),
  CIRCUIT_BREAKER_RESET_TIMEOUT_MS: z.coerce.number().default(30_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid API Gateway environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  CORS_ORIGINS: raw.CORS_ORIGINS.split(",").map((v: string) => v.trim()).filter(Boolean),
};
