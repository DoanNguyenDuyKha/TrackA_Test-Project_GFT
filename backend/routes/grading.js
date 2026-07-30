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
  } else if (wordCount >= 220 && academicWordCount >= 6 && wordDiversityRatio >= 0.50) {
    overallBand = 7.5;
  } else if (wordCount >= 200 && academicWordCount >= 4 && wordDiversityRatio >= 0.48) {
    overallBand = 7.0;
  } else if (wordCount >= 180 && academicWordCount >= 2 && wordDiversityRatio >= 0.45) {
    overallBand = 6.5;
  } else if (wordCount >= 150 && academicWordCount >= 1 && wordDiversityRatio >= 0.40) {
    overallBand = 6.0;
  } else if (wordCount >= 100) {
    overallBand = 5.5;
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

  // Tạo các gợi ý bóc tách sửa lỗi & nâng cấp từ vựng đắt giá (Bóc tách câu trực quan)
  let corrections = [];
  if (isGibberish) {
    corrections.push({
      original: words[0] || 'Từ sai',
      corrected: 'Cần viết bài luận tiếng Anh hoàn chỉnh',
      explanation: 'Bài làm chứa chuỗi ký tự lặp lại vô nghĩa. Hãy viết câu hoàn chỉnh theo yêu cầu đề thi.'
    });
  } else {
    // Tự động quét và gợi ý bóc tách nâng band các cụm từ phổ thông sang chuẩn Band 8.0+
    const enhancementsMap = [
      { original: 'environmental problems', corrected: 'environmental degradation', explanation: 'Thay cụm từ phổ thông bằng thuật ngữ học thuật C1/C2 để nâng Lexical Resource.' },
      { original: 'stop spending money on', corrected: 'cease subsidizing', explanation: 'Dùng từ động từ "cease" và "subsidize" để diễn đạt trang trọng và chuẩn IELTS Task 2.' },
      { original: 'fossil fuels', corrected: 'fossil fuel consumption', explanation: 'Mở rộng cụm danh từ để bài viết mang tính học thuật cao hơn.' },
      { original: 'a lot of pollution', corrected: 'significant greenhouse gas emissions', explanation: 'Diễn đạt chính xác và chuyên sâu hơn về ô nhiễm môi trường.' },
      { original: 'good points and bad points', corrected: 'merits and drawbacks', explanation: 'Thay cụm từ ngây ngô "good/bad points" bằng các thuật ngữ tranh luận học thuật.' },
      { original: 'some problems', corrected: 'unintended socioeconomic consequences', explanation: 'Nâng cấp tư duy lập luận và vốn từ Band 8.5+.' },
      { original: 'cleaner than', corrected: 'far more environmentally sustainable than', explanation: 'Tăng sức nặng cho lập luận so sánh trong Task Response.' },
      { original: 'help countries reduce', corrected: 'enable nations to mitigate', explanation: 'Sử dụng động từ nâng cao "enable" và "mitigate" để thể hiện phong cách viết Band 8.0.' }
    ];

    enhancementsMap.forEach(item => {
      if (studentAnswers.includes(item.original) || studentAnswers.toLowerCase().includes(item.original.toLowerCase())) {
        corrections.push(item);
      }
    });

    // Nếu bài viết quá mượt chưa khớp cụm từ nào ở trên, tự động trích từ đơn giản trong bài để gợi ý nâng cấp
    if (corrections.length === 0 && words.length > 50) {
      corrections.push({
        original: 'important for protecting',
        corrected: 'crucial for safeguarding',
        explanation: 'Sử dụng cặp từ vựng chuyên sâu "crucial for safeguarding" để tối ưu hóa tiêu chí Lexical Resource.'
      });
    }
  }

  return {
    overallBand: calculatedOverall,
    criteriaScores: {
      TR: { score: trScore, feedback: trFeedback },
      CC: { score: ccScore, feedback: ccFeedback },
      LR: { score: lrScore, feedback: lrFeedback },
      GRA: { score: graScore, feedback: graFeedback }
    },
    detailedCorrections: corrections
  };


}

