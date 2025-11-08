# Base stage - shared dependencies
FROM node:20.11.1-alpine AS base

WORKDIR /app

# Install FFmpeg, audiowaveform, and essential build tools
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    libmad \
    libid3tag \
    libsndfile \
    gd \
    boost-program_options \
    boost-filesystem \
    boost-system \
    curl \
    git

# Build audiowaveform from source (not in alpine repos)
RUN apk add --no-cache --virtual .build-deps \
    cmake \
    boost-dev \
    gd-dev \
    libmad-dev \
    libid3tag-dev \
    libsndfile-dev && \
    cd /tmp && \
    git clone https://github.com/bbc/audiowaveform.git && \
    cd audiowaveform && \
    git checkout 1.10.1 && \
    mkdir build && cd build && \
    cmake -D ENABLE_TESTS=0 -D CMAKE_BUILD_TYPE=Release .. && \
    make && make install && \
    cd / && rm -rf /tmp/audiowaveform && \
    apk del .build-deps

# Development stage
FROM base AS development

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Create temp directory for processing
RUN mkdir -p /tmp/worker && chmod 777 /tmp/worker

# Health check (simple process check)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD pgrep -f "node" || exit 1

# Start in development mode
CMD ["npm", "run", "start:dev"]

# Builder stage - compile TypeScript
FROM base AS builder

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20.11.1-alpine AS production

WORKDIR /app

# Install production runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    libmad \
    libid3tag \
    libsndfile \
    gd \
    boost-program_options \
    boost-filesystem \
    boost-system

# Copy audiowaveform binary from base
COPY --from=base /usr/local/bin/audiowaveform /usr/local/bin/audiowaveform

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S worker -u 1001

# Create temp directory for processing
RUN mkdir -p /tmp/worker && chown worker:nodejs /tmp/worker

# Change ownership
RUN chown -R worker:nodejs /app

# Switch to non-root user
USER worker

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD pgrep -f "node" || exit 1

# Start in production mode
CMD ["node", "dist/main.js"]
