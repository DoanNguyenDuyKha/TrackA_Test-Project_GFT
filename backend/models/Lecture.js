const mongoose = require('mongoose');

const LectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  focusCriterion: {
    type: String,
    enum: ['TR', 'CC', 'LR', 'GRA'],
    required: [true, 'Focus criterion is required']
  },
  targetGroup: {
    type: String,
    enum: ['support', 'average', 'excellent'],
    required: [true, 'Target group is required'],
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for filtering lectures by targetGroup and focusCriterion
LectureSchema.index({ targetGroup: 1, focusCriterion: 1 });

module.exports = mongoose.model('Lecture', LectureSchema);
