import { describe, it, expect, vi } from 'vitest';
import { validate, validateBody, validateParams } from '../../src/lib/validate';
import { z } from 'zod';

describe('Validation utilities', () => {
  const userSchema = z.object({
    name: z.string().min(2),
    age: z.number().positive(),
  });

  it('should validate valid data using validate() helper', () => {
    const input = { name: 'Alice', age: 25 };
    const output = validate(userSchema, input);
    expect(output).toEqual(input);
  });

  it('should throw formatted error on invalid data', () => {
    const input = { name: 'A', age: -5 };
    expect(() => validate(userSchema, input)).toThrow('Validation failed');
  });

  it('should pass middleware validation when body is valid', () => {
    const req: any = { body: { name: 'Alice', age: 25 } };
    const res: any = {};
    const next = vi.fn();

    const middleware = validateBody(userSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Alice', age: 25 });
  });

  it('should pass params middleware validation when params are valid', () => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const req: any = { params: { id: '123e4567-e89b-12d3-a456-426614174000' } };
    const res: any = {};
    const next = vi.fn();

    const middleware = validateParams(paramsSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.params.id).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should call next with error when body is invalid', () => {
    const req: any = { body: { name: 'A' } };
    const res: any = {};
    const next = vi.fn();

    const middleware = validateBody(userSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
