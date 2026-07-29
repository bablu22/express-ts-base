import { describe, it, expect, vi } from 'vitest';
import { ErrorHandler } from '../../src/middleware/error-handler';
import { AppError } from '../../src/utils/errors';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

describe('ErrorHandler middleware', () => {
  it('should handle AppError and respond with correct status and message', () => {
    const req: any = { method: 'GET', originalUrl: '/test' };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    const error = new AppError('Resource not found', StatusCodes.NOT_FOUND);

    ErrorHandler.handle(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      status: StatusCodes.NOT_FOUND,
      message: 'Resource not found',
    });
  });

  it('should handle ZodError validation failures correctly', () => {
    const req: any = { method: 'POST', originalUrl: '/test' };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    const schema = z.object({ email: z.string().email() });
    const parseResult = schema.safeParse({ email: 'invalid-email' });

    if (!parseResult.success) {
      ErrorHandler.handle(parseResult.error, req, res, next);
    }

    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        status: StatusCodes.UNPROCESSABLE_ENTITY,
        message: 'Validation failed',
      }),
    );
  });

  it('should create 404 AppError in notFound middleware', () => {
    const req: any = { method: 'GET', originalUrl: '/unknown' };
    const res: any = {};
    const next = vi.fn();

    ErrorHandler.notFound(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Route GET /unknown not found',
      }),
    );
  });
});
