import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { logger } from '@lib/logger';
import { AppError, isAppError } from '@utils/errors';
import { env } from '@config/env';

/**
 * Standardized error response shape returned by all error handlers.
 */
interface ErrorResponse {
  success: false;
  status: number;
  message: string;
  errors?: unknown;
  stack?: string;
}

/**
 * ErrorHandler — static class encapsulating all global Express error middleware.
 *
 * Usage in App:
 *   app.use(ErrorHandler.notFound);
 *   app.use(ErrorHandler.handle);
 */
export class ErrorHandler {
  // Prevent direct instantiation
  private constructor() {}

  /**
   * 404 catch-all middleware.
   * Mount AFTER all routes. Converts unknown routes into an AppError
   * and forwards to ErrorHandler.handle via next().
   */
  static notFound(this: void, req: Request, _res: Response, next: NextFunction): void {
    const err = new AppError(
      `Route ${req.method} ${req.originalUrl} not found`,
      StatusCodes.NOT_FOUND,
    );
    next(err);
  }

  /**
   * Global error handler — must have exactly 4 parameters for Express to
   * recognize it as an error-handling middleware.
   *
   * Handles three error categories:
   *  1. ZodError        → 422 Unprocessable Entity (field-level validation errors)
   *  2. AppError        → operational HTTP errors (4xx), logged at warn
   *  3. Unknown errors  → programmer errors (500), logged at error
   */
  static handle(
    this: void,
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    // 1. Validation errors (from validateBody / validateParams / validateQuery)
    const isValidationError =
      err instanceof ZodError ||
      (err instanceof Error &&
        (err as NodeJS.ErrnoException & { isValidation?: boolean }).isValidation ===
          true);

    if (isValidationError) {
      let formattedErrors: { field: string; message: string }[];

      if (err instanceof ZodError) {
        formattedErrors = err.errors.map((e) => ({
          field: e.path.length > 0 ? e.path.join('.') : 'body',
          message: e.message,
        }));
      } else {
        // Errors already formatted by validate.ts
        formattedErrors =
          (err as Error & { errors?: { field: string; message: string }[] }).errors ?? [];
      }

      logger.warn(
        { errors: formattedErrors, method: req.method, url: req.originalUrl },
        'Validation error',
      );

      const response: ErrorResponse = {
        success: false,
        status: StatusCodes.UNPROCESSABLE_ENTITY,
        message: 'Validation failed',
        errors: formattedErrors,
      };

      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json(response);
      return;
    }

    // 2. Operational AppError (4xx)
    if (isAppError(err) && err.isOperational) {
      logger.warn(
        {
          err: {
            name: err.name,
            message: err.message,
            statusCode: err.statusCode,
            context: err.context,
          },
          method: req.method,
          url: req.originalUrl,
        },
        `Operational error: ${err.message}`,
      );

      const response: ErrorResponse = {
        success: false,
        status: err.statusCode,
        message: err.message,
        ...(err.context ? { errors: err.context } : {}),
      };

      res.status(err.statusCode).json(response);
      return;
    }

    // 3. Programmer / unhandled errors (5xx)
    logger.error(
      { err, method: req.method, url: req.originalUrl, body: req.body },
      'Unhandled error',
    );

    const response: ErrorResponse = {
      success: false,
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong',
    };

    // Only expose stack in development
    if (
      env.NODE_ENV === 'development' &&
      err instanceof Error &&
      err.stack !== undefined
    ) {
      response.stack = err.stack;
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(response);
  }
}
