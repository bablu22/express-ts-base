import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { z, ZodIssue } from 'zod';
import { StatusCodes } from 'http-status-codes';

function formatIssue(issue: ZodIssue): { field: string; message: string } {
  const field = issue.path.length > 0 ? issue.path.join('.') : 'body';
  return { field, message: issue.message };
}

export const validate = <T>(schema: z.ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map(formatIssue);
    const err = Object.assign(new Error('Validation failed'), {
      statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      isOperational: true,
      isValidation: true,
      errors,
    });
    throw err;
  }

  return result.data;
};

export const validateBody = <T>(schema: z.ZodType<T>): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Treat a missing body as {} so optional-field schemas work without a body.
      req.body = validate(schema, req.body ?? {});
      next();
    } catch (err) {
      next(err);
    }
  };
};

export const validateParams = <T>(schema: z.ZodType<T>): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = validate(schema, req.params);
      Object.defineProperty(req, 'params', {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      next();
    } catch (err) {
      next(err);
    }
  };
};

export const validateQuery = <T>(schema: z.ZodType<T>): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = validate(schema, req.query);
      Object.defineProperty(req, 'query', {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      next();
    } catch (err) {
      next(err);
    }
  };
};
