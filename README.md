# Digital Time Capsule Collective

A full-stack platform where users can submit messages, images, or videos that are sealed until a specific future date. Each submission gets encrypted and stored with a countdown timer visible to all. When time expires, content is revealed to the world.

## 🌟 Features

- **3D Interactive Gallery**: Explore time capsules in an immersive 3D environment with Three.js
- **Time-Locked Encryption**: Content is encrypted and automatically revealed on the specified date
- **Real-time Updates**: Live countdown timers and instant notifications when capsules are revealed
- **Rich Media Support**: Store text, images, videos, audio, and documents
- **User Authentication**: Secure JWT-based authentication system
- **Social Features**: Like, comment, and share time capsules
- **Responsive Design**: Beautiful UI that works on all devices

## 🏗️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Socket.io** for real-time features
- **Crypto** for encryption/decryption
- **Sharp** & **FFmpeg** for media processing

### Frontend
- **React** with TypeScript
- **Three.js** & **React Three Fiber** for 3D graphics
- **Framer Motion** for animations
- **Tailwind CSS** for styling
- **React Hook Form** for form handling
- **Axios** for API calls
- **Socket.io Client** for real-time updates

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Digital-time-capsule
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   
   # Copy and configure environment variables
   cp .env.example .env
   # Edit .env with your MongoDB connection string and JWT secret
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system or configure a cloud connection.

5. **Run the application**

   **Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   
   **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
Digital-time-capsule/
├── backend/
│   ├── src/
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Authentication & validation
│   │   ├── utils/           # Encryption & file handling
│   │   └── server.js        # Express server setup
│   ├── uploads/             # File storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── 3D/          # Three.js components
│   │   │   ├── Auth/        # Authentication components
│   │   │   └── Layout/      # Layout components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Backend Environment Variables (.env)
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/digital-time-capsule
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
ENCRYPTION_KEY=your-32-character-encryption-key-here
UPLOAD_MAX_SIZE=50000000
CORS_ORIGIN=http://localhost:3000
```

### Frontend Environment Variables (.env)
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

## 🎯 Core Features

### 1. Time Capsule Creation
- Rich text editor for messages
- File upload with drag & drop support
- Category selection and tagging
- Future date picker with validation
- Public/private visibility settings

### 2. 3D Gallery Experience
- Interactive 3D scene with floating capsules
- Particle effects and ambient lighting
- Smooth camera controls and navigation
- Real-time countdown animations
- Color-coded status indicators

### 3. Encryption & Security
- AES-256-GCM encryption for content
- Time-based automatic decryption
- Secure file storage with encryption
- JWT-based authentication
- Rate limiting and input validation

### 4. Real-time Features
- Live countdown timers
- Instant notifications for reveals
- Real-time like and comment updates
- WebSocket-based communication

## 🛡️ Security Features

- **Content Encryption**: All sensitive content is encrypted until reveal date
- **Secure Authentication**: JWT tokens with secure headers
- **File Validation**: Strict file type and size validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Sanitization**: All user inputs are validated and sanitized

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile phones
- Touch interactions for 3D scene navigation

## 🎨 UI/UX Features

- **Dark Theme**: Modern dark theme with glassmorphism effects
- **Smooth Animations**: Framer Motion powered animations
- **Loading States**: Beautiful loading animations and skeletons
- **Toast Notifications**: Real-time feedback for user actions
- **Accessibility**: ARIA labels and keyboard navigation support

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Time Capsules
- `GET /api/capsules` - Get all public capsules
- `POST /api/capsules` - Create new capsule
- `GET /api/capsules/:id` - Get specific capsule
- `POST /api/capsules/:id/like` - Like/unlike capsule
- `POST /api/capsules/:id/comments` - Add comment

### Users
- `GET /api/users/:username` - Get user profile
- `GET /api/users/leaderboard/top` - Get leaderboard

## 🎭 3D Scene Components

### Capsule Objects
- Dynamic positioning in 3D space
- Color-coded by category
- Floating animations
- Progress indicators
- Interactive hover effects

### Environment
- Particle field background
- Dynamic lighting
- Star field effects
- Ambient atmosphere

## 🚧 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production
```bash
# Build frontend
cd frontend
npm run build

# Backend is production-ready with PM2 or similar
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by physical time capsules and digital preservation
- Three.js community for 3D graphics inspiration
- React and Node.js communities for excellent documentation

---

**Built with ❤️ for preserving memories and connecting across time**