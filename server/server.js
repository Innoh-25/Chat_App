import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from './config/auth.js';

// Import routes and middleware
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';

// Import models
import User from './models/User.js';
import Message from './models/Message.js';
import Room from './models/Room.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin:'*',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (token) {
      const jwt = (await import('jsonwebtoken')).default;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        socket.userId = user._id;
        socket.username = user.username;
        socket.avatar = user.avatar;
        return next();
      }
    }
    next(new Error('Authentication error'));
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Store online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.username} (${socket.id})`);

  // Add user to online users immediately after authentication
  const userInfo = {
    id: socket.userId.toString(),
    username: socket.username,
    avatar: socket.avatar,
    socketId: socket.id,
    lastSeen: new Date()
  };
  
  onlineUsers.set(socket.userId.toString(), userInfo);
  
  console.log(`✅ User online: ${socket.username} (${socket.userId})`);
  console.log(`👥 Total online users: ${onlineUsers.size}`);

  // Update user online status in database
  User.findByIdAndUpdate(socket.userId, {
    isOnline: true,
    lastSeen: new Date()
  }).exec();

  // Send online users list to all clients
  broadcastOnlineUsers();

  // Handle user identification (for redundancy)
  socket.on('user_identified', (userData) => {
    console.log(`User identified: ${userData.username}`);
  });

  // Handle joining a room
  socket.on('join_room', async (roomName) => {
    try {
      // Leave previous rooms
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      // Join new room
      socket.join(roomName);
      socket.currentRoom = roomName;

      // Get room messages
      const messages = await Message.find({ room: roomName })
        .populate('sender', 'username avatar')
        .sort({ createdAt: 1 })
        .limit(100)
        .exec();

      // Send room messages to the user
      socket.emit('room_messages', {
        room: roomName,
        messages
      });

      // Notify room that user joined
      socket.to(roomName).emit('user_joined', {
        username: socket.username,
        room: roomName,
        timestamp: new Date().toISOString()
      });

      console.log(`${socket.username} joined room: ${roomName}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  // Handle sending messages
  socket.on('send_message', async (messageData) => {
    try {
      const { content, room } = messageData;

      // Create message in database
      const message = await Message.create({
        content,
        sender: socket.userId,
        room: room || socket.currentRoom,
        type: 'message'
      });

      await message.populate('sender', 'username avatar');

      // Broadcast to room
      io.to(room || socket.currentRoom).emit('receive_message', message);

      console.log(`Message from ${socket.username} in ${room || socket.currentRoom}: ${content}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle direct message
  socket.on('direct_message', async (data) => {
    try {
      const { toUserId, content } = data;
      
      // Create message in database
      const message = await Message.create({
        content,
        sender: socket.userId,
        receiver: toUserId,
        type: 'direct'
      });

      await message.populate('sender', 'username avatar');
      await message.populate('receiver', 'username avatar');

      // Find the recipient's socket
      const recipientInfo = onlineUsers.get(toUserId);
      
      // Send to sender
      socket.emit('direct_message', message);

      // Send to recipient if online
      if (recipientInfo) {
        io.to(recipientInfo.socketId).emit('direct_message', message);
        console.log(`📨 Direct message delivered to ${recipientInfo.username}`);
      }

      console.log(`💬 Direct message from ${socket.username} to ${toUserId}: ${content}`);
    } catch (error) {
      console.error('Error sending direct message:', error);
      socket.emit('error', { message: 'Failed to send direct message' });
    }
  });

  // Handle starting a direct chat
  socket.on('start_direct_chat', async (targetUserId) => {
    try {
      // Create a unique room name for the direct chat
      const directRoomId = [socket.userId, targetUserId].sort().join('_');
      socket.directRoom = directRoomId;
      socket.join(directRoomId);
      
      // Find target user's socket and join them to the same room
      const targetUser = onlineUsers.get(targetUserId);
      
      // Load previous direct messages
      const messages = await Message.find({
        $or: [
          { sender: socket.userId, receiver: targetUserId, type: 'direct' },
          { sender: targetUserId, receiver: socket.userId, type: 'direct' }
        ]
      })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: 1 })
      .limit(100)
      .exec();

      // Send messages to the user starting the chat
      socket.emit('direct_chat_messages', {
        roomId: directRoomId,
        messages,
        withUser: targetUser ? {
          id: targetUser.id,
          username: targetUser.username,
          avatar: targetUser.avatar
        } : null
      });

      if (targetUser) {
        socket.to(targetUser.socketId).emit('direct_chat_started', {
          roomId: directRoomId,
          withUser: {
            id: socket.userId,
            username: socket.username,
            avatar: socket.avatar
          }
        });
      }
      
      console.log(`💬 Direct chat started between ${socket.username} and ${targetUser?.username || targetUserId}`);
    } catch (error) {
      console.error('Error starting direct chat:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (room) => {
    socket.to(room).emit('user_typing', {
      username: socket.username,
      room: room
    });
  });

  socket.on('typing_stop', (room) => {
    socket.to(room).emit('user_stopped_typing', {
      username: socket.username,
      room: room
    });
  });

  // Handle message reactions
  socket.on('message_reaction', async (data) => {
    try {
      const { messageId, reaction, room } = data;
      const user = await User.findById(socket.userId);
      if (!user) return;

      const message = await Message.findById(messageId);
      if (!message) return;

      // Initialize reactions array if it doesn't exist
      if (!message.reactions) {
        message.reactions = [];
      }

      // Find existing reaction for this emoji
      let reactionObj = message.reactions.find(r => r.emoji === reaction);
      
      if (reactionObj) {
        // Check if user already reacted
        const userAlreadyReacted = reactionObj.users.some(userId => 
          userId.toString() === socket.userId.toString()
        );
        
        if (!userAlreadyReacted) {
          reactionObj.users.push(socket.userId);
        }
      } else {
        // Create new reaction
        message.reactions.push({
          emoji: reaction,
          users: [socket.userId]
        });
      }

      await message.save();
      await message.populate('sender', 'username avatar');

      // Broadcast updated message to the room
      io.to(room).emit('message_updated', message);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  });

  // Handle message deletion
  socket.on('delete_message', async (data) => {
    try {
      const { messageId, room } = data;
      
      // Find the message
      const message = await Message.findById(messageId);
      
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check if user is the sender or has permission to delete
      if (message.sender.toString() !== socket.userId.toString()) {
        socket.emit('error', { message: 'You can only delete your own messages' });
        return;
      }

      // Delete the message
      await Message.findByIdAndDelete(messageId);

      // Notify all clients in the room
      io.to(room).emit('message_deleted', { messageId, room });

      console.log(`🗑️ Message deleted by ${socket.username}: ${messageId}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.username} (${socket.id})`);

    // Remove from online users
    onlineUsers.delete(socket.userId.toString());

    // Update user online status in database
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: false,
      lastSeen: new Date()
    });

    // Broadcast updated online users
    broadcastOnlineUsers();

    // Notify room that user left
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit('user_left', {
        username: socket.username,
        room: socket.currentRoom,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`👥 Total online users after disconnect: ${onlineUsers.size}`);
  });

  function broadcastOnlineUsers() {
    const users = Array.from(onlineUsers.values());
    io.emit('online_users', users);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const users = Array.from(onlineUsers.values());
  res.json({ 
    status: 'OK', 
    onlineUsers: users.length,
    users: users,
    timestamp: new Date().toISOString()
  });
});

// Get online users endpoint
app.get('/api/online-users', (req, res) => {
  const users = Array.from(onlineUsers.values());
  res.json(users);
});

// Get all users endpoint (for testing)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username email avatar isOnline lastSeen');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Delete message endpoint
app.delete('/api/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // In a real app, you'd verify the user owns the message
    const message = await Message.findByIdAndDelete(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting message' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL}`);
  console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI}`);
});