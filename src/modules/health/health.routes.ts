import { Router } from 'express';
import { BaseRouter } from '@shared/base.router';
import { HealthController } from './health.controller';

export class HealthRouter extends BaseRouter {
  private readonly controller: HealthController;

  constructor() {
    super();
    this.controller = new HealthController();
  }

  registerRoutes(): Router {
    const router = Router();
    router.get('/', this.asyncHandler(this.controller.check));
    return router;
  }
}
