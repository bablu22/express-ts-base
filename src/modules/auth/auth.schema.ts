import { z } from 'zod';

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
});

export const ResendOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;
export type ResendOtpDto = z.infer<typeof ResendOtpSchema>;
