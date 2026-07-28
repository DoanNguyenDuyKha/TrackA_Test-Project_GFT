const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/assignments
// - Dynamic Adaptive Filtering for Students (based on studentGroup)
// - Admin sees all assignments or can query with ?targetGroup=...
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = {};

    if (req.query.targetGroup) {
      query.targetGroup = req.query.targetGroup;
    }

    if (req.query.topic) {
      query.topic = req.query.topic;
    }

    // Học viên thường (Support, Average) không nhìn thấy các đề thi AI độc bản của nhóm Excellent
    // Học viên Xuất Sắc (Excellent) chỉ nhìn thấy các bài thi AI do chính họ yêu cầu khởi tạo
    if (req.user.role === 'student') {
      if (req.user.studentGroup === 'excellent') {
        // Chỉ lấy đề gốc chính thức HOẶC đề AI độc bản do chính học viên này yêu cầu khởi tạo
        query.$or = [
          { title: { $not: /^AI Master Exam/ } },
          { createdBy: req.user._id }
        ];
      } else {
        // Ẩn hoàn toàn các bài AI Master Exam dành cho học viên nhóm Support và Average
        query.title = { $not: /^AI Master Exam/ };
      }
    }

    const assignments = await Assignment.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('GET Assignments Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching assignments', error: error.message });
  }
});

// POST /api/assignments/:id/generate-adaptive-sample - Render bài mẫu thích ứng theo nhóm học viên bằng AI GPT-4o
router.post('/:id/generate-adaptive-sample', authenticateToken, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const studentGroup = req.user.studentGroup || 'support';

    if (studentGroup === 'excellent') {
      return res.json({
        success: true,
        data: {
          targetBand: '8.5+',
          studentGroup,
          sampleAnswer: assignment.sampleAnswer,
          isPrecomputed: true
        }
      });
    }

    const targetBand = studentGroup === 'support' ? '6.0' : '7.0';
    const complexityGuide = studentGroup === 'support' 
      ? 'Viết bài luận ở mức Band 6.0 với từ vựng dễ hiểu, câu đơn và câu ghép cơ bản, cấu trúc mạch lạc rõ ràng, không lạm dụng từ quá khó.'
      : 'Viết bài luận ở mức Band 7.0 với các từ vựng học thuật tốt, áp dụng một số câu phức và collocations tự nhiên.';

    let generatedSample = '';

    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-fallback'
    });

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-fallback') {
      try {
        const aiRes = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `Bạn là một chuyên gia luyện thi IELTS Writing Task 2. Nhiệm vụ của bạn là viết một bài mẫu IELTS Writing Task 2 chuẩn chính xác ở Band ${targetBand}. ${complexityGuide}`
            },
            {
              role: 'user',
              content: `[ĐỀ BÀI TASK 2] ${assignment.prompt}\n\nHãy viết bài mẫu đạt Band ${targetBand} khoảng 260-280 từ. Trả về duy nhất nội dung bài luận Tiếng Anh.`
            }
          ],
          temperature: 0.5
        });

        generatedSample = aiRes.choices[0].message.content.trim();
      } catch (err) {
        console.error('Error generating AI adaptive sample:', err.message);
        generatedSample = `[Fallback Band ${targetBand} Sample]\n${assignment.sampleAnswer}`;
      }
    } else {
      generatedSample = `[Fallback Band ${targetBand} Sample]\n${assignment.sampleAnswer}`;
    }

    return res.json({
      success: true,
      data: {
        targetBand,
        studentGroup,
        sampleAnswer: generatedSample,
        isPrecomputed: false
      }
    });
  } catch (error) {
    console.error('Generate Adaptive Sample Error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating adaptive sample', error: error.message });
  }
});

// GET /api/assignments/:id - Chi tiết 1 đề thi
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('createdBy', 'name email');
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    return res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('GET Single Assignment Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching assignment', error: error.message });
  }
});

// POST /api/assignments - Admin tạo đề thi mới
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, prompt, topic, targetGroup, scaffoldingTemplate, suggestedVocabulary } = req.body;

    if (!title || !prompt || !topic || !targetGroup) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields: title, prompt, topic, targetGroup' });
    }

    const newAssignment = await Assignment.create({
      title,
      prompt,
      topic,
      targetGroup,
      scaffoldingTemplate,
      suggestedVocabulary: suggestedVocabulary || [],
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: newAssignment
    });
  } catch (error) {
    console.error('POST Assignment Error:', error);
    return res.status(500).json({ success: false, message: 'Error creating assignment', error: error.message });
  }
});

// PUT /api/assignments/:id - Admin cập nhật đề thi
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: updatedAssignment
    });
  } catch (error) {
    console.error('PUT Assignment Error:', error);
    return res.status(500).json({ success: false, message: 'Error updating assignment', error: error.message });
  }
});

// DELETE /api/assignments/:id - Admin xóa đề thi
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('DELETE Assignment Error:', error);
    return res.status(500).json({ success: false, message: 'Error deleting assignment', error: error.message });
  }
});

module.exports = router;
