require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import Routes
const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignments');
const lectureRoutes = require('./routes/lectures');
const submissionRoutes = require('./routes/submissions');
const gradingRoutes = require('./routes/grading');
const adaptiveSampleRoutes = require('./routes/adaptiveSample');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://doannguyenduykha08_db_user:Kha.0804@englishadaptivelms.6dtqe9l.mongodb.net/lms_adaptive?appName=EnglishAdaptiveLMS';

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- DATABASE CONNECTION ---
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Cloud Atlas Connected Successfully.'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/grading', gradingRoutes);
app.use('/api/assignments', adaptiveSampleRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'LMS Backend Server is running smoothly' });
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

// Start listening if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`================================================`);
    console.log(`   LMS Backend Server running on port ${PORT}   `);
    console.log(`================================================`);
  });
}

module.exports = app;
