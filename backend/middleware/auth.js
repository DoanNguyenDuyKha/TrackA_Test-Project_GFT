const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'adaptive_lms_secret_key_2026';

// Middleware authenticating JWT Token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token missing or invalid' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User non-existent or account disabled' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Authentication Error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
  }
};

// Middleware requiring Student role
const requireStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.user.role !== 'student' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Requires Student role' });
  }
  next();
};

// Middleware requiring Admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Requires Admin role' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireStudent,
  requireAdmin,
  JWT_SECRET
};
