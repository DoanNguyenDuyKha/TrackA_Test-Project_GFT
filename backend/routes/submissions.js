const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// POST /api/submissions - Student nộp bài luận & nhận kết quả chấm
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { assignmentId, studentAnswers, overallBand, criteriaScores, detailedCorrections } = req.body;

    if (!assignmentId || !studentAnswers) {
      return res.status(400).json({ success: false, message: 'Please provide assignmentId and studentAnswers' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Mẫu chấm mặc định nếu chưa có kết quả chấm AI tự động
    const defaultOverallBand = overallBand || 6.0;
    const defaultCriteriaScores = criteriaScores || {
      TR: { score: 6.0, feedback: 'Đã hoàn thành cơ bản yêu cầu đề bài.' },
      CC: { score: 6.0, feedback: 'Mạch văn mạch lạc, sử dụng các từ nối hợp lý.' },
      LR: { score: 6.0, feedback: 'Từ vựng đa dạng đúng ngữ cảnh.' },
      GRA: { score: 6.0, feedback: 'Cấu trúc câu phong phú.' }
    };

    const submission = await Submission.create({
      studentId: req.user._id,
      assignmentId,
      studentAnswers,
      overallBand: defaultOverallBand,
      criteriaScores: defaultCriteriaScores,
      detailedCorrections: detailedCorrections || []
    });

    // Tự động phân nhóm lại năng lực của Student dựa trên điểm số mới nhất
    if (req.user.role === 'student') {
      let newGroup = req.user.studentGroup;
      if (defaultOverallBand < 6.0) {
        newGroup = 'support';
      } else if (defaultOverallBand >= 6.0 && defaultOverallBand < 7.0) {
        newGroup = 'average';
      } else {
        newGroup = 'excellent';
      }

      if (newGroup !== req.user.studentGroup) {
        await User.findByIdAndUpdate(req.user._id, { studentGroup: newGroup });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Submission recorded successfully',
      data: submission
    });
  } catch (error) {
    console.error('POST Submission Error:', error);
    return res.status(500).json({ success: false, message: 'Error submitting assignment', error: error.message });
  }
});

// GET /api/submissions - Xem danh sách bài làm (Student xem của mình, Admin xem tất cả)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.studentId = req.user._id;
    }

    const submissions = await Submission.find(query)
      .populate('studentId', 'name email studentGroup targetBand')
      .populate('assignmentId', 'title topic targetGroup')
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('GET Submissions Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching submissions', error: error.message });
  }
});

module.exports = router;
