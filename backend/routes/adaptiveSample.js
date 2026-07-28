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

    // Đã là học viên 'excellent' thì trả về bài mẫu Band 8.5+ trong DB mà không cần render lại AI
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

    // Học viên nhóm 'support' (Target Band 5.5 - 6.0) hoặc 'average' (Target Band 6.5 - 7.0) -> AI Render bài luận thích ứng vừa sức
    const targetBand = studentGroup === 'support' ? '6.0' : '7.0';
    const complexityGuide = studentGroup === 'support' 
      ? 'Viết bài luận ở mức Band 6.0 với từ vựng dễ hiểu, câu đơn và câu ghép cơ bản, cấu trúc mạch lạc rõ ràng, không lạm dụng từ quá khó.'
      : 'Viết bài luận ở mức Band 7.0 với các từ vựng học thuật tốt, áp dụng một số câu phức và collocations tự nhiên.';

    let generatedSample = '';

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

module.exports = router;
