# Deployment Guide

This guide covers deploying the Digital Time Capsule application to various platforms.

## 🔧 Prerequisites

- Node.js v18 or higher
- MongoDB database (local or cloud)
- Git repository hosting (GitHub, GitLab, etc.)

## 🌩️ Cloud Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend (Vercel)
1. Build the React app:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy to Vercel:
   ```bash
   npm install -g vercel
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `REACT_APP_API_URL`: Your backend API URL

#### Backend (Railway)
1. Create `railway.json` in backend directory:
   ```json
   {
     "deploy": {
       "startCommand": "npm start",
       "healthcheckPath": "/api/health"
     }
   }
   ```

2. Deploy with Railway CLI:
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   railway up
   ```

3. Set environment variables in Railway dashboard

### Option 2: Heroku

#### Backend
1. Create `Procfile` in backend directory:
   ```
   web: node src/server.js
   ```

2. Deploy:
   ```bash
   heroku create your-app-name-backend
   heroku addons:create mongolab:sandbox
   git subtree push --prefix backend heroku main
   ```

#### Frontend
1. Build and deploy:
   ```bash
   heroku create your-app-name-frontend
   heroku buildpacks:set mars/create-react-app
   git subtree push --prefix frontend heroku main
   ```

### Option 3: DigitalOcean App Platform

1. Create `app.yaml`:
   ```yaml
   name: digital-time-capsule
   services:
   - name: backend
     source_dir: /backend
     github:
       repo: your-username/digital-time-capsule
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
   - name: frontend
     source_dir: /frontend
     github:
       repo: your-username/digital-time-capsule
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
   databases:
   - name: mongodb
     engine: MONGODB
     version: "5"
   ```

## 🐳 Docker Deployment

### Backend Dockerfile
Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Frontend Dockerfile
Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:5
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  backend:
    build: ./backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:password@mongodb:27017/digital-time-capsule?authSource=admin
      JWT_SECRET: your-production-jwt-secret
      ENCRYPTION_KEY: your-production-encryption-key
    depends_on:
      - mongodb
    volumes:
      - uploads_data:/app/uploads

  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - "80:80"
    environment:
      REACT_APP_API_URL: http://your-backend-domain:5000/api
    depends_on:
      - backend

volumes:
  mongodb_data:
  uploads_data:
```

## 🔒 Security Configuration

### Production Environment Variables

#### Backend (.env)
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/digital-time-capsule
JWT_SECRET=super-long-random-production-secret-key
JWT_EXPIRE=7d
ENCRYPTION_KEY=32-character-production-encryption-key
UPLOAD_MAX_SIZE=50000000
CORS_ORIGIN=https://your-frontend-domain.com
SOCKET_CORS_ORIGIN=https://your-frontend-domain.com
```

#### Frontend (.env.production)
```bash
REACT_APP_API_URL=https://your-backend-domain.com/api
```

### SSL/HTTPS Setup

1. **Cloudflare** (Recommended):
   - Add your domain to Cloudflare
   - Enable "Always Use HTTPS"
   - Set SSL/TLS to "Full (strict)"

2. **Let's Encrypt with Nginx**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

3. **Load Balancer SSL**:
   Most cloud providers offer SSL termination at the load balancer level.

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster
3. Set up database user and whitelist IPs
4. Copy connection string to `MONGODB_URI`

### Self-Hosted MongoDB
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo
use digital-time-capsule
db.createUser({
  user: "capsule_user",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

## 📊 Monitoring and Analytics

### Health Check Endpoint
The backend includes a health check at `/api/health`:
```javascript
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Application Monitoring
- **Frontend**: Vercel Analytics, Google Analytics
- **Backend**: New Relic, DataDog, or Sentry
- **Database**: MongoDB Atlas monitoring

### Log Management
```javascript
// Add to backend for production logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🚀 Performance Optimization

### Frontend Optimizations
1. **Code Splitting**:
   ```javascript
   const CapsuleDetail = lazy(() => import('./pages/CapsuleDetail'));
   ```

2. **Image Optimization**:
   - Use WebP format when possible
   - Implement lazy loading
   - Compress images with Sharp

3. **CDN Integration**:
   - Serve static assets from CDN
   - Enable Cloudflare or AWS CloudFront

### Backend Optimizations
1. **Database Indexing**:
   ```javascript
   // Add to your models
   capsuleSchema.index({ revealDate: 1, isRevealed: 1 });
   userSchema.index({ username: 1 }, { unique: true });
   ```

2. **Caching**:
   ```javascript
   const redis = require('redis');
   const client = redis.createClient();
   
   // Cache frequently accessed data
   app.get('/api/capsules', async (req, res) => {
     const cached = await client.get('public_capsules');
     if (cached) return res.json(JSON.parse(cached));
     
     const capsules = await Capsule.find({ visibility: 'public' });
     await client.setex('public_capsules', 300, JSON.stringify(capsules));
     res.json(capsules);
   });
   ```

## 🔄 CI/CD Pipeline

### GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Test Backend
      run: |
        cd backend
        npm ci
        npm test
    
    - name: Test Frontend
      run: |
        cd frontend
        npm ci
        npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to Production
      run: |
        # Your deployment commands here
```

## 📱 Mobile App Deployment

### React Native Setup
```bash
npm install -g @react-native-community/cli
npx react-native init DigitalTimeCapsuleMobile
```

### Expo Alternative
```bash
npm install -g @expo/cli
npx create-expo-app DigitalTimeCapsuleMobile
```

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Verify `CORS_ORIGIN` in backend .env
   - Check frontend API URL configuration

2. **Database Connection**:
   - Verify MongoDB URI format
   - Check network connectivity and firewall rules

3. **File Upload Issues**:
   - Ensure uploads directory exists and is writable
   - Check file size limits

4. **Environment Variables**:
   - Verify all required variables are set
   - Check for typos in variable names

### Debug Commands
```bash
# Check backend health
curl https://your-backend-domain.com/api/health

# View backend logs
heroku logs --tail --app your-backend-app

# Test database connection
mongo "your-mongodb-connection-string"
```

---

**Need help with deployment? Create an issue in the repository or consult the platform-specific documentation.**