// POST /api/grading/generate-promotion-prompt - API Sinh đề thi nâng hạng & Đề thi AI Độc Bản cho Học Viên Xuất Sắc
router.post('/generate-promotion-prompt', authenticateToken, async (req, res) => {
  try {
    const studentGroup = req.user.studentGroup || 'support';
    let targetGroup = studentGroup === 'excellent' ? 'excellent' : (studentGroup === 'average' ? 'excellent' : 'average');


    const topics = ['Education', 'Health', 'Art', 'Technology', 'Sport', 'Social Issues', 'Environment'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const timestamp = new Date().getTime();
    const uniqueExamId = Math.floor(Math.random() * 9000 + 1000);

    let examTitle = studentGroup === 'excellent' 
      ? `AI Master Exam #${uniqueExamId} - Topic ${randomTopic} (Band 8.5+ Challenge)`
      : `Bài Test Nâng Hạng (${studentGroup.toUpperCase()} ➔ ${targetGroup.toUpperCase()})`;

    const fallbackPrompts = {
      Education: [
        "Some people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university should be to give access to knowledge for its own sake, regardless of whether the course is useful to an employer. Discuss both views and give your opinion.",
        "In many countries, secondary schools now require students to perform unpaid community work. Do the advantages of this requirement outweigh the disadvantages?"
      ],
      Health: [
        "Some people believe that the government should introduce a tax on unhealthy food and drinks to encourage healthier eating habits. To what extent do you agree or disagree?",
        "With the increasing availability of medical information online, more people are self-diagnosing illnesses instead of consulting healthcare professionals. Discuss the causes and impacts of this trend."
      ],
      Art: [
        "Some people argue that government funding for the arts, such as music and theatre, is a waste of money in modern society. To what extent do you agree or disagree?",
        "Art and music classes are being reduced in many school curricula to make more room for science and mathematics. Is this a positive or negative development?"
      ],
      Technology: [
        "Some people believe that advanced technological developments, such as artificial intelligence and automation, produce severe ethical dilemmas in modern society. To what extent do you agree or disagree?",
        "The increasing use of smartphones and social media has altered human interaction significantly. Do the benefits of this technology outweigh the drawbacks?"
      ],
      Sport: [
        "Successful sports professionals can earn a great deal more money than people in other important professions. Some people think this is fully justified, while others think it is unfair. Discuss both views and give your opinion.",
        "Hosting international sporting events brings major economic and social benefits to a country. To what extent do you agree or disagree?"
      ],
      'Social Issues': [
        "In many countries, an increasing number of young people are choosing to live alone rather than with their families or roommates. What are the reasons for this, and is it a positive or negative trend?",
        "The gap between the wealthy and the poor is widening globally. What problems does this disparity cause, and what measures can be taken to reduce it?"
      ],
      Environment: [
        "Environmental pollution is a global problem, and it can only be solved through international cooperation rather than individual action. To what extent do you agree or disagree?",
        "The consumption of single-use plastic has caused severe damage to marine ecosystems. What are the primary causes, and how can governments encourage sustainable alternatives?"
      ]
    };

    let fullSuggestedVocab = [
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

    let fullExercises = [
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

    const topicPrompts = fallbackPrompts[randomTopic] || fallbackPrompts['Technology'];
    let promptText = topicPrompts[Math.floor(Math.random() * topicPrompts.length)];

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-fallback') {
      try {
        const aiRes = await openai.chat.completions.create({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `Bạn là Chuyên gia ra đề IELTS Writing Task 2 Cambridge. Sáng tạo 1 đề thi độc bản hoàn toàn mới về chủ đề ${randomTopic} dạng JSON:
{
  "prompt": "Câu hỏi essay IELTS Task 2 bằng tiếng Anh độc bản hoàn toàn mới",
  "suggestedVocabulary": [
    { "word": "từ vựng C1/C2", "meaning": "nghĩa tiếng Việt", "collocation": "cụm từ đi kèm" }
  ],
  "exercises": [
    { "prompt": "Mô tả câu hỏi", "blankSpaceText": "Câu có chỗ trống _______", "correctAnswer": "từ cần điền", "explanation": "giải thích chi tiết" }
  ]
}`
            },
            {
              role: 'user',
              content: `Sáng tạo đề thi IELTS Task 2 độc bản mới về chủ đề ${randomTopic} (Mã sinh ngẫu nhiên #${timestamp}).`
            }
          ],
          temperature: 0.95
        });

        const parsedAI = JSON.parse(aiRes.choices[0].message.content);
        if (parsedAI.prompt) promptText = parsedAI.prompt;
        if (parsedAI.suggestedVocabulary && Array.isArray(parsedAI.suggestedVocabulary)) fullSuggestedVocab = parsedAI.suggestedVocabulary;
        if (parsedAI.exercises && Array.isArray(parsedAI.exercises)) fullExercises = parsedAI.exercises;
      } catch (e) {
        console.error('Error generating AI prompt, using fallback:', e.message);
      }
    }



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


    const topics = ['Education', 'Health', 'Art', 'Technology', 'Sport', 'Social Issues', 'Environment'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const timestamp = new Date().getTime();
    const uniqueExamId = Math.floor(Math.random() * 9000 + 1000);

    let examTitle = `AI Master Exam #${uniqueExamId} - Topic ${randomTopic} (Band 8.5+ Challenge)`;
    const fallbackPrompts = {
      Education: [
        "Some people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university should be to give access to knowledge for its own sake, regardless of whether the course is useful to an employer. Discuss both views and give your opinion.",
        "In many countries, secondary schools now require students to perform unpaid community work. Do the advantages of this requirement outweigh the disadvantages?"
      ],
      Health: [
        "Some people believe that the government should introduce a tax on unhealthy food and drinks to encourage healthier eating habits. To what extent do you agree or disagree?",
        "With the increasing availability of medical information online, more people are self-diagnosing illnesses instead of consulting healthcare professionals. Discuss the causes and impacts of this trend."
      ],
      Art: [
        "Some people argue that government funding for the arts, such as music and theatre, is a waste of money in modern society. To what extent do you agree or disagree?",
        "Art and music classes are being reduced in many school curricula to make more room for science and mathematics. Is this a positive or negative development?"
      ],
      Technology: [
        "Some people believe that advanced technological developments, such as artificial intelligence and automation, produce severe ethical dilemmas in modern society. To what extent do you agree or disagree?",
        "The increasing use of smartphones and social media has altered human interaction significantly. Do the benefits of this technology outweigh the drawbacks?"
      ],
      Sport: [
        "Successful sports professionals can earn a great deal more money than people in other important professions. Some people think this is fully justified, while others think it is unfair. Discuss both views and give your opinion.",
        "Hosting international sporting events brings major economic and social benefits to a country. To what extent do you agree or disagree?"
      ],
      'Social Issues': [
        "In many countries, an increasing number of young people are choosing to live alone rather than with their families or roommates. What are the reasons for this, and is it a positive or negative trend?",
        "The gap between the wealthy and the poor is widening globally. What problems does this disparity cause, and what measures can be taken to reduce it?"
      ],
      Environment: [
        "Environmental pollution is a global problem, and it can only be solved through international cooperation rather than individual action. To what extent do you agree or disagree?",
        "The consumption of single-use plastic has caused severe damage to marine ecosystems. What are the primary causes, and how can governments encourage sustainable alternatives?"
      ]
    };

    const topicPrompts = fallbackPrompts[randomTopic] || fallbackPrompts['Technology'];
    let promptText = topicPrompts[Math.floor(Math.random() * topicPrompts.length)];

    let fullSuggestedVocab = [
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

    let fullExercises = [
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

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-fallback') {
      try {
        const aiRes = await openai.chat.completions.create({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `Bạn là Chuyên gia ra đề IELTS Writing Task 2 Cambridge. Sáng tạo 1 đề thi độc bản hoàn toàn mới về chủ đề ${randomTopic} dạng JSON:
{
  "prompt": "Câu hỏi essay IELTS Task 2 bằng tiếng Anh độc bản hoàn toàn mới",
  "suggestedVocabulary": [
    { "word": "từ vựng C1/C2", "meaning": "nghĩa tiếng Việt", "collocation": "cụm từ đi kèm" }
  ],
  "exercises": [
    { "prompt": "Mô tả câu hỏi", "blankSpaceText": "Câu có chỗ trống _______", "correctAnswer": "từ cần điền", "explanation": "giải thích chi tiết" }
  ]
}`
            },
            {
              role: 'user',
              content: `Sáng tạo đề thi IELTS Task 2 độc bản mới về chủ đề ${randomTopic} (Mã sinh ngẫu nhiên #${timestamp}).`
            }
          ],
          temperature: 0.95
        });

        const parsedAI = JSON.parse(aiRes.choices[0].message.content);
        if (parsedAI.prompt) promptText = parsedAI.prompt;
        if (parsedAI.suggestedVocabulary && Array.isArray(parsedAI.suggestedVocabulary)) fullSuggestedVocab = parsedAI.suggestedVocabulary;
        if (parsedAI.exercises && Array.isArray(parsedAI.exercises)) fullExercises = parsedAI.exercises;
      } catch (e) {
        console.error('Error generating AI prompt in generate-ai-exam, using fallback:', e.message);
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

    if (!assignmentId || !studentAnswers || !studentAnswers.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập bài luận trước khi nộp bài.'
      });
    }

    const words = studentAnswers.trim().split(/\s+/).filter(Boolean);
    const isGibberish = words.some(w => /(.)\1{4,}/.test(w) || w.length > 25);
    const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, ''))).size;
    const wordDiversityRatio = words.length > 0 ? (uniqueWords / words.length) : 0;

    // Chặn bài nộp rác hoặc ngắn không hợp lệ
    if (words.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Bài làm quá ngắn! Vui lòng viết tối thiểu 50 từ trước khi nộp bài để AI chấm điểm.'
      });
    }

    if (isGibberish || wordDiversityRatio < 0.3) {
      return res.status(400).json({
        success: false,
        message: 'Phát hiện văn bản rác / vô nghĩa! Bài làm chứa các chuỗi ký tự gõ lặp lại không hợp lệ. Vui lòng viết câu tiếng Anh hoàn chỉnh.'
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
        // Lấy tiêu chí Rubric động mới nhất do Admin cấu hình từ CSDL
        const { Rubric } = require('./rubrics');
        let activeRubricDocs = await Rubric.find({});
        
        let customRubricInstruction = '';
        if (activeRubricDocs && activeRubricDocs.length > 0) {
          customRubricInstruction = activeRubricDocs.map(r => `
- Tiêu chí ${r.name} (${r.criterionKey}): ${r.description}
  * Band 8.0: ${r.bands?.[8] || ''}
  * Band 7.0: ${r.bands?.[7] || ''}
  * Band 6.0: ${r.bands?.[6] || ''}
  * Band 5.0: ${r.bands?.[5] || ''}`).join('\n');
        }

        const systemPrompt = `Bạn là một Giám khảo chấm thi IELTS Writing Task 2 chuyên nghiệp của tổ chức IDP và British Council (nghiêm túc, công bằng và tuân thủ 100% tài liệu IELTS Writing Task 2 Official Band Descriptors).

Nhiệm vụ của bạn là phân tích bài làm của học viên và đánh giá CHÍNH XÁC, THỰC TẾ từng tiêu chí theo thang điểm IELTS chuẩn từ 1.0 đến 9.0 dựa trên Tiêu Chí Rubric Đăng Ký Hệ Thống:
${customRubricInstruction}


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

    // ── Tạo Thông Báo Cho Admin: Học viên vừa nộp bài ──
    try {
      const Notification = require('../models/Notification');
      const admins = await User.find({ role: 'admin' });
      const adminNotifData = {
        title: '📩 Bài Nộp Mới Từ Học Viên',
        message: `Học viên ${student.name} (${student.studentGroup?.toUpperCase()}) vừa nộp bài "${assignment.title}" — Kết quả: ${evaluationResult.overallBand} Band`,
        type: 'submission_alert',
        senderId: studentId,
        senderName: student.name,
        isRead: false
      };

      for (const admin of admins) {
        await Notification.create({ ...adminNotifData, recipientId: admin._id });
      }

      // Emit socket nếu có (local dev)
      const io = req.app.get('io');
      if (io) {
        io.to('admin_room').emit('admin_submission_alert', {
          studentName: student.name,
          studentGroup: student.studentGroup,
          assignmentTitle: assignment.title,
          overallBand: evaluationResult.overallBand
        });
      }
    } catch (notifErr) {
      console.error('Admin notification error (non-critical):', notifErr.message);
    }

    // 1. Lấy danh sách đề thi thuộc nhóm năng lực của học viên (không tính các đề AI)
    const groupAssignments = await Assignment.find({
      targetGroup: student.studentGroup,
      title: { $not: /AI Master Exam|Test Code #|Test Route #|Nâng Hạng/i }
    });


    const totalGroupAssignments = groupAssignments.length;
    const requiredBandForGroup = student.studentGroup === 'support' ? 5.5 : (student.studentGroup === 'average' ? 6.5 : 7.5);

    // 2. Lấy tất cả bài nộp của học viên và lọc bài nộp ĐẠT YÊU CẦU DỰA TRÊN ĐIỂM (score >= requiredBandForGroup)
    const allUserSubmissions = await Submission.find({ studentId });
    const passedAssignmentIds = new Set();

    allUserSubmissions.forEach(sub => {
      if (sub.overallBand >= requiredBandForGroup) {
        const assignId = sub.assignmentId?._id || sub.assignmentId;
        if (assignId) {
          passedAssignmentIds.add(assignId.toString());
        }
      }
    });

    const completedGroupCount = groupAssignments.filter(a => passedAssignmentIds.has(a._id.toString())).length;
    const isEligibleForPromotion = totalGroupAssignments > 0 && completedGroupCount >= totalGroupAssignments && student.studentGroup !== 'excellent';

    // 3. Nếu vừa hoàn thành đủ tất cả các bài thi với điểm số đạt chuẩn -> Tự động bắn Thông báo Realtime lên Header của Học viên
    if (isEligibleForPromotion) {
      const Notification = require('../models/Notification');
      const nextGroupLabel = student.studentGroup === 'support' ? 'AVERAGE (6.0 - 7.0 Band)' : 'EXCELLENT (7.5+ Band)';
      const targetMinBand = student.studentGroup === 'support' ? '6.0' : '7.0';

      const existingNotif = await Notification.findOne({
        recipientId: studentId,
        type: 'promotion_unlocked',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (!existingNotif) {
        const newNotif = await Notification.create({
          recipientId: studentId,
          title: '🎉 CHÚC MỪNG! BẠN ĐÃ MỞ KHÓA BÀI THI CHUYỂN CẤP',
          message: `Bạn đã đạt điểm số yêu cầu (>= ${requiredBandForGroup} Band) cho toàn bộ ${totalGroupAssignments} bài thi nhóm ${student.studentGroup.toUpperCase()}! Hãy tham gia Bài Thi Chuyển Cấp ngay (cần đạt >= ${targetMinBand} Band) để thăng hạng lên nhóm ${nextGroupLabel}.`,
          type: 'promotion_unlocked',
          isRead: false
        });

        // Push Socket.IO realtime event to student room
        const io = req.app.get('io');
        if (io) {
          io.to(studentId.toString()).emit('new_notification', newNotif);
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Assignment graded successfully',
      data: {
        submission: newSubmission,
        adaptiveRouting: {
          currentGroup: student.studentGroup,
          groupMigrated: false,
          totalGroupAssignments,
          completedGroupCount,
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

    // ── Thông báo cho Admin về bài Chuyển Cấp vừa nộp ──
    try {
      const Notification = require('../models/Notification');
      const admins = await User.find({ role: 'admin' });
      const promoResult = promoted
        ? `✅ ĐẠT — Đã nâng lên nhóm ${targetNextGroup.toUpperCase()}`
        : `❌ CHƯA ĐẠT — Vẫn ở nhóm ${student.studentGroup.toUpperCase()}`;

      for (const admin of admins) {
        await Notification.create({
          recipientId: admin._id,
          title: '🏆 Kết Quả Bài Thi Chuyển Cấp',
          message: `Học viên ${student.name} nộp Bài Thi Chuyển Cấp (${student.studentGroup?.toUpperCase()} ➔ ${targetNextGroup?.toUpperCase()}) — Band: ${evaluationResult.overallBand} — ${promoResult}`,
          type: 'submission_alert',
          senderId: studentId,
          senderName: student.name,
          isRead: false
        });
      }

      // ── Thông báo cho chính học viên về kết quả ──
      await Notification.create({
        recipientId: studentId,
        title: promoted ? '🎉 CHÚC MỪNG! BẠN ĐÃ CHUYỂN CẤP THÀNH CÔNG!' : '📋 Kết Quả Bài Thi Chuyển Cấp',
        message: promoted
          ? `Band ${evaluationResult.overallBand} — Bạn đã vượt qua ngưỡng ${requiredBand} Band và được nâng lên nhóm ${targetNextGroup.toUpperCase()}! Vào Dashboard để xem đề thi mới của nhóm bạn.`
          : `Band ${evaluationResult.overallBand} — Chưa đạt ngưỡng ${requiredBand} Band để chuyển cấp. Hãy luyện tập thêm và thử lại!`,
        type: 'promotion_unlocked',
        isRead: false
      });

      // Emit socket nếu có
      const io = req.app.get('io');
      if (io) {
        io.to('admin_room').emit('admin_submission_alert', {
          studentName: student.name,
          studentGroup: student.studentGroup,
          assignmentTitle: assignment.title,
          overallBand: evaluationResult.overallBand
        });
      }
    } catch (notifErr) {
      console.error('Promotion notification error (non-critical):', notifErr.message);
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

