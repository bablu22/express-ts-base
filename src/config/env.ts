import 'dotenv/config';
import { z } from 'zod';

// Helper for boolean env vars to prevent z.coerce.boolean() treating "false" string as true
const booleanEnv = (defaultValue = false) =>
  z
    .preprocess(
      (val) =>
        typeof val === 'string'
          ? val.toLowerCase() === 'true' || val === '1'
          : Boolean(val),
      z.boolean(),
    )
    .default(defaultValue);

// Resolve unexpanded ${...} variable placeholders or missing URLs in process.env
const resolveDatabaseUrl = (): string => {
  const dbUrl = process.env.DATABASE_URL ?? '';
  if (dbUrl && !dbUrl.includes('${')) {
    return dbUrl;
  }
  const user = process.env.POSTGRES_USER || 'myapp';
  const pass = process.env.POSTGRES_PASSWORD || 'myapp_secret';
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = process.env.POSTGRES_PORT || '5432';
  const db = process.env.POSTGRES_DB || 'myapp_db';
  return `postgresql://${user}:${pass}@${host}:${port}/${db}?schema=public`;
};

const resolveRedisUrl = (): string => {
  const redisUrl = process.env.REDIS_URL ?? '';
  if (redisUrl && !redisUrl.includes('${')) {
    return redisUrl;
  }
  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';
  const pass = process.env.REDIS_PASSWORD || 'redis_secret';
  return pass ? `redis://:${pass}@${host}:${port}` : `redis://${host}:${port}`;
};

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('${')) {
  process.env.DATABASE_URL = resolveDatabaseUrl();
}

if (!process.env.REDIS_URL || process.env.REDIS_URL.includes('${')) {
  process.env.REDIS_URL = resolveRedisUrl();
}

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_VERSION: z.string().default('v1'),
  APP_NAME: z.string().default('my-app'),
  PUBLIC_URL: z.string().url().default('http://localhost:3000'),

  // Database (PostgreSQL)
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
  POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
  POSTGRES_HOST: z.string().default('localhost'),
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_URL: z.string().url(),

  // Logger
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  // Security
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),

  // SMTP Email
  SMTP_HOST: z.string().default('smtp.mailtrap.io'),
  SMTP_PORT: z.coerce.number().default(2525),
  SMTP_SECURE: booleanEnv(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@my-app.com'),

  // Database Seeding
  SEED_RUN: booleanEnv(false),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;

export type Env = typeof env;
