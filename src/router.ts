import { Router } from 'express';
import { env } from '@config/env';
import { HealthRouter } from '@modules/health/health.routes';
import { AuthRouter } from '@modules/auth/auth.routes';
import { UserRouter } from '@modules/user/user.routes';

/**
 * AppRouter — central API router, mounts all feature modules under /api/:version/
 */
export class AppRouter {
  private readonly router: Router;

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private registerRoutes(): void {
    const v = env.API_VERSION; // e.g. "v1"

    this.router.use(`/api/${v}/health`, new HealthRouter().registerRoutes());
    this.router.use(`/api/${v}/auth`, new AuthRouter().registerRoutes());
    this.router.use(`/api/${v}/users`, new UserRouter().registerRoutes());
  }
}
