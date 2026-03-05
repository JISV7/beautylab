#!/bin/bash
set -e

# Wait for database to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL is up and running!"

# Run migrations
echo "Running database migrations..."
uv run alembic upgrade head

# Seed database
echo "Seeding database..."
uv run python -m app.seed

# Start FastAPI server
echo "Starting FastAPI server..."
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
