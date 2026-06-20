# ---- Sigil — Production Dockerfile ----
# Multi-stage build: dependencies first, then slim runtime image

# ---- Stage 1: build deps (includes build tools for native modules like canvas, better-sqlite3) ----
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# System deps for canvas + better-sqlite3 native compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

# ---- Stage 2: runtime image ----
FROM node:20-bullseye-slim AS runtime

WORKDIR /app

# Runtime libs for canvas rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Copy built node_modules and source
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Ensure data + logs dirs exist
RUN mkdir -p data logs

# Non-root user for security
RUN groupadd -r sigil && useradd -r -g sigil sigil \
    && chown -R sigil:sigil /app
USER sigil

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3420) + '/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

EXPOSE 3420

CMD ["node", "src/index.js"]
