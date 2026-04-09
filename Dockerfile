# ─── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# pnpm
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

# Copy manifests
COPY package.json pnpm-lock.yaml .npmrc ./

# Install all deps (including devDeps needed for build)
RUN pnpm install --frozen-lockfile

# ─── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build frontend (Vite → dist/frontend) and backend (tsc → dist/backend)
RUN pnpm build

# ─── Stage 3: production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

# Copy manifests for prod-only install
COPY package.json pnpm-lock.yaml .npmrc ./

# Install production deps only (rebuilds native modules for this exact arch)
RUN pnpm install --frozen-lockfile --prod

# Copy build artifacts
COPY --from=builder /app/dist ./dist

# Create non-root user and data directory
RUN apk add --no-cache su-exec \
 && addgroup -S appgroup \
 && adduser -S appuser -G appgroup \
 && mkdir -p /data \
 && chown -R appuser:appgroup /app /data

COPY docker-entrypoint.sh /usr/local/bin/
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
 && chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3939
ENV DATA_DIR=/data

EXPOSE 3939

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3939/api/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
