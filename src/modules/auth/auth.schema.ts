import { z } from 'zod';

export const OtpPurposeEnum = z.enum([
  'email_verification',
  'password_reset',
  'login_2fa',
]);
export type OtpPurpose = z.infer<typeof OtpPurposeEnum>;

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  otp: z
    .string()
    .length(6, 'OTP code must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP code must contain numbers only'),
  purpose: OtpPurposeEnum.default('email_verification'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password must be at most 128 characters')
    .optional(),
});

export const ResendOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  purpose: OtpPurposeEnum.default('email_verification'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;
export type ResendOtpDto = z.infer<typeof ResendOtpSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
