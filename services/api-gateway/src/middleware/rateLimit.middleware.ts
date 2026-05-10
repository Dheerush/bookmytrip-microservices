import { RequestHandler } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { env } from "../config/env";
import { fail } from "../utils/response";

const keyGenerator = (req: any): string => {
  const userId = req.user?.sub || req.user?.id;
  return userId ? `user:${userId}` : `ip:${ipKeyGenerator(req.ip || req.socket.remoteAddress || "")}`;
};

const baseOptions = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  keyGenerator,
  handler: (req: any, res: any) => {
    res.status(429).json(fail("Too many requests. Please try again shortly.", req.requestId));
  },
};

export const authRateLimiter: RequestHandler = rateLimit({
  ...baseOptions,
  max: env.RATE_LIMIT_AUTH_MAX,
}) as unknown as RequestHandler;

export const apiRateLimiter: RequestHandler = rateLimit({
  ...baseOptions,
  max: env.RATE_LIMIT_API_MAX,
}) as unknown as RequestHandler;
