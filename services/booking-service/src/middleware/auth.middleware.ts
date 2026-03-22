import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

interface JwtPayload {
  id: string;
  email?: string;
  role?: string;
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const gatewayUserId = req.headers['x-user-id'] as string | undefined;

  if (gatewayUserId) {
    req.user = {
      id: gatewayUserId,
      email: req.headers['x-user-email'] as string | undefined,
      role: req.headers['x-user-role'] as string | undefined,
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
  }
};

export const authorizeRoles = (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role ?? '')) {
      return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
    }
    next();
  };
