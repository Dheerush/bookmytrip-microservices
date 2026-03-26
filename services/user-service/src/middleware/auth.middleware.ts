import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

interface JwtPayload {
  id?: string;
  sub?: string;
  email?: string;
  fullName?: string;
  role?: string;
}

/**
 * Used when the service is called directly (not via API Gateway).
 * In production all requests go through the gateway which verifies the token
 * and forwards x-user-id / x-user-email / x-user-role headers.
 * This middleware also accepts those trusted headers (gateway mode).
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  // ── Gateway-forwarded trusted headers ─────────────────────────────────
  const headerUserId = req.headers['x-user-id'] as string | undefined;
  if (headerUserId) {
    req.user = {
      id: headerUserId,
      email: req.headers['x-user-email'] as string | undefined,
      fullName: req.headers['x-user-full-name'] as string | undefined,
      role:  (req.headers['x-user-role'] as string | undefined) ?? 'user',
    };
    return next();
  }

  // ── Direct Bearer token (dev / testing) ────────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Unauthorized — no token provided', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = {
      id:    (decoded.id ?? decoded.sub) as string,
      email: decoded.email,
      fullName: decoded.fullName,
      role:  decoded.role ?? 'user',
    };
    next();
  } catch {
    throw new AppError('Unauthorized — invalid or expired token', 401, 'UNAUTHORIZED');
  }
};

export const authorizeRoles = (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      throw new AppError('Forbidden — insufficient permissions', 403, 'FORBIDDEN');
    }
    next();
  };
