import { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { fail } from "../utils/response";

const keyGenerator = (req: Request): string => {
  const userId = req.user?.sub || req.user?.id;
  return userId ? `user:${userId}` : `ip:${req.ip}`;
};

const baseOptions = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  keyGenerator,
  handler: (req: Request, res: Response) => {
    res.status(429).json(fail("Too many requests. Please try again shortly.", req.requestId));
  },
};

export const authRateLimiter = rateLimit({
  ...baseOptions,
  max: env.RATE_LIMIT_AUTH_MAX,
});

export const apiRateLimiter = rateLimit({
  ...baseOptions,
  max: env.RATE_LIMIT_API_MAX,
});
