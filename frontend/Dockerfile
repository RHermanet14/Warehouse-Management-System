FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install ALL dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY frontend/ ./

# Copy shared folder for shared constants (from parent directory)
COPY shared ../shared

# Copy .env file for build-time environment variables
COPY frontend/.env .env

# Install TypeScript
RUN npx expo install typescript

# Expose port
EXPOSE 8081

# Start the frontend
CMD ["npm", "start"] 