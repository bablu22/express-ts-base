import type { Socket, Server } from 'socket.io';

// Client → Server events (what the client sends)
export interface ClientToServerEvents {
  ping: () => void;
  // TODO: add your client-to-server events here
  // Example:
  // 'chat:message': (payload: { roomId: string; text: string }) => void;
}

// Server → Client events (what the server emits)
export interface ServerToClientEvents {
  pong: () => void;
  error: (payload: { code: string; message: string }) => void;
  // TODO: add your server-to-client events here
  // Example:
  // 'chat:message': (payload: { from: string; text: string; timestamp: number }) => void;
}

// Per-socket session data stored in socket.data
export interface SocketData {
  userId?: string;
  // TODO: add per-socket session fields here
}

// Convenience type aliases
export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
