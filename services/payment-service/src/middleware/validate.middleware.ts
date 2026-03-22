import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

type Source = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', result.error.flatten().fieldErrors));
    }

    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };