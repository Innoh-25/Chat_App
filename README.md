# Real-Time Chat Application with Socket.io

A full-stack real-time chat application built with React, Node.js, Express, Socket.io, and MongoDB. Features real-time messaging, user authentication, multiple chat rooms, direct messaging, and message reactions.

## Tech Stack

### Frontend
- **React** - UI framework
- **Socket.io Client** - Real-time communication
- **Vite** - Build tool
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Passport.js** - Authentication middleware
- **bcryptjs** - Password hashing

## Features

### Core Features
- ✅ Real-time messaging with Socket.io
- ✅ User authentication (Local + Google OAuth)
- ✅ Multiple chat rooms (General, Random, Tech)
- ✅ Direct messaging between users
- ✅ Online user status and presence indicators
- ✅ Typing indicators
- ✅ Message reactions (emojis)
- ✅ Message deletion (right-click/long-press)

### User Experience
- ✅ Responsive design for all devices
- ✅ Real-time notifications
- ✅ Message history persistence
- ✅ User avatars and profiles
- ✅ Smooth animations and transitions

### Security
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Environment variable security

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Google OAuth credentials (for Google login)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/PLP-MERN-Stack-Development/real-time-communication-with-socket-io-Innoh-25.git
cd real-time-communication-with-socket-io-Innoh-25
```

2. **Setup Backend**
```bash
cd server
npm install
```

3. **Setup Frontend**
```bash
cd ../client
npm install
```

### Environment Configuration

1. **Create `server/.env`:**
```env
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-jwt-secret-key

# MongoDB
MONGODB_URI=mongodb://localhost:27017/chat-app

```

2. **Create `client/.env`:**
```env
VITE_SOCKET_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000/api
```

### Setup Google OAuth

1. Go to Google Cloud Console
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy credentials to `server/.env`

### Run the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Access the Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

## Project Structure

```
real-time-chat-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context providers
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── public/
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # Express routes
│   ├── middleware/         # Custom middleware
│   ├── server.js           # Main server file
│   └── package.json
└── README.md
```

## Usage Guide

### Authentication
- Register/Login with email and password
- Google OAuth for quick authentication
- Automatic session management

### Chat Features
- **Room Chat:** Join general, random, or tech rooms
- **Direct Messages:** Click on online users to start private chats
- **Typing Indicators:** See when others are typing
- **Message Reactions:** Click emoji reactions on messages
- **Message Deletion:** Right-click or long-press your messages to delete

### User Interface
- **Sidebar:** Switch between rooms and direct messages
- **Online Users:** See who's currently online
- **Responsive Design:** Works on desktop and mobile
- **Real-time Updates:** Instant message delivery

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Messages
- `GET /api/messages/direct/:userId` - Get direct messages
- `DELETE /api/messages/:messageId` - Delete message

### System
- `GET /api/health` - Health check
- `GET /api/online-users` - Get online users
- `GET /api/users` - Get all users

## Features in Detail

### Real-time Communication
- Bidirectional communication using Socket.io
- Instant message delivery without page refresh
- Live user presence and status updates
- Typing indicators in real-time

### User Management
- Secure authentication with JWT tokens
- Google OAuth integration
- User profiles with avatars
- Online/offline status

### Message System
- Persistent message storage in MongoDB
- Message reactions with emojis
- Message deletion for own messages
- File URL detection and formatting

### Room System
- Multiple chat rooms with separate histories
- Room switching with persisted messages
- User join/leave notifications

## Troubleshooting

### Common Issues

**Socket Connection Failed**
- Check if backend server is running on port 5000
- Verify CORS configuration

**MongoDB Connection Error**
- Ensure MongoDB is running locally
- Check `MONGODB_URI` in environment variables

**Google OAuth Not Working**
- Verify Google Cloud Console configuration
- Check redirect URIs match exactly

**Environment Variables Not Loading**
- Ensure `.env` files are in correct directories
- Restart server after changing environment variables

### Debug Mode
Enable debug logs by setting `NODE_ENV=development` in your environment variables.

## Performance Optimizations

- Message pagination for large chat histories
- Socket.io room management for efficient broadcasting
- MongoDB indexing for faster queries
- React memoization for better rendering performance

## Security Features

- JWT token-based authentication
- Password hashing with salt rounds
- Input validation and sanitization
- CORS configuration for controlled access
- Environment variable protection
- Message ownership verification

## 🚀 Deployment Guide

### Prerequisites
- MongoDB Atlas account
- Render account (for backend)
- Vercel account (for frontend)
- GitHub account