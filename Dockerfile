# =============================================================================
# UNIFIED Dockerfile — builds a single image that serves both React + FastAPI
# Primary deploy strategy: fly deploy (uses root fly.toml)
# =============================================================================

# --- Stage 1: Build React frontend -------------------------------------------
FROM node:22-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# --- Stage 2: Python runtime with static files baked in ----------------------
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy the full backend source (hatchling needs app/ present to install)
COPY backend/ ./backend/

# Install the package + all dependencies
RUN pip install --no-cache-dir ./backend

# Copy built React app into location FastAPI expects
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

WORKDIR /app/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
