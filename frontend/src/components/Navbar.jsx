import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Award, FileText, UserCheck, LogOut, Menu, X, Shield, Sparkles, Bell, Download, Send, Check } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../utils/api';

let socket = null;

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Realtime Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showSendDocModal, setShowSendDocModal] = useState(false);

  // Admin Document Share Form State
  const [docTitle, setDocTitle] = useState('');
  const [docMessage, setDocMessage] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docName, setDocName] = useState('');
  const [docTargetGroup, setDocTargetGroup] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentsList, setStudentsList] = useState([]);
  const [sendingDoc, setSendingDoc] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
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

  // Xử lý upload tệp từ máy tính cá nhân của Admin
  const handleLocalFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setDocUrl(uploadEvent.target.result); // Base64 URL preview & download
        setDocName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      if (user.role === 'admin') {
        fetchStudentsList();
      }

      if (!socket) {
        const rawSocketUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const socketUrl = rawSocketUrl.replace(/\/+$/, '').replace(/\/api$/, '');
        const isServerless = socketUrl.includes('vercel.app');
        
        socket = io(socketUrl, {
          autoConnect: !isServerless,
          transports: ['websocket'],
          reconnection: false
        });
      }



      if (user.role === 'student') {
        socket.emit('join_user_room', user._id);
        socket.on('new_notification', (data) => {
          setNotifications(prev => [data, ...prev]);
          setUnreadCount(prev => prev + 1);
        });
      } else if (user.role === 'admin') {
        socket.emit('join_admin_room');
        socket.on('admin_submission_alert', (data) => {
          const newNotif = {
            _id: Date.now().toString(),
            title: '📩 Bài Nộp Mới Từ Học Viên!',
            message: `Học viên ${data.studentName} (${data.studentGroup?.toUpperCase()}) vừa nộp bài luận "${data.assignmentTitle}" - Kết quả: ${data.overallBand} Band`,
            createdAt: new Date(),
            type: 'submission_alert'
          };
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        });
      }
    }

    return () => {
      if (socket) {
        socket.off('new_notification');
        socket.off('admin_submission_alert');
      }
    };
  }, [isAuthenticated, user]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  // Admin gửi tài liệu Realtime cho Học Viên
  const handleSendDocument = async (e) => {
    e.preventDefault();
    setSendingDoc(true);
    try {
      const res = await api.post('/notifications/send-document', {
        title: docTitle,
        message: docMessage,
        documentUrl: docUrl,
        documentName: docName,
        targetGroup: docTargetGroup,
        recipientId: selectedStudentId || undefined
      });

      if (res.data.success) {
        setShowSendDocModal(false);
        setDocTitle('');
        setDocMessage('');
        setDocUrl('');
        setDocName('');
        setDocTargetGroup('all');
        setSelectedStudentId('');
      }
    } catch (err) {
      console.error('Error sending document:', err);
    } finally {
      setSendingDoc(false);
    }
  };


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderStudentBadge = () => {
    if (!user || user.role !== 'student') return null;
    const group = user.studentGroup || 'support';
    switch (group) {
      case 'support':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 shadow-sm animate-pulse">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-red-500"></span>
            CẦN HỖ TRỢ
          </span>
        );
      case 'average':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-amber-500"></span>
            TRUNG BÌNH
          </span>
        );
      case 'excellent':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600" />
            XUẤT SẮC
          </span>
        );
      default:
        return null;
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Adaptive LMS
                  </span>
                  <span className="hidden sm:inline-block ml-1.5 text-xs px-2 py-0.5 bg-blue-50 text-blue-600 font-semibold rounded-md border border-blue-100">
                    IELTS Writing
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            {isAuthenticated && (
              <div className="hidden md:flex md:items-center md:space-x-1">
                {isStudent && (
                  <>
                    <Link
                      to="/"
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition duration-150 ${
                        isActive('/')
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/assignments"
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition duration-150 ${
                        isActive('/assignments')
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      Đề Thi Thực Hành
                    </Link>
                    <Link
                      to="/student/resources"
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition duration-150 ${
                        isActive('/student/resources') || location.pathname.startsWith('/student/resources')
                          ? 'bg-indigo-50 text-indigo-600 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      Kho Tài Liệu
                    </Link>
                  </>

                )}

                {isAdmin && (
                  <>
                    <Link
                      to="/admin/assignments"
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition duration-150 ${
                        isActive('/admin/assignments')
                          ? 'bg-indigo-50 text-indigo-600 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      Quản Lý Đề Thi
                    </Link>
                    <Link
                      to="/admin/students"
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition duration-150 ${
                        isActive('/admin/students')
                          ? 'bg-indigo-50 text-indigo-600 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      Giám Sát Học Viên
                    </Link>
                    <Link
                      to="/admin/resources"
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition duration-150 ${
                        isActive('/admin/resources')
                          ? 'bg-indigo-50 text-indigo-600 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      Kho Tài Liệu Admin
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Notification Bell Dropdown & User Profile */}
            <div className="hidden md:flex md:items-center md:space-x-3">
              {isAuthenticated ? (
                <>
                  {/* Realtime Notification Bell Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowNotifDropdown(!showNotifDropdown);
                        if (unreadCount > 0) handleMarkAllRead();
                      }}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition relative"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white font-black text-[10px] rounded-full flex items-center justify-center animate-bounce shadow-md">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Popup Dropdown */}
                    {showNotifDropdown && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-fadeIn">
                        <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                          <h4 className="text-sm font-extrabold text-slate-800 flex items-center">
                            <Bell className="w-4 h-4 mr-1.5 text-blue-600" /> Thông Báo Realtime
                          </h4>
                          <span className="text-[11px] font-bold text-slate-400">Tự động cập nhật</span>
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                          {notifications.length > 0 ? (
                            notifications.map((n, idx) => (
                              <div key={idx} className="p-3.5 hover:bg-slate-50 transition space-y-1">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-extrabold text-xs text-slate-800">{n.title}</h5>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-snug">{n.message}</p>
                                {n.documentUrl && (
                                  <a
                                    href={n.documentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg mt-1 border border-blue-100 hover:bg-blue-100 transition"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Tải về: {n.documentName || 'Tài liệu học tập'}
                                  </a>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center text-xs text-slate-400">Chưa có thông báo mới nào.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800 leading-tight">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.role === 'admin' ? 'Quản trị viên' : user.email}</p>
                    </div>

                    {renderStudentBadge()}

                    <button
                      onClick={handleLogout}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      title="Đăng xuất"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition"
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
                  >
                    Đăng Ký Học Viên
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modal Admin Gửi Tài Liệu & Thông Báo Realtime Cho Học Viên (Kích Thước Lớn Rộng Rãi) */}
      {showSendDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col justify-between shadow-2xl space-y-4 border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">
                    Gửi Tài Liệu & Phát Thông Báo Realtime
                  </h3>
                  <p className="text-xs text-slate-400">Tải tệp từ máy tính cá nhân hoặc gửi URL tài liệu bổ trợ tới học viên</p>
                </div>
              </div>

              <button onClick={() => setShowSendDocModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleSendDocument} className="flex-1 flex flex-col justify-between space-y-4 text-xs font-semibold overflow-y-auto no-scrollbar pr-1">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">1. Tiêu Đề Thông Báo *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Tài liệu bổ trợ cấu trúc Complex Sentences Band 7.5"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">2. 🎯 Người Nhận (Gửi Riêng HOẶC Theo Nhóm)</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-indigo-200 text-sm bg-indigo-50/50 font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 transition"
                    >
                      <option value="">-- Gửi Theo Nhóm Học Viên --</option>
                      {studentsList.map(st => (
                        <option key={st._id} value={st._id}>
                          👤 Gửi Riêng Cho: {st.name} ({st.email}) - Group: {st.studentGroup?.toUpperCase()}
                        </option>
                      ))}
                    </select>

                    {!selectedStudentId && (
                      <select
                        value={docTargetGroup}
                        onChange={(e) => setDocTargetGroup(e.target.value)}
                        className="w-full px-4 py-2 rounded-2xl border border-slate-200 text-xs bg-slate-50 font-bold text-slate-700 mt-1.5"
                      >
                        <option value="all">🌐 Tất Cả Học Viên Trong Hệ Thống</option>
                        <option value="support">🔴 Chỉ Nhóm Cần Hỗ Trợ (&lt; 6.0 Band)</option>
                        <option value="average">🟡 Chỉ Nhóm Trung Bình (6.0 - 6.5 Band)</option>
                        <option value="excellent">🟣 Chỉ Nhóm Xuất Sắc (7.0 - 8.5+ Band)</option>
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">3. Nội Dung Nhắn Gửi Tới Học Viên *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Nhập nội dung hướng dẫn học tập chi tiết tới học viên..."
                    value={docMessage}
                    onChange={(e) => setDocMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 leading-relaxed transition"
                  ></textarea>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
                      📁 Tải Tệp Trực Tiếp Từ Máy Tính Cá Nhân (PDF / DOCX / Image)
                    </label>
                    <input
                      type="file"
                      onChange={handleLocalFileUpload}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                    />
                    {docName && (
                      <p className="text-xs font-bold text-indigo-600 mt-1.5 flex items-center">
                        <Check className="w-4 h-4 mr-1 text-emerald-600" /> Đã chọn tệp: {docName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hoặc Nhập URL Tài Liệu Online</label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên Tệp Hiển Thị</label>
                      <input
                        type="text"
                        placeholder="tai_lieu_task2.pdf"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 shrink-0 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSendDocModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={sendingDoc}
                  className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-2xl shadow-lg hover:shadow-xl transition"
                >
                  {sendingDoc ? 'Đang Phát Realtime...' : 'Phát Thông Báo Realtime 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
