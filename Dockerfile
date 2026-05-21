# Dockerfile for Production Deployment to Google Cloud Run
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy the source code
COPY . .

# Compile both frontend assets and check backend typescript
RUN npm run build

# Expose port (Cloud Run automatically sets the PORT env variable and maps it, but EXPOSE documents the default)
EXPOSE 3001

# Run in production mode
ENV NODE_ENV=production

# Start the unified Express and WebSocket server
CMD ["npm", "run", "server:start"]
