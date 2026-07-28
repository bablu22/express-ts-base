import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { env } from '@config/env';

export class PublicController {
  /**
   * GET /
   * API root — returns basic info about the running service.
   */
  root = (_req: Request, res: Response): void => {
    res.status(StatusCodes.OK).json({
      success: true,
      app: env.APP_NAME,
      version: env.API_VERSION,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * GET /health
   * Simple liveness probe (no dependency checks — those live under /api/v1/health).
   */
  health = (_req: Request, res: Response): void => {
    res.status(StatusCodes.OK).json({
      status: 'ok',
      app: env.APP_NAME,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  };
}
