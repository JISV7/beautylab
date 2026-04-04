# BeautyLab Backend Dockerfile
# Python 3.13 with uv for dependency management

FROM python:3.13-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    netcat-openbsd \
    libpango-1.0-0 \
    libharfbuzz0b \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*s

# Set work directory
WORKDIR /app

# Copy project files
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
RUN pip install --no-cache-dir uv && \
    uv pip install --system -e .

# Copy the rest of the application
COPY . .

# Set permissions for entrypoint
RUN chmod +x /app/entrypoint.sh

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run the application
ENTRYPOINT ["/app/entrypoint.sh"]
