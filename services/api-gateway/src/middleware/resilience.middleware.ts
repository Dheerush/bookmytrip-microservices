import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { fail } from "../utils/response";

export const requestTimeoutMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json(fail("Gateway timeout", req.requestId));
    }
  }, env.REQUEST_TIMEOUT_MS + 500);

  res.on("finish", () => clearTimeout(timer));
  res.on("close", () => clearTimeout(timer));

  next();
};
