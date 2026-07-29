const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Schema lưu trữ Rubric tùy chỉnh của Admin trong CSDL MongoDB
const RubricSchema = new mongoose.Schema({
  criterionKey: { type: String, required: true, unique: true }, // 'TR', 'CC', 'LR', 'GRA'
  name: { type: String, required: true },
  description: { type: String, required: true },
  bands: {
    5: { type: String, required: true },
    6: { type: String, required: true },
    7: { type: String, required: true },
    8: { type: String, required: true }
  },
  coachNotes: {
    '5-6': { type: String, required: true },
    '6-7': { type: String, required: true },
    '7-8': { type: String, required: true }
  },
  updatedAt: { type: Date, default: Date.now }
});

const Rubric = mongoose.models.Rubric || mongoose.model('Rubric', RubricSchema);

// Dữ liệu Rubric mặc định chuẩn IELTS Task 2 Band Descriptors
const DEFAULT_RUBRICS = {
  TR: {
    criterionKey: 'TR',
    name: 'Task Response (TR)',
    description: 'Đánh giá mức độ trả lời đầy đủ yêu cầu đề bài và tính phát triển của luận điểm.',
    bands: {
      5: 'Chỉ giải quyết đề bài một cách một chiều/bề nổi; các ý kiến chính hạn chế và có thể thiếu tập trung hoặc chứa lỗi khái quát hóa quá mức (over-generalisations).',
      6: 'Giải quyết được tất cả các phần của đề bài; đưa ra quan điểm rõ ràng xuyên suốt; phát triển các ý chính nhưng một số ý còn thiếu chi tiết hoặc mơ hồ.',
      7: 'Giải quyết trọn vẹn mọi yêu cầu đề bài; đưa ra lập luận phát triển rõ ràng với các ý hỗ trợ được mở rộng có logic và bằng chứng cụ thể.',
      8: 'Trả lời đầy đủ và sâu sắc mọi khía cạnh đề bài; phát triển ý tưởng vượt trội với sự mở rộng luận điểm thuyết phục.'
    },
    coachNotes: {
      '5-6': 'Để nâng từ Band 5 lên Band 6: Cần đảm bảo trả lời ĐẦY ĐỦ cả 2 vế của đề bài. Tránh đưa ra các nhận định chung chung thiếu căn cứ.',
      '6-7': 'Để nâng từ Band 6 lên Band 7: Khắc phục triệt để lỗi "khái quát hóa quá mức" (over-generalisations). Mỗi body paragraph chỉ tập trung vào 1-2 ý chính và phát triển sâu với ví dụ minh họa cụ thể.',
      '7-8': 'Để đạt Band 8: Phát triển lập luận sắc bén, phản biện đa chiều và liên kết luận điểm một cách tự nhiên.'
    }
  },
  CC: {
    criterionKey: 'CC',
    name: 'Coherence and Cohesion (CC)',
    description: 'Đánh giá tính mạch lạc, bố cục chia đoạn và cách sử dụng các công cụ kết nối.',
    bands: {
      5: 'Thông tin có thứ tự nhưng thiếu tính logic chung; sử dụng từ nối bị rập khuôn, máy móc (mechanical cohesive devices) hoặc lặp lại.',
      6: 'Bố cục bài viết bài bản có 4 đoạn; sắp xếp thông tin có mạch nếp; sử dụng từ nối hợp lý nhưng đôi chỗ còn thiếu tự nhiên hoặc lạm dụng.',
      7: 'Tổ chức thông tin mạch lạc và có luồng phát triển logic rõ ràng; chia đoạn chuẩn xác; sử dụng linh hoạt và tự nhiên các từ nối.',
      8: 'Mạch văn trôi chảy tự nhiên; liên kết câu và đoạn hoàn hảo mà không cần nỗ lực nhận biết từ nối.'
    },
    coachNotes: {
      '5-6': 'Để nâng từ Band 5 lên Band 6: Đảm bảo bài viết chia 4 đoạn rõ ràng. Sử dụng từ nối cơ bản đúng vị trí.',
      '6-7': 'Để nâng từ Band 6 lên Band 7: Loại bỏ ngay các từ nối rập khuôn, máy móc (mechanical cohesive devices) như "Firstly, Secondly, In a nutshell". Thay thế bằng cách nối ý bằng đại từ thay thế hoặc câu chuyển tiếp tự nhiên.',
      '7-8': 'Để đạt Band 8: Tối ưu hóa tính Cohesion ẩn (cohesion through referencing & substitution), giúp bài văn chảy mượt mà không cần phụ thuộc quá nhiều từ nối đứng đầu câu.'
    }
  },
  LR: {
    criterionKey: 'LR',
    name: 'Lexical Resource (LR)',
    description: 'Đánh giá độ phong phú từ vựng, tính chính xác và sử dụng cụm collocations tự nhiên.',
    bands: {
      5: 'Vốn từ vựng hạn chế; mắc lỗi chính tả hoặc dùng từ sai ngữ cảnh làm ảnh hưởng đến người đọc.',
      6: 'Vốn từ vựng đủ dùng cho đề bài; có nỗ lực sử dụng từ vựng ít phổ biến nhưng còn mắc lỗi lựa chọn từ (word choice) hoặc collocations.',
      7: 'Sử dụng vốn từ vựng phong phú và linh hoạt; ứng dụng tự nhiên các cụm từ ít phổ biến (uncommon lexical items) và cụm collocations đắt giá.',
      8: 'Vốn từ vựng dồi dào, tinh tế; sử dụng collocations chuẩn xác tuyệt đối, chỉ mắc lỗi hiếm hoi không đáng kể.'
    },
    coachNotes: {
      '5-6': 'Để nâng từ Band 5 lên Band 6: Kiểm tra kỹ chính tả và dạng từ (word family). Tránh lặp từ bằng cách dùng từ đồng nghĩa cơ bản.',
      '6-7': 'Để nâng từ Band 6 lên Band 7: Tích hợp các cụm từ ít phổ biến (uncommon lexical items) và cụm Collocations tự nhiên theo từng chủ đề (Education, Health, Art,...).',
      '7-8': 'Để đạt Band 8: Làm chủ sắc thái nghĩa của từ (precision in word choice) và sử dụng thuật ngữ chuyên ngành một cách tự nhiên như người bản xứ.'
    }
  },
  GRA: {
    criterionKey: 'GRA',
    name: 'Grammatical Range and Accuracy (GRA)',
    description: 'Đánh giá độ đa dạng và tính chính xác của các cấu trúc ngữ pháp.',
    bands: {
      5: 'Chỉ sử dụng linh hoạt các câu đơn; nỗ lực viết câu phức nhưng thường xuyên mắc lỗi ngữ pháp và chấm câu.',
      6: 'Kết hợp hài hòa giữa câu đơn và câu phức; mắc một số lỗi ngữ pháp nhưng không làm gián đoạn việc truyền tải ý nghĩa.',
      7: 'Sử dụng đa dạng các cấu trúc câu phức nâng cao; phần lớn các câu hoàn toàn không có lỗi ngữ pháp (frequent error-free sentences).',
      8: 'Sử dụng linh hoạt và chuẩn xác tuyệt đối các cấu trúc ngữ pháp phức tạp.'
    },
    coachNotes: {
      '5-6': 'Để nâng từ Band 5 lên Band 6: Luyện tập viết đúng các dạng câu phức cơ bản (mệnh đề quan hệ, mệnh đề nhượng bộ Although/Even though).',
      '6-7': 'Để nâng từ Band 6 lên Band 7: Tăng tỷ lệ các câu hoàn toàn không có lỗi (error-free sentences). Áp dụng đảo ngữ, câu điều kiện mixed, hoặc đảo ngữ phân từ.',
      '7-8': 'Để đạt Band 8: Tối ưu hóa cấu trúc câu phức hợp (complex-compound sentences) mà vẫn duy trì tính chính xác ngữ pháp 100%.'
    }
  }
};

