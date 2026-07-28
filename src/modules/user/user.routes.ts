import { Router } from 'express';
import { Database } from '@lib/prisma';
import { authMiddleware } from '@middleware/auth.middleware';
import { BaseRouter } from '@shared/base.router';
import { PrismaUserRepository } from './prisma-user.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

/**
 * UserRouter — Composition Root for User Profile management.
 */
export class UserRouter extends BaseRouter {
  private readonly controller: UserController;

  constructor() {
    super();
    const userRepository = new PrismaUserRepository(Database.getInstance());
    const userService = new UserService(userRepository);
    this.controller = new UserController(userService);
  }

  registerRoutes(): Router {
    const router = Router();

    router.get('/me', authMiddleware, this.asyncHandler(this.controller.getProfile));

    return router;
  }
}
