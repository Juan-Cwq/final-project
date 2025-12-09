# Frontend Dockerfile for Aura Virtual Try-On Platform
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (skip TypeScript checking in Docker)
RUN npx vite build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Install serve to run the built app
RUN npm install -g serve

# Expose port
EXPOSE 3001

# Start the application
CMD ["serve", "-s", "dist", "-l", "3001"]
