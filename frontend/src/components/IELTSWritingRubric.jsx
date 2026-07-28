import React, { useState } from 'react';
import { BookOpen, Sparkles, Target, ArrowRight, Info, CheckCircle2 } from 'lucide-react';

const RUBRIC_DATA = {
  TR: {
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

const IELTSWritingRubric = () => {
  const [activeCriterion, setActiveCriterion] = useState('TR');
  const [viewMode, setViewMode] = useState('full'); // 'full' | 'transition'

  // State cho Chế độ Phân Tích Chuyển Band
  const [currentBand, setCurrentBand] = useState(6);
  const [targetBand, setTargetBand] = useState(7);

  const transitionKey = `${currentBand}-${targetBand}`;
  const currentCriterionData = RUBRIC_DATA[activeCriterion];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
      {/* Header Tra Cứu */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
            Bảng Tra Cứu Tiêu Chí IELTS Task 2 Band Descriptors
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dữ liệu tiêu chuẩn chính thức từ Cambridge ESOL - Đánh giá 4 tiêu chí TR, CC, LR, GRA
          </p>
        </div>

        {/* Toggle Mode Button */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setViewMode('full')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              viewMode === 'full'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ma Trận Chi Tiết
          </button>
          <button
            onClick={() => setViewMode('transition')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1 ${
              viewMode === 'transition'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Phân Tích Chuyển Band AI
          </button>
        </div>
      </div>

      {/* Tabs Chọn Tiêu Chí Chấm */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.keys(RUBRIC_DATA).map((key) => (
          <button
            key={key}
            onClick={() => setActiveCriterion(key)}
            className={`p-3 rounded-2xl text-left border transition ${
              activeCriterion === key
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 font-semibold hover:bg-slate-100'
            }`}
          >
            <div className="text-xs text-slate-400">{key}</div>
            <div className="text-sm font-extrabold truncate">{RUBRIC_DATA[key].name}</div>
          </button>
        ))}
      </div>

      {/* Mô tả tiêu chí đang chọn */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 italic">
        <Info className="w-4 h-4 inline mr-1 text-blue-600" />
        {currentCriterionData.description}
      </div>

      {/* CHẾ ĐỘ 1: MA TRẬN FULL */}
      {viewMode === 'full' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[5, 6, 7, 8].map((band) => (
            <div
              key={band}
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 ${
                band === 7
                  ? 'bg-purple-50/50 border-purple-200'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-800 text-white inline-block mb-2">
                  BAND {band}.0
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {currentCriterionData.bands[band]}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CHẾ ĐỘ 2: PHÂN TÍCH CHUYỂN BAND AI */}
      {viewMode === 'transition' && (
        <div className="space-y-6">
          {/* Bộ chọn Band Hiện tại vs Band Mục tiêu */}
          <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-purple-50 rounded-2xl border border-purple-100">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <span>Band Hiện tại:</span>
              <select
                value={currentBand}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCurrentBand(val);
                  if (val >= targetBand) setTargetBand(val + 1);
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
              >
                <option value={5}>Band 5.0</option>
                <option value={6}>Band 6.0</option>
                <option value={7}>Band 7.0</option>
              </select>
            </div>

            <ArrowRight className="w-5 h-5 text-purple-600 hidden sm:block" />

            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <span>Band Mục tiêu:</span>
              <select
                value={targetBand}
                onChange={(e) => setTargetBand(Number(e.target.value))}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-purple-700"
              >
                {currentBand < 6 && <option value={6}>Band 6.0</option>}
                {currentBand < 7 && <option value={7}>Band 7.0</option>}
                <option value={8}>Band 8.0</option>
              </select>
            </div>
          </div>

          {/* Compare Cards Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full font-bold text-xs">
                Yêu cầu Band {currentBand}.0 hiện tại
              </span>
              <p className="text-xs text-slate-600 leading-relaxed pt-2">
                {currentCriterionData.bands[currentBand] || 'Đang cập nhật...'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 space-y-2 shadow-sm">
              <span className="px-3 py-1 bg-purple-600 text-white rounded-full font-bold text-xs inline-flex items-center">
                <Target className="w-3.5 h-3.5 mr-1" /> Yêu cầu Band {targetBand}.0 bứt phá
              </span>
              <p className="text-xs text-purple-950 font-medium leading-relaxed pt-2">
                {currentCriterionData.bands[targetBand] || 'Đang cập nhật...'}
              </p>
            </div>
          </div>

          {/* AI Coach Notes Block */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white space-y-2 shadow-lg">
            <div className="flex items-center space-x-2 text-yellow-300 font-extrabold text-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>GHI CHÚ SƯ PHẠM TỪ AI COACH (BỨT PHÁ BAND)</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {currentCriterionData.coachNotes[transitionKey] ||
                `Để bứt phá từ Band ${currentBand} lên Band ${targetBand} ở tiêu chí ${activeCriterion}: Học viên cần tập trung khắc phục điểm nghẽn chính, cải thiện tính chính xác và mở rộng cấu trúc câu/từ vựng theo chuẩn Rubric của Cambridge.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IELTSWritingRubric;
