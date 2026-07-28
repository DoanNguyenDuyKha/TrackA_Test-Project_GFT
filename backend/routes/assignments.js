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

    let assignments = await Assignment.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Phân loại tự động đề thi thích ứng (Adaptive Filtering):
    // - Mặc định chỉ lấy đề bám sát targetGroup của học viên
    // - Nếu học viên chọn chế độ "Tất cả đề thi" (showAll=true), cho phép xem tất cả các đề thật (nhưng vẫn bảo vệ ẩn các đề AI của người khác)
    if (req.user.role === 'student') {
      const studentGroup = req.user.studentGroup || 'support';
      const isShowAll = req.query.showAll === 'true';

      assignments = assignments.filter(item => {
        const isAiExam = item.title.includes('AI Master Exam') || item.title.includes('Test Code #') || item.prompt.includes('Test Route #') || item.prompt.includes('Test Code #');
        
        if (isAiExam) {
          // Chỉ cho phép chính học viên đã khởi tạo đề AI đó xem bài AI của mình
          return item.createdBy && item.createdBy._id && item.createdBy._id.toString() === req.user._id.toString();
        }

        if (isShowAll) {
          return true; // Hiển thị tất cả đề thi thật chính thức
        }

        return item.targetGroup === studentGroup; // Lọc thích ứng theo phân cấp
      });
    }

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

// POST /api/assignments/:id/generate-adaptive-sample - AI tự động phân tích bài luận của Admin để trích xuất Từ vựng & Bài tập tương tác DOL
router.post('/:id/generate-adaptive-sample', authenticateToken, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const studentGroup = req.user.studentGroup || 'support';
    const targetBand = studentGroup === 'support' ? '6.0' : (studentGroup === 'average' ? '7.0' : '8.5+');

    // Lấy bài mẫu mà Admin đã viết cho nhóm học viên này
    const adminParagraph = (assignment.groupSampleAnswers && assignment.groupSampleAnswers[studentGroup]) 
      ? assignment.groupSampleAnswers[studentGroup]
      : assignment.sampleAnswer;

    // AI sử dụng bài mẫu của Admin để trích xuất 10 Từ vựng + 10 Bài tập tương tác phù hợp
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-fallback'
    });

    let extractedVocab = [];
    let generatedExercises = [];

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-fallback') {
      try {
        const aiRes = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `Bạn là trợ lý giảng dạy IELTS DOL English. Nhiệm vụ của bạn là phân tích đoạn văn bài luận IELTS Task 2 do Admin cung cấp và trích xuất đúng 10 từ vựng cốt lõi + 10 bài tập điền từ tương tác phù hợp với trình độ Band ${targetBand}. Trả về duy nhất định dạng JSON.`
            },
            {
              role: 'user',
              content: `[ĐỌAN VĂN BÀI MẪU ADMIN BAND ${targetBand}]:\n${adminParagraph}\n\nHãy phân tích và trả về cấu trúc JSON đúng định dạng như sau:\n{\n  "suggestedVocabulary": [\n    {"word": "từ vựng", "meaning": "nghĩa tiếng Việt", "collocation": "cụm từ đi kèm trong bài"}\n  ],\n  "exercises": [\n    {"prompt": "Câu hỏi...", "blankSpaceText": "Sentence with _______ blank", "correctAnswer": "từ từ đoạn văn", "explanation": "Giải thích ngắn"}\n  ]\n}`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3
        });

        const parsedData = JSON.parse(aiRes.choices[0].message.content);
        extractedVocab = parsedData.suggestedVocabulary || [];
        generatedExercises = parsedData.exercises || [];
      } catch (err) {
        console.error('Error generating AI vocab & exercises from admin paragraph:', err.message);
        extractedVocab = assignment.suggestedVocabulary || [];
        generatedExercises = assignment.exercises || [];
      }
    } else {
      extractedVocab = assignment.suggestedVocabulary || [];
      generatedExercises = assignment.exercises || [];
    }

    return res.json({
      success: true,
      data: {
        targetBand,
        studentGroup,
        sampleAnswer: adminParagraph, // Đúng đoạn văn Admin đã viết
        suggestedVocabulary: extractedVocab.length > 0 ? extractedVocab : assignment.suggestedVocabulary,
        exercises: generatedExercises.length > 0 ? generatedExercises : assignment.exercises
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
    const { title, prompt, topic, targetGroup, scaffoldingTemplate, sampleAnswer, groupSampleAnswers, suggestedVocabulary, exercises } = req.body;

    if (!title || !prompt || !topic) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields: title, prompt, topic' });
    }

    const newAssignment = await Assignment.create({
      title,
      prompt,
      topic,
      targetGroup: targetGroup || 'support',
      scaffoldingTemplate,
      sampleAnswer: sampleAnswer || (groupSampleAnswers ? groupSampleAnswers.excellent : ''),
      groupSampleAnswers: groupSampleAnswers || {},
      suggestedVocabulary: suggestedVocabulary || [],
      exercises: exercises || [],
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
