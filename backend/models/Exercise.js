const mongoose = require('mongoose');

const QuestionItemSchema = new mongoose.Schema({
  prompt: {
    type: String,
    trim: true
  },
  blankSpaceText: {
    type: String,
    trim: true
  },
  correctAnswer: {
    type: String,
    trim: true
  },
  explanation: {
    type: String,
    trim: true
  }
}, { _id: false });

const ExerciseSchema = new mongoose.Schema({
  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture',
    required: [true, 'Lecture ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['gap-fill', 'rewriting'],
    required: [true, 'Exercise type is required']
  },
  questions: [QuestionItemSchema]
});

module.exports = mongoose.model('Exercise', ExerciseSchema);
