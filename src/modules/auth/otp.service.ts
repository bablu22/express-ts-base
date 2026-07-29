import type Redis from 'ioredis';
import { RedisClient } from '@lib/redis';
import type { OtpPurpose } from './auth.schema';

export class OtpService {
  private static readonly OTP_PREFIX = 'otp:';
  private static readonly OTP_TTL_SECONDS = 600; // 10 minutes

  constructor(private readonly redis: Redis = RedisClient.getInstance()) {}

  /**
   * Generates a 6-digit OTP code and stores it in Redis with key `otp:<purpose>:<email>`.
   */
  async generateOtp(
    email: string,
    purpose: OtpPurpose = 'email_verification',
  ): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `${OtpService.OTP_PREFIX}${purpose}:${email.toLowerCase().trim()}`;

    await this.redis.set(key, otp, 'EX', OtpService.OTP_TTL_SECONDS);
    return otp;
  }

  /**
   * Verifies the OTP code for the given email and purpose from Redis.
   * Consumes and deletes the OTP upon successful verification.
   */
  async verifyOtp(
    email: string,
    code: string,
    purpose: OtpPurpose = 'email_verification',
  ): Promise<boolean> {
    const key = `${OtpService.OTP_PREFIX}${purpose}:${email.toLowerCase().trim()}`;
    const storedOtp = await this.redis.get(key);

    if (!storedOtp || storedOtp !== code.trim()) {
      return false;
    }

    await this.redis.del(key);
    return true;
  }

  getTtlMinutes(): number {
    return Math.floor(OtpService.OTP_TTL_SECONDS / 60);
  }
}
