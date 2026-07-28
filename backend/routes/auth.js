const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, requireAdmin, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register - Đăng ký tài khoản
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, studentGroup, targetBand } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'student',
      studentGroup: studentGroup || 'support',
      targetBand: targetBand || 6.5
    });

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
});

// POST /api/auth/login - Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
});

// GET /api/auth/me - Lấy thông tin cá nhân hiện tại
router.get('/me', authenticateToken, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching user profile', error: error.message });
  }
});

// PUT /api/auth/update-group - Cập nhật nhóm năng lực học viên
router.put('/update-group', authenticateToken, async (req, res) => {
  try {
    const { studentGroup } = req.body;
    if (!['support', 'average', 'excellent'].includes(studentGroup)) {
      return res.status(400).json({ success: false, message: 'Invalid student group' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { studentGroup },
      { new: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Student group updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update Group Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating student group', error: error.message });
  }
});

// PUT /api/auth/users/:id - Admin cập nhật thông tin học viên (Tên, Email, Nhóm, Target Band)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, studentGroup, targetBand } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (studentGroup && ['support', 'average', 'excellent'].includes(studentGroup)) {
      updateFields.studentGroup = studentGroup;
    }
    if (targetBand) updateFields.targetBand = targetBand;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update Student Error:', error);
    return res.status(500).json({ success: false, message: 'Error updating student profile', error: error.message });
  }
});

// DELETE /api/auth/users/:id - Admin xóa hoàn toàn học viên và tất cả bài nộp (Cascading delete)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const Submission = require('../models/Submission');
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Xóa sạch tất cả bài nộp (Submissions) của học viên này
    await Submission.deleteMany({ studentId: req.params.id });

    // Xóa học viên khỏi MongoDB User collection
    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Student and all associated submissions permanently deleted successfully'
    });
  } catch (error) {
    console.error('Delete Student Error:', error);
    return res.status(500).json({ success: false, message: 'Error deleting student', error: error.message });
  }
});

// PUT /api/auth/users/:id/override-group - Admin can thiệp điều chỉnh thủ công nhóm học viên (Bài Toán 3 PDF)
router.put('/users/:id/override-group', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { studentGroup, targetBand } = req.body;
    if (studentGroup && !['support', 'average', 'excellent'].includes(studentGroup)) {
      return res.status(400).json({ success: false, message: 'Invalid student group' });
    }

    const updateFields = {};
    if (studentGroup) updateFields.studentGroup = studentGroup;
    if (targetBand) updateFields.targetBand = targetBand;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Admin manual override successful',
      data: updatedUser
    });
  } catch (error) {
    console.error('Admin Override Error:', error);
    return res.status(500).json({ success: false, message: 'Error performing manual override', error: error.message });
  }
});


// POST /api/auth/ai-monitoring-analysis - AI Assistant Phân Tích Giám Sát & Nhận Diện Học Viên Cần Can Thiệp
router.get('/students', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('GET Students Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching students list', error: error.message });
  }
});

// POST /api/auth/ai-monitoring-analysis - AI Assistant Phân Tích Giám Sát Học Viên
router.post('/ai-monitoring-analysis', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const Submission = require('../models/Submission');
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-fallback'
    });

    const students = await User.find({ role: 'student' }).select('-password');
    const submissions = await Submission.find().populate('assignmentId', 'title topic');

    // Tổng hợp dữ liệu học tập của từng học viên
    const studentProfiles = students.map(s => {
      const sSubs = submissions.filter(sub => sub.studentId?.toString() === s._id.toString());
      const bands = sSubs.map(sub => sub.overallBand);
      const avgBand = bands.length > 0 ? (bands.reduce((a, b) => a + b, 0) / bands.length).toFixed(1) : 0;
      
      return {
        id: s._id,
        name: s.name,
        email: s.email,
        studentGroup: s.studentGroup,
        targetBand: s.targetBand || 6.5,
        submissionCount: sSubs.length,
        avgBand: Number(avgBand),
        recentBands: bands.slice(0, 4)
      };
    });

    let aiAnalysisResult = null;

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-fallback') {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Bạn là Cố vấn Sư phạm AI cao cấp trong hệ thống LMS Học tập Thích ứng. Nhiệm vụ của bạn là phân tích dữ liệu danh sách học viên, nhận diện học viên đang nguy cơ ngưng trệ/tụt phong độ cần can thiệp sư phạm khẩn cấp, và đưa ra khuyến nghị cụ thể cho Admin.'
            },
            {
              role: 'user',
              content: `Dưới đây là danh sách dữ liệu học sinh hiện tại:\n${JSON.stringify(studentProfiles, null, 2)}\n\nHãy phân tích và trả về định dạng JSON gồm:\n1. "criticalInterventions": danh sách các học viên cần Admin can thiệp gấp (bắt buộc gồm các trường: "studentId", "studentName", "riskLevel", "reason", "suggestedAction").\n2. "topPerformers": các học viên xuất sắc sẵn sàng nâng hạng (gồm: "studentId", "studentName", "reason", "suggestedAction").\n3. "overallClassHealth": nhận xét tổng quan chất lượng lớp học.`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        });

        aiAnalysisResult = JSON.parse(completion.choices[0].message.content);
      } catch (err) {
        console.error('OpenAI Analysis Error, fallback logic:', err.message);
      }
    }

    // Algorithmic Fallback nếu không dùng OpenAI API Key
    if (!aiAnalysisResult) {
      const criticals = studentProfiles
        .filter(s => s.submissionCount === 0 || s.avgBand < 6.0 || s.studentGroup === 'support')
        .map(s => ({
          studentId: s.id,
          studentName: s.name,
          riskLevel: s.submissionCount === 0 ? 'CAO (Chưa làm bài)' : 'TRUNG BÌNH (Tụt phong độ)',
          reason: s.submissionCount === 0 
            ? 'Học viên chưa thực hiện bất kỳ bài thi thực hành nào trong hệ thống.' 
            : `Band trung bình ${s.avgBand} thấp hơn mục tiêu ${s.targetBand}.`,
          suggestedAction: s.submissionCount === 0 
            ? 'Admin nên bấm nút Gửi Tài Liệu Realtime bổ trợ kiến thức dàn ý cơ bản.' 
            : 'Admin nên Override chuyển nhóm sang Support hoặc gửi bộ từ vựng mồi.'
        }));

      const topPerformers = studentProfiles
        .filter(s => s.avgBand >= 6.5)
        .map(s => ({
          studentId: s.id,
          studentName: s.name,
          reason: `Đạt phong độ trung bình ${s.avgBand} Band cao.`,
          suggestedAction: 'Sẵn sàng kích hoạt Bài Test Nâng Hạng hoặc chuyển nhóm Excellent.'
        }));

      aiAnalysisResult = {
        criticalInterventions: criticals,
        topPerformers,
        overallClassHealth: `Lớp học có ${studentProfiles.length} học viên. ${criticals.length} học viên cần Admin chú ý can thiệp sư phạm.`
      };
    }

    return res.status(200).json({
      success: true,
      data: aiAnalysisResult
    });
  } catch (error) {
    console.error('AI Monitoring Analysis Error:', error);
    return res.status(500).json({ success: false, message: 'Error performing AI monitoring analysis', error: error.message });
  }
});

module.exports = router;
