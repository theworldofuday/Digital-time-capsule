#!/bin/bash

echo "🚀 Starting Digital Time Capsule Development Environment"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  Warning: MongoDB doesn't appear to be running."
    echo "   Please start MongoDB or configure a cloud connection in .env"
    echo ""
fi

# Check if backend .env exists
if [ ! -f "./backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Copying from .env.example..."
    cp ./backend/.env.example ./backend/.env
    echo "   Please edit backend/.env with your configuration."
    echo ""
fi

# Install backend dependencies if needed
if [ ! -d "./backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
    echo ""
fi

# Install frontend dependencies if needed
if [ ! -d "./frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    echo ""
fi

# Create uploads directory if it doesn't exist
mkdir -p ./backend/uploads

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend:  cd backend && npm run dev"
echo "2. Frontend: cd frontend && npm start"
echo ""
echo "Access the app at: http://localhost:3000"
echo "API will be available at: http://localhost:5000"