import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

export const globalErrorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message, code: err.code });
    return;
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
};
