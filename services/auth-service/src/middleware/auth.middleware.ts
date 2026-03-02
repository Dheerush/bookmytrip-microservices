import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { rolePermissions } from '../config/roles';
import { Permission, UserRole } from '../types/auth.types';

/**
 * 🔐 Authenticate Middleware
 * Verifies JWT and attaches user to request
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Unauthorized - No token provided', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET
    ) as { id: string; role: UserRole };

    // Attach user to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    throw new AppError('Unauthorized - Invalid or expired token', 401);
  }
};


/**
 * 🛡️ Authorize Middleware (RBAC)
 * Checks if user has required permission
 */
export const authorize = (permission: Permission) => {
  return (req: Request, _res: Response, next: NextFunction): void => {

    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const userRole = req.user.role;

    const permissions = rolePermissions[userRole];

    if (!permissions.includes(permission)) {
      throw new AppError('Forbidden - Insufficient permissions', 403);
    }

    next();
  };
};