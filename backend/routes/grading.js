const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { authenticateToken } = require('../middleware/auth');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-fallback'
});

// Fallback Grading Engine (Phân tích chất lượng bài viết khi không dùng AI API)
function fallbackGrading(studentAnswers, assignment) {
  const words = studentAnswers.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Đếm các cụm từ vựng học thuật & cấu trúc phức
  const academicKeywords = [
    'disproportionate', 'idolization', 'unmatched', 'prestige', 'rigorous',
    'discipline', 'intellectual', 'astronomical', 'adversity', 'advancement',
    'predominantly', 'prominent', 'recreational', 'resilience', 'undervalue',
    'profound', 'consequently', 'furthermore', 'nevertheless', 'unprecedented',
    'proactive', 'foster', 'subsidize', 'deterrent', 'imperative', 'indispensable',
    'substantially', 'alleviate', 'substantial', 'infrastructure', 'collaboration',
    'furthermore', 'however', 'moreover', 'nonetheless', 'therefore', 'whereas'
  ];

  let academicWordCount = 0;
  words.forEach(w => {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
    if (academicKeywords.includes(cleanWord) || cleanWord.length >= 7) {
      academicWordCount++;
    }
  });

  // Đếm lỗi chính tả / từ vựng đơn giản (từ ngắn dưới 5 ký tự)
  let simpleWordCount = 0;
  words.forEach(w => {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length <= 4) {
      simpleWordCount++;
    }
  });

  let overallBand = 5.0;

  // Đánh giá dải điểm chuẩn theo độ dài, từ vựng và cấu trúc
  if (wordCount >= 250 && academicWordCount >= 10) {
    overallBand = 8.0;
  } else if (wordCount >= 220 && academicWordCount >= 6) {
    overallBand = 7.5;
  } else if (wordCount >= 180 && academicWordCount >= 4) {
    overallBand = 7.0;
  } else if (wordCount >= 150 && academicWordCount >= 2) {
    overallBand = 6.5;
  } else if (wordCount >= 120) {
    overallBand = 6.0;
  } else if (wordCount >= 80) {
    overallBand = 5.0;
  } else if (wordCount >= 40) {
    overallBand = 4.0;
  } else {
    overallBand = 3.0;
  }

  // Nếu tỷ lệ từ đơn giản / lặp lại quá cao thì hạ band điểm
  if (wordCount > 0 && (simpleWordCount / wordCount) > 0.65 && academicWordCount < 3) {
    overallBand = Math.max(3.0, overallBand - 1.5);
  }

  // Tính điểm 4 tiêu chí chuẩn
  const trScore = Math.max(3.0, Math.min(9.0, overallBand + (wordCount >= 250 ? 0.5 : (wordCount < 100 ? -1.0 : 0))));
  const ccScore = overallBand;
  const lrScore = Math.max(3.0, Math.min(9.0, overallBand + (academicWordCount >= 8 ? 0.5 : (academicWordCount < 2 ? -1.0 : 0))));
  const graScore = overallBand;

  // Tính lại điểm Overall Band trung bình cộng chuẩn Cambridge
  const calculatedOverall = Math.round(((trScore + ccScore + lrScore + graScore) / 4) * 2) / 2;



  return {
    overallBand: calculatedOverall,
    criteriaScores: {
      TR: {
        score: trScore,
        feedback: `Bài làm đạt ${wordCount} từ. Đã giải quyết đầy đủ và nhất quán các luận điểm của đề bài.`
      },
      CC: {
        score: ccScore,
        feedback: 'Bố cục bài luận được chia đoạn mạch lạc, liên kết giữa các câu bằng phương tiện nối tự nhiên.'
      },
      LR: {
        score: lrScore,
        feedback: `Bài làm áp dụng ${academicWordCount} từ vựng/collocations học thuật phong phú, đa dạng vốn từ.`
      },
      GRA: {
        score: graScore,
        feedback: 'Sử dụng thành thạo các cấu trúc câu phức, duy trì độ chính xác cao trong bài luận.'
      }
    },
    detailedCorrections: [
      {
        original: 'Gợi ý nâng band:',
        corrected: 'Tăng cường áp dụng thêm các collocations chuyên sâu',
        explanation: 'Việc kết hợp collocations giúp bài viết đạt mốc Band 8.5+ trọn vẹn.'
      }
    ]
  };
}

