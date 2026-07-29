import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/modules/auth/auth.service';
import {
  ConflictError,
  BadRequestError,
  UnauthorizedError,
} from '../../src/utils/errors';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: any;
  let mockEmailJob: any;
  let mockOtpService: any;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
    };

    mockEmailJob = {
      enqueue: vi.fn().mockResolvedValue({ id: 'job-1' }),
    };

    mockOtpService = {
      generateOtp: vi.fn().mockResolvedValue('123456'),
      verifyOtp: vi.fn().mockResolvedValue(true),
      getTtlMinutes: vi.fn().mockReturnValue(10),
    };

    authService = new AuthService(mockUserRepository, mockEmailJob, mockOtpService);
  });

  describe('register', () => {
    it('should successfully register a new user and enqueue verification email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
      });

      const result = await authService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result.message).toContain('Registration successful');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockOtpService.generateOtp).toHaveBeenCalledWith(
        'john@example.com',
        'email_verification',
      );
      expect(mockEmailJob.enqueue).toHaveBeenCalled();
    });

    it('should throw ConflictError if email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({ id: 'user-1' });

      await expect(
        authService.register({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        password: hashedPassword,
        isVerified: true,
      });

      const result = await authService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBeDefined();
    });

    it('should throw UnauthorizedError for incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('correctpass', 10);
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        password: hashedPassword,
        isVerified: true,
      });

      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if user is not verified', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        password: hashedPassword,
        isVerified: false,
      });

      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('verifyOtp', () => {
    it('should verify email_verification OTP and return access token', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        name: 'John Doe',
        isVerified: false,
      });
      mockOtpService.verifyOtp.mockResolvedValue(true);

      const result = await authService.verifyOtp({
        email: 'john@example.com',
        otp: '123456',
        purpose: 'email_verification',
      });

      expect(result.accessToken).toBeDefined();
      expect(mockUserRepository.update).toHaveBeenCalledWith('user-1', {
        isVerified: true,
      });
      expect(mockEmailJob.enqueue).toHaveBeenCalled();
    });

    it('should verify password_reset OTP and reset password when newPassword is provided', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        name: 'John Doe',
        isVerified: true,
      });
      mockOtpService.verifyOtp.mockResolvedValue(true);

      const result = await authService.verifyOtp({
        email: 'john@example.com',
        otp: '123456',
        purpose: 'password_reset',
        newPassword: 'newpassword123',
      });

      expect(result.message).toContain('Password reset successfully');
      expect(mockUserRepository.update).toHaveBeenCalled();
    });

    it('should throw BadRequestError if OTP is invalid', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        isVerified: false,
      });
      mockOtpService.verifyOtp.mockResolvedValue(false);

      await expect(
        authService.verifyOtp({
          email: 'john@example.com',
          otp: '000000',
          purpose: 'email_verification',
        }),
      ).rejects.toThrow(BadRequestError);
    });
  });
});
