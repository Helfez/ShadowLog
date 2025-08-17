# Multi-stage build for ShadowLog Backend
FROM node:22-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies including tsc-alias for path resolution
RUN npm install
RUN npm install -g tsc-alias

# Copy source code and Prisma schema
COPY src ./src
COPY prisma ./prisma

# Generate Prisma client and build TypeScript with path resolution
RUN npx prisma generate
RUN npx --package=typescript tsc --skipLibCheck --noImplicitAny false --strictNullChecks false
RUN npx tsc-alias

# Production stage
FROM node:22-alpine AS production

# Install OpenSSL and dumb-init
RUN apk add --no-cache openssl dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy built application and Prisma files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
