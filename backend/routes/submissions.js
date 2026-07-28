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

    // 🔔 REALTIME NOTIFICATION (TẠO THÔNG BÁO THỜI GIAN THỰC CHO ADMIN KHI HỌC VIÊN NỘP BÀI)
    try {
      const Notification = require('../models/Notification');
      const admins = await User.find({ role: 'admin' });
      const notifDocs = admins.map(admin => ({
        recipientId: admin._id,
        senderId: req.user._id,
        senderName: req.user.name || 'Học Viên',
        type: 'submission_alert',
        title: '📩 Bài Nộp Mới Từ Học Viên!',
        message: `Học viên ${req.user.name} (${req.user.studentGroup?.toUpperCase()}) vừa nộp bài luận "${assignment.title}" và đạt ${defaultOverallBand} Band!`
      }));

      await Notification.insertMany(notifDocs);

      // Realtime Socket broadcast tới phòng 'admins_room'
      const io = req.app.get('io');
      if (io) {
        io.to('admins_room').emit('admin_submission_alert', {
          submissionId: submission._id,
          studentName: req.user.name,
          studentGroup: req.user.studentGroup,
          assignmentTitle: assignment.title,
          overallBand: defaultOverallBand,
          submittedAt: new Date()
        });
      }
    } catch (notifErr) {
      console.error('Error creating realtime submission alert:', notifErr.message);
    }

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

