# =========================================================
# Stage 1: Build & Compile
# =========================================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm@10.33.2

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (incl. devDependencies) for compilation
RUN pnpm install --frozen-lockfile

# Copy source & config files
COPY tsconfig.json tsconfig.build.json tsconfig.prod.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma Client
RUN pnpm run prisma:generate

# Compile TypeScript → JavaScript
RUN pnpm run build

# Bundle the seed script as a standalone JS file
RUN pnpm dlx esbuild prisma/seed.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --outfile=dist/prisma/seed.js \
  --external:@prisma/client

# Prune dev dependencies for a minimal production image
RUN pnpm prune --prod --ignore-scripts

# =========================================================
# Stage 2: Production Runner
# =========================================================
FROM node:20-alpine AS runner

ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy built output and pruned node_modules from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/tsconfig.prod.json ./tsconfig.json
COPY --from=builder /usr/src/app/prisma.config.ts ./prisma.config.ts

# Prisma schema & migrations are needed for migrate deploy at startup
COPY --from=builder /usr/src/app/prisma ./prisma

# Copy startup script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "-r", "tsconfig-paths/register", "dist/index.js"]
