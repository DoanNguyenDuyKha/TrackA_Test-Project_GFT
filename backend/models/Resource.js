const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  documentUrl: {
    type: String,
    default: ''
  },
  documentName: {
    type: String,
    default: ''
  },
  defaultTargetGroup: {
    type: String,
    enum: ['all', 'support', 'average', 'excellent'],
    default: 'all'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resource', resourceSchema);
