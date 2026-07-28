import http from 'node:http';
import { App } from './app';
import { env } from '@config/env';
import { logger } from '@lib/logger';
import { Database } from '@lib/prisma';
import { RedisClient } from '@lib/redis';
import { QueueManager } from './jobs/queue-manager';
import { createIo, registerSocketHandlers, type AppServer } from './sockets';

class Server {
  private readonly app: App;
  private httpServer!: http.Server;
  private io!: AppServer;

  constructor() {
    this.app = new App();
  }

  async start(): Promise<void> {
    try {
      await Database.connect();
    } catch (err) {
      logger.fatal({ err }, 'Database: failed to connect — aborting startup');
      process.exit(1);
    }

    const redis = RedisClient.getInstance();
    if (redis.status !== 'ready') {
      logger.warn({ redisStatus: redis.status }, 'Redis: not yet ready at startup');
    }

    this.httpServer = http.createServer(this.app.getInstance());
    this.io = createIo(this.httpServer);
    registerSocketHandlers(this.io);

    this.httpServer.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, env: env.NODE_ENV, apiVersion: env.API_VERSION },
        `🚀 ${env.APP_NAME} server started`,
      );
    });

    QueueManager.start();

    this.registerSignalHandlers();
    this.registerErrorHandlers();
  }

  private async shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Graceful shutdown initiated');

    // Force-kill after 30s if shutdown hangs
    const timeoutId = setTimeout(() => {
      logger.error('Forced shutdown: graceful shutdown timed out after 30s');
      process.exit(1);
    }, 30_000);
    timeoutId.unref();

    try {
      if (this.io) {
        await this.io.close();
        logger.info('Socket.io server closed');
      }

      await new Promise<void>((resolve, reject) => {
        this.httpServer.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      await QueueManager.shutdown();
      await Database.disconnect();
      await RedisClient.disconnect();

      clearTimeout(timeoutId);
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  }

  private registerSignalHandlers(): void {
    process.on('SIGTERM', () => void this.shutdown('SIGTERM'));
    process.on('SIGINT', () => void this.shutdown('SIGINT'));
  }

  private registerErrorHandlers(): void {
    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled Promise Rejection — rethrowing');
      throw reason;
    });

    process.on('uncaughtException', (err) => {
      logger.fatal({ err }, 'Uncaught Exception — exiting');
      process.exit(1);
    });
  }
}

void new Server().start();
