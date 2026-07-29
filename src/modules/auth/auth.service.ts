import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';
import { BaseService } from '@shared/base.service';
import { BadRequestError, ConflictError, UnauthorizedError } from '@utils/errors';
import type { EmailJob } from '@jobs/email.job';
import type { IUserRepository } from '@modules/user/user.repository.interface';
import type { OtpService } from './otp.service';
import type {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendOtpDto,
  VerifyOtpDto,
} from './auth.schema';

const BCRYPT_ROUNDS = 12;

export interface VerifyOtpResult {
  message: string;
  accessToken?: string;
  resetToken?: string;
}

export class AuthService extends BaseService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailJob: EmailJob,
    private readonly otpService: OtpService,
  ) {
    super();
  }

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.userRepository.findByEmail(dto.email);

    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      isVerified: false,
    });

    const otp = await this.otpService.generateOtp(user.email, 'email_verification');

    await this.emailJob.enqueue({
      to: user.email,
      subject: 'Your Verification Code',
      templateName: 'verify-otp',
      templateData: {
        name: user.name,
        otp,
        expiresInMinutes: this.otpService.getTtlMinutes(),
      },
      title: 'Verify your email address',
      previewText: `Your verification OTP is ${otp}`,
    });

    return {
      message: 'Registration successful. An OTP has been sent to your email address.',
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<VerifyOtpResult> {
    const purpose = dto.purpose || 'email_verification';
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestError('Invalid email or verification code');
    }

    // 1. Email Verification Purpose
    if (purpose === 'email_verification') {
      if (user.isVerified) {
        throw new BadRequestError('This email address is already verified');
      }

      const isValid = await this.otpService.verifyOtp(
        dto.email,
        dto.otp,
        'email_verification',
      );
      if (!isValid) {
        throw new BadRequestError('Invalid or expired OTP verification code');
      }

      await this.userRepository.update(user.id, { isVerified: true });

      await this.emailJob.enqueue({
        to: user.email,
        subject: `Welcome to ${env.APP_NAME}!`,
        templateName: 'welcome',
        templateData: {
          name: user.name,
        },
        title: `Welcome to ${env.APP_NAME}`,
        previewText: `Your ${env.APP_NAME} account is verified and active.`,
      });

      return {
        accessToken: this.signToken(user.id),
        message: 'Email verified successfully. You are now logged in.',
      };
    }

    // 2. Password Reset Purpose
    if (purpose === 'password_reset') {
      const isValid = await this.otpService.verifyOtp(
        dto.email,
        dto.otp,
        'password_reset',
      );
      if (!isValid) {
        throw new BadRequestError('Invalid or expired password reset OTP code');
      }

      if (dto.newPassword) {
        const hashedPassword = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
        await this.userRepository.update(user.id, { password: hashedPassword });
        return {
          message:
            'Password reset successfully. You can now log in with your new password.',
        };
      }

      const resetToken = this.signResetToken(user.id);
      return {
        resetToken,
        message: 'OTP verified successfully. Please provide your new password.',
      };
    }

    // 3. Login 2FA Purpose
    if (purpose === 'login_2fa') {
      const isValid = await this.otpService.verifyOtp(dto.email, dto.otp, 'login_2fa');
      if (!isValid) {
        throw new BadRequestError('Invalid or expired 2FA code');
      }

      return {
        accessToken: this.signToken(user.id),
        message: '2FA authentication successful.',
      };
    }

    throw new BadRequestError(`Unsupported OTP purpose: ${String(purpose)}`);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const successMessage =
      'If that email address is registered, a password reset OTP code has been sent.';

    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      return { message: successMessage };
    }

    const otp = await this.otpService.generateOtp(user.email, 'password_reset');

    await this.emailJob.enqueue({
      to: user.email,
      subject: 'Password Reset Verification Code',
      templateName: 'verify-otp',
      templateData: {
        name: user.name,
        otp,
        expiresInMinutes: this.otpService.getTtlMinutes(),
      },
      title: 'Reset Your Password',
      previewText: `Your password reset code is ${otp}`,
    });

    return { message: successMessage };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedError('Please verify your email address before logging in');
    }

    return { accessToken: this.signToken(user.id) };
  }

  async resendOtp(dto: ResendOtpDto): Promise<{ message: string }> {
    const purpose = dto.purpose || 'email_verification';
    const successMessage = 'If that email is registered, a new OTP code has been sent.';

    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      return { message: successMessage };
    }

    if (purpose === 'email_verification' && user.isVerified) {
      return { message: successMessage };
    }

    const otp = await this.otpService.generateOtp(user.email, purpose);

    await this.emailJob.enqueue({
      to: user.email,
      subject:
        purpose === 'password_reset'
          ? 'New Password Reset Code'
          : 'Your New Verification Code',
      templateName: 'verify-otp',
      templateData: {
        name: user.name,
        otp,
        expiresInMinutes: this.otpService.getTtlMinutes(),
      },
      title:
        purpose === 'password_reset'
          ? 'Reset Your Password'
          : 'Verify your email address',
      previewText: `Your new OTP code is ${otp}`,
    });

    return { message: successMessage };
  }

  private signToken(userId: string): string {
    return jwt.sign({ sub: userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  private signResetToken(userId: string): string {
    return jwt.sign({ sub: userId, type: 'password_reset' }, env.JWT_SECRET, {
      expiresIn: '15m',
    } as jwt.SignOptions);
  }
}
