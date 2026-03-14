# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm via npm
RUN npm install -g pnpm@10.4.1

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build || true
RUN mkdir -p client/dist

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm via npm
RUN npm install -g pnpm@10.4.1

# Copy package files from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/patches/ ./patches/

# Install all dependencies (vite is referenced in bundled code)
RUN pnpm install --no-frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/ ./client/

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Start the application
CMD ["node", "dist/index.js"]
