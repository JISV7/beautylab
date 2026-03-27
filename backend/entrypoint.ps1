$ErrorActionPreference = "Stop"

# Wait for database to be ready
Write-Host "Waiting for PostgreSQL to be ready..."
while (-not (Test-NetConnection -ComputerName db -Port 5432 -WarningAction SilentlyContinue).TcpTestSucceeded) {
    Start-Sleep -Seconds 1
}
Write-Host "PostgreSQL is up and running!"

# Run migrations
Write-Host "Running database migrations..."
uv run alembic upgrade head

# Seed database
Write-Host "Seeding database..."
uv run python -m app.seed

# Start FastAPI server
Write-Host "Starting FastAPI server..."
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
