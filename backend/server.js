require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

// Import Routes
const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignments');
const lectureRoutes = require('./routes/lectures');
const submissionRoutes = require('./routes/submissions');
const gradingRoutes = require('./routes/grading');
const adaptiveSampleRoutes = require('./routes/adaptiveSample');
const notificationRoutes = require('./routes/notifications');
const resourceRoutes = require('./routes/resources');

const app = express();

const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Attach io to express app so routes can access req.app.get('io')
app.set('io', io);

// Socket.IO Room Management & Connections
io.on('connection', (socket) => {
  console.log(`⚡ [Socket.IO] Client Connected: ${socket.id}`);

  // User join personal room by userId
  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`👤 User Joined Room: ${userId}`);
    }
  });

  // Admin join admins_room for realtime submission alerts
  socket.on('join_admin_room', () => {
    socket.join('admins_room');
    console.log(`🛡️ Admin Joined Room: admins_room`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [Socket.IO] Client Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://doannguyenduykha08_db_user:Kha.0804@englishadaptivelms.6dtqe9l.mongodb.net/lms_adaptive?appName=EnglishAdaptiveLMS';

const path = require('path');

// --- MIDDLEWARES & SERVERLESS MONGO CONNECT ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static route cho file upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Cached Connection for Vercel Serverless Functions
let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  const db = await mongoose.connect(MONGO_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000
  });
  cachedDb = db;
  return db;
};

// Middleware kết nối CSDLServerless
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('MongoDB Serverless Connection Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi kết nối CSDL MongoDB Atlas từ Serverless Vercel. Hãy kiểm tra Network Access (IP Whitelist) trong MongoDB Atlas.',
      error: err.message 
    });
  }
});



// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/grading', gradingRoutes);
app.use('/api/assignments', adaptiveSampleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/resources', resourceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'LMS Backend Server with Realtime Socket.IO is running smoothly' });
});

// Global 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error Stack:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start listening HTTP server with Socket.IO attached
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`================================================`);
    console.log(`   LMS Backend & Socket.IO running on port ${PORT}   `);
    console.log(`================================================`);
  });
}

module.exports = app;
