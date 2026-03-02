import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const verifyCsrf = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {

  const csrfCookie = req.cookies.csrfToken;
  const csrfHeader = req.headers['x-csrf-token'];

  if (!csrfCookie || !csrfHeader) {
    throw new AppError('CSRF token missing', 403);
  }

  if (csrfCookie !== csrfHeader) {
    throw new AppError('Invalid CSRF token', 403);
  }

  next();
};