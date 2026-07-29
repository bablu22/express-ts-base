<div align="center">
  <img src="https://i.ibb.co.com/Tqq4vR78/4321db6e-b86d-4b67-bf20-cf4f4a546e8d.png" alt="create-express-ts-base banner" width="100%" />
</div>

# create-express-ts-base 🚀

> An interactive CLI generator & production-ready backend starter kit featuring **Express 5**, **TypeScript**, **Prisma 7**, **PostgreSQL**, **Redis**, **Socket.io**, and **BullMQ**.

[![npm version](https://img.shields.io/npm/v/create-express-ts-base.svg)](https://www.npmjs.com/package/create-express-ts-base)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

---

## ⚡ Quick Start

Create a new project instantly with a single command:

```bash
# Using pnpm (Recommended)
pnpm create express-ts-base

# Using npm
npm create express-ts-base

# Using npx directly
npx create-express-ts-base
```

Follow the interactive terminal prompts:

- 📛 **Project name** (e.g. `my-awesome-api`)
- 📦 **Package manager selection** (`pnpm`, `npm`, `yarn`)
- 🐙 **Git initialization** (automates `git init`)
- 📥 **Automatic dependency installation**
- 💻 **Open in VS Code** (if `code` CLI is available)

---

## 🧰 Tech Stack & Architecture

| Component                | Technology                 | Description                                                                |
| :----------------------- | :------------------------- | :------------------------------------------------------------------------- |
| **Runtime**              | Node.js 20+                | Modern ESM & CommonJS Node runtime                                         |
| **Language**             | TypeScript 5+              | Strict type checking with clean path aliases                               |
| **HTTP Framework**       | Express 5                  | Next-generation Express with async error propagation                       |
| **Database & ORM**       | Prisma 7 + PostgreSQL 16   | JS Driver Adapter (`@prisma/adapter-pg`) with `pg.Pool` connection pooling |
| **Caching & In-Memory**  | Redis 7 (`ioredis`)        | High-performance caching & rate limiter store                              |
| **Real-time WebSockets** | Socket.io 4                | Multi-node real-time sync via `@socket.io/redis-adapter`                   |
| **Task Queue**           | BullMQ 5                   | Asynchronous background jobs with worker lifecycle management              |
| **Request Logging**      | Pino + `pino-http`         | Ultra-fast structured JSON logging with custom serializers                 |
| **Validation**           | Zod                        | Strictly typed request body/params/query validation                        |
| **Authentication**       | JWT + Bcrypt               | Secure password hashing & bearer token authentication                      |
| **Transactional Email**  | Nodemailer + EJS/MJML      | Responsive HTML email templates with queue processing                      |
| **Testing**              | Vitest 3+                  | Fast unit & integration testing with v8 coverage                           |
| **CLI Engine**           | `@clack/prompts` + `chalk` | Interactive, beautiful CLI scaffolding experience                          |

---

## 📁 Project Directory Structure

```
├── cli/                        # Interactive CLI generator source
│   └── index.ts                # Clack-based CLI entry point
├── prisma/
│   ├── schema/                 # Prisma 7 multi-file schema directory
│   │   ├── base.prisma         # Generator & datasource configuration
│   │   └── user.prisma         # User model definition
│   └── seed.ts                 # Database seed script
├── src/
│   ├── config/
│   │   └── env.ts              # Zod-validated environment config
│   ├── jobs/                   # BullMQ background job definitions
│   │   ├── base.job.ts         # Abstract job class with QueueManager integration
│   │   ├── queue-manager.ts    # Queue registry, worker startup & graceful teardown
│   │   ├── email.job.ts        # Async transactional email job
│   │   └── sample.job.ts       # Sample job template
│   ├── lib/                    # Shared core infrastructure
│   │   ├── email.service.ts    # Nodemailer email transport service
│   │   ├── logger.ts           # Pino logger singleton
│   │   ├── prisma.ts           # Singleton Prisma Client with pg.Pool adapter
│   │   ├── redis.ts            # Singleton Redis connection manager & event tracking
│   │   └── validate.ts         # Zod validation middlewares (body, params, query)
│   ├── middleware/
│   │   ├── auth.middleware.ts  # JWT bearer authentication middleware
│   │   └── error-handler.ts   # Express 5 global error handler & 404 handler
│   ├── modules/                # Feature-based API modules
│   │   ├── auth/               # Auth routes, controllers, services, schemas, OTP logic
│   │   ├── user/               # User repository interface, Prisma repo, service
│   │   ├── health/             # GET /api/v1/health readiness probe (DB + Redis)
│   │   └── public/            # System liveness probes (/)
│   ├── shared/                 # Base classes & utilities
│   │   ├── base.router.ts      # Express Router wrapper with async handler support
│   │   └── base.service.ts     # Abstract service helper
│   ├── sockets/                # Socket.io real-time server
│   │   ├── socket.server.ts    # Socket.io initialization with Redis adapter
│   │   ├── socket.registry.ts  # Event listener registration
│   │   └── socket.types.ts     # Strongly typed client/server socket events
│   ├── app.ts                  # Express Application configuration & middleware pipeline
│   ├── index.ts                # HTTP server bootstrap & graceful signal handling
│   └── router.ts               # Versioned API Router (/api/v1)
├── __tests__/                  # Unit & Integration test suite
│   ├── setup.ts                # Global Vitest environment setup & mocks
│   └── unit/                   # Unit test files (*.test.ts)
└── docker-compose.yml          # Local PostgreSQL & Redis infrastructure
```

---

## 🛠️ Development & Deployment Workflow

### 1. Initial Setup

```bash
# Copy sample environment configuration
cp .env.example .env

# Spin up local PostgreSQL & Redis containers
pnpm docker:up

# Run Prisma migrations & seed database
pnpm prisma:migrate
pnpm prisma:seed
```

### 2. Start Development Server

```bash
pnpm dev
```

The server will start at `http://localhost:3000`.

### 3. Run Unit Tests & Linting

```bash
# Type check without emitting files
pnpm type-check

# Run ESLint check
pnpm lint

# Run Vitest test suite
pnpm test

# Run tests with code coverage report
pnpm test:coverage
```

### 4. Build for Production

```bash
# Compile TypeScript to dist/
pnpm build

# Start production server
pnpm start:prod
```

---

## 📋 Available NPM Scripts

| Command                | Action                                                 |
| :--------------------- | :----------------------------------------------------- |
| `pnpm dev`             | Launch dev server with hot reload via `tsx watch`      |
| `pnpm build`           | Compile TypeScript source code to `dist/`              |
| `pnpm start`           | Execute production build from `dist/index.js`          |
| `pnpm type-check`      | Perform strict TypeScript type verification            |
| `pnpm lint`            | Lint codebase with ESLint                              |
| `pnpm lint:fix`        | Automatically fix ESLint formatting & rule errors      |
| `pnpm test`            | Run Vitest unit & integration tests                    |
| `pnpm test:coverage`   | Generate Vitest code coverage report                   |
| `pnpm prisma:migrate`  | Run Prisma database migrations in development          |
| `pnpm prisma:generate` | Generate Prisma Client types                           |
| `pnpm prisma:seed`     | Seed database with initial data                        |
| `pnpm docker:up`       | Start PostgreSQL & Redis services via Docker Compose   |
| `pnpm docker:down`     | Stop local Docker containers                           |
| `pnpm cli:build`       | Bundle CLI generator using `tsup` for NPM distribution |

---

## 📡 API Endpoints Overview

### Public & Health Probes

- `GET /` — Service metadata probe
- `GET /health` — Simple liveness check
- `GET /api/v1/health` — Detailed database & Redis connection health check

### Authentication Module (`/api/v1/auth`)

- `POST /api/v1/auth/register` — Register a new user account (sends email OTP)
- `POST /api/v1/auth/verify-otp` — Verify email address with 6-digit OTP
- `POST /api/v1/auth/login` — Authenticate user and issue JWT bearer token
- `POST /api/v1/auth/resend-otp` — Request a fresh OTP code

### User Management (`/api/v1/users`)

- `GET /api/v1/users/me` — Retrieve current authenticated user profile (Requires `Authorization: Bearer <token>`)

---

## 🔒 Security Features Implemented

1. **Helmet & Security Headers**: Protection against cross-site scripting (XSS), clickjacking, and MIME-sniffing.
2. **CORS & HPP**: Configurable cross-origin policies and HTTP Parameter Pollution protection.
3. **Redis Rate Limiting**: Distributed rate limiting using `express-rate-limit` backed by Redis store, correctly placed behind `trust proxy`.
4. **Input Sanitization & Schema Validation**: Strict input validation using Zod schemas for request body, URL parameters, and query strings.
5. **Graceful Shutdown**: Intercepts `SIGINT`, `SIGTERM`, and unhandled rejections to cleanly terminate HTTP listeners, Socket.io, BullMQ workers, Redis connections, and PostgreSQL pools.

---

## 📦 Publishing CLI to NPM Registry

Maintainers publishing updates to the `create-express-ts-base` package:

```bash
# 1. Build CLI bundle & template files
pnpm run cli:build

# 2. Test CLI locally
npx . my-test-app

# 3. Publish to NPM
npm publish --access public
```

---

## 📄 License

This project is licensed under the **ISC License**.
