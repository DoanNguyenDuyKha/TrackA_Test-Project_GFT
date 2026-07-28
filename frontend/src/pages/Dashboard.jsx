import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Sparkles, Clock, ArrowRight, CheckCircle2, Shield, Trophy, Zap, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const { user, updateUserGroup } = useAuth();
  const navigate = useNavigate();
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEligibleForPromotion, setIsEligibleForPromotion] = useState(false);
  const [generatingTest, setGeneratingTest] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/submissions');
        if (res.data.success) {
          const subs = res.data.data;
          setRecentSubmissions(subs.slice(0, 5));

          // Đánh giá điều kiện đủ xét làm bài Test Nâng Hạng (3 bài gần nhất MA >= 6.0/7.0)
          if (subs.length >= 3) {
            const top3 = subs.slice(0, 3);
            const avg = top3.reduce((acc, s) => acc + s.overallBand, 0) / 3;

            if (user?.studentGroup === 'support' && avg >= 6.0) {
              setIsEligibleForPromotion(true);
            } else if (user?.studentGroup === 'average' && avg >= 7.0) {
              setIsEligibleForPromotion(true);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching submissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Bắt đầu làm bài Test Nâng Hạng (AI sinh đề mới)
  const handleStartPromotionTest = async () => {
    setGeneratingTest(true);
    try {
      const res = await api.post('/grading/generate-promotion-prompt');
      if (res.data.success) {
        const { assignment, targetNextGroup } = res.data.data;
        // Chuyển tới Workspace làm bài test nâng hạng độc bản
        navigate(`/workspace/${assignment._id}`, {
          state: { isPromotionTest: true, targetNextGroup }
        });
      }
    } catch (err) {
      console.error('Error generating promotion test:', err);
      alert('Có lỗi xảy ra khi tạo đề thi nâng hạng. Vui lòng thử lại!');
    } finally {
      setGeneratingTest(false);
    }
  };

  const getGroupBadge = (group) => {
    switch (group) {
      case 'support':
        return <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full border border-red-200">CẦN HỖ TRỢ</span>;
      case 'average':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-200">TRUNG BÌNH</span>;
      case 'excellent':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 font-bold text-xs rounded-full border border-purple-200">XUẤT SẮC</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner Khai phá & Mở khóa Bài Test Nâng Hạng Độc Bản AI */}
        {isEligibleForPromotion && user?.studentGroup !== 'excellent' && (
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden animate-fadeIn">
            <div className="flex flex-wrap justify-between items-center gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <span className="px-3 py-1 bg-yellow-400 text-slate-900 font-black text-[11px] rounded-full uppercase tracking-wider inline-flex items-center shadow-md">
                  <Zap className="w-3.5 h-3.5 mr-1" /> ĐỦ ĐIỀU KIỆN MỞ KHÓA BÀI TEST NÂNG HẠNG
                </span>
                <h2 className="text-2xl font-black">Bạn Đã Sẵn Sàng Bứt Phá Nhóm Năng Lực? 🚀</h2>
                <p className="text-xs text-purple-100 leading-relaxed">
                  Kết quả các bài thực hành vừa qua cho thấy bạn duy trì phong độ rất tốt! Hệ thống AI đã mở khóa <span className="underline font-bold">Bài Test Nâng Hạng Độc Bản (GPT-4o)</span>. Hoàn thành bài test này để nâng hạng nhóm năng lực chính thức!
                </p>
              </div>

              <button
                onClick={handleStartPromotionTest}
                disabled={generatingTest}
                className="px-6 py-3.5 bg-white hover:bg-yellow-300 text-slate-900 font-black text-sm rounded-2xl shadow-2xl transition transform active:scale-95 flex items-center space-x-2 shrink-0"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>{generatingTest ? 'AI Đang Sinh Đề Độc Bản...' : 'Bắt Đầu Test Nâng Hạng'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl flex flex-wrap justify-between items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold">
                Nền tảng Học tập Thích ứng LMS
              </span>
            </div>
            <h1 className="text-3xl font-black">Xin chào, {user?.name}! 👋</h1>
            <p className="text-blue-100 text-sm max-w-xl">
              Hệ thống AI tự động điều chỉnh lộ trình học tập, đề thi và bài giảng theo từng cấp độ năng lực để giúp bạn bứt phá Band điểm IELTS tốt nhất.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center min-w-[200px]">
            <p className="text-xs uppercase text-blue-200 font-bold mb-1">Nhóm Năng Lực Hiện Tại</p>
            <div className="my-2">{getGroupBadge(user?.studentGroup)}</div>
            <p className="text-[11px] text-blue-100 mt-1">Target Band: <span className="font-bold text-yellow-300">{user?.targetBand || 6.5}</span></p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => navigate('/assignments')}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition duration-200">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition">
              Đề Thi Thực Hành Thích Ứng
            </h3>
            <p className="text-slate-600 text-xs mb-4">
              Luyện tập với các đề IELTS Writing Task 2 được thiết kế riêng phù hợp với nhóm <span className="font-semibold">{user?.studentGroup}</span>.
            </p>
            <span className="inline-flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition">
              Khám phá đề thi <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>

          <div
            onClick={() => navigate('/lectures')}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition duration-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition">
              Bài Học Lý Thuyết & Bài Tập
            </h3>
            <p className="text-slate-600 text-xs mb-4">
              Học các bài giảng chuyên sâu bổ trợ tiêu chí TR, CC, LR, GRA và làm các bài tập tương tác tức thì.
            </p>
            <span className="inline-flex items-center text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition">
              Vào bài học <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>
        </div>

        {/* Recent Submissions History */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Lịch Sử Nộp Bài & Kết Quả Chấm gần đây
          </h3>

          {loading ? (
            <div className="text-center py-6 text-slate-500 text-sm">Đang tải lịch sử bài nộp...</div>
          ) : recentSubmissions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentSubmissions.map((sub) => (
                <div
                  key={sub._id}
                  onClick={() => navigate(`/results/${sub._id}`)}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-3 rounded-xl transition cursor-pointer"
                >
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{sub.assignmentId?.title || 'Bài thi Task 2'}</h4>
                    <p className="text-xs text-slate-500">
                      Nộp lúc: {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-semibold text-slate-500">Overall:</span>
                    <span className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                      {sub.overallBand}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              Bạn chưa nộp bài thi nào. Hãy bắt đầu luyện tập ngay nhé!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
