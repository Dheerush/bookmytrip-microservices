import cors, { CorsOptions } from "cors";
import express, { RequestHandler } from "express";
import helmet from "helmet";
import { env } from "../config/env";

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (env.CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-request-id", "x-idempotency-key"],
  exposedHeaders: ["x-request-id"],
};

export const securityMiddlewares: RequestHandler[] = [
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
  cors(corsOptions),
  express.json({ limit: "300kb" }),
  express.urlencoded({ extended: true, limit: "300kb" }),
];
