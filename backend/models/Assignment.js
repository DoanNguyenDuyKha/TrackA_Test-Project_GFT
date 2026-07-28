const mongoose = require('mongoose');

const VocabularyItemSchema = new mongoose.Schema({
  word: {
    type: String,
    trim: true
  },
  meaning: {
    type: String,
    trim: true
  },
  collocation: {
    type: String,
    trim: true
  }
}, { _id: false });

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  prompt: {
    type: String,
    required: [true, 'Prompt is required']
  },
  topic: {
    type: String,
    enum: ['Education', 'Health', 'Art', 'Technology', 'Sport', 'Social Issues', 'Environment'],
    required: [true, 'Topic is required']
  },
  targetGroup: {
    type: String,
    enum: ['support', 'average', 'excellent'],
    required: [true, 'Target group is required'],
    index: true
  },
  scaffoldingTemplate: {
    type: String
  },
  sampleAnswer: {
    type: String // Bài mẫu band 8.0+ chuẩn format DOL English
  },
  suggestedVocabulary: [VocabularyItemSchema],
  exercises: [
    {
      prompt: String,
      blankSpaceText: String,
      correctAnswer: String,
      explanation: String
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for targetGroup and topic queries
AssignmentSchema.index({ targetGroup: 1, topic: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);
