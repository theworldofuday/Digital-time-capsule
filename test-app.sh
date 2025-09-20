#!/bin/bash

echo "🧪 Testing Digital Time Capsule Application"
echo "=========================================="
echo ""

# Test if backend is running
echo "Testing backend health..."
if curl -f http://localhost:5000/api/health &> /dev/null; then
    echo "✅ Backend is running on http://localhost:5000"
else
    echo "❌ Backend is not responding on http://localhost:5000"
    echo "   Make sure to run 'cd backend && npm run dev' first"
fi

echo ""

# Test if frontend is running
echo "Testing frontend..."
if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ Frontend is running on http://localhost:3000"
else
    echo "❌ Frontend is not responding on http://localhost:3000"
    echo "   Make sure to run 'cd frontend && npm start' first"
fi

echo ""

# Test database connection
echo "Testing database connection..."
if curl -f http://localhost:5000/api/auth/test &> /dev/null; then
    echo "✅ Database connection is working"
else
    echo "⚠️  Database connection test failed"
    echo "   Check MongoDB connection and backend logs"
fi

echo ""
echo "🎯 Application Status Summary:"
echo "- Backend API: http://localhost:5000"
echo "- Frontend UI: http://localhost:3000"
echo "- MongoDB: Check logs if connection issues"
echo ""
echo "📚 Available API endpoints:"
echo "- GET  /api/health - Health check"
echo "- POST /api/auth/register - User registration"
echo "- POST /api/auth/login - User login"
echo "- GET  /api/capsules - Get public capsules"
echo "- POST /api/capsules - Create new capsule"
echo ""
echo "For detailed API documentation, see the README.md file."