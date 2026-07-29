import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { BookOpen, Save, RotateCcw, Check, Sparkles, AlertCircle } from 'lucide-react';
import AdminConfirmModal from '../components/AdminConfirmModal';

const AdminRubricManager = () => {
  const [rubrics, setRubrics] = useState({});
  const [activeTab, setActiveTab] = useState('TR');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmResetModal, setConfirmResetModal] = useState(false);

  // State chỉnh sửa tiêu chí đang chọn
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

  useEffect(() => {
    fetchRubrics();
  }, []);

  useEffect(() => {
    if (rubrics[activeTab]) {
      setFormData(rubrics[activeTab]);
    }
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
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: 'Lỗi Cập Nhật',
        message: 'Có lỗi xảy ra khi lưu cấu hình Rubric.',
        type: 'danger'
      });
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
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-wrap justify-between items-center gap-4">
          <div className="space-y-1">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-xs font-bold rounded-full">
              Hệ Thống Quản Trị LMS Admin
            </span>
            <h1 className="text-2xl sm:text-3xl font-black flex items-center">
              <BookOpen className="w-7 h-7 mr-2 text-yellow-300" />
              Quản Lý Rubric Chấm Điểm & Chỉ Dẫn AI
            </h1>
            <p className="text-xs sm:text-sm text-blue-100">
              Cấu hình mô tả tiêu chí (TR, CC, LR, GRA) để định hướng Engine AI chấm bài chuẩn xác theo ý muốn của Trung Tâm.
            </p>
          </div>

          <button
            onClick={() => setConfirmResetModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition flex items-center space-x-1.5"
          >
            <RotateCcw className="w-4 h-4 text-yellow-300" />
            <span>Khôi Phục Chuẩn Cambridge Mặc Định</span>
          </button>
        </div>

        {/* Dynamic Criterion Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['TR', 'CC', 'LR', 'GRA'].map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`p-4 rounded-2xl text-left border transition ${
                activeTab === key
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md font-bold'
                  : 'bg-white border-slate-200 text-slate-700 font-semibold hover:border-slate-300'
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
              Cấu Hình Tiêu Chí: {formData.name} ({activeTab})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nội dung chỉnh sửa sẽ được đồng bộ trực tiếp vào Prompt chấm thi của AI.
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

          {/* Band Descriptors Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Mô Tả Chi Tiết Thang Điểm (Band Descriptors)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[5, 6, 7, 8].map((b) => (
                <div key={b} className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="px-2.5 py-0.5 bg-slate-800 text-white font-extrabold text-[11px] rounded-full">
                    BAND {b}.0
                  </span>
                  <textarea
                    rows={3}
                    value={formData.bands?.[b] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      bands: { ...formData.bands, [b]: e.target.value }
                    })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Coach Notes Transition */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Hướng Dẫn Nâng Band AI Coach (Phân Tích Chuyển Band)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['5-6', '6-7', '7-8'].map((noteKey) => (
                <div key={noteKey} className="space-y-1.5 bg-purple-50/40 p-4 rounded-2xl border border-purple-100">
                  <span className="px-2.5 py-0.5 bg-purple-600 text-white font-extrabold text-[11px] rounded-full">
                    Nâng Chuyển Band {noteKey}
                  </span>
                  <textarea
                    rows={3}
                    value={formData.coachNotes?.[noteKey] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      coachNotes: { ...formData.coachNotes, [noteKey]: e.target.value }
                    })}
                    className="w-full text-xs p-2.5 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
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

        {/* Reset Confirm Modal */}
        <AdminConfirmModal
          isOpen={confirmResetModal}
          onClose={() => setConfirmResetModal(false)}
          onConfirm={handleResetDefault}
          title="Xác Nhận Khôi Phục Mặc Định"
          message="Bạn có chắc chắn muốn khôi phục lại toàn bộ Rubric về nội dung IELTS Cambridge mặc định ban đầu?"
          type="warning"
          confirmText="Khôi Phục Ngay"
        />

        {/* Alert Result Modal */}
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
