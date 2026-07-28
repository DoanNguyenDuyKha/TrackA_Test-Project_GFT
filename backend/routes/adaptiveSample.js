const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Assignment = require('../models/Assignment');
const { authenticateToken } = require('../middleware/auth');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-fallback'
});

// POST /api/assignments/:id/generate-adaptive-sample - Render bài mẫu thích ứng theo nhóm học viên bằng AI GPT-4o
router.post('/:id/generate-adaptive-sample', authenticateToken, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const studentGroup = req.user.studentGroup || 'support';

    // Đảm bảo trả về 100% chính xác bài luận mẫu do Admin đã nhập
    const groupSample = (assignment.groupSampleAnswers && assignment.groupSampleAnswers[studentGroup]) 
      ? assignment.groupSampleAnswers[studentGroup] 
      : assignment.sampleAnswer;

    const targetBand = studentGroup === 'support' ? '6.0' : (studentGroup === 'average' ? '7.0' : '8.5+');

    return res.json({
      success: true,
      data: {
        targetBand,
        studentGroup,
        sampleAnswer: groupSample || 'Chưa có bài mẫu cho nhóm học viên này.',
        isPrecomputed: true
      }
    });
  } catch (error) {
    console.error('Generate Adaptive Sample Error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating adaptive sample', error: error.message });
  }
});

module.exports = router;
