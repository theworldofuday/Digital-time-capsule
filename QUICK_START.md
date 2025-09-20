# Quick Start Guide

Get the Digital Time Capsule platform running in under 5 minutes!

## 🚀 One-Command Setup

```bash
./setup.sh
```

This script will:
- Check prerequisites
- Install all dependencies
- Create necessary directories
- Copy environment configuration

## 📋 Manual Setup (Alternative)

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure Environment

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
```

**Frontend:**
The frontend .env is already configured for local development.

### 3. Start Services

**Start MongoDB** (if using local):
```bash
# macOS with Homebrew
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:5
```

**Start Backend** (Terminal 1):
```bash
cd backend
npm run dev
```

**Start Frontend** (Terminal 2):
```bash
cd frontend
npm start
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 🧪 Test the Setup

```bash
./test-app.sh
```

## 🔑 Default Configuration

The application comes preconfigured with:
- MongoDB on localhost:27017
- Backend on port 5000
- Frontend on port 3000
- File uploads enabled
- Real-time features enabled

## 📚 Next Steps

1. **Create an Account**: Visit http://localhost:3000 and register
2. **Create a Time Capsule**: Add your first message or file
3. **Explore 3D Gallery**: Navigate the interactive 3D space
4. **Customize**: Modify the code to fit your needs

## 🆘 Troubleshooting

### Common Issues

**MongoDB not connecting:**
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB service
sudo systemctl start mongod
```

**Port already in use:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Find and kill process using port 5000  
lsof -ti:5000 | xargs kill -9
```

**Dependencies not installing:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

## 🔧 Environment Variables

### Backend (.env)
```bash
# Required
MONGODB_URI=mongodb://localhost:27017/digital-time-capsule
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-32-char-key

# Optional (have defaults)
PORT=5000
NODE_ENV=development
JWT_EXPIRE=7d
UPLOAD_MAX_SIZE=50000000
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

## 📖 Additional Resources

- [Full README](./README.md) - Comprehensive documentation
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [API Documentation](./README.md#api-endpoints) - Backend API reference

---

**Happy time capsule creating! 🎉**