#!/bin/sh
set -e

# Run database migrations
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set. Skipping migrations."
else
  echo "Running database migrations..."
  npx prisma migrate deploy
fi

# Run seed if SEED_RUN is true
if [ "$SEED_RUN" = "true" ]; then
  echo "SEED_RUN is true. Seeding database..."
  node dist/prisma/seed.js
else
  echo "SEED_RUN is not true. Skipping database seed."
fi

# Execute the command passed to docker run
exec "$@"
