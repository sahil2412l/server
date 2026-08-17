# Production Dockerfile for Node.js Express Backend
FROM node:20-alpine AS base

# Create app directory
WORKDIR /app

# Install dependencies needed for native modules if any
RUN apk add --no-cache python3 make g++

# Copy package management files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Create required directories with permissions
RUN mkdir -p public/uploads logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose server port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
