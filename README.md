# Express TypeScript Starter

A production-ready boilerplate for building REST APIs with **Express 5**, **TypeScript**, **Prisma 7**, **PostgreSQL**, **Redis**, **Socket.io**, and **BullMQ**.

---

## Tech Stack

| Layer                | Technology                         |
| -------------------- | ---------------------------------- |
| Runtime              | Node.js 20+                        |
| Language             | TypeScript (strict mode)           |
| Framework            | Express 5                          |
| ORM                  | Prisma 7 with `@prisma/adapter-pg` |
| Database             | PostgreSQL 16                      |
| Cache / Pub-Sub      | Redis 7 (ioredis)                  |
| Real-time            | Socket.io 4 (Redis adapter)        |
| Background Jobs      | BullMQ 5                           |
| Validation           | Zod                                |
| Logging              | Pino + pino-http                   |
| Auth                 | JWT (jsonwebtoken)                 |
| Email                | Nodemailer                         |
| Testing              | Vitest                             |
| Linting / Formatting | ESLint + Prettier                  |
| Package Manager      | pnpm                               |
| Containerisation     | Docker + Docker Compose            |

---

## Project Structure

```
src/
├── config/
│   └── env.ts               # Zod-validated environment config
├── jobs/
│   ├── base.job.ts          # Abstract BullMQ job base class
│   ├── queue-manager.ts     # Worker bootstrap & graceful shutdown
│   └── sample.job.ts        # Example job — replace with yours
├── lib/
│   ├── email.service.ts     # Nodemailer transactional email
│   ├── logger.ts            # Pino structured logger
│   ├── prisma.ts            # Singleton Prisma client
│   ├── redis.ts             # Singleton Redis client (main + pub/sub)
│   └── validate.ts          # Zod request validators (body/params/query)
├── middleware/
│   ├── auth.middleware.ts   # JWT Bearer token auth
│   └── error-handler.ts    # Global Express error handler
├── modules/
│   ├── health/              # GET /api/v1/health — DB + Redis readiness
│   └── public/             # GET /, GET /health — liveness probes
├── shared/
│   ├── base.router.ts       # Abstract router with asyncHandler helper
│   └── base.service.ts      # Abstract service with pagination helper
├── sockets/
│   ├── index.ts             # Barrel export
│   ├── socket.registry.ts   # Socket event handler registration
│   ├── socket.server.ts     # Socket.io server + Redis adapter setup
│   └── socket.types.ts      # Typed ClientToServer / ServerToClient events
├── types/
│   └── index.ts             # Global types, Express augmentation
├── utils/
│   └── errors.ts            # AppError + HTTP error subclasses
├── app.ts                   # Express App class (middleware + routes)
├── index.ts                 # Server entry point + graceful shutdown
└── router.ts                # Central API router (/api/v1/...)

prisma/
├── schema/
│   └── base.prisma          # Generator, datasource, your models go here
└── seed.ts                  # Database seeder

__tests__/
└── setup.ts                 # Vitest global setup + infrastructure mocks
```

---

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env and fill in your values
```

### 3. Start infrastructure (PostgreSQL + Redis)

```bash
pnpm docker:up
```

### 4. Run migrations & generate Prisma client

```bash
pnpm prisma:migrate
pnpm prisma:generate
```

### 5. Start the dev server

```bash
pnpm dev
```

The API will be available at `http://localhost:3000`.

---

## Available Scripts

| Command                    | Description                         |
| -------------------------- | ----------------------------------- |
| `pnpm dev`                 | Start with hot-reload (`tsx watch`) |
| `pnpm build`               | Compile TypeScript to `dist/`       |
| `pnpm start`               | Run compiled output                 |
| `pnpm lint`                | Run ESLint                          |
| `pnpm lint:fix`            | Auto-fix lint errors                |
| `pnpm format`              | Format with Prettier                |
| `pnpm type-check`          | TypeScript type check (no emit)     |
| `pnpm test`                | Run Vitest (once)                   |
| `pnpm test:watch`          | Run Vitest in watch mode            |
| `pnpm test:coverage`       | Run Vitest with coverage report     |
| `pnpm prisma:migrate`      | Create & apply new migration        |
| `pnpm prisma:migrate:prod` | Deploy migrations in production     |
| `pnpm prisma:studio`       | Open Prisma Studio                  |
| `pnpm prisma:seed`         | Run `prisma/seed.ts`                |
| `pnpm docker:up`           | Start Docker services               |
| `pnpm docker:down`         | Stop Docker services                |
| `pnpm docker:logs`         | Tail Docker logs                    |

---

## Adding a Feature Module

Every feature follows the same pattern:

```
src/modules/<feature>/
├── <feature>.routes.ts      # Router (extends BaseRouter)
├── <feature>.controller.ts  # Request handlers
├── <feature>.service.ts     # Business logic (extends BaseService)
└── <feature>.schema.ts      # Zod schemas for validation
```

Then register it in [`src/router.ts`](src/router.ts):

```ts
import { UserRouter } from '@modules/user/user.routes';
// ...
this.router.use(`/api/${v}/users`, new UserRouter().registerRoutes());
```

---

## Adding a Background Job

1. Create `src/jobs/my-task.job.ts` extending `BaseJob<MyPayload>`
2. Register it in `QueueManager.start()`:

```ts
QueueManager.register(new MyTaskJob());
```

3. Enqueue from anywhere:

```ts
await new MyTaskJob().enqueue({ userId: '...', ... });
```

---

## Adding a Socket Event

1. Add the event signature to `ClientToServerEvents` or `ServerToClientEvents` in [`src/sockets/socket.types.ts`](src/sockets/socket.types.ts)
2. Handle it in [`src/sockets/socket.registry.ts`](src/sockets/socket.registry.ts)

---

## API Endpoints

| Method | Path             | Description                  |
| ------ | ---------------- | ---------------------------- |
| `GET`  | `/`              | Service info                 |
| `GET`  | `/health`        | Liveness probe               |
| `GET`  | `/api/v1/health` | Readiness check (DB + Redis) |

---

## Error Response Format

All errors return a consistent JSON envelope:

```json
{
  "success": false,
  "status": 422,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

---

## Path Aliases

Configured in `tsconfig.json` and supported at runtime via `tsconfig-paths`:

| Alias           | Resolves to        |
| --------------- | ------------------ |
| `@config/*`     | `src/config/*`     |
| `@lib/*`        | `src/lib/*`        |
| `@middleware/*` | `src/middleware/*` |
| `@modules/*`    | `src/modules/*`    |
| `@shared/*`     | `src/shared/*`     |
| `@utils/*`      | `src/utils/*`      |
| `@/*`           | `src/*`            |

---

## License

ISC
