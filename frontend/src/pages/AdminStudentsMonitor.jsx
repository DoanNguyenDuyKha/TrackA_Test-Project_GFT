import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { UserCheck, Shield, Sparkles, Eye, CheckCircle2, ChevronRight, X, Edit3, Trash2 } from 'lucide-react';

const AdminStudentsMonitor = () => {
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Assistant Pedagogical Monitoring State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  // Selected student for deep inspection
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [inspectSubmission, setInspectSubmission] = useState(null);

  // Edit Student Modal State
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGroup, setEditGroup] = useState('support');
  const [editTargetBand, setEditTargetBand] = useState(6.5);

  const fetchMonitorData = async () => {
    try {
      const [subRes, studentsRes] = await Promise.all([
        api.get('/submissions'),
        api.get('/auth/students')
      ]);

      if (subRes.data.success) {
        setSubmissions(subRes.data.data);
      }

      if (studentsRes.data.success) {
        const allStudents = studentsRes.data.data;
        const subs = subRes.data.success ? subRes.data.data : [];

        const enrichedStudents = allStudents.map(student => {
          const studentSubs = subs.filter(s => s.studentId?._id === student._id);
          return {
            ...student,
            submissionCount: studentSubs.length,
            lastOverall: studentSubs.length > 0 ? studentSubs[0].overallBand : 'Chưa nộp',
            movingAvg: studentSubs.length > 0
              ? (studentSubs.slice(0, 5).reduce((acc, s) => acc + s.overallBand, 0) / Math.min(5, studentSubs.length)).toFixed(1)
              : 'N/A'
          };
        });

        setUsers(enrichedStudents);
      }
    } catch (err) {
      console.error('Error fetching monitor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    setAnalyzingAI(true);
    try {
      const res = await api.post('/auth/ai-monitoring-analysis');
      if (res.data.success) {
        setAiAnalysis(res.data.data);
      }
    } catch (err) {
      console.error('Error running AI analysis:', err);
      alert('Có lỗi xảy ra khi gọi AI phân tích.');
    } finally {
      setAnalyzingAI(false);
    }
  };

  useEffect(() => {
    fetchMonitorData();
    handleRunAiAnalysis(); // Tự động AI phân tích ngay khi Admin mở trang Giám sát
  }, []);

  // Kiểm tra học viên có thuộc danh sách cần can thiệp khẩn cấp không
  const getCriticalAlert = (studentId) => {
    if (!aiAnalysis || !aiAnalysis.criticalInterventions) return null;
    return aiAnalysis.criticalInterventions.find(c => c.studentId?.toString() === studentId?.toString());
  };

  // Thay đổi thủ công nhóm năng lực (Manual Override)
  const handleOverrideGroup = async (studentId, newGroup) => {
    try {
      const res = await api.put(`/auth/users/${studentId}/override-group`, { studentGroup: newGroup });
      if (res.data.success) {
        setUsers(prev => prev.map(u => u._id === studentId ? { ...u, studentGroup: newGroup } : u));
        if (selectedStudent && selectedStudent._id === studentId) {
          setSelectedStudent({ ...selectedStudent, studentGroup: newGroup });
        }
        alert(`🎯 Đã Can Thiệp Thủ Công (Admin Manual Override): Chuyển học viên sang nhóm [${newGroup.toUpperCase()}] thành công!`);
      }
    } catch (err) {
      console.error('Error overriding group:', err);
      alert('Có lỗi xảy ra khi can thiệp điều chỉnh nhóm học viên!');
    }
  };

  // Xem chi tiết tiến độ học viên (Icon Mắt)
  const handleInspectStudent = (student) => {
    setSelectedStudent(student);
    const subList = submissions.filter(s => s.studentId?._id === student._id);
    setStudentSubmissions(subList);
    setInspectSubmission(subList[0] || null);
    setShowDetailModal(true);
  };

  // Mở modal sửa thông tin học viên (Icon Sửa)
  const openEditStudentModal = (student) => {
    setEditingStudent(student);
    setEditName(student.name || '');
    setEditEmail(student.email || '');
    setEditGroup(student.studentGroup || 'support');
    setEditTargetBand(student.targetBand || 6.5);
    setShowEditStudentModal(true);
  };

  // Lưu thông tin học viên vừa sửa
  const handleSaveStudentInfo = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const res = await api.put(`/auth/users/${editingStudent._id}`, {
        name: editName,
        email: editEmail,
        studentGroup: editGroup,
        targetBand: Number(editTargetBand)
      });
      if (res.data.success) {
        setShowEditStudentModal(false);
        fetchMonitorData();
      }
    } catch (err) {
      console.error('Error updating student profile:', err);
      alert('Có lỗi xảy ra khi cập nhật thông tin học viên.');
    }
  };

  // Xóa HOÀN TOÀN học viên & tất cả bài nộp (Icon Thùng rác)
  const handleDeleteStudentPermanently = async (student) => {
    if (!window.confirm(`⚠️ BẠN CÓ CHẮC CHẮN MỐN XÓA HOÀN TOÀN HỌC VIÊN "${student.name.toUpperCase()}"?\n\nHành động này sẽ xóa vĩnh viễn tài khoản học viên và tất cả các bài nộp trong hệ thống mà không bị ràng buộc bởi bất kỳ khóa chính/khóa ngoại nào!`)) {
      return;
    }

    try {
      const res = await api.delete(`/auth/users/${student._id}`);
      if (res.data.success) {
        fetchMonitorData();
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('Có lỗi xảy ra khi xóa học viên.');
    }
  };

  const getBadge = (group) => {
    switch (group) {
      case 'support':
        return <span className="px-2.5 py-1 bg-red-100 text-red-700 font-extrabold text-xs rounded-full border border-red-200">CẦN HỖ TRỢ</span>;
      case 'average':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold text-xs rounded-full border border-amber-200">TRUNG BÌNH</span>;
      case 'excellent':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 font-extrabold text-xs rounded-full border border-purple-200">XUẤT SẮC</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Giám Sát & Can Thiệp Sư Phạm Học Viên (Admin)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống AI tự động theo dõi tiến độ, bóc tách rủi ro ngưng trệ và hiển thị trực tiếp khuyến nghị can thiệp cho từng học viên.
          </p>
        </div>

        {/* Table danh sách học viên */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Đang tải danh sách học viên...</div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">Học viên</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Nhóm Thích Ứng Currently</th>
                  <th className="p-4 text-center">Số Bài Nộp</th>
                  <th className="p-4 text-center">Band Trung Bình Động (MA 5)</th>
                  <th className="p-4">Trạng Thái Rủi Ro & Khuyến Nghị Can Thiệp AI</th>
                  <th className="p-4 text-center">Can Thiệp Sư Phạm (Override)</th>
                  <th className="p-4 text-right">Chi Tiết Tiến Độ & Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((student) => {
                  const riskAlert = getCriticalAlert(student._id);
                  return (
                    <tr
                      key={student._id}
                      className={`transition ${
                        riskAlert
                          ? 'bg-red-50/60 hover:bg-red-50 border-l-4 border-l-red-500'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-bold text-slate-800 flex items-center space-x-2">
                          <span>{student.name}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">Target: {student.targetBand || 6.5} Band</span>
                      </td>
                      <td className="p-4 text-xs text-slate-600 font-mono">{student.email}</td>
                      <td className="p-4">{getBadge(student.studentGroup)}</td>
                      <td className="p-4 text-center font-bold text-slate-700">{student.submissionCount}</td>
                      <td className="p-4 text-center">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 font-extrabold text-xs rounded-full border border-blue-100">
                          {student.movingAvg} Band
                        </span>
                      </td>
                      <td className="p-4 max-w-xs">
                        {riskAlert ? (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 bg-red-600 text-white font-black text-[10px] rounded-full uppercase inline-block animate-pulse shadow-sm">
                              🚨 CAN THIỆP GẤP ({riskAlert.riskLevel})
                            </span>
                            <p className="text-[11px] text-red-900 font-medium leading-snug">
                              <strong>Lý do:</strong> {riskAlert.reason}
                            </p>
                            <p className="text-[11px] text-indigo-900 font-bold leading-snug">
                              <strong>Gợi ý Admin:</strong> {riskAlert.suggestedAction}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Học tập tiến bộ ổn định
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {/* Manual Override Dropdown */}
                        <select
                          value={student.studentGroup || 'support'}
                          onChange={(e) => handleOverrideGroup(student._id, e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-200 transition"
                        >
                          <option value="support">Set: Support (&lt;6.0)</option>
                          <option value="average">Set: Average (6.0-6.5)</option>
                          <option value="excellent">Set: Excellent (7.0+)</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Icon Mắt: Xem Tiến Độ */}
                          <button
                            onClick={() => handleInspectStudent(student)}
                            className="p-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition"
                            title="Xem tiến độ bài nộp học viên"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Icon Sửa: Sửa thông tin học viên */}
                          <button
                            onClick={() => openEditStudentModal(student)}
                            className="p-2 text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-100 transition"
                            title="Sửa thông tin học viên"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {/* Icon Thùng Rác: Xóa hoàn toàn học viên không bị vướng ràng buộc */}
                          <button
                            onClick={() => handleDeleteStudentPermanently(student)}
                            className="p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 transition"
                            title="Xóa hoàn toàn học viên và tất cả bài nộp"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}


        {/* Modal Xem Lịch Sử Bài Viết & Kết Quả GPT-4o Chấm */}
        {showDetailModal && selectedStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-5 border border-slate-200 no-scrollbar overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">
                    Lịch Sử Học Tập: {selectedStudent.name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Submissions List Tabs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 border-r border-slate-100 pr-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Các bài nộp ({studentSubmissions.length})
                  </span>
                  {studentSubmissions.map((sub) => (
                    <div
                      key={sub._id}
                      onClick={() => setInspectSubmission(sub)}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer transition ${
                        inspectSubmission?._id === sub._id
                          ? 'bg-blue-50 border-blue-300 font-bold text-blue-700 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <p className="line-clamp-1 font-bold">{sub.assignmentId?.title || 'Bài thi Task 2'}</p>
                      <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
                        <span>Overall: <strong className="text-blue-600">{sub.overallBand}</strong></span>
                        <span>{new Date(sub.submittedAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detailed GPT-4o Evaluation View */}
                <div className="md:col-span-2 space-y-4">
                  {inspectSubmission ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div>
                          <span className="text-xs font-bold text-slate-500">KẾT QUẢ CHẤM GPT-4O</span>
                          <h4 className="font-bold text-slate-800 text-sm">{inspectSubmission.assignmentId?.title}</h4>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                          {inspectSubmission.overallBand}
                        </div>
                      </div>

                      {/* 4 Criteria Scores */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-slate-700">TR: {inspectSubmission.criteriaScores?.TR?.score}</span>
                          <p className="text-[11px] text-slate-600 mt-1">{inspectSubmission.criteriaScores?.TR?.feedback}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-slate-700">CC: {inspectSubmission.criteriaScores?.CC?.score}</span>
                          <p className="text-[11px] text-slate-600 mt-1">{inspectSubmission.criteriaScores?.CC?.feedback}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-slate-700">LR: {inspectSubmission.criteriaScores?.LR?.score}</span>
                          <p className="text-[11px] text-slate-600 mt-1">{inspectSubmission.criteriaScores?.LR?.feedback}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-slate-700">GRA: {inspectSubmission.criteriaScores?.GRA?.score}</span>
                          <p className="text-[11px] text-slate-600 mt-1">{inspectSubmission.criteriaScores?.GRA?.feedback}</p>
                        </div>
                      </div>

                      {/* Student Original Essay */}
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500">Bài luận gốc của học viên:</span>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-serif leading-relaxed text-slate-800 max-h-48 overflow-y-auto">
                          {inspectSubmission.studentAnswers}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Chọn bài nộp ở cột bên trái để xem chi tiết kết quả chấm.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Sửa Thông Tin Học Viên */}

        {showEditStudentModal && editingStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Chỉnh Sửa Thông Tin Học Viên</h3>
                    <p className="text-xs text-slate-400">Cập nhật họ tên, email, nhóm năng lực và band mục tiêu</p>
                  </div>
                </div>
                <button onClick={() => setShowEditStudentModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStudentInfo} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 mb-1">Họ Và Tên Học Viên</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-normal text-xs focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Địa Chỉ Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-normal text-xs focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1">Nhóm Thích Ứng (Group)</label>
                    <select
                      value={editGroup}
                      onChange={(e) => setEditGroup(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-amber-700 cursor-pointer"
                    >
                      <option value="support">🔴 Support (&lt;6.0)</option>
                      <option value="average">🟡 Average (6.0-6.5)</option>
                      <option value="excellent">🟣 Excellent (7.0+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">Target Band Mục Tiêu</label>
                    <input
                      type="number"
                      step="0.5"
                      min="4.0"
                      max="9.0"
                      value={editTargetBand}
                      onChange={(e) => setEditTargetBand(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditStudentModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    Lưu Thay Đổi 💾
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

export default AdminStudentsMonitor;

