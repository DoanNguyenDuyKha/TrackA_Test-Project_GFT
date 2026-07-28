import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Send, Clock, CheckCircle2, AlertCircle, BookOpen, Trophy, ArrowRight, Award } from 'lucide-react';

const PlacementTest = () => {
  const { user, updateUserGroup } = useAuth();
  const navigate = useNavigate();

  const [essay, setEssay] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // State quản lý Modal Kết quả Đóng/Mở & Chi tiết Điểm
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);

  // Bài test cố định để đánh giá xếp lớp đầu vào
  const placementPrompt = {
    title: 'Bài Test Khảo Sát Năng Lực Xếp Lớp Đầu Vào (Diagnostic Placement Test)',
    prompt: 'Some people think that university students should focus on one specific subject, while others believe they should study a wide range of subjects. Discuss both views and give your opinion.',
    topic: 'Education'
  };

  const handleCompleteTest = async () => {
    if (!essay.trim() || essay.trim().split(/\s+/).length < 50) {
      alert('Bài làm cần đạt tối thiểu 50 từ để hệ thống AI đánh giá phân nhóm chính xác!');
      return;
    }

    setSubmitting(true);
    try {
      const assignRes = await api.get('/assignments');
      let targetAssignmentId;

      if (assignRes.data.success && assignRes.data.data.length > 0) {
        // Ưu tiên bài thi đúng chủ đề Education của Đề bài Placement Test
        const eduAssign = assignRes.data.data.find(a => a.topic === 'Education' || a.prompt.includes('university students'));
        targetAssignmentId = eduAssign ? eduAssign._id : assignRes.data.data[0]._id;
      } else {
        alert('Đang tải dữ liệu bài thi...');
        setSubmitting(false);
        return;
      }

      const res = await api.post('/grading/submit', {
        assignmentId: targetAssignmentId,
        studentAnswers: essay,
        customPrompt: placementPrompt.prompt
      });

      if (res.data.success) {
        const submission = res.data.data.submission;
        const band = submission.overallBand || 5.0;

        // Phân loại nhóm học viên chuẩn xác dựa trên Band điểm bài Test Đầu Vào
        let assignedGroup = 'support';
        if (band >= 7.5) {
          assignedGroup = 'excellent';
        } else if (band >= 6.0) {
          assignedGroup = 'average';
        } else {
          assignedGroup = 'support';
        }

        // Cập nhật CSDL và Context
        await api.put('/auth/update-group', { studentGroup: assignedGroup }).catch(() => {});
        updateUserGroup(assignedGroup);

        setResultData({
          assignedGroup,
          overallBand: submission.overallBand,
          criteriaScores: submission.criteriaScores,
          submissionId: submission._id
        });

        setSubmitting(false);
        setShowResultModal(true);
      }
    } catch (err) {
      console.error('Placement test error:', err);
      alert('Có lỗi xảy ra khi chấm bài test. Vui lòng thử lại!');
      setSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    setShowResultModal(false);
    navigate('/');
  };

  const getGroupBadge = (group) => {
    switch (group) {
      case 'support':
        return <span className="px-3 py-1 bg-red-100 text-red-700 font-extrabold text-xs rounded-full border border-red-200">CẦN HỖ TRỢ (SUPPORT)</span>;
      case 'average':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-extrabold text-xs rounded-full border border-amber-200">TRUNG BÌNH (AVERAGE)</span>;
      case 'excellent':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 font-extrabold text-xs rounded-full border border-purple-200">XUẤT SẮC (EXCELLENT)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Overlay Loading Modal khi AI đang chấm điểm */}
      {submitting && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-slate-100 space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping"></div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-800">AI Đang Đánh Giá Năng Lực Đầu Vào...</h3>
            <p className="text-xs text-slate-600">
              Hệ thống đang phân tích vốn từ vựng, cấu trúc câu và mạch liên kết để xếp bạn vào nhóm học phù hợp nhất.
            </p>
          </div>
        </div>
      )}

      {/* POPUP MODAL KẾT QUẢ ĐẦU VÀO VỚI HIỆU ỨNG ĐỘNG (ANIMATED PLACEMENT RESULT MODAL) */}
      {showResultModal && resultData && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center border border-slate-100 space-y-6 relative overflow-hidden transform transition-all scale-100 animate-scaleUp">
            {/* Background Decorative Gradient Light */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-tr from-blue-400 to-indigo-500 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full blur-3xl opacity-20"></div>

            {/* Trophy Icon with Bounce Effect */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30 animate-bounce">
              <Trophy className="w-10 h-10 text-yellow-300" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                KẾT QUẢ XẾP LỚP ĐẦU VÀO TỰ ĐỘNG
              </span>
              <h3 className="text-2xl font-black text-slate-800 pt-1">Chúc mừng {user?.name}!</h3>
              <p className="text-xs text-slate-500">
                Hệ thống AI đã hoàn tất chấm điểm và xếp cấp độ học tập cho bạn.
              </p>
            </div>

            {/* Overall Band & Assigned Group Box */}
            <div className="p-5 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-xs font-bold text-slate-600">ĐIỂM OVERALL BAND:</span>
                <span className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  {resultData.overallBand}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <p className="text-xs text-slate-500 mb-1.5 font-medium">NHÓM NĂNG LỰC ĐƯỢC PHÂN BỔ:</p>
                <div>{getGroupBadge(resultData.assignedGroup)}</div>
              </div>
            </div>

            {/* 4 Criteria Scores Breakdown Grid */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] text-slate-400 font-bold">TR</span>
                <span className="font-black text-slate-800 text-sm">{resultData.criteriaScores?.TR?.score}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] text-slate-400 font-bold">CC</span>
                <span className="font-black text-slate-800 text-sm">{resultData.criteriaScores?.CC?.score}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] text-slate-400 font-bold">LR</span>
                <span className="font-black text-slate-800 text-sm">{resultData.criteriaScores?.LR?.score}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] text-slate-400 font-bold">GRA</span>
                <span className="font-black text-slate-800 text-sm">{resultData.criteriaScores?.GRA?.score}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                onClick={handleGoToDashboard}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 text-sm flex items-center justify-center space-x-2 transition transform active:scale-95"
              >
                <span>Vào Trang Học Tập Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-3">
          <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-yellow-300" />
            BÀI TEST BẮT BUỘC DÀNH CHO HỌC VIÊN MỚI
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Chào mừng {user?.name}! Hãy hoàn thành bài Test xếp lớp 🎯</h1>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            Hệ thống LMS Adaptive không yêu cầu bạn tự chọn cấp độ. Bạn chỉ cần viết một bài luận ngắn dưới đây, AI sẽ tự động phân tích và xếp bạn vào đúng nhóm năng lực (<span className="underline font-bold">Support</span>, <span className="underline font-bold">Average</span>, hoặc <span className="underline font-bold">Excellent</span>).
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
              Chủ đề: {placementPrompt.topic}
            </span>
            <h2 className="text-lg font-bold text-slate-800">{placementPrompt.title}</h2>
            <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200 italic">
              "{placementPrompt.prompt}"
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
              <span>Bài viết khảo sát của bạn:</span>
              <span>Số từ: {essay.trim() ? essay.trim().split(/\s+/).length : 0} từ</span>
            </div>

            <textarea
              rows={12}
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Nhập bài luận tiếng Anh của bạn tại đây để AI đánh giá trình độ..."
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-serif focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            ></textarea>
          </div>

          <button
            onClick={handleCompleteTest}
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 text-sm flex items-center justify-center space-x-2 transition"
          >
            <Send className="w-4 h-4" />
            <span>Nộp Bài Test & Đánh Giá Cấp Độ Tự Động</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlacementTest;
