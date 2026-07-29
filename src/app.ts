import { env } from '@config/env';
import { logger } from '@lib/logger';
import { RedisClient } from '@lib/redis';
import { ErrorHandler } from '@middleware/error-handler';
import { PublicRouter } from '@modules/public/public.routes';
import cors from 'cors';
import express, { type Application } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import { RedisStore } from 'rate-limit-redis';
import { AppRouter } from './router';

export class App {
  private readonly express: Application;

  constructor() {
    this.express = express();
    this.registerMiddleware();
    this.registerRoutes();
    this.registerErrorHandlers();
  }

  getInstance(): Application {
    return this.express;
  }

  private registerMiddleware(): void {
    this.express.set('trust proxy', 1);
    this.express.disable('x-powered-by');

    this.express.use(helmet());

    this.express.use(
      cors({
        origin: env.CORS_ORIGIN,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      }),
    );

    this.express.use(hpp());

    const rateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 100, // max 100 requests per window per IP
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: {
        success: false,
        status: 429,
        message: 'Too many requests, please try again later.',
      },
      store: new RedisStore({
        sendCommand: (...args: string[]) =>
          RedisClient.getInstance().call(args[0], ...args.slice(1)) as Promise<any>,
      }),
    });
    this.express.use(rateLimiter);

    this.express.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: (req) => req.url === '/health',
        },
        customLogLevel(_req, res, err) {
          if (err ?? res.statusCode >= 500) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
        serializers: {
          req(req) {
            return {
              id: req.id,
              method: req.method,
              url: req.url,
              remoteAddress: req.remoteAddress,
              userAgent: req.headers['user-agent'],
            };
          },
          res(res) {
            return { statusCode: res.statusCode };
          },
        },
      }),
    );

    this.express.use(express.json({ limit: '10mb' }));
    this.express.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private registerRoutes(): void {
    // Root & system routes (/, /health, etc.)
    this.express.use(new PublicRouter().registerRoutes());

    // Versioned API routes (/api/v1/...)
    this.express.use(new AppRouter().getRouter());
  }

  private registerErrorHandlers(): void {
    this.express.use(ErrorHandler.notFound);
    this.express.use(ErrorHandler.handle);
  }
}
