import type { Router, Request, Response, NextFunction, RequestHandler } from 'express';

export abstract class BaseRouter {
  /**
   * Must return a configured Express Router instance.
   */
  abstract registerRoutes(): Router;

  /**
   * Wraps async middleware/controllers and forwards thrown errors to next().
   */
  protected asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void,
  ): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}
