FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY backend/ ./

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the backend
CMD ["npm", "start"] 