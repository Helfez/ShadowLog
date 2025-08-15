# Multi-stage build for production optimization with pnpm workspace support
FROM node:22-alpine AS builder

# Install pnpm and OpenSSL
RUN npm install -g pnpm
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /src

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package*.json ./

# Copy backend package files
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/

# Install dependencies using pnpm workspace
RUN pnpm install

# Copy backend source code
COPY backend/src ./backend/src
COPY backend/prisma ./backend/prisma

# Generate Prisma client in backend workspace
RUN pnpm --filter shadowlog-backend exec prisma generate

# Build the backend application (skip postbuild in Docker)
RUN pnpm --filter shadowlog-backend run tsc

# Production stage
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from backend workspace
COPY --from=builder --chown=nodejs:nodejs /src/backend/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /src/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /src/backend/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /src/backend/prisma ./prisma

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
