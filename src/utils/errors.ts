import { StatusCodes } from 'http-status-codes';

/**
 * Base application error class.
 * All custom errors should extend this class.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (context !== undefined) {
      this.context = context;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 - Bad Request */
export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', context?: Record<string, unknown>) {
    super(message, StatusCodes.BAD_REQUEST, true, context);
  }
}

/** 401 - Unauthorized */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', context?: Record<string, unknown>) {
    super(message, StatusCodes.UNAUTHORIZED, true, context);
  }
}

/** 403 - Forbidden */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', context?: Record<string, unknown>) {
    super(message, StatusCodes.FORBIDDEN, true, context);
  }
}

/** 404 - Not Found */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', context?: Record<string, unknown>) {
    super(message, StatusCodes.NOT_FOUND, true, context);
  }
}

/** 409 - Conflict */
export class ConflictError extends AppError {
  constructor(message = 'Conflict', context?: Record<string, unknown>) {
    super(message, StatusCodes.CONFLICT, true, context);
  }
}

/** 422 - Unprocessable Entity (Validation) */
export class ValidationError extends AppError {
  public readonly errors: unknown;
  constructor(
    message = 'Validation failed',
    errors?: unknown,
    context?: Record<string, unknown>,
  ) {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY, true, context);
    this.errors = errors;
  }
}

/** 429 - Too Many Requests */
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', context?: Record<string, unknown>) {
    super(message, StatusCodes.TOO_MANY_REQUESTS, true, context);
  }
}

/** 500 - Internal Server Error (non-operational / programmer errors) */
export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', context?: Record<string, unknown>) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, false, context);
  }
}

/** Type guard */
export const isAppError = (err: unknown): err is AppError => err instanceof AppError;
