import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { BookOpen, Plus, Trash2, Edit3, CheckCircle2, Sparkles, Filter, X, Eye } from 'lucide-react';
import AdminConfirmModal from '../components/AdminConfirmModal';



const AdminAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // Tab Modal System: 'general' | 'samples' | 'outline'
  const [editMode, setEditMode] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);

  // View Detail Modal State
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState(null);

  const openViewModal = (item) => {
    setViewingAssignment(item);
    setShowViewModal(true);
  };


  // Form State: 3 Ô Nhập Bài Mẫu Riêng Cho 3 Nhóm Học Viên (Support, Average, Excellent)
  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [prompt, setPrompt] = useState('');
  const [topic, setTopic] = useState('Education');
  const [targetGroup, setTargetGroup] = useState('support');
  // Dàn ý 4 phần riêng biệt (Mở bài, Thân bài 1, Thân bài 2, Kết bài)
  const [outlineIntro, setOutlineIntro] = useState('');
  const [outlineBody1, setOutlineBody1] = useState('');
  const [outlineBody2, setOutlineBody2] = useState('');
  const [outlineConclusion, setOutlineConclusion] = useState('');

  // 3 Ô Nhập Bài Mẫu Riêng Biệt Cho 3 Cấp Độ Học Viên
  const [sampleSupport, setSampleSupport] = useState('');
  const [sampleAverage, setSampleAverage] = useState('');
  const [sampleExcellent, setSampleExcellent] = useState('');

  // Dynamic suggested vocabulary cho nhóm excellent
  const [suggestedVocab, setSuggestedVocab] = useState([
    { word: '', meaning: '', collocation: '' }
  ]);

  const openCreateModal = () => {
    setEditMode(false);
    setEditingAssignmentId(null);
    setTitle('');
    setExamDate('');
    setPrompt('');
    setTopic('Education');
    setTargetGroup('support');
    setOutlineIntro('');
    setOutlineBody1('');
    setOutlineBody2('');
    setOutlineConclusion('');
    setSampleSupport('');
    setSampleAverage('');
    setSampleExcellent('');
    setSuggestedVocab([{ word: '', meaning: '', collocation: '' }]);
    setActiveTab('general');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditMode(true);
    setEditingAssignmentId(item._id);
    setTitle(item.title ? item.title.replace(/\s*\(Đề thi ngày [^)]+\)/, '') : '');
    const matchDate = item.title ? item.title.match(/\(Đề thi ngày ([^)]+)\)/) : null;
    setExamDate(matchDate ? matchDate[1] : '');
    setPrompt(item.prompt || '');
    setTopic(item.topic || 'Education');
    setTargetGroup(item.targetGroup || 'support');

    if (item.scaffoldingTemplate) {
      const introMatch = item.scaffoldingTemplate.match(/1\.\s*\*\*Mở bài[^*]*\*\*\n(?:-\s*)?([\s\S]*?)(?=\n\n2\.|\n2\.|$)/);
      const body1Match = item.scaffoldingTemplate.match(/2\.\s*\*\*Thân bài 1[^*]*\*\*\n(?:-\s*)?([\s\S]*?)(?=\n\n3\.|\n3\.|$)/);
      const body2Match = item.scaffoldingTemplate.match(/3\.\s*\*\*Thân bài 2[^*]*\*\*\n(?:-\s*)?([\s\S]*?)(?=\n\n4\.|\n4\.|$)/);
      const concMatch = item.scaffoldingTemplate.match(/4\.\s*\*\*Kết bài[^*]*\*\*\n(?:-\s*)?([\s\S]*?)(?=$)/);

      setOutlineIntro(introMatch ? introMatch[1].replace(/^- /gm, '').trim() : '');
      setOutlineBody1(body1Match ? body1Match[1].replace(/^- /gm, '').trim() : '');
      setOutlineBody2(body2Match ? body2Match[1].replace(/^- /gm, '').trim() : '');
      setOutlineConclusion(concMatch ? concMatch[1].replace(/^- /gm, '').trim() : '');
    } else {
      setOutlineIntro('');
      setOutlineBody1('');
      setOutlineBody2('');
      setOutlineConclusion('');
    }

    setSampleSupport(item.groupSampleAnswers?.support || '');
    setSampleAverage(item.groupSampleAnswers?.average || '');
    setSampleExcellent(item.groupSampleAnswers?.excellent || item.sampleAnswer || '');
    setSuggestedVocab(item.suggestedVocabulary?.length > 0 ? item.suggestedVocabulary : [{ word: '', meaning: '', collocation: '' }]);
    setActiveTab('general');
    setShowModal(true);
  };


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

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    // 🛑 Chỉ cho phép lưu đề thi khi đang ở Tab cuối cùng (outline - Bước 3/3)
    if (activeTab !== 'outline') {
      setActiveTab(activeTab === 'general' ? 'samples' : 'outline');
      return;
    }

    try {
      const filteredVocab = suggestedVocab.filter(v => v.word.trim() !== '');

      const formattedTitle = examDate 
        ? `${title} (Đề thi ngày ${examDate})`
        : title;

      // Ghép 4 phần dàn ý riêng biệt thành Scaffolding Template chuẩn Card Box
      const combinedScaffolding = `
1. **Mở bài (Introduction)**
- ${outlineIntro.split('\n').join('\n- ')}

2. **Thân bài 1 (Body Paragraph 1)**
- ${outlineBody1.split('\n').join('\n- ')}

3. **Thân bài 2 (Body Paragraph 2)**
- ${outlineBody2.split('\n').join('\n- ')}

4. **Kết bài (Conclusion)**
- ${outlineConclusion.split('\n').join('\n- ')}
      `.trim();

      const payload = {
        title: formattedTitle,
        prompt,
        topic,
        targetGroup,
        scaffoldingTemplate: combinedScaffolding,
        sampleAnswer: sampleExcellent,
        groupSampleAnswers: {
          support: sampleSupport,
          average: sampleAverage,
          excellent: sampleExcellent
        },
        suggestedVocabulary: filteredVocab
      };

      let res;
      if (editMode && editingAssignmentId) {
        res = await api.put(`/assignments/${editingAssignmentId}`, payload);
      } else {
        res = await api.post('/assignments', payload);
      }

      if (res.data.success) {
        setShowModal(false);
        fetchAssignments();
      }
    } catch (err) {
      console.error('Error saving assignment:', err.response?.data || err.message);
    }
  };

  // Confirm Modal State

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    confirmText: 'Xác Nhận Xóa',
    onConfirm: () => {}
  });

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác Nhận Xóa Đề Thi',
      message: 'Bạn có chắc chắn muốn xóa hoàn toàn đề thi này khỏi hệ thống?',
      type: 'danger',
      confirmText: 'Xóa Vĩnh Viễn',
      onConfirm: async () => {
        try {
          const res = await api.delete(`/assignments/${id}`);
          if (res.data.success) {
            fetchAssignments();
          }
        } catch (err) {
          console.error('Error deleting assignment:', err);
        }
      }
    });
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
              Thêm mới, chỉnh sửa, cấu hình Dàn ý Scaffolding & Từ vựng nâng cao cho từng nhóm học viên
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Đề Thi Mới</span>
          </button>
        </div>

        {/* Assignments Table View */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Đang tải danh sách đề thi...</div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-x-auto table-responsive no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">

              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">Tiêu Đề & Ngày Ra Đề</th>
                  <th className="p-4">Chủ Đề (Topic)</th>
                  <th className="p-4">Nhóm Học Viên Đích</th>
                  <th className="p-4">Nội Dung Đề Bài Luận</th>
                  <th className="p-4 text-center">Cấu Hình Dàn Ý & Bài Mẫu</th>
                  <th className="p-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {assignments.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-800 text-sm">{item.title}</div>
                      <span className="text-[10px] text-slate-400">Tạo: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-100">
                        {item.topic}
                      </span>
                    </td>
                    <td className="p-4">{getTargetBadge(item.targetGroup)}</td>
                    <td className="p-4 max-w-xs">
                      <p className="text-xs text-slate-600 italic line-clamp-2">"{item.prompt}"</p>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${item.scaffoldingTemplate ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                          {item.scaffoldingTemplate ? '✓ Có Dàn Ý 4 Phần' : 'Chưa có dàn ý'}
                        </span>
                        <span className="text-[10px] font-semibold text-purple-600">
                          {item.suggestedVocabulary?.length || 0} Từ Vựng Đính Kèm
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Icon Mắt: Xem Chi Tiết Đề Thi */}
                        <button
                          onClick={() => openViewModal(item)}
                          className="p-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition"
                          title="Xem chi tiết đề thi, bài mẫu & dàn ý"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Icon Sửa: Chỉnh Sửa Đề Thi */}
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-100 transition"
                          title="Sửa đề thi"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {/* Icon Thùng Rác: Xóa Đề Thi */}
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 transition"
                          title="Xóa đề thi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}


        {/* Modal Create Assignment (Kích thước Lớn Rộng Rãi - Tabbed System & No Scrollbar) */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-3xl p-8 max-w-6xl w-full h-[85vh] flex flex-col justify-between shadow-2xl space-y-6 border border-slate-200 no-scrollbar overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      {editMode ? 'Chỉnh Sửa Đề Thi IELTS Task 2' : 'Tạo Đề Thi IELTS Task 2 Thích Ứng Mới'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Cấu hình thông tin đề thi, bài luận mẫu và dàn ý 4 phần</p>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeTab === 'general'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    1. Đề Bài & Thông Tin
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('samples')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeTab === 'samples'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    2. Bài Mẫu 3 Band
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('outline')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeTab === 'outline'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    3. Dàn Ý 4 Phần
                  </button>
                </div>

                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleSaveAssignment}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    if (activeTab === 'general') setActiveTab('samples');
                    else if (activeTab === 'samples') setActiveTab('outline');
                  }
                }}
                className="flex-1 flex flex-col justify-between space-y-6 text-xs font-semibold"
              >

                {/* TAB 1: General Info & Prompt */}
                {activeTab === 'general' && (
                  <div className="flex-1 flex flex-col justify-between space-y-5 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-slate-700 mb-2 font-bold text-sm">1. Tiêu đề đề thi</label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Ví dụ: Real IELTS Writing 2 - Quy mô lớp học"
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-normal text-sm focus:ring-2 focus:ring-blue-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-2 font-bold text-sm">2. Ngày ra đề thi thật</label>
                        <input
                          type="date"
                          value={examDate}
                          onChange={(e) => setExamDate(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-normal text-sm focus:ring-2 focus:ring-blue-500 transition"
                        />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <label className="block text-slate-700 mb-2 font-bold text-sm">3. Đề bài luận đầy đủ (Prompt)</label>
                      <textarea
                        required
                        rows={6}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Nhập câu hỏi essay đầy đủ (Ví dụ: Some people think that...)..."
                        className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-normal text-sm font-serif leading-relaxed focus:ring-2 focus:ring-blue-500 transition"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-slate-700 mb-2 font-bold text-sm">4. Chủ đề (Topic)</label>
                        <input
                          type="text"
                          required
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="Nhập chủ đề (Education, Environment...)"
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-2 font-bold text-sm">5. Nhóm Học Viên Đích (targetGroup)</label>
                        <select
                          value={targetGroup}
                          onChange={(e) => setTargetGroup(e.target.value)}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-blue-600 cursor-pointer focus:ring-2 focus:ring-blue-500 transition"
                        >
                          <option value="support">Support (Cần hỗ trợ)</option>
                          <option value="average">Average (Trung bình)</option>
                          <option value="excellent">Excellent (Xuất sắc)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Sample Answers for 3 Groups */}
                {activeTab === 'samples' && (
                  <div className="flex-1 flex flex-col space-y-4 animate-fadeIn">
                    <div className="p-5 bg-blue-50/60 rounded-3xl border border-blue-100 flex-1 flex flex-col justify-between space-y-4">
                      <div className="flex items-center space-x-2 text-blue-900 font-extrabold text-sm border-b border-blue-100 pb-3">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        <span>Bài Luận Mẫu Thích Ứng Cho 3 Nhóm Học Viên (Dữ Liệu Chuẩn AI)</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                        <div className="flex flex-col">
                          <label className="block text-red-700 font-bold mb-2 text-xs">
                            • Bài mẫu Band 6.0 (Nhóm Cần Hỗ Trợ - Support)
                          </label>
                          <textarea
                            rows={10}
                            value={sampleSupport}
                            onChange={(e) => setSampleSupport(e.target.value)}
                            placeholder="Nhập bài essay mẫu ở mức Band 6.0 (từ vựng đơn giản, cấu trúc rõ ràng)..."
                            className="w-full flex-1 p-3.5 bg-white border border-slate-200 rounded-2xl font-normal text-xs leading-relaxed"
                          ></textarea>
                        </div>

                        <div className="flex flex-col">
                          <label className="block text-amber-700 font-bold mb-2 text-xs">
                            • Bài mẫu Band 7.0 (Nhóm Trung Bình - Average)
                          </label>
                          <textarea
                            rows={10}
                            value={sampleAverage}
                            onChange={(e) => setSampleAverage(e.target.value)}
                            placeholder="Nhập bài essay mẫu ở mức Band 7.0 (từ vựng tốt, collocations)..."
                            className="w-full flex-1 p-3.5 bg-white border border-slate-200 rounded-2xl font-normal text-xs leading-relaxed"
                          ></textarea>
                        </div>

                        <div className="flex flex-col">
                          <label className="block text-emerald-700 font-bold mb-2 text-xs">
                            • Bài mẫu Band 8.5+ (Nhóm Xuất Sắc - Excellent)
                          </label>
                          <textarea
                            rows={10}
                            value={sampleExcellent}
                            onChange={(e) => setSampleExcellent(e.target.value)}
                            placeholder="Nhập bài essay mẫu xuất sắc ở mức Band 8.5+..."
                            className="w-full flex-1 p-3.5 bg-white border border-slate-200 rounded-2xl font-normal text-xs leading-relaxed"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: 4-Part Scaffolding Outline */}
                {activeTab === 'outline' && (
                  <div className="flex-1 flex flex-col space-y-4 animate-fadeIn">
                    <div className="p-5 bg-amber-50/60 rounded-3xl border border-amber-200/80 flex-1 flex flex-col justify-between space-y-4">
                      <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-sm border-b border-amber-200/60 pb-3">
                        <BookOpen className="w-5 h-5 text-amber-600" />
                        <span>Dàn Ý Scaffolding 4 Phần Cho Nhóm Yếu & Trung Bình (Dạng Card Box)</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                        <div className="flex flex-col">
                          <label className="block text-amber-900 font-bold mb-2 text-xs">
                            1. Mở bài (Introduction)
                          </label>
                          <textarea
                            rows={4}
                            value={outlineIntro}
                            onChange={(e) => setOutlineIntro(e.target.value)}
                            placeholder="Paraphrase đề bài và câu trả lời trực tiếp..."
                            className="w-full flex-1 p-3.5 bg-white border border-slate-200 rounded-2xl font-normal text-xs"
                          ></textarea>
                        </div>

                        <div className="flex flex-col">
                          <label className="block text-amber-900 font-bold mb-2 text-xs">
                            2. Thân bài 1 (Body Paragraph 1)
                          </label>
                          <textarea
                            rows={4}
                            value={outlineBody1}
                            onChange={(e) => setOutlineBody1(e.target.value)}
                            placeholder="Ý chính 1, giải thích nguyên nhân..."
                            className="w-full flex-1 p-3.5 bg-white border border-slate-200 rounded-2xl font-normal text-xs"
                          ></textarea>
                        </div>

                        <div className="flex flex-col">
                          <label className="block text-amber-900 font-bold mb-2 text-xs">
                            3. Thân bài 2 (Body Paragraph 2)
                          </label>
                          <textarea
                            rows={4}
                            value={outlineBody2}
                            onChange={(e) => setOutlineBody2(e.target.value)}
                            placeholder="Ý chính 2, phân tích tác động..."
                            className="w-full flex-1 p-3.5 bg-white border border-slate-200 rounded-2xl font-normal text-xs"
                          ></textarea>
                        </div>

                        <div className="flex flex-col">
                          <label className="block text-amber-900 font-bold mb-2 text-xs">
                            4. Kết bài (Conclusion)
                          </label>
                          <textarea
                            rows={4}
                            value={outlineConclusion}
                            onChange={(e) => setOutlineConclusion(e.target.value)}
                            placeholder="Tóm tắt quan điểm và khẳng định lập trường..."
                            className="w-full flex-1 p-3.5 bg-white border border-slate-200 rounded-2xl font-normal text-xs"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400">
                    {activeTab === 'general' && 'Bước 1/3: Nhập thông tin tổng quan đề thi'}
                    {activeTab === 'samples' && 'Bước 2/3: Cấu hình bài essay mẫu thích ứng'}
                    {activeTab === 'outline' && 'Bước 3/3: Phân chia 4 phần dàn ý chuẩn Card Box'}
                  </div>

                  <div className="flex space-x-2">
                    {activeTab !== 'general' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab(activeTab === 'outline' ? 'samples' : 'general')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                      >
                        Quay Lại
                      </button>
                    )}

                    {activeTab !== 'outline' ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab(activeTab === 'general' ? 'samples' : 'outline')}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition"
                      >
                        Tiếp Theo
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 shadow-md transition"
                      >
                        Lưu & Tạo Đề Thi
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Xem Chi Tiết Đề Thi (Icon Mắt) */}

        {showViewModal && viewingAssignment && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-3xl p-8 max-w-5xl w-full max-h-[90vh] flex flex-col justify-between shadow-2xl space-y-6 border border-slate-200 overflow-hidden no-scrollbar">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-800">{viewingAssignment.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-100">
                        Topic: {viewingAssignment.topic}
                      </span>
                      {getTargetBadge(viewingAssignment.targetGroup)}
                    </div>
                  </div>
                </div>

                <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pr-1 text-xs">
                {/* Prompt */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Đề Bài Luận (Prompt)</span>
                  <p className="text-sm font-serif italic text-slate-800 leading-relaxed">
                    "{viewingAssignment.prompt}"
                  </p>
                </div>

                {/* 3 Group Sample Answers */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase block">Bài Luận Mẫu Theo 3 Band Thích Ứng</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100">
                      <span className="font-bold text-red-700 block mb-2">• Band 6.0 (Support)</span>
                      <p className="text-[11px] text-slate-700 font-normal leading-relaxed whitespace-pre-wrap">
                        {viewingAssignment.groupSampleAnswers?.support || 'Chưa có bài mẫu'}
                      </p>
                    </div>
                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                      <span className="font-bold text-amber-700 block mb-2">• Band 7.0 (Average)</span>
                      <p className="text-[11px] text-slate-700 font-normal leading-relaxed whitespace-pre-wrap">
                        {viewingAssignment.groupSampleAnswers?.average || 'Chưa có bài mẫu'}
                      </p>
                    </div>
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                      <span className="font-bold text-emerald-700 block mb-2">• Band 8.5+ (Excellent)</span>
                      <p className="text-[11px] text-slate-700 font-normal leading-relaxed whitespace-pre-wrap">
                        {viewingAssignment.groupSampleAnswers?.excellent || viewingAssignment.sampleAnswer || 'Chưa có bài mẫu'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Scaffolding Template */}
                {viewingAssignment.scaffoldingTemplate && (
                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2">
                    <span className="text-xs font-bold text-amber-900 uppercase block">Dàn Ý Scaffolding 4 Phần</span>
                    <pre className="font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {viewingAssignment.scaffoldingTemplate}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Đóng Chi Tiết
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Confirm Modal */}

        <AdminConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          confirmText={confirmModal.confirmText}
        />
      </div>
    </div>
  );
};

export default AdminAssignments;


