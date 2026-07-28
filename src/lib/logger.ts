import pino from 'pino';
import { env } from '@config/env';

const isDev = env.NODE_ENV === 'development';
const isTest = env.NODE_ENV === 'test';

export const logger = pino(
  {
    level: isTest ? 'silent' : env.LOG_LEVEL,
    base: {
      pid: process.pid,
      app: env.APP_NAME,
      env: env.NODE_ENV,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    redact: {
      paths: [
        '*.password',
        '*.token',
        '*.secret',
        '*.authorization',
        'req.headers.authorization',
      ],
      censor: '[REDACTED]',
    },
  },
  isDev
    ? (pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }) as pino.DestinationStream)
    : undefined,
);

export type Logger = typeof logger;
