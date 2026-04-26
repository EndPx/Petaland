# ─── Petaland game server — production Dockerfile ───────────────────────────
# Multi-stage build keeps the final image small (~150MB vs ~1GB)

# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy manifests first — separate layer for cache
COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine AS runtime
WORKDIR /app

# Production deps only (no devDependencies = smaller image)
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Non-root user (security best practice)
RUN addgroup -g 1001 -S petaland && adduser -S petaland -u 1001
USER petaland

# Expose Colyseus port
EXPOSE 2567

# Healthcheck — Colyseus exposes /matchmake when healthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:2567/matchmake/joinOrCreate/game || exit 1

ENV NODE_ENV=production
ENV PORT=2567

CMD ["node", "dist/index.js"]