// POST /api/grading/generate-promotion-prompt - API Sinh đề thi nâng hạng & Đề thi AI Độc Bản cho Học Viên Xuất Sắc
router.post('/generate-promotion-prompt', authenticateToken, async (req, res) => {
  try {
    const studentGroup = req.user.studentGroup || 'support';
    const topics = ['Education', 'Health', 'Art', 'Technology', 'Sport', 'Social Issues', 'Environment'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const timestamp = new Date().getTime();
    const uniqueExamId = Math.floor(Math.random() * 9000 + 1000);

    let targetGroup = studentGroup === 'excellent' ? 'excellent' : (studentGroup === 'average' ? 'excellent' : 'average');
    let examTitle = studentGroup === 'excellent' 
      ? `AI Master Exam #${uniqueExamId} - Topic ${randomTopic} (Band 8.5+ Challenge)`
      : `Bài Test Nâng Hạng (${studentGroup.toUpperCase()} ➔ ${targetGroup.toUpperCase()})`;

    let promptText = `Some people believe that advanced technological developments produce severe ethical dilemmas in modern society. To what extent do you agree or disagree?`;

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-fallback') {
      try {
        const aiRes = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Bạn là một Chuyên gia ra đề thi IELTS Writing Task 2 cấp độ cao của Cambridge. Hãy sáng tạo 1 câu hỏi essay IELTS Task 2 hoàn toàn mới, độc bản, nâng cao về tư duy phản biện.'
            },
            {
              role: 'user',
              content: `Hãy sinh 1 đề thi IELTS Writing Task 2 độc bản hoàn toàn mới về chủ đề ${randomTopic} (Mã đề #${timestamp}). Chỉ trả về duy nhất 1 câu đề bài Tiếng Anh.`
            }
          ],
          temperature: 0.95 // Đảm bảo mỗi lần bấm là 1 đề thi hoàn toàn khác nhau
        });

        promptText = aiRes.choices[0].message.content.trim();
      } catch (e) {
        console.error('Error generating AI prompt, using fallback:', e.message);
      }
    }

    // Sinh từ vựng & bài tập đa dạng phong phú
    const fullSuggestedVocab = [
      { word: 'profound implications', meaning: 'Hệ quả/tác động sâu sắc', collocation: 'have profound implications for society' },
      { word: 'imperative duty', meaning: 'Nhiệm vụ bắt buộc', collocation: 'regard as an imperative duty' },
      { word: 'substantially alleviate', meaning: 'Giảm thiểu đáng kể', collocation: 'substantially alleviate the burden' },
      { word: 'indispensable asset', meaning: 'Tài sản không thể thiếu', collocation: 'an indispensable asset to growth' },
      { word: 'foster innovation', meaning: 'Thúc đẩy sự đổi mới', collocation: 'foster innovation and progress' },
      { word: 'deterrent factor', meaning: 'Yếu tố răn đe', collocation: 'act as a strong deterrent factor' },
      { word: 'ethical dilemma', meaning: 'Tiến thoái lưỡng nan về đạo đức', collocation: 'pose a severe ethical dilemma' },
      { word: 'unprecedented growth', meaning: 'Sự tăng trưởng chưa từng có', collocation: 'witness unprecedented growth' },
      { word: 'intellectual resilience', meaning: 'Sự kiên cường trí tuệ', collocation: 'cultivate intellectual resilience' },
      { word: 'holistic development', meaning: 'Sự phát triển toàn diện', collocation: 'promote holistic development' }
    ];

    const fullExercises = [
      { prompt: 'Câu 1: Điền cụm từ vựng học thuật chỉ tác động sâu sắc:', blankSpaceText: 'The technological revolution has had _______ for modern society.', correctAnswer: 'profound implications', explanation: '"profound implications" nghĩa là các tác động/hệ quả sâu sắc.' },
      { prompt: 'Câu 2: Điền từ chỉ trách nhiệm bắt buộc:', blankSpaceText: 'Protecting global ecosystems is considered an _______ for all governments.', correctAnswer: 'imperative duty', explanation: '"imperative duty" chỉ nghĩa là trách nhiệm/nghĩa vụ bắt buộc.' },
      { prompt: 'Câu 3: Điền từ chỉ việc giảm nhẹ gánh nặng:', blankSpaceText: 'Renewable energy investment will _______ the dependence on fossil fuels.', correctAnswer: 'substantially alleviate', explanation: '"substantially alleviate" nghĩa là làm giảm nhẹ đáng kể.' },
      { prompt: 'Câu 4: Điền từ chỉ tài sản vô giá/không thể thiếu:', blankSpaceText: 'Critical thinking skills are an _______ in the modern workplace.', correctAnswer: 'indispensable asset', explanation: '"indispensable asset" là tài sản/kỹ năng không thể thiếu.' },
      { prompt: 'Câu 5: Điền từ chỉ sự thúc đẩy đổi mới:', blankSpaceText: 'Educational reforms should _______ and creative thinking.', correctAnswer: 'foster innovation', explanation: '"foster innovation" nghĩa là nuôi dưỡng/thúc đẩy đổi mới.' },
      { prompt: 'Câu 6: Điền từ chỉ yếu tố răn đe:', blankSpaceText: 'Strict laws act as a strong _______ against illegal activities.', correctAnswer: 'deterrent factor', explanation: '"deterrent factor" nghĩa là yếu tố răn đe ngăn chặn.' },
      { prompt: 'Câu 7: Điền từ chỉ cuộc xung đột đạo đức:', blankSpaceText: 'Genetic engineering often poses a complex _______.', correctAnswer: 'ethical dilemma', explanation: '"ethical dilemma" chỉ tình huống tiến thoái lưỡng nan về đạo đức.' },
      { prompt: 'Câu 8: Điền từ chỉ sự phát triển chưa từng có:', blankSpaceText: 'The digital economy has experienced _______ over the past decade.', correctAnswer: 'unprecedented growth', explanation: '"unprecedented growth" là tăng trưởng vượt bậc chưa từng thấy.' },
      { prompt: 'Câu 9: Điền từ chỉ sự kiên cường về mặt trí tuệ:', blankSpaceText: 'Challenging curricula help students build _______.', correctAnswer: 'intellectual resilience', explanation: '"intellectual resilience" là bản lĩnh/sự kiên cường trí tuệ.' },
      { prompt: 'Câu 10: Điền từ chỉ sự phát triển toàn diện:', blankSpaceText: 'Schools should aim for the _______ of young individuals.', correctAnswer: 'holistic development', explanation: '"holistic development" là sự phát triển toàn diện cả thể chất lẫn trí tuệ.' }
    ];

    const newAssignment = await Assignment.create({
      title: examTitle,
      prompt: promptText,
      topic: randomTopic,
      targetGroup: targetGroup,
      scaffoldingTemplate: `### 🚀 Đề bài:
${promptText}

### 😵 Dàn ý chi tiết 4 phần (Outline):
1. **Introduction**: Paraphrase đề bài và nêu quan điểm cá nhân mạnh mẽ về chủ đề ${randomTopic}.
2. **Body 1**: Triển khai luận điểm thứ nhất với phân tích chuyên sâu và từ vựng học thuật cao cấp.
3. **Body 2**: Triển khai luận điểm phản biện/bổ sung với ví dụ thực tế thuyết phục.
4. **Conclusion**: Tóm tắt các ý chính và khẳng định thông điệp định hướng xã hội.`,
      sampleAnswer: `[Bài làm mẫu Band 8.5+ do AI khởi tạo cho đề thi độc bản: ${promptText}]`,
      suggestedVocabulary: fullSuggestedVocab,
      exercises: fullExercises,
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      data: {
        assignment: newAssignment,
        targetNextGroup: targetGroup
      }
    });
  } catch (error) {
    console.error('Generate Promotion Prompt Error:', error);
    return res.status(500).json({ success: false, message: 'Error generating AI test prompt', error: error.message });
  }
});

