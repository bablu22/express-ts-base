import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';
import { UnauthorizedError } from '@utils/errors';

export interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

/**
 * authMiddleware — verifies the Bearer JWT from the Authorization header
 * and attaches the decoded userId to req.userId.
 *
 * Usage:
 *   router.get('/protected', authMiddleware, handler);
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or invalid Authorization header'));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.userId = decoded.sub;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
