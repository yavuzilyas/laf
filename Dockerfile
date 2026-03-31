# ============================================================================
# Multi-stage Dockerfile for SvelteKit with Node.js Adapter
# Optimized for production deployment with minimal image size
# ============================================================================

# ----------------------------------------------------------------------------
# Stage 1: Dependencies
# Install all dependencies (dev + production)
# ----------------------------------------------------------------------------
FROM node:22-alpine AS dependencies

# Enable corepack for pnpm support
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package manager files first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Install all dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile

# ----------------------------------------------------------------------------
# Stage 2: Builder
# Build the SvelteKit application
# ----------------------------------------------------------------------------
FROM node:22-alpine AS builder

# Enable corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Accept build arguments
ARG DATABASE_URL
ARG NODE_OPTIONS="--max-old-space-size=4096"

# Set environment variables for build
ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_OPTIONS=${NODE_OPTIONS}
ENV NODE_ENV=production

# Sync SvelteKit and build
RUN pnpm exec svelte-kit sync
RUN pnpm approve-builds --all || true
RUN pnpm build

# ----------------------------------------------------------------------------
# Stage 3: Production
# Minimal runtime image with only production dependencies
# ----------------------------------------------------------------------------
FROM node:22-alpine AS production

# Install security updates and dumb-init for proper signal handling
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S sveltekit -u 1001

WORKDIR /app

# Copy package files for production install
COPY package.json pnpm-lock.yaml ./

# Enable corepack and install only production dependencies
RUN corepack enable && \
    pnpm install --prod --frozen-lockfile && \
    pnpm store prune && \
    rm -rf /root/.local/share/pnpm/store/*

# Copy built application from builder stage
COPY --from=builder --chown=sveltekit:nodejs /app/build ./build

# Switch to non-root user for security
USER sveltekit

# Expose application port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "build"]