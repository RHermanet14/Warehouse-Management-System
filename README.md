# Warehouse Management System

A modern, full-stack warehouse management solution built with React Native (Expo) for mobile, React for desktop web, and Node.js backend. This system provides comprehensive inventory tracking, order management, and employee oversight capabilities with barcode scanning functionality.

## 🚀 Features

### Core Functionality
- **Barcode Scanning**: Real-time inventory item identification using device camera
- **Inventory Management**: Create, search, and track items with detailed location mapping
- **Order Processing**: Complete order lifecycle management (pending → in progress → completed)
- **Employee Management**: User authentication and employee account administration
- **Location Tracking**: Multi-area warehouse organization (Bedroom, Kitchen, Garage, Basement, etc.)
- **Real-time Updates**: Live inventory quantity tracking and status updates

### Technical Features
- **Cross-platform Mobile App**: React Native with Expo for iOS and Android
- **Desktop Web Application**: React with Vite for web-based management interface
- **RESTful API**: Node.js backend with Express and TypeScript
- **Database**: PostgreSQL with comprehensive schema for inventory, orders, and employees
- **Docker Support**: Complete containerization for easy deployment
- **Type Safety**: Full TypeScript implementation across frontend and backend

### User Interface
- **Intuitive Dashboard**: Clean, modern interface for warehouse operations
- **Responsive Design**: Optimized for mobile devices and tablets
- **Authentication System**: Secure login with role-based access
- **Search & Filter**: Advanced item and order search capabilities

## 🛠️ Technology Stack

- **Mobile Frontend**: React Native, Expo, TypeScript
- **Desktop Frontend**: React, Vite, TypeScript, RSuite UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Containerization**: Docker, Docker Compose
- **Key Libraries**: Expo Barcode Scanner, Axios, React Navigation, React Router DOM

## 📋 Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (for development setup)
- **Docker** and **Docker Compose** (for containerized setup)
- **Expo CLI** (for mobile development)

## 🚀 Quick Start with Docker

The fastest way to get the application running is using Docker Compose.

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd warehouse-management-system
```

### 2. Run with Docker Compose
```bash
docker-compose up --build
```

This single command will start all services:
- **Backend API** on http://localhost:3000
- **Frontend** on http://localhost:8081
- **PostgreSQL Database** on localhost:5432

### 3. Access the Application
- **Desktop Web App**: Open your browser to http://localhost:8081 for the web interface
- **Mobile App**: Use Expo Go app on your mobile device to scan the QR code

### 4. Stop the Application
```bash
docker-compose down
```

## 💻 Development Setup

For developers who want to run the application locally for development and debugging.

### 1. Database Setup

First, set up your PostgreSQL database:

```bash
# Create database
createdb warehouse_management

# Import schema
psql warehouse_management < db.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit the `.env` file with your database credentials:
```env
PGHOST=localhost
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=warehouse_management
PGPORT=5432
```

```bash
# Start development server
npm run dev
```

The backend will be available at http://localhost:3000

### 3. Mobile Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit the `.env` file with your backend URL:
```env
BACKEND_URL=http://YOUR_COMPUTER_IP:3000
```

**Important**: Replace `YOUR_COMPUTER_IP` with your actual computer's IP address for mobile device connectivity.

```bash
# Start Expo development server
npm start
```

### 4. Desktop Frontend Setup

```bash
cd desktop-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The desktop web application will be available at http://localhost:5173

### 5. Mobile Development

For mobile development, you'll need the Expo Go app:

1. Install **Expo Go** from App Store (iOS) or Google Play Store (Android)
2. Scan the QR code displayed in your terminal
3. The app will load on your device

## 📁 Project Structure

```
warehouse-management-system/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API endpoints (items, orders, employees)
│   │   └── index.ts        # Server entry point
│   ├── package.json
│   └── Dockerfile
├── frontend/               # React Native mobile app
│   ├── app/               # Expo Router pages
│   │   ├── (auth)/        # Authentication screens
│   │   ├── (dashboard)/   # Main app screens
│   │   └── index.tsx      # Entry point
│   ├── components/        # Reusable UI components
│   ├── constants/         # App constants and styles
│   ├── package.json
│   └── Dockerfile
├── desktop-frontend/      # React web application
│   ├── src/
│   │   ├── pages/         # Web pages (Home, Dashboard)
│   │   │   ├── dashboard/ # Dashboard components
│   │   │   └── Home.tsx   # Home page
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── vite.config.ts     # Vite configuration
├── shared/               # Shared types and constants
├── db.sql               # Database schema
├── docker-compose.yml   # Docker orchestration
└── README.md
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
PGHOST=localhost          # Use "postgres" for Docker
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=warehouse_management
PGPORT=5432
```

**Mobile Frontend (.env)**
```env
BACKEND_URL=http://YOUR_COMPUTER_IP:3000
```

**Desktop Frontend**: No environment file needed - uses the same backend URL

### Database Configuration

The system uses PostgreSQL with the following key tables:
- `account` - User authentication
- `employee` - Employee information
- `item` - Inventory items with barcode tracking
- `orders` - Order management
- `order_items` - Order-item relationships
- `area` - Warehouse location areas

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Include your environment details and error messages

---

**Built with ❤️ using React Native, Node.js, and PostgreSQL** 