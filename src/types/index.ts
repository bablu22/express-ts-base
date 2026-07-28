/* eslint-disable @typescript-eslint/no-namespace */
import type { Request, Response, NextFunction } from 'express';

// Extend Express Request to carry common auth/session context
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
      userId?: string;
    }
  }
}

// Standard API response envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown;
  meta?: PaginationMeta;
}

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Utility types
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
