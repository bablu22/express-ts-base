import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@config/env';
import { logger } from '@lib/logger';

export class Database {
  private static instance: PrismaClient | null = null;

  private constructor() {}

  static getInstance(): PrismaClient {
    if (!Database.instance) {
      Database.instance = Database.createClient();
    }
    return Database.instance;
  }

  static async connect(): Promise<void> {
    await Database.getInstance().$connect();
    logger.info('Database: connected');
  }

  static async disconnect(): Promise<void> {
    if (Database.instance) {
      await Database.instance.$disconnect();
      Database.instance = null;
      logger.info('Database: disconnected');
    }
  }

  private static createClient(): PrismaClient {
    const isDev = env.NODE_ENV === 'development';

    const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

    const client = new PrismaClient({
      adapter,
      log: isDev
        ? [
            { emit: 'stdout', level: 'query' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ]
        : [
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ],
    });

    if (isDev) {
      return client.$extends({
        query: {
          async $allOperations({
            operation,
            model,
            args,
            query,
          }: {
            operation: string;
            model?: string;
            args: unknown;
            query: (args: unknown) => Promise<unknown>;
          }) {
            const start = Date.now();
            const result = await query(args);
            const duration = Date.now() - start;
            logger.debug({ model, operation, duration: `${duration}ms` }, 'Prisma query');
            return result;
          },
        },
      }) as unknown as PrismaClient;
    }

    return client;
  }
}