// Alias Route: POST /api/grading/generate-ai-exam
router.post('/generate-ai-exam', authenticateToken, async (req, res) => {
  try {
    const studentGroup = req.user.studentGroup || 'excellent';
    const topics = ['Education', 'Health', 'Art', 'Technology', 'Sport', 'Social Issues', 'Environment'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const timestamp = new Date().getTime();
    const uniqueExamId = Math.floor(Math.random() * 9000 + 1000);

    let examTitle = `AI Master Exam #${uniqueExamId} - Topic ${randomTopic} (Band 8.5+ Challenge)`;
    let promptText = `Some people believe that advanced technological developments produce severe ethical dilemmas in modern society. To what extent do you agree or disagree?`;

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-fallback') {
      try {
        const aiRes = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Bạn là một Chuyên gia ra đề thi IELTS Writing Task 2 cấp độ cao của Cambridge. Hãy sáng tạo 1 câu hỏi essay IELTS Task 2 hoàn toàn mới, độc bản, nâng cao về tư duy phản biện.'
            },
            {
              role: 'user',
              content: `Hãy sinh 1 đề thi IELTS Writing Task 2 độc bản hoàn toàn mới về chủ đề ${randomTopic} (Mã đề #${timestamp}). Chỉ trả về duy nhất 1 câu đề bài Tiếng Anh.`
            }
          ],
          temperature: 0.95
        });

        promptText = aiRes.choices[0].message.content.trim();
      } catch (e) {
        console.error('Error generating AI prompt, using fallback:', e.message);
      }
    }

    const newAssignment = await Assignment.create({
      title: examTitle,
      prompt: promptText,
      topic: randomTopic,
      targetGroup: 'excellent',
      scaffoldingTemplate: `### 🚀 Đề bài:
${promptText}

### 😵 Dàn ý chi tiết 4 phần (Outline):
1. **Introduction**: Paraphrase đề bài và nêu quan điểm cá nhân mạnh mẽ về chủ đề ${randomTopic}.
2. **Body 1**: Triển khai luận điểm thứ nhất với phân tích chuyên sâu và từ vựng học thuật cao cấp.
3. **Body 2**: Triển khai luận điểm phản biện/bổ sung với ví dụ thực tế thuyết phục.
4. **Conclusion**: Tóm tắt các ý chính và khẳng định thông điệp định hướng xã hội.`,
      sampleAnswer: `[Bài làm mẫu Band 8.5+ do AI khởi tạo cho đề thi độc bản: ${promptText}]`,
      suggestedVocabulary: fullSuggestedVocab,
      exercises: fullExercises,
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      data: {
        assignment: newAssignment,
        targetNextGroup: 'excellent'
      }
    });
  } catch (error) {
    console.error('Generate AI Exam Error:', error);
    return res.status(500).json({ success: false, message: 'Error generating AI exam', error: error.message });
  }
});

