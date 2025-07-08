# Warehouse Management System

A React Native frontend with Node.js backend for managing warehouse inventory.

## Quick Start with Docker

### Prerequisites
- Docker
- Docker Compose

### Run the entire application with one command:
```bash
docker-compose up --build
```

This will start:
- **Backend** on http://localhost:3000
- **Frontend** on http://localhost:8081
- **PostgreSQL** database on localhost:5432

### Stop the application:
```bash
docker-compose down
```

## Development Setup

You will need to create a .env file in the frontend folder with your computer's IP address:
BACKEND_URL=http://YOUR_COMPUTER_IP:3000

For the backend:
PGHOST=localhost
PGUSER="username"
PGPASSWORD="password"
PGDATABASE=database_name
PGPORT=5432

for the docker container, the host needs to be "postgres"

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Project Structure
```
├── backend/          # Node.js API server
├── frontend/         # React Native app
├── db.sql           # Database schema
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

## Features
- Barcode scanning for inventory items
- Create and search items
- Location tracking
- PostgreSQL database 