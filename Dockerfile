# Multi-stage Dockerfile for frontend and backend
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files for both frontend and backend
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies for both
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci --only=production

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build frontend
RUN cd frontend && npm run build

# Expose ports
EXPOSE 3000 8081

# Create start script
RUN echo '#!/bin/sh\n\
cd backend && npm start &\n\
cd frontend && npm start &\n\
wait' > /app/start.sh && chmod +x /app/start.sh

# Start both services
CMD ["/app/start.sh"] 