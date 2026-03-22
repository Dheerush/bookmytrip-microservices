import { NextFunction, Request, Response } from "express";
import logger from "../config/logger";
import { fail } from "../utils/response";

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(fail(`Route not found: ${req.method} ${req.originalUrl}`, req.requestId));
};

export const globalErrorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error("Unhandled gateway error", {
    requestId: req.requestId,
    path: req.originalUrl,
    method: req.method,
    error,
  });

  if (res.headersSent) {
    return;
  }

  res.status(500).json(fail("Internal server error", req.requestId));
};
