import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { BookOpen, Plus, Trash2, Edit3, CheckCircle2, Sparkles, Filter, X } from 'lucide-react';

const AdminAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State: 3 Ô Nhập Bài Mẫu Riêng Cho 3 Nhóm Học Viên (Support, Average, Excellent)
  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [prompt, setPrompt] = useState('');
  const [topic, setTopic] = useState('Education');
  const [targetGroup, setTargetGroup] = useState('support');
  const [scaffoldingTemplate, setScaffoldingTemplate] = useState('');

  // 3 Ô Nhập Bài Mẫu Riêng Biệt Cho 3 Cấp Độ Học Viên
  const [sampleSupport, setSampleSupport] = useState('');
  const [sampleAverage, setSampleAverage] = useState('');
  const [sampleExcellent, setSampleExcellent] = useState('');

  // Dynamic suggested vocabulary cho nhóm excellent
  const [suggestedVocab, setSuggestedVocab] = useState([
    { word: '', meaning: '', collocation: '' }
  ]);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/assignments');
      if (res.data.success) {
        setAssignments(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleAddVocabRow = () => {
    setSuggestedVocab([...suggestedVocab, { word: '', meaning: '', collocation: '' }]);
  };

  const handleRemoveVocabRow = (index) => {
    setSuggestedVocab(suggestedVocab.filter((_, i) => i !== index));
  };

  const handleVocabChange = (index, field, value) => {
    const updated = [...suggestedVocab];
    updated[index][field] = value;
    setSuggestedVocab(updated);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const filteredVocab = suggestedVocab.filter(v => v.word.trim() !== '');

      const formattedTitle = examDate 
        ? `${title} (Đề thi ngày ${examDate})`
        : title;

      const res = await api.post('/assignments', {
        title: formattedTitle,
        prompt,
        topic,
        targetGroup,
        scaffoldingTemplate,
        sampleAnswer: sampleExcellent,
        groupSampleAnswers: {
          support: sampleSupport,
          average: sampleAverage,
          excellent: sampleExcellent
        },
        suggestedVocabulary: filteredVocab
      });

      if (res.data.success) {
        setShowModal(false);
        setTitle('');
        setExamDate('');
        setPrompt('');
        setTopic('Education');
        setScaffoldingTemplate('');
        setSampleSupport('');
        setSampleAverage('');
        setSampleExcellent('');
        setSuggestedVocab([{ word: '', meaning: '', collocation: '' }]);
        fetchAssignments();
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
      alert('Có lỗi xảy ra khi tạo đề thi mới');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đề thi này?')) return;
    try {
      const res = await api.delete(`/assignments/${id}`);
      if (res.data.success) {
        fetchAssignments();
      }
    } catch (err) {
      console.error('Error deleting assignment:', err);
    }
  };

  const getTargetBadge = (group) => {
    switch (group) {
      case 'support':
        return <span className="px-3 py-1 bg-red-100 text-red-700 font-extrabold text-xs rounded-full border border-red-200">CẦN HỖ TRỢ</span>;
      case 'average':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-extrabold text-xs rounded-full border border-amber-200">TRUNG BÌNH</span>;
      case 'excellent':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 font-extrabold text-xs rounded-full border border-purple-200">XUẤT SẮC</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Quản Lý Đề Thi IELTS Task 2 (Admin)</h1>
            <p className="text-xs text-slate-500 mt-1">
              Thêm mới, cấu hình Dàn ý Scaffolding & Từ vựng nâng cao cho từng nhóm học viên
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Đề Thi Mới</span>
          </button>
        </div>

        {/* Assignments Grid Card */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Đang tải danh sách đề thi...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((item) => (
              <div key={item._id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between space-y-4 hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full">
                      {item.topic}
                    </span>
                    {getTargetBadge(item.targetGroup)}
                  </div>

                  <h3 className="font-extrabold text-slate-800 text-base leading-snug">{item.title}</h3>
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-3">
                    "{item.prompt}"
                  </p>

                  {item.scaffoldingTemplate && (
                    <div className="text-[11px] text-slate-500 bg-red-50/50 p-2.5 rounded-xl border border-red-100">
                      <span className="font-bold text-red-700 block mb-0.5">Dàn ý Scaffolding đính kèm:</span>
                      <p className="line-clamp-2">{item.scaffoldingTemplate}</p>
                    </div>
                  )}

                  {item.suggestedVocabulary && item.suggestedVocabulary.length > 0 && (
                    <div className="text-[11px] text-purple-700 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                      <span className="font-bold block mb-0.5">Bộ từ vựng đính kèm ({item.suggestedVocabulary.length} từ):</span>
                      <p className="line-clamp-1">{item.suggestedVocabulary.map(v => v.word).join(', ')}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-400">
                    Tạo lúc: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    title="Xóa đề thi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Create Assignment */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xl font-extrabold text-slate-800">Tạo Đề Thi IELTS Task 2 Mới</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 mb-1">1. Tiêu đề đề thi</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ví dụ: Real IELTS Writing 2 - Quy mô lớp học"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-normal text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">2. Ngày ra đề thi thật</label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-normal text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">3. Đề bài luận đầy đủ (Prompt)</label>
                  <textarea
                    required
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Nhập câu hỏi essay đầy đủ (Ví dụ: Some people think that...)..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-normal text-sm font-serif leading-relaxed"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1">4. Chủ đề (Topic - Nhập text trực tiếp)</label>
                    <input
                      type="text"
                      required
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Nhập chủ đề (Ví dụ: Education, Environment, Health...)"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">5. Nhóm Học Viên Đích (targetGroup)</label>
                    <select
                      value={targetGroup}
                      onChange={(e) => setTargetGroup(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-blue-600 cursor-pointer"
                    >
                      <option value="support">Support (Cần hỗ trợ)</option>
                      <option value="average">Average (Trung bình)</option>
                      <option value="excellent">Excellent (Xuất sắc)</option>
                    </select>
                  </div>
                </div>

                {/* 3 Ô Nhập Bài Mẫu Riêng Biệt Theo Thang Điểm Dành Cho 3 Nhóm Học Viên */}
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-4">
                  <div className="flex items-center space-x-2 text-blue-900 font-extrabold text-sm border-b border-blue-100 pb-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Bài Luận Mẫu Thích Ứng Theo 3 Cấp Độ Học Viên (AI sẽ dùng làm dữ liệu chuẩn)</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-red-700 font-bold mb-1">
                        • Bài mẫu Band 6.0 - Dành cho Nhóm Cần Hỗ Trợ (Support Group)
                      </label>
                      <textarea
                        rows={3}
                        value={sampleSupport}
                        onChange={(e) => setSampleSupport(e.target.value)}
                        placeholder="Nhập bài essay mẫu ở mức Band 6.0 (từ vựng đơn giản, cấu trúc rõ ràng cho học viên yếu)..."
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-normal text-xs leading-relaxed"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-amber-700 font-bold mb-1">
                        • Bài mẫu Band 7.0 - Dành cho Nhóm Trung Bình (Average Group)
                      </label>
                      <textarea
                        rows={3}
                        value={sampleAverage}
                        onChange={(e) => setSampleAverage(e.target.value)}
                        placeholder="Nhập bài essay mẫu ở mức Band 7.0 (từ vựng học thuật tốt, áp dụng collocations tự nhiên)..."
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-normal text-xs leading-relaxed"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-emerald-700 font-bold mb-1">
                        • Bài mẫu Band 8.5+ - Dành cho Nhóm Xuất Sắc (Excellent Group)
                      </label>
                      <textarea
                        rows={3}
                        value={sampleExcellent}
                        onChange={(e) => setSampleExcellent(e.target.value)}
                        placeholder="Nhập bài essay mẫu xuất sắc ở mức Band 8.5+ (từ vựng advanced, lập luận sắc bén)..."
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-normal text-xs leading-relaxed"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Dàn ý Scaffolding Template hỗ trợ nhóm support & average */}
                <div className="p-4 bg-slate-100/70 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block text-slate-800 font-bold">
                    Dàn ý Gợi ý Scaffolding Template 4 Phần (Mở bài - Thân 1 - Thân 2 - Kết bài)
                  </label>
                  <textarea
                    rows={3}
                    value={scaffoldingTemplate}
                    onChange={(e) => setScaffoldingTemplate(e.target.value)}
                    placeholder="Dàn ý 4 phần chi tiết để hiển thị dạng Card Box..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-normal text-xs"
                  ></textarea>
                </div>

                {/* Nhập Suggested Vocabulary nếu chọn targetGroup excellent */}
                {targetGroup === 'excellent' && (
                  <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-purple-800 font-bold">
                        Gợi ý Bộ Từ Vựng Nâng Cao & Collocations (Nhóm Excellent)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddVocabRow}
                        className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-[11px] font-bold hover:bg-purple-700"
                      >
                        + Thêm hàng
                      </button>
                    </div>

                    {suggestedVocab.map((row, vIdx) => (
                      <div key={vIdx} className="grid grid-cols-3 gap-2 items-center bg-white p-2.5 rounded-xl border border-purple-200">
                        <input
                          type="text"
                          placeholder="Từ vựng (Word)"
                          value={row.word}
                          onChange={(e) => handleVocabChange(vIdx, 'word', e.target.value)}
                          className="p-2 border border-slate-200 rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Nghĩa (Meaning)"
                          value={row.meaning}
                          onChange={(e) => handleVocabChange(vIdx, 'meaning', e.target.value)}
                          className="p-2 border border-slate-200 rounded-lg text-xs"
                        />
                        <div className="flex space-x-1">
                          <input
                            type="text"
                            placeholder="Collocation"
                            value={row.collocation}
                            onChange={(e) => handleVocabChange(vIdx, 'collocation', e.target.value)}
                            className="p-2 border border-slate-200 rounded-lg text-xs w-full"
                          />
                          {suggestedVocab.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVocabRow(vIdx)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700"
                  >
                    Lưu & Tạo Đề Thi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAssignments;