// GET /api/submissions/progress-analytics - Engine Theo Dõi Tiến Độ Theo Thời Gian & Xuất Lộ Trình Thích Ứng (Bài Toán 3 PDF)
router.get('/progress-analytics', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user._id;
    const student = await User.findById(studentId);

    // Lấy toàn bộ lịch sử nộp bài của học viên theo thứ tự thời gian tăng dần
    const submissions = await Submission.find({ studentId })
      .populate('assignmentId', 'title topic targetGroup')
      .sort({ submittedAt: 1 });

    if (submissions.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          hasData: false,
          studentGroup: student.studentGroup,
          message: 'Chưa có dữ liệu bài làm. Hãy thực hiện bài kiểm tra đầu tiên để AI xây dựng biểu đồ tiến độ và lộ trình học cá nhân hóa!'
        }
      });
    }

    // 1. Phân Tích Chuỗi Thời Gian (Time-Series Progress Trend Data)
    const timeSeriesData = submissions.map(sub => ({
      submissionId: sub._id,
      assignmentTitle: sub.assignmentId?.title || 'Bài tập IELTS Task 2',
      submittedAt: sub.submittedAt,
      formattedDate: new Date(sub.submittedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      overallBand: sub.overallBand,
      criteriaScores: sub.criteriaScores
    }));

    // 2. Tính Điểm Band Trung Bình Động (Moving Average Band) & Độ Ổn Định (Stability Index)
    const totalSubmissions = submissions.length;
    const recentSubmissions = submissions.slice(-5); // 5 bài gần nhất
    const overallSum = recentSubmissions.reduce((acc, sub) => acc + sub.overallBand, 0);
    const movingAverageBand = Number((overallSum / recentSubmissions.length).toFixed(2));

    // Tính độ lệch chuẩn biên độ điểm số (Consistency Metric)
    const variance = recentSubmissions.reduce((acc, sub) => acc + Math.pow(sub.overallBand - movingAverageBand, 2), 0) / recentSubmissions.length;
    const standardDeviation = Number(Math.sqrt(variance).toFixed(2));

    let stabilityRating = 'Rất Ổn Định';
    if (standardDeviation > 0.75) {
      stabilityRating = 'Biến Động Cần Cải Thiện';
    } else if (standardDeviation > 0.4) {
      stabilityRating = 'Khá Ổn Định';
    }

    // 3. Phân Tích Điểm Nghẽn Học Thuật (Weakest Criterion Analysis)
    const criteriaTotals = { TR: 0, CC: 0, LR: 0, GRA: 0 };
    recentSubmissions.forEach(sub => {
      if (sub.criteriaScores) {
        criteriaTotals.TR += sub.criteriaScores.TR?.score || sub.overallBand;
        criteriaTotals.CC += sub.criteriaScores.CC?.score || sub.overallBand;
        criteriaTotals.LR += sub.criteriaScores.LR?.score || sub.overallBand;
        criteriaTotals.GRA += sub.criteriaScores.GRA?.score || sub.overallBand;
      }
    });

    const criteriaAverages = {
      TR: Number((criteriaTotals.TR / recentSubmissions.length).toFixed(1)),
      CC: Number((criteriaTotals.CC / recentSubmissions.length).toFixed(1)),
      LR: Number((criteriaTotals.LR / recentSubmissions.length).toFixed(1)),
      GRA: Number((criteriaTotals.GRA / recentSubmissions.length).toFixed(1))
    };

    // Tìm tiêu chí điểm thấp nhất
    let weakestCriterion = 'TR';
    let minScore = criteriaAverages.TR;
    Object.keys(criteriaAverages).forEach(key => {
      if (criteriaAverages[key] < minScore) {
        minScore = criteriaAverages[key];
        weakestCriterion = key;
      }
    });

    // 4. Thuật Toán Sinh Lộ Trình Học Thích Ứng Cá Nhân Hóa (Adaptive Personal Learning Roadmap)
    const currentGroup = student.studentGroup || 'support';
    let recommendedActions = [];
    let nextMilestone = '';

    if (currentGroup === 'support') {
      nextMilestone = 'Mục tiêu: Đạt 6.0 Band để Bứt Phá Lên Nhóm Trung Bình (Average)';
      recommendedActions = [
        {
          type: 'scaffolding',
          title: '📌 1. Luyện Tập Dàn Ý Giàn Giáo (Card-Grid 4 Phần)',
          description: 'Sử dụng khung gợi ý 4 phần và các Mẫu Câu Mở Đầu (Sentence Starters) để dựng khung bài luận mạch lạc.'
        },
        {
          type: 'micro_learning',
          title: '📚 2. Tích Lũy 20 Cụm Từ Vựng & 2 Bài Tập Điền Từ DOL',
          description: 'Làm bài tập tương tác điền từ để tích lũy vốn từ vựng cốt lõi mà không bị ngợp.'
        },
        {
          type: 'promotion',
          title: movingAverageBand >= 5.5 ? '🚀 3. Đã Đủ Điều Kiện: Làm Bài Test Nâng Hạng Lên Group Average!' : '🎯 3. Làm Thêm 1-2 Bài Để Mở Khóa Bài Test Nâng Hạng',
          description: 'Bứt phá vượt qua rào cản tâm lý để chuyển lên nhóm dẫn đầu.'
        }
      ];
    } else if (currentGroup === 'average') {
      nextMilestone = 'Mục tiêu: Đạt 7.0+ Band để Thăng Cấp Lên Nhóm Xuất Sắc (Excellent)';
      recommendedActions = [
        {
          type: 'weakness_fix',
          title: `🔍 1. Tập Trung Khắc Phục Điểm Nghẽn Thấp Nhất: ${weakestCriterion} (${minScore} Band)`,
          description: weakestCriterion === 'LR' ? 'Tăng cường các cụm Collocations tự nhiên thay vì dùng từ đơn lẻ.' :
                       weakestCriterion === 'GRA' ? 'Luyện tập các cấu trúc câu phức (complex sentences) và mệnh đề quan hệ.' :
                       weakestCriterion === 'CC' ? 'Cải thiện mạch nối và đại từ thay thế giữa các đoạn văn.' :
                       'Mở rộng các ví dụ dẫn chứng thực tế để thuyết phục giám khảo.'
        },
        {
          type: 'interactive_canvas',
          title: '🛠️ 2. Ôn Tập Canvas Sửa Lỗi Chi Tiết Từ Giám Khảo AI',
          description: 'Xem lại các câu đã được AI sửa lại tối ưu nâng band trong phần lịch sử bài nộp.'
        },
        {
          type: 'promotion',
          title: movingAverageBand >= 6.5 ? '🚀 3. Đã Đủ Điều Kiện: Làm Bài Test Nâng Hạng Lên Group Excellent!' : '🎯 3. Duy Trì Phong Độ Để Thăng Cấp',
          description: 'Sẵn sàng chinh phục mục tiêu 7.5+ Band.'
        }
      ];
    } else {
      nextMilestone = 'Mục tiêu: Chinh Phục Band 8.5+ & Duy Trì Đỉnh Phong Năng Lực';
      recommendedActions = [
        {
          type: 'ai_master',
          title: '🔥 1. Thử Thách Với Engine Sinh Đề AI Độc Bản (AI Master Exam Generator)',
          description: 'Mỗi lần bấm chọn là một đề thi độc bản hoàn toàn mới với độ khó ngẫu nhiên nhằm kích thích tư duy phản biện cao cấp.'
        },
        {
          type: 'lexical_booster',
          title: '💎 2. Áp Dụng Bộ Từ Vựng Học Thuật Lexical Resource Booster 8.5+',
          description: 'Nâng cấp các từ vựng đơn giản thành cụm collocations tự nhiên chuẩn văn phong bản xứ.'
        }
      ];
    }

    return res.status(200).json({
      success: true,
      data: {
        hasData: true,
        summary: {
          totalSubmissions,
          movingAverageBand,
          standardDeviation,
          stabilityRating,
          weakestCriterion,
          weakestScore: minScore,
          currentGroup,
          targetBand: student.targetBand || 6.5
        },
        criteriaAverages,
        timeSeriesData,
        roadmap: {
          nextMilestone,
          recommendedActions
        }
      }
    });
  } catch (error) {
    console.error('Progress Analytics Error:', error);
    return res.status(500).json({ success: false, message: 'Error computing progress analytics', error: error.message });
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
