import { Router } from 'express';
import { BaseRouter } from '@shared/base.router';
import { PublicController } from './public.controller';

export class PublicRouter extends BaseRouter {
  private readonly controller: PublicController;

  constructor() {
    super();
    this.controller = new PublicController();
  }

  registerRoutes(): Router {
    const router = Router();

    // API root info
    router.get('/', this.controller.root);

    // Liveness probe (no DB/Redis check — use /api/v1/health for full readiness)
    router.get('/health', this.controller.health);

    // TODO: add other public routes here (e.g. oauth callbacks, webhooks)

    return router;
  }
}
