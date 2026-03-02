import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const validate =
  (schema: ZodSchema<any>) =>
  (req: Request, _res: Response, next: NextFunction) => {

    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errorMessage = result.error.issues
        .map(issue => issue.message)
        .join(', ');

      throw new AppError(errorMessage, 400);
    }

    req.body = result.data;
    next();
  };