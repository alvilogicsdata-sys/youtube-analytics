# Build the Next.js frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend files
COPY nextjs-youtube-frontend/ ./

# Install dependencies
RUN npm ci

# Build the Next.js application
RUN npm run build

# Production image for frontend
FROM node:18-alpine AS frontend-runner

WORKDIR /app

# Install dumb-init for proper init process
RUN apk add --no-cache dumb-init

# Create nextjs user
RUN addgroup -g 1001 -S nextjs &&\
    adduser -S nextjs -u 1001

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built Next.js app
COPY --from=frontend-builder --chown=nextjs:nextjs /app/public ./public
COPY --from=frontend-builder --chown=nextjs:nextjs /app/.next/standalone ./ 
COPY --from=frontend-builder --chown=nextjs:nextjs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Define environment variables
ENV PORT=3000

# Start the application
CMD ["dumb-init", "node", "server.js"]