import { logger } from '@lib/logger';
import type { AppServer, AppSocket } from './socket.types';

/**
 * SocketRegistry — registers all socket event handlers on the io server.
 *
 * Add your feature-specific handlers here (e.g., chat, notifications).
 * Pattern: create a handler class, instantiate it, and call registerHandlers(io, socket).
 */
export class SocketRegistry {
  public register(io: AppServer): void {
    io.on('connection', (socket: AppSocket) => {
      logger.info(
        { socketId: socket.id, recovered: socket.recovered },
        'Socket connected',
      );

      // Example: ping / pong
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // TODO: register your feature handlers here
      // Example:
      // this.chatHandler.registerHandlers(io, socket);

      socket.on('disconnect', (reason) => {
        logger.info({ socketId: socket.id, reason }, 'Socket disconnected');
      });

      socket.on('error', (err) => {
        logger.error({ err, socketId: socket.id }, 'Socket error');
      });
    });
  }
}

/**
 * Convenience function used in index.ts to boot up socket handlers.
 */
export function registerSocketHandlers(io: AppServer): void {
  const registry = new SocketRegistry();
  registry.register(io);
}