// GET /api/rubrics - Lấy toàn bộ danh sách tiêu chí Rubric (Tất cả người dùng)
router.get('/', async (req, res) => {
  try {
    let dbRubrics = await Rubric.find({});
    
    // Nếu trong CSDL chưa có dữ liệu -> Tự động khởi tạo dữ liệu mặc định
    if (dbRubrics.length === 0) {
      const docsToInsert = Object.values(DEFAULT_RUBRICS);
      dbRubrics = await Rubric.insertMany(docsToInsert);
    }

    const rubricMap = {};
    dbRubrics.forEach(doc => {
      rubricMap[doc.criterionKey] = doc;
    });

    return res.status(200).json({
      success: true,
      data: rubricMap
    });
  } catch (error) {
    console.error('GET Rubrics Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching rubrics', error: error.message });
  }
});

// PUT /api/rubrics/:key - Admin cập nhật tiêu chí Rubric
router.put('/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { name, description, bands, coachNotes } = req.body;

    if (!['TR', 'CC', 'LR', 'GRA'].includes(key)) {
      return res.status(400).json({ success: false, message: 'Invalid criterion key' });
    }

    const updated = await Rubric.findOneAndUpdate(
      { criterionKey: key },
      {
        name,
        description,
        bands,
        coachNotes,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: `Cập nhật tiêu chí ${key} thành công!`,
      data: updated
    });
  } catch (error) {
    console.error('PUT Rubric Error:', error);
    return res.status(500).json({ success: false, message: 'Error updating rubric', error: error.message });
  }
});

// POST /api/rubrics/reset - Admin khôi phục toàn bộ Rubric về chuẩn IELTS Cambridge ban đầu
router.post('/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Rubric.deleteMany({});
    const docsToInsert = Object.values(DEFAULT_RUBRICS);
    const newRubrics = await Rubric.insertMany(docsToInsert);

    const rubricMap = {};
    newRubrics.forEach(doc => {
      rubricMap[doc.criterionKey] = doc;
    });

    return res.status(200).json({
      success: true,
      message: 'Đã khôi phục toàn bộ Rubric về chuẩn IELTS Cambridge ban đầu!',
      data: rubricMap
    });
  } catch (error) {
    console.error('Reset Rubrics Error:', error);
    return res.status(500).json({ success: false, message: 'Error resetting rubrics', error: error.message });
  }
});

module.exports = router;
module.exports.Rubric = Rubric;
