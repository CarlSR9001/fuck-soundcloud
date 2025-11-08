# Base stage - shared dependencies
FROM node:20.11.1-alpine AS base

WORKDIR /app

# Install essential build tools
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

# Development stage
FROM base AS development

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/v1/health || exit 1

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

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Start in production mode
CMD ["node", "dist/main.js"]
