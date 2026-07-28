import { createAdapter } from '@socket.io/redis-adapter';
import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

import { env } from '@config/env';
import { RedisClient } from '@lib/redis';

import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from './socket.types';

const corsOrigin = (): string | string[] => {
  if (env.CORS_ORIGIN === '*') {
    return '*';
  }
  return env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
};

let ioInstance: Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
> | null = null;

export const getIo = (): Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
> | null => ioInstance;

export const createIo = (
  httpServer: HttpServer,
): Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
> => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: {
      origin: corsOrigin(),
      methods: ['GET', 'POST'],
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  const pubClient = RedisClient.getPublisher();
  const subClient = RedisClient.getSubscriber();

  io.adapter(createAdapter(pubClient, subClient));

  ioInstance = io;

  return io;
};
