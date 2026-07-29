import { Router } from 'express';
import { Database } from '@lib/prisma';
import { validateBody } from '@lib/validate';
import { BaseRouter } from '@shared/base.router';
import { emailJob } from '@jobs/email.job';
import { PrismaUserRepository } from '@modules/user/prisma-user.repository';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResendOtpSchema,
  VerifyOtpSchema,
} from './auth.schema';

/**
 * AuthRouter — Composition Root for Authentication.
 * Routes handle Registration, Login, Multi-Purpose OTP Verification, Resend, and Forgot Password.
 */
export class AuthRouter extends BaseRouter {
  private readonly controller: AuthController;

  constructor() {
    super();
    const userRepository = new PrismaUserRepository(Database.getInstance());
    const otpService = new OtpService();
    const authService = new AuthService(userRepository, emailJob, otpService);
    this.controller = new AuthController(authService);
  }

  registerRoutes(): Router {
    const router = Router();

    router.post(
      '/register',
      validateBody(RegisterSchema),
      this.asyncHandler(this.controller.register),
    );

    router.post(
      '/verify-otp',
      validateBody(VerifyOtpSchema),
      this.asyncHandler(this.controller.verifyOtp),
    );

    router.post(
      '/resend-otp',
      validateBody(ResendOtpSchema),
      this.asyncHandler(this.controller.resendOtp),
    );

    router.post(
      '/forgot-password',
      validateBody(ForgotPasswordSchema),
      this.asyncHandler(this.controller.forgotPassword),
    );

    router.post(
      '/login',
      validateBody(LoginSchema),
      this.asyncHandler(this.controller.login),
    );

    return router;
  }
}
