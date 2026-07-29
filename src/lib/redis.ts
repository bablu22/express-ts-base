import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';

import { env } from '@config/env';
import { logger } from '@lib/logger';

export class RedisClient {
  private static client: Redis | null = null;
  private static publisher: Redis | null = null;
  private static subscriber: Redis | null = null;
  private static createdConnections = new Set<Redis>();

  private constructor() {}

  static getInstance(): Redis {
    if (!this.client) {
      this.client = this.createClient(undefined, 'main');
    }

    return this.client;
  }

  static getPublisher(): Redis {
    if (!this.publisher) {
      this.publisher = this.createClient(undefined, 'publisher');
    }

    return this.publisher;
  }

  static getSubscriber(): Redis {
    if (!this.subscriber) {
      this.subscriber = this.createClient(undefined, 'subscriber');
    }

    return this.subscriber;
  }

  static duplicateConnection(): Redis {
    return this.getInstance().duplicate();
  }

  static createQueueConnection(): Redis {
    return this.createClient(
      {
        maxRetriesPerRequest: null,
      },
      'queue',
    );
  }

  static async disconnect(): Promise<void> {
    const connections = Array.from(this.createdConnections);
    await Promise.all(
      connections.map((redis) => redis.quit().catch(() => redis.disconnect())),
    );

    this.createdConnections.clear();
    this.client = null;
    this.publisher = null;
    this.subscriber = null;

    logger.info('Redis: all connections closed');
  }

  static async eval<T = unknown>(
    script: string,
    numKeys: number,
    ...args: (string | number)[]
  ): Promise<T> {
    return this.getInstance().eval(script, numKeys, ...args) as Promise<T>;
  }

  private static createClient(options?: RedisOptions, name: string = 'client'): Redis {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,

      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        logger.warn({ name, attempt: times, delay }, 'Redis: reconnecting');
        return delay;
      },

      reconnectOnError(err) {
        logger.error({ name, err }, 'Redis reconnecting after error');
        return true;
      },

      ...(options ?? {}),
    });

    this.createdConnections.add(client);
    this.bindEvents(client, name);

    return client;
  }

  private static bindEvents(client: Redis, name: string): void {
    client.on('connect', () => {
      logger.debug({ name }, `Redis (${name}): connected`);
    });

    client.on('ready', () => {
      if (name === 'main') {
        logger.info('Redis: connected and ready');
      } else {
        logger.debug({ name }, `Redis (${name}): ready`);
      }
    });

    client.on('close', () => {
      logger.warn({ name }, `Redis (${name}): connection closed`);
    });

    client.on('reconnecting', () => {
      logger.info({ name }, `Redis (${name}): reconnecting...`);
    });

    client.on('end', () => {
      logger.warn({ name }, `Redis (${name}): connection ended`);
    });

    client.on('error', (err) => {
      logger.error({ name, err }, `Redis (${name}): error`);
    });
  }
}
