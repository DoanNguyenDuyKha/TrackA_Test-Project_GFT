import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FolderOpen, Search, Download, Eye, FileText, UserCheck, Shield, Sparkles, Clock, ArrowRight } from 'lucide-react';

const StudentResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'individual' | 'group'
  const navigate = useNavigate();

  const fetchResources = async () => {
    try {
      const res = await api.get('/notifications/my-resources');
      if (res.data.success) {
        setResources(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching student resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const filteredResources = resources.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.documentName && item.documentName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterType === 'individual') {
      return matchesSearch && item.targetGroup === 'individual';
    } else if (filterType === 'group') {
      return matchesSearch && item.targetGroup !== 'individual';
    }
    return matchesSearch;
  });

  const getTagBadge = (targetGroup) => {
    if (targetGroup === 'individual') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600" />
          Gửi Riêng Cho Bạn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
        <UserCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
        Tài Liệu Nhóm
      </span>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center">
              <FolderOpen className="w-7 h-7 mr-2.5 text-indigo-600" />
              Kho Tài Liệu Học Tập Thích Ứng (Resource Hub)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Tất cả tài liệu bổ trợ, chuyên đề Band điểm & bài tập mồi do Giáo viên / AI gửi riêng cho bạn hoặc nhóm năng lực của bạn.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-100">
              Tổng cộng: {resources.length} Tài liệu
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm kiếm tiêu đề, tên file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Type Filters */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất Cả ({resources.length})
            </button>
            <button
              onClick={() => setFilterType('individual')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'individual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Gửi Riêng Cho Tôi ({resources.filter(r => r.targetGroup === 'individual').length})
            </button>
            <button
              onClick={() => setFilterType('group')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filterType === 'group' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tài Liệu Nhóm ({resources.filter(r => r.targetGroup !== 'individual').length})
            </button>
          </div>
        </div>

        {/* Resources Grid View */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">Đang tải kho tài liệu của bạn...</div>
        ) : filteredResources.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Chưa tìm thấy tài liệu phù hợp</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Khi Giáo viên hoặc Admin gửi bài giảng bổ trợ cho bạn, tài liệu sẽ ngay lập tức được lưu trữ tại trang này.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    {getTagBadge(item.targetGroup)}
                    <span className="text-[10px] text-slate-400 flex items-center font-medium">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base group-hover:text-indigo-600 transition line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {item.documentName && (
                    <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center space-x-2.5">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-xs font-bold text-indigo-900 truncate">
                        {item.documentName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/student/resources/${item._id}`)}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-sm transition flex items-center justify-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Đọc / Xem Chi Tiết</span>
                  </button>

                  {item.documentUrl && (
                    <a
                      href={item.documentUrl}
                      download={item.documentName || 'tai_lieu.pdf'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition border border-slate-200"
                      title="Tải về máy tính cá nhân"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResources;
