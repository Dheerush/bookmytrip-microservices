import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import { env } from '../config/env';

export const globalErrorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.data ? { data: err.data } : {}),
    });
    return;
  }

  if ((err as NodeJS.ErrnoException).name === 'MongoServerError' && (err as { code?: number }).code === 11000) {
    res.status(409).json({ success: false, message: 'Duplicate entry', code: 'DUPLICATE_KEY' });
    return;
  }

  logger.error('Unhandled error', { err: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
  });
};