import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';
import { BaseService } from '@shared/base.service';
import { BadRequestError, ConflictError, UnauthorizedError } from '@utils/errors';
import type { EmailJob } from '@jobs/email.job';
import type { IUserRepository } from '@modules/user/user.repository.interface';
import type { OtpService } from './otp.service';
import type { LoginDto, RegisterDto, ResendOtpDto, VerifyOtpDto } from './auth.schema';

const BCRYPT_ROUNDS = 12;

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

    const otp = await this.otpService.generateOtp(user.email);

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

  async verifyOtp(dto: VerifyOtpDto): Promise<{ accessToken: string; message: string }> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestError('Invalid email or verification code');
    }

    if (user.isVerified) {
      throw new BadRequestError('This email address is already verified');
    }

    const isValid = await this.otpService.verifyOtp(dto.email, dto.otp);

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
    const successMessage =
      'If that email is registered and unverified, a new OTP code has been sent.';

    const user = await this.userRepository.findByEmail(dto.email);

    if (!user || user.isVerified) {
      return { message: successMessage };
    }

    const otp = await this.otpService.generateOtp(user.email);

    await this.emailJob.enqueue({
      to: user.email,
      subject: 'Your New Verification Code',
      templateName: 'verify-otp',
      templateData: {
        name: user.name,
        otp,
        expiresInMinutes: this.otpService.getTtlMinutes(),
      },
      title: 'Verify your email address',
      previewText: `Your new verification OTP is ${otp}`,
    });

    return { message: successMessage };
  }

  private signToken(userId: string): string {
    return jwt.sign({ sub: userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }
}
