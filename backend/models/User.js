const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  studentGroup: {
    type: String,
    enum: ['support', 'average', 'excellent'],
    default: 'support',
    index: true
  },
  targetBand: {
    type: Number,
    default: 6.5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