// POST /api/grading/submit - API Chấm bài thực hành (Không tự nâng hạng ảo)
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { assignmentId, studentAnswers, customPrompt } = req.body;
    const studentId = req.user._id;

    if (!assignmentId || !studentAnswers) {
      return res.status(400).json({
        success: false,
        message: 'Please provide assignmentId and studentAnswers'
      });
    }

    const [student, assignment] = await Promise.all([
      User.findById(studentId),
      Assignment.findById(assignmentId)
    ]);

    if (!student || !assignment) {
      return res.status(404).json({ success: false, message: 'Student or Assignment not found' });
    }

    const effectivePrompt = customPrompt || assignment.prompt;

    let evaluationResult;

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-fallback') {
      try {
        const systemPrompt = `Bạn là một Giám khảo chấm thi IELTS Writing Task 2 chuyên nghiệp của tổ chức IDP và British Council (khắt khe, công bằng và tuân thủ 100% tài liệu IELTS Writing Task 2 Official Band Descriptors).

Nhiệm vụ của bạn là phân tích bài làm của học viên và đánh giá chính xác từng tiêu chí theo khung điểm IELTS chuẩn từ 1.0 đến 9.0:

1. **Task Achievement / Task Response (TR)**:
   - Band 8.0+: Giải quyết đầy đủ tất cả các khía cạnh của đề bài, phát triển ý kiến rõ ràng, lập luận mạch lạc, có ví dụ minh họa thuyết phục và độ dài trên 250 từ.
   - Band 5.0 - 6.0: Bài quá ngắn, ý tưởng sơ sài hoặc trả lời lệch trọng tâm đề bài.

2. **Coherence and Cohesion (CC)**:
   - Band 8.0+: Phân chia đoạn văn logic, sử dụng từ nối (cohesive devices) tự nhiên, không gượng ép.

3. **Lexical Resource (LR)**:
   - Band 8.0+: Sử dụng vốn từ vựng phong phú, collocations học thuật tự nhiên, có cấu trúc từ vựng ít phổ biến (uncommon lexical items) và rất ít lỗi chính tả/dùng từ.

4. **Grammatical Range and Accuracy (GRA)**:
   - Band 8.0+: Áp dụng đa dạng các cấu trúc câu phức (complex sentences), câu điều kiện, bị động, mệnh đề quan hệ với độ chính xác tuyệt đối hoặc chỉ mắc phải các lỗi nhỏ không đáng kể (slips).

⚠️ CẢNH BÁO: Nếu bài làm của học viên có văn phong học thuật xuất sắc, từ vựng phong phú (collocations), ngữ pháp câu phức chuẩn xác và đáp ứng đầy đủ yêu cầu đề bài, bạn BẮT BUỘC phải chấm điểm cao tương ứng (Band 7.5 - 8.5+). KHÔNG ĐƯỢC tự ý hạ điểm xuống Band 5.0 - 6.0 nếu bài làm xuất sắc!

BẮT BUỘC trả về phản hồi dưới dạng JSON thuần túy theo đúng cấu trúc Schema sau:
{
  "overallBand": Number (Làm tròn 0.5 gần nhất theo điểm trung bình cộng 4 tiêu chí),
  "criteriaScores": {
    "TR": { "score": Number, "feedback": "Nhận xét chi tiết bằng tiếng Việt" },
    "CC": { "score": Number, "feedback": "Nhận xét chi tiết bằng tiếng Việt" },
    "LR": { "score": Number, "feedback": "Nhận xét chi tiết bằng tiếng Việt" },
    "GRA": { "score": Number, "feedback": "Nhận xét chi tiết bằng tiếng Việt" }
  },
  "detailedCorrections": [
    {
      "original": "Câu sai hoặc chưa tối ưu",
      "corrected": "Câu đã sửa lại tối ưu nâng band",
      "explanation": "Giải thích chi tiết lỗi sai hoặc cách nâng band bằng tiếng Việt"
    }
  ],
  "advancedVocabularyEnhancements": [
    {
      "originalWord": "Từ hoặc cụm từ đơn giản trong bài làm (ví dụ: good, important, make, big)",
      "contextSentence": "Câu chứa từ đó trong bài làm của học viên",
      "advancedSynonym": "Từ vựng/cụm từ học thuật nâng cao đồng nghĩa (ví dụ: imperative, substantial, foster)",
      "collocationUsage": "Collocation tự nhiên chứa từ nâng cao đó",
      "explanation": "Hướng dẫn chi tiết cách thay thế để nâng band Lexical Resource lên 8.5+ - 9.0"
    }
  ]
}`;

        const userPrompt = `[THÔNG TIN ĐỀ THI CHẤM BÀI]
Tiêu đề: ${assignment.title}
Chủ đề: ${assignment.topic}
Đề bài luận chính xác: ${effectivePrompt}

[BÀI LÀM CỦA HỌC VIÊN CẦN CHẤM]
${studentAnswers}`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        });

        evaluationResult = JSON.parse(response.choices[0].message.content);
      } catch (openaiErr) {
        console.error('OpenAI Call Error, using fallback engine:', openaiErr.message);
        evaluationResult = fallbackGrading(studentAnswers, assignment);
      }
    } else {
      evaluationResult = fallbackGrading(studentAnswers, assignment);
    }

    const newSubmission = await Submission.create({
      studentId,
      assignmentId,
      studentAnswers,
      overallBand: evaluationResult.overallBand,
      criteriaScores: evaluationResult.criteriaScores,
      detailedCorrections: evaluationResult.detailedCorrections || [],
      advancedVocabularyEnhancements: evaluationResult.advancedVocabularyEnhancements || []
    });

    // Kiểm tra điều kiện đủ xét duyệt làm bài Test nâng hạng
    const recentSubmissions = await Submission.find({ studentId })
      .sort({ submittedAt: -1 })
      .limit(3);

    const sumBand = recentSubmissions.reduce((acc, sub) => acc + sub.overallBand, 0);
    const movingAverageBand = sumBand / recentSubmissions.length;

    let isEligibleForPromotion = false;
    if (student.studentGroup === 'support' && movingAverageBand >= 6.0) {
      isEligibleForPromotion = true;
    } else if (student.studentGroup === 'average' && movingAverageBand >= 7.0) {
      isEligibleForPromotion = true;
    }

    return res.status(201).json({
      success: true,
      message: 'Assignment graded successfully',
      data: {
        submission: newSubmission,
        adaptiveRouting: {
          currentGroup: student.studentGroup,
          movingAverageBand: Number(movingAverageBand.toFixed(2)),
          isEligibleForPromotion
        }
      }
    });
  } catch (error) {
    console.error('Grading Submit Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during assignment grading', error: error.message });
  }
});

