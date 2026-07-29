import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FolderOpen, Plus, Search, Send, Edit3, Trash2, FileText, Check, Sparkles, X, Download, ExternalLink } from 'lucide-react';
import AdminConfirmModal from '../components/AdminConfirmModal';


const AdminResources = () => {
  const [resources, setResources] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add / Edit Modal State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [defaultTargetGroup, setDefaultTargetGroup] = useState('all');

  // Send Modal State
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [targetGroup, setTargetGroup] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [sendingDoc, setSendingDoc] = useState(false);

  const fetchResources = async () => {
    try {
      const res = await api.get(`/resources?search=${encodeURIComponent(searchTerm)}`);
      if (res.data.success) {
        setResources(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsList = async () => {
    try {
      const res = await api.get('/auth/students');
      if (res.data.success) {
        setStudentsList(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching students list:', err);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchStudentsList();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchResources();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Open Create Modal
  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDocumentUrl('');
    setDocumentName('');
    setDefaultTargetGroup('all');
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setIsEditing(true);
    setEditingId(item._id);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setDocumentUrl(item.documentUrl || '');
    setDocumentName(item.documentName || '');
    setDefaultTargetGroup(item.defaultTargetGroup || 'all');
    setShowAddEditModal(true);
  };

  // Upload file từ máy tính
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setDocumentUrl(uploadEvent.target.result);
        setDocumentName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Create / Edit Save
  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title,
        description,
        documentUrl,
        documentName,
        defaultTargetGroup
      };

      let res;
      if (isEditing && editingId) {
        res = await api.put(`/resources/${editingId}`, payload);
      } else {
        res = await api.post('/resources', payload);
      }

      if (res.data.success) {
        setShowAddEditModal(false);
        fetchResources();
      }
    } catch (err) {
      console.error('Error saving resource:', err);
      alert('Có lỗi xảy ra khi lưu tài liệu.');
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

  // Delete resource from bank
  const handleDeleteResource = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác Nhận Xóa Tài Liệu',
      message: 'Bạn có chắc chắn muốn xóa tài liệu này khỏi Kho lưu trữ Admin?',
      type: 'danger',
      confirmText: 'Xóa Khỏi Kho 🗑️',
      onConfirm: async () => {
        try {
          const res = await api.delete(`/resources/${id}`);
          if (res.data.success) {
            fetchResources();
          }
        } catch (err) {
          console.error('Error deleting resource:', err);
        }
      }
    });
  };

  // Open Send Modal for a specific resource Card
  const openSendModal = (resource) => {
    setSelectedResource(resource);
    setCustomMessage(resource.description || '');
    setTargetGroup(resource.defaultTargetGroup || 'all');
    setSelectedStudentId('');
    setShowSendModal(true);
  };

  // Handle Send Resource Realtime
  const handleSendFromBank = async (e) => {
    e.preventDefault();
    if (!selectedResource) return;
    setSendingDoc(true);

    try {
      const res = await api.post(`/resources/${selectedResource._id}/send`, {
        customMessage,
        targetGroup,
        recipientId: selectedStudentId || undefined
      });

      if (res.data.success) {
        setConfirmModal({
          isOpen: true,
          title: 'Phát Tài Liệu Thành Công 🚀',
          message: res.data.message,
          type: 'success',
          confirmText: 'Đóng',
          onConfirm: () => {}
        });
        setShowSendModal(false);
      }
    } catch (err) {
      console.error('Error sending resource from bank:', err);
    } finally {
      setSendingDoc(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center">
              <FolderOpen className="w-7 h-7 mr-2.5 text-indigo-600" />
              Kho Tài Liệu Trung Tâm Admin (Resource Bank)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Lưu trữ tài liệu mồi, bài giảng chuyên đề & phát trực tiếp cho học viên chỉ với 1-Click.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm rounded-2xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tài Liệu Mới Vào Kho</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề tài liệu, tên file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 transition font-medium"
            />
          </div>
          <span className="text-xs font-bold text-slate-400">Tổng cộng: {resources.length} Tài liệu</span>
        </div>

        {/* Resource Grid Cards */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">Đang tải kho tài liệu Admin...</div>
        ) : resources.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Chưa có tài liệu nào trong Kho</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Bấm nút "Thêm Tài Liệu Mới Vào Kho" phía trên để lưu trữ tài liệu đầu tiên.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-[11px] rounded-full border border-indigo-100 uppercase">
                      Nhóm: {item.defaultTargetGroup?.toUpperCase()}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-xl transition"
                        title="Chỉnh sửa tài liệu"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteResource(item._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition"
                        title="Xóa tài liệu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-black text-slate-800 text-base group-hover:text-indigo-600 transition line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                      {item.description || 'Chưa có lời nhắn mồi'}
                    </p>
                  </div>

                  {item.documentName && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center space-x-2.5">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-700 truncate">
                        {item.documentName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Send Button directly on Card */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openSendModal(item)}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs rounded-2xl shadow-sm transition flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi Cho Học Viên Realtime 🚀</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Add / Edit Resource in Bank */}
        {showAddEditModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 no-scrollbar overflow-y-auto max-h-[90vh] border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black text-slate-800">
                  {isEditing ? 'Chỉnh Sửa Tài Liệu Trong Kho' : 'Thêm Tài Liệu Mới Vào Kho Admin'}
                </h3>
                <button onClick={() => setShowAddEditModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveResource} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 uppercase mb-1">1. Tiêu Đề Tài Liệu *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Chuyên đề cấu trúc Complex Sentences Band 7.5"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-normal text-sm focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 uppercase mb-1">2. Lời Nhắn Mồi / Hướng Dẫn Mặc Định</label>
                  <textarea
                    rows={3}
                    placeholder="Nhập nội dung lời nhắn hướng dẫn học sinh..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-normal text-xs leading-relaxed"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-slate-700 uppercase mb-1">📁 Upload Tệp Từ Máy Tính Cá Nhân</label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                  />
                  {documentName && (
                    <p className="text-xs font-bold text-indigo-600 mt-2 flex items-center">
                      <Check className="w-4 h-4 mr-1 text-emerald-600" /> Tệp đính kèm: {documentName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 uppercase mb-1">Hoặc Nhập URL Tài Liệu Online</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 uppercase mb-1">Nhóm Nhận Mặc Định</label>
                    <select
                      value={defaultTargetGroup}
                      onChange={(e) => setDefaultTargetGroup(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-indigo-900 cursor-pointer"
                    >
                      <option value="all">🌐 Tất Cả Học Viên</option>
                      <option value="support">🔴 Chỉ Nhóm Support (&lt;6.0)</option>
                      <option value="average">🟡 Chỉ Nhóm Average (6.0-6.5)</option>
                      <option value="excellent">🟣 Chỉ Nhóm Excellent (7.0+)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddEditModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-2xl shadow-md hover:shadow-lg transition"
                  >
                    {isEditing ? 'Cập Nhật Tài Liệu 💾' : 'Lưu Vào Kho 🚀'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Send Resource Realtime to Student */}
        {showSendModal && selectedResource && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 border border-slate-200 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Phát Tài Liệu Realtime Cho Học Viên</h3>
                    <p className="text-xs text-indigo-600 font-bold truncate max-w-xs">{selectedResource.title}</p>
                  </div>
                </div>
                <button onClick={() => setShowSendModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendFromBank} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 uppercase mb-1">🎯 Chọn Người Nhận (Gửi Riêng HOẶC Theo Nhóm)</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full p-3 bg-indigo-50/60 border border-indigo-200 rounded-2xl text-xs font-bold text-indigo-900 mb-2 cursor-pointer"
                  >
                    <option value="">-- Gửi Theo Nhóm Học Viên Bên Dưới --</option>
                    {studentsList.map(st => (
                      <option key={st._id} value={st._id}>
                        👤 Gửi Riêng Cho: {st.name} ({st.email}) - Group: {st.studentGroup?.toUpperCase()}
                      </option>
                    ))}
                  </select>

                  {!selectedStudentId && (
                    <select
                      value={targetGroup}
                      onChange={(e) => setTargetGroup(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      <option value="all">🌐 Tất Cả Học Viên Trong Hệ Thống</option>
                      <option value="support">🔴 Chỉ Nhóm Cần Hỗ Trợ (&lt; 6.0 Band)</option>
                      <option value="average">🟡 Chỉ Nhóm Trung Bình (6.0 - 6.5 Band)</option>
                      <option value="excellent">🟣 Chỉ Nhóm Xuất Sắc (7.0 - 8.5+ Band)</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 uppercase mb-1">Lời Nhắn Hướng Dẫn Tới Học Viên *</label>
                  <textarea
                    required
                    rows={4}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 transition"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSendModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={sendingDoc}
                    className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-2xl shadow-lg hover:shadow-xl transition"
                  >
                    {sendingDoc ? 'Đang Phát Realtime...' : 'Phát Tài Liệu Ngay 🚀'}
                  </button>
                </div>
              </form>
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

export default AdminResources;

