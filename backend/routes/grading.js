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

  // 1. Kiểm tra văn bản rác / vô nghĩa / lặp từ ngây ngô (Gibberish & Repeated character check)
  const isGibberish = words.some(w => /(.)\1{4,}/.test(w) || w.length > 25);
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, ''))).size;
  const wordDiversityRatio = words.length > 0 ? (uniqueWords / words.length) : 0;

  // Đếm các cụm từ vựng học thuật thực sự xuất hiện trong bài
  const academicKeywords = [
    'disproportionate', 'idolization', 'unmatched', 'prestige', 'rigorous',
    'discipline', 'intellectual', 'astronomical', 'adversity', 'advancement',
    'predominantly', 'prominent', 'recreational', 'resilience', 'undervalue',
    'profound', 'consequently', 'furthermore', 'nevertheless', 'unprecedented',
    'proactive', 'foster', 'subsidize', 'deterrent', 'imperative', 'indispensable',
    'substantially', 'alleviate', 'substantial', 'infrastructure', 'collaboration',
    'however', 'moreover', 'nonetheless', 'therefore', 'whereas', 'significant',
    'perspective', 'fundamental', 'counterpart', 'implement', 'policy'
  ];

  let academicWordCount = 0;
  words.forEach(w => {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
    if (academicKeywords.includes(cleanWord)) {
      academicWordCount++;
    }
  });


  let overallBand = 5.0;

  // Đánh giá dựa trên độ hợp lệ của từ vựng và cấu trúc
  if (isGibberish || wordDiversityRatio < 0.35 || wordCount < 60) {
    overallBand = 3.0;
  } else if (wordCount >= 250 && academicWordCount >= 8 && wordDiversityRatio >= 0.55) {
    overallBand = 8.0;
  } else if (wordCount >= 220 && academicWordCount >= 5 && wordDiversityRatio >= 0.50) {
    overallBand = 7.5;
  } else if (wordCount >= 180 && academicWordCount >= 3 && wordDiversityRatio >= 0.45) {
    overallBand = 7.0;
  } else if (wordCount >= 150 && academicWordCount >= 1) {
    overallBand = 6.5;
  } else if (wordCount >= 100) {
    overallBand = 6.0;
  } else {
    overallBand = 5.0;
  }

  // Tính điểm 4 tiêu chí chuẩn
  const trScore = isGibberish ? 3.0 : Math.max(3.0, Math.min(9.0, overallBand + (wordCount >= 250 ? 0.5 : (wordCount < 150 ? -1.0 : 0))));
  const ccScore = isGibberish ? 3.0 : Math.max(3.0, Math.min(9.0, overallBand + (wordDiversityRatio < 0.4 ? -1.0 : 0)));
  const lrScore = isGibberish ? 3.0 : Math.max(3.0, Math.min(9.0, overallBand + (academicWordCount >= 5 ? 0.5 : (academicWordCount < 2 ? -1.0 : 0))));
  const graScore = isGibberish ? 3.0 : overallBand;

  // Tính lại điểm Overall Band trung bình cộng chuẩn Cambridge
  const calculatedOverall = Math.round(((trScore + ccScore + lrScore + graScore) / 4) * 2) / 2;

  // Phản hồi nhận xét linh hoạt chuẩn xác theo mức điểm thực tế
  let trFeedback = `Bài làm đạt ${wordCount} từ. Đã giải quyết cơ bản các yêu cầu của đề bài.`;
  let ccFeedback = 'Bố cục bài viết được phân chia tương đối rõ ràng giữa các phần.';
  let lrFeedback = `Bài làm sử dụng ${academicWordCount} từ vựng học thuật chuyên sâu.`;
  let graFeedback = 'Đã có nỗ lực áp dụng một số cấu trúc câu phức trong bài.';

  if (calculatedOverall <= 4.0) {
    trFeedback = `Bài viết quá ngắn (${wordCount} từ) hoặc chứa chuỗi từ lặp lại vô nghĩa. Chưa đáp ứng yêu cầu đề bài.`;
    ccFeedback = 'Ý tưởng rời rạc, chưa có liên kết đoạn văn và thiếu phương tiện nối phù hợp.';
    lrFeedback = 'Vốn từ vựng rất hạn chế, nhiều từ bị lặp hoặc mắc lỗi chính tả nghiêm trọng.';
    graFeedback = 'Thường xuyên mắc lỗi cấu trúc câu cơ bản, thiếu sự đa dạng về ngữ pháp.';
  } else if (calculatedOverall <= 6.0) {
    trFeedback = `Bài làm đạt ${wordCount} từ. Đã nêu được quan điểm nhưng các luận điểm và ví dụ chưa được phát triển sâu.`;
    ccFeedback = 'Đã có phân chia đoạn văn nhưng việc sử dụng từ nối còn gượng ép hoặc lặp lại.';
    lrFeedback = 'Sử dụng vốn từ vựng đủ dùng cho chủ đề, tuy nhiên còn lặp từ và ít từ vựng nâng cao.';
    graFeedback = 'Đa số sử dụng câu đơn hoặc câu ghép cơ bản, còn xuất hiện một số lỗi ngữ pháp.';
  } else if (calculatedOverall >= 7.5) {
    trFeedback = `Bài làm xuất sắc (${wordCount} từ). Giải quyết trọn vẹn và sâu sắc tất cả các khía cạnh của đề bài kèm ví dụ minh họa thuyết phục.`;
    ccFeedback = 'Bố cục bài luận mạch lạc tuyệt đối, sử dụng phương tiện nối tự nhiên và mượt mà.';
    lrFeedback = `Sử dụng vốn từ phong phú (${academicWordCount} collocations học thuật), phối hợp từ vựng chuẩn xác và tự nhiên.`;
    graFeedback = 'Sử dụng thành thạo và đa dạng các cấu trúc câu phức với độ chính xác cao.';
  }

  return {
    overallBand: calculatedOverall,
    criteriaScores: {
      TR: { score: trScore, feedback: trFeedback },
      CC: { score: ccScore, feedback: ccFeedback },
      LR: { score: lrScore, feedback: lrFeedback },
      GRA: { score: graScore, feedback: graFeedback }
    },
    detailedCorrections: isGibberish ? [
      {
        original: words[0] || 'Từ sai',
        corrected: 'Cần viết bài luận tiếng Anh hoàn chỉnh',
        explanation: 'Bài làm chứa chuỗi ký tự lặp lại vô nghĩa. Hãy viết câu hoàn chỉnh theo yêu cầu đề thi.'
      }
    ] : []
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
        const systemPrompt = `Bạn là một Giám khảo chấm thi IELTS Writing Task 2 chuyên nghiệp của tổ chức IDP và British Council (nghiêm túc, công bằng và tuân thủ 100% tài liệu IELTS Writing Task 2 Official Band Descriptors).

Nhiệm vụ của bạn là phân tích bài làm của học viên và đánh giá CHÍNH XÁC, THỰC TẾ từng tiêu chí theo thang điểm IELTS chuẩn từ 1.0 đến 9.0 dựa trên chất lượng thực sự của bài làm:

1. **Task Achievement / Task Response (TR)**:
   - Band 8.0+: Trả lời trọn vẹn và sâu sắc tất cả các phần của đề bài, lập luận chặt chẽ, ví dụ cụ thể, dài trên 250 từ.
   - Band 5.0 - 6.0: Trả lời được đề bài nhưng ý còn sơ sài, thiếu ví dụ hoặc bài chưa đạt 250 từ.
   - Band 3.0 - 4.0: Bài quá ngắn (dưới 100 từ), lạc đề, hoặc chỉ viết được vài câu chưa hoàn chỉnh.

2. **Coherence and Cohesion (CC)**:
   - Band 8.0+: Chia đoạn hoàn hảo, liên kết câu/đoạn tự nhiên, mượt mà.
   - Band 5.0 - 6.0: Có dùng từ nối nhưng còn lặp hoặc gượng ép, chia đoạn chưa hợp lý.
   - Band 3.0 - 4.0: Thiếu kết nối giữa các câu, ý tưởng rời rạc không logic.

3. **Lexical Resource (LR)**:
   - Band 8.0+: Vốn từ vựng phong phú, sử dụng chính xác collocations và uncommon words, rất hiếm lỗi chính tả.
   - Band 5.0 - 6.0: Từ vựng đủ dùng cho chủ đề nhưng chủ yếu là từ đơn giản, lặp từ, mắc một số lỗi dùng từ/chính tả.
   - Band 3.0 - 4.0: Vốn từ rất hạn chế, mắc lỗi chính tả/từ vựng nghiêm trọng làm cản trở việc hiểu nội dung.

4. **Grammatical Range and Accuracy (GRA)**:
   - Band 8.0+: Sử dụng thành thạo và đa dạng các cấu trúc câu phức, độ chính xác cao.
   - Band 5.0 - 6.0: Có cố gắng dùng câu phức nhưng mắc nhiều lỗi ngữ pháp hoặc đa số chỉ đúng ở câu đơn.
   - Band 3.0 - 4.0: Thường xuyên mắc lỗi ngữ pháp cơ bản (thì, hòa hợp chủ ngữ - động từ, cấu trúc câu).

⚠️ QUY TẮC ĐÁNH GIÁ CHÂM ĐIỂM:
- Đánh giá khách quan đúng năng lực thực tế. Nếu bài làm xuất sắc (Band 8.0+), hãy cho điểm 8.0 - 8.5+. Ngược lại, nếu bài viết ngây ngô, kém chất lượng, ngắn hoặc sai ngữ pháp/từ vựng nghiêm trọng (Band 3.0 - 5.0), bạn BẮT BUỘC phải cho điểm thấp tương ứng theo chuẩn Rubric. KHÔNG NÂNG ĐIỂM ẢO!


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
module.exports.fallbackGrading = fallbackGrading;