// POST /api/grading/submit-promotion-test - API Chấm bài nâng hạng chính thức & Thực hiện Level Migration
router.post('/submit-promotion-test', authenticateToken, async (req, res) => {
  try {
    const { assignmentId, studentAnswers, targetNextGroup } = req.body;
    const studentId = req.user._id;

    const [student, assignment] = await Promise.all([
      User.findById(studentId),
      Assignment.findById(assignmentId)
    ]);

    if (!student || !assignment) {
      return res.status(404).json({ success: false, message: 'Student or Assignment not found' });
    }

    let evaluationResult;
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-fallback') {
      try {
        const systemPrompt = `Bạn là một Giám khảo chấm thi IELTS Writing Task 2 chuyên nghiệp của tổ chức IDP và British Council (khắt khe, công bằng và tuân thủ 100% tài liệu IELTS Writing Task 2 Official Band Descriptors).

Đánh giá bài làm nâng hạng của học viên theo đúng 4 tiêu chí chuẩn (TR, CC, LR, GRA) và trả về JSON chuẩn:
{
  "overallBand": Number (Làm tròn 0.5 gần nhất theo điểm trung bình cộng 4 tiêu chí),
  "criteriaScores": {
    "TR": { "score": Number, "feedback": "Nhận xét chi tiết bằng tiếng Việt" },
    "CC": { "score": Number, "feedback": "Nhận xét chi tiết bằng tiếng Việt" },
    "LR": { "score": Number, "feedback": "Nhận xét chi tiết bằng tiếng Việt" },
    "GRA": { "score": Number, "feedback": "Nhận xét chi tiết bằng tiếng Việt" }
  },
  "detailedCorrections": [
    { "original": "String", "corrected": "String", "explanation": "String" }
  ]
}`;
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `[ĐỀ BÀI NÂNG HẠNG] ${assignment.prompt}\n\n[BÀI LÀM CỦA HỌC VIÊN] ${studentAnswers}` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        });
        evaluationResult = JSON.parse(response.choices[0].message.content);
      } catch (e) {
        evaluationResult = fallbackGrading(studentAnswers, assignment);
      }
    } else {
      evaluationResult = fallbackGrading(studentAnswers, assignment);
    }

    const newSubmission = await Submission.create({
      studentId,
      assignmentId,
      studentAnswers,
      overallBand: evaluationResult.overallBand,
      criteriaScores: evaluationResult.criteriaScores,
      detailedCorrections: evaluationResult.detailedCorrections || []
    });

    // Xét duyệt nâng hạng chính thức dựa trên điểm bài Test Nâng Hạng
    let promoted = false;
    let requiredBand = targetNextGroup === 'excellent' ? 7.0 : 6.0;

    if (evaluationResult.overallBand >= requiredBand) {
      await User.findByIdAndUpdate(studentId, { studentGroup: targetNextGroup });
      promoted = true;
    }

    return res.status(201).json({
      success: true,
      data: {
        submission: newSubmission,
        promoted,
        previousGroup: student.studentGroup,
        newGroup: promoted ? targetNextGroup : student.studentGroup,
        requiredBand
      }
    });
  } catch (error) {
    console.error('Submit Promotion Test Error:', error);
    return res.status(500).json({ success: false, message: 'Error grading promotion test', error: error.message });
  }
});

module.exports = router;
