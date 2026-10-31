# ==============================================================================
# InfraPulse AI — Production AI Computer Vision Service Dockerfile
# ==============================================================================

FROM python:3.11-slim

WORKDIR /app

# Install system runtime dependencies for OpenCV and image operations
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root application user
RUN groupadd -r infrapulse && useradd -r -g infrapulse -d /app -s /sbin/nologin infrapulse

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and ensure non-root ownership
COPY . .
RUN mkdir -p /app/models /app/uploads && \
    chown -R infrapulse:infrapulse /app

USER infrapulse

EXPOSE 8000

ENV ENVIRONMENT=production
ENV PYTHONUNBUFFERED=1

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Production ASGI server with 2 worker processes
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--no-access-log"]
