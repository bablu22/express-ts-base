/**
 * Vitest global test setup — runs before all test suites.
 */
import { vi, afterAll, afterEach, beforeAll } from 'vitest';

// ── Mock environment variables for tests ──────────────────────────────────────
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test_db';
process.env['REDIS_URL'] = 'redis://localhost:6379';
process.env['LOG_LEVEL'] = 'silent';
process.env['JWT_SECRET'] = 'test-jwt-secret-at-least-16-chars';
process.env['CORS_ORIGIN'] = '*';
process.env['PORT'] = '4000';
process.env['APP_NAME'] = 'my-app-test';
process.env['API_VERSION'] = 'v1';

// ── Auto-mock heavy infrastructure dependencies ────────────────────────────────
vi.mock('@lib/prisma', () => ({
  Database: {
    getInstance: vi.fn().mockReturnValue({
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
      // TODO: add mocked model methods as your schema grows
      // user: {
      //   findMany: vi.fn(),
      //   findUnique: vi.fn(),
      //   findFirst: vi.fn(),
      //   create: vi.fn(),
      //   update: vi.fn(),
      //   delete: vi.fn(),
      // },
    }),
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));

vi.mock('@lib/redis', () => ({
  RedisClient: {
    getInstance: vi.fn().mockReturnValue({
      ping: vi.fn().mockResolvedValue('PONG'),
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      quit: vi.fn(),
      status: 'ready',
    }),
    getPublisher: vi.fn(),
    getSubscriber: vi.fn(),
    disconnect: vi.fn(),
    createQueueConnection: vi.fn(),
  },
}));

// ── Lifecycle hooks ───────────────────────────────────────────────────────────
beforeAll(() => {
  // Global setup before all tests
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});
