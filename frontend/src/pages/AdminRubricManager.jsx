import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { BookOpen, Save, RotateCcw, Sparkles, Eye, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import AdminConfirmModal from '../components/AdminConfirmModal';

const BAND_COLORS = {
  8: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-600', text: 'text-emerald-900' },
  7: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-600', text: 'text-blue-900' },
  6: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500', text: 'text-amber-900' },
  5: { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-500', text: 'text-rose-900' },
};

// Component đọc (Read-only) một tiêu chí Rubric
const RubricCriterionView = ({ data, criterionKey, expanded, onToggle }) => {
  if (!data) return null;
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      {/* Criterion Header — click để mở/đóng */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition text-left"
      >
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-indigo-600 text-white font-black text-xs rounded-full">{criterionKey}</span>
          <span className="font-bold text-slate-800 text-sm">{data.name}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="p-5 space-y-4">
          {/* Mô tả */}
          <p className="text-xs text-slate-600 italic border-l-4 border-indigo-300 pl-3">{data.description}</p>

          {/* Band Descriptors */}
          <div>
            <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Mô tả từng mức điểm (Band Descriptors)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[8, 7, 6, 5].map((b) => {
                const c = BAND_COLORS[b];
                return (
                  <div key={b} className={`p-3 rounded-xl border ${c.bg} ${c.border}`}>
                    <span className={`inline-block px-2.5 py-0.5 text-[11px] font-black text-white rounded-full mb-2 ${c.badge}`}>
                      Band {b}.0
                    </span>
                    <p className={`text-xs leading-relaxed ${c.text}`}>{data.bands?.[b] || '—'}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coach Notes */}
          <div>
            <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Hướng dẫn nâng band (Coach Notes)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['5-6', '6-7', '7-8'].map((key) => (
                <div key={key} className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-black text-white rounded-full mb-2 bg-purple-600">
                    Band {key}
                  </span>
                  <p className="text-xs text-purple-900 leading-relaxed">{data.coachNotes?.[key] || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminRubricManager = () => {
  const [rubrics, setRubrics] = useState({});
  const [pageMode, setPageMode] = useState('view'); // 'view' | 'edit'
  const [activeTab, setActiveTab] = useState('TR');
  const [expandedKeys, setExpandedKeys] = useState({ TR: true, CC: true, LR: true, GRA: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmResetModal, setConfirmResetModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bands: { 5: '', 6: '', 7: '', 8: '' },
    coachNotes: { '5-6': '', '6-7': '', '7-8': '' }
  });

  const fetchRubrics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rubrics');
      if (res.data.success) {
        setRubrics(res.data.data);
        if (res.data.data[activeTab]) {
          setFormData(res.data.data[activeTab]);
        }
      }
    } catch (err) {
      console.error('Error fetching rubrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRubrics(); }, []);

  useEffect(() => {
    if (rubrics[activeTab]) setFormData(rubrics[activeTab]);
  }, [activeTab, rubrics]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put(`/rubrics/${activeTab}`, formData);
      if (res.data.success) {
        setAlertModal({
          isOpen: true,
          title: 'Thành Công',
          message: `Đã cập nhật cấu hình Rubric tiêu chí ${activeTab} thành công! AI sẽ áp dụng quy tắc mới này ngay lập tức khi chấm bài.`,
          type: 'success'
        });
        fetchRubrics();
        setPageMode('view');
      }
    } catch (err) {
      setAlertModal({ isOpen: true, title: 'Lỗi Cập Nhật', message: 'Có lỗi xảy ra khi lưu cấu hình Rubric.', type: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    setSaving(true);
    try {
      const res = await api.post('/rubrics/reset');
      if (res.data.success) {
        setRubrics(res.data.data);
        setFormData(res.data.data[activeTab]);
        setConfirmResetModal(false);
        setAlertModal({
          isOpen: true,
          title: 'Khôi Phục Mặc Định',
          message: 'Đã khôi phục toàn bộ Rubric về chuẩn IELTS Cambridge ban đầu!',
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Error resetting rubrics:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (key) => setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-wrap justify-between items-center gap-4">
          <div className="space-y-1">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-xs font-bold rounded-full">
              Hệ Thống Quản Trị LMS Admin
            </span>
            <h1 className="text-2xl sm:text-3xl font-black flex items-center">
              <BookOpen className="w-7 h-7 mr-2 text-yellow-300" />
              Quản Lý Rubric Chấm Điểm
            </h1>
            <p className="text-xs sm:text-sm text-blue-100">
              Xem và điều chỉnh tiêu chí rubric (TR, CC, LR, GRA) — Engine AI chấm bài theo đúng quy tắc này.
            </p>
          </div>
          <button
            onClick={() => setConfirmResetModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition flex items-center space-x-1.5"
          >
            <RotateCcw className="w-4 h-4 text-yellow-300" />
            <span>Khôi Phục Chuẩn Cambridge</span>
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm w-fit">
          <button
            onClick={() => setPageMode('view')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${pageMode === 'view' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Eye className="w-4 h-4" />
            <span>Xem Rubric Hiện Tại</span>
          </button>
          <button
            onClick={() => setPageMode('edit')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${pageMode === 'edit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Chỉnh Sửa Rubric</span>
          </button>
        </div>

        {/* ─── MODE: VIEW (Xem Rubric Hiện Tại) ─── */}
        {pageMode === 'view' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-800">
                Rubric đang được AI sử dụng để chấm bài
              </h2>
              <button
                onClick={() => { setExpandedKeys({ TR: true, CC: true, LR: true, GRA: true }); }}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Mở rộng tất cả
              </button>
            </div>

            {['TR', 'CC', 'LR', 'GRA'].map((key) => (
              <RubricCriterionView
                key={key}
                criterionKey={key}
                data={rubrics[key]}
                expanded={!!expandedKeys[key]}
                onToggle={() => toggleExpand(key)}
              />
            ))}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPageMode('edit')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow transition flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Chỉnh Sửa Rubric</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── MODE: EDIT (Chỉnh Sửa Rubric) ─── */}
        {pageMode === 'edit' && (
          <div className="space-y-4">
            {/* Criterion Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['TR', 'CC', 'LR', 'GRA'].map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`p-4 rounded-2xl text-left border transition ${
                    activeTab === key
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className={`text-xs ${activeTab === key ? 'text-blue-200' : 'text-slate-400'}`}>{key}</div>
                  <div className="text-sm font-extrabold truncate">{rubrics[key]?.name || key}</div>
                </button>
              ))}
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-800 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                  Chỉnh Sửa Tiêu Chí: {formData.name} ({activeTab})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thay đổi sẽ được đồng bộ trực tiếp vào Prompt chấm thi của AI ngay khi lưu.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase">Mô Tả Tiêu Chí Chấm</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Band Descriptors */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Mô Tả Thang Điểm Band 5–8</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[8, 7, 6, 5].map((b) => {
                    const c = BAND_COLORS[b];
                    return (
                      <div key={b} className={`space-y-1.5 p-4 rounded-2xl border ${c.bg} ${c.border}`}>
                        <span className={`inline-block px-2.5 py-0.5 text-[11px] font-black text-white rounded-full ${c.badge}`}>
                          BAND {b}.0
                        </span>
                        <textarea
                          rows={3}
                          value={formData.bands?.[b] || ''}
                          onChange={(e) => setFormData({ ...formData, bands: { ...formData.bands, [b]: e.target.value } })}
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          required
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coach Notes */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Hướng Dẫn Nâng Band (Coach Notes)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['5-6', '6-7', '7-8'].map((noteKey) => (
                    <div key={noteKey} className="space-y-1.5 bg-purple-50/40 p-4 rounded-2xl border border-purple-100">
                      <span className="inline-block px-2.5 py-0.5 bg-purple-600 text-white font-extrabold text-[11px] rounded-full">
                        Nâng Band {noteKey}
                      </span>
                      <textarea
                        rows={3}
                        value={formData.coachNotes?.[noteKey] || ''}
                        onChange={(e) => setFormData({ ...formData, coachNotes: { ...formData.coachNotes, [noteKey]: e.target.value } })}
                        className="w-full text-xs p-2.5 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPageMode('view')}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition"
                >
                  ← Quay Lại Xem
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Đang Lưu...' : 'Lưu Thay Đổi Rubric'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modals */}
        <AdminConfirmModal
          isOpen={confirmResetModal}
          onClose={() => setConfirmResetModal(false)}
          onConfirm={handleResetDefault}
          title="Xác Nhận Khôi Phục Mặc Định"
          message="Bạn có chắc chắn muốn khôi phục lại toàn bộ Rubric về nội dung IELTS Cambridge mặc định ban đầu?"
          type="warning"
          confirmText="Khôi Phục Ngay"
        />
        <AdminConfirmModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
          onConfirm={() => setAlertModal({ ...alertModal, isOpen: false })}
          title={alertModal.title}
          message={alertModal.message}
          type={alertModal.type}
          confirmText="Đã Hiểu"
        />
      </div>
    </div>
  );
};

export default AdminRubricManager;
