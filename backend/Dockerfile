# Build context is the repo root (see docker-compose.yml) so this can reach
# both frontend/ and backend/.

# --- Stage 1: static-export the Next.js frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
COPY templates /templates
RUN npm run build

# --- Stage 2: backend runtime, serving the exported frontend ---
FROM python:3.12-slim AS backend
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app

COPY backend/pyproject.toml ./
RUN uv sync --no-dev

COPY backend/app ./app
COPY --from=frontend-builder /frontend/out ./static

ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
