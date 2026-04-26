import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthUser {
  id: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthUser;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const forwardedUserId = req.header('x-user-id');
  const forwardedRole = req.header('x-user-role');
  if (forwardedUserId) {
    req.authUser = { id: forwardedUserId, role: forwardedRole || 'user' };
    next();
    return;
  }

  const authorization = req.header('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
    return;
  }

  const token = authorization.replace('Bearer ', '').trim();
  const candidateSecrets = [process.env.JWT_ACCESS_SECRET, env.JWT_SECRET].filter((secret): secret is string => Boolean(secret));

  for (const secret of candidateSecrets) {
    try {
      const decoded = jwt.verify(token, secret) as { id?: string; sub?: string; userId?: string; role?: string };
      const userId = decoded.userId || decoded.id || decoded.sub;
      if (!userId) continue;
      req.authUser = { id: userId, role: decoded.role || 'user' };
      next();
      return;
    } catch {
      // Try the next configured secret.
    }
  }

  res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
};
