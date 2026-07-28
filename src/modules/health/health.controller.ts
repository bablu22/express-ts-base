import type { Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Redis } from 'ioredis';
import { StatusCodes } from 'http-status-codes';
import { Database } from '@lib/prisma';
import { RedisClient } from '@lib/redis';
import { env } from '@config/env';

export class HealthController {
  private readonly prisma: PrismaClient;
  private readonly redis: Redis;

  constructor() {
    this.prisma = Database.getInstance();
    this.redis = RedisClient.getInstance();
  }

  check = async (_req: Request, res: Response): Promise<void> => {
    const [dbResult, redisResult] = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.redis.ping(),
    ]);

    const allHealthy = [dbResult, redisResult].every((r) => r.status === 'fulfilled');

    const payload = {
      status: allHealthy ? 'ok' : 'degraded',
      app: env.APP_NAME,
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbResult.status === 'fulfilled' ? 'up' : 'down',
        redis: redisResult.status === 'fulfilled' ? 'up' : 'down',
      },
    };

    res
      .status(allHealthy ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE)
      .json(payload);
  };
}
