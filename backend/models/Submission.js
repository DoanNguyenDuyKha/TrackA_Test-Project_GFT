const mongoose = require('mongoose');

const CriterionScoreSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 9
  },
  feedback: {
    type: String,
    default: ''
  }
}, { _id: false });

const DetailedCorrectionSchema = new mongoose.Schema({
  original: {
    type: String,
    required: true
  },
  corrected: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    default: ''
  }
}, { _id: false });

const SubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required'],
    index: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Assignment ID is required'],
    index: true
  },
  studentAnswers: {
    type: String,
    required: [true, 'Student essay/answers are required']
  },
  overallBand: {
    type: Number,
    required: [true, 'Overall band score is required'],
    min: 0,
    max: 9
  },
  criteriaScores: {
    TR: {
      type: CriterionScoreSchema,
      required: true
    },
    CC: {
      type: CriterionScoreSchema,
      required: true
    },
    LR: {
      type: CriterionScoreSchema,
      required: true
    },
    GRA: {
      type: CriterionScoreSchema,
      required: true
    }
  },
  detailedCorrections: [DetailedCorrectionSchema],
  advancedVocabularyEnhancements: [{
    originalWord: { type: String },
    contextSentence: { type: String },
    advancedSynonym: { type: String },
    collocationUsage: { type: String },
    explanation: { type: String }
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for querying submissions of a student for an assignment
SubmissionSchema.index({ studentId: 1, assignmentId: 1 });

module.exports = mongoose.model('Submission', SubmissionSchema);
