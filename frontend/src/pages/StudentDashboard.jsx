import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import IELTSWritingRubric from '../components/IELTSWritingRubric';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BookOpen, Sparkles, Award, ArrowRight, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [recommendedLectures, setRecommendedLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Điểm nghẽn tiêu chí thấp nhất
  const [weakestCriterion, setWeakestCriterion] = useState(null);

  useEffect(() => {
    const fetchStudentDashboard = async () => {
      try {
        const [subRes, lecRes] = await Promise.all([
          api.get('/submissions'),
          api.get('/lectures')
        ]);

        let userSubs = [];
        if (subRes.data.success) {
          userSubs = subRes.data.data;
          setSubmissions(userSubs);
        }

        // Nếu là học viên mới chưa phân loại (chỉ riêng nhóm support và chưa có bài nộp nào) -> Chuyển đến bài Placement Test
        if (user.role === 'student' && userSubs.length === 0 && (!user.studentGroup || user.studentGroup === 'support')) {
          navigate('/placement-test');
          return;
        }

        let allLectures = [];
        if (lecRes.data.success) {
          allLectures = lecRes.data.data;
        }

        // Đánh giá điểm nghẽn tiêu chí thấp nhất ở bài nộp gần đây nhất
        if (userSubs.length > 0) {
          const latest = userSubs[0];
          const scores = latest.criteriaScores;

          if (scores) {
            let lowestKey = 'TR';
            let lowestScore = scores.TR?.score || 9;

            ['CC', 'LR', 'GRA'].forEach((crit) => {
              if (scores[crit]?.score < lowestScore) {
                lowestScore = scores[crit].score;
                lowestKey = crit;
              }
            });

            setWeakestCriterion({ key: lowestKey, score: lowestScore });

            // Lọc các bài giảng có focusCriterion trùng với tiêu chí yếu nhất
            const matched = allLectures.filter(l => l.focusCriterion === lowestKey);
            setRecommendedLectures(matched.length > 0 ? matched : allLectures.slice(0, 2));
          }
        } else {
          setRecommendedLectures(allLectures.slice(0, 2));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDashboard();
  }, []);

  // Chuẩn bị dữ liệu cho Recharts Line Chart
  const chartData = submissions
    .slice()
    .reverse()
    .map((sub, idx) => ({
      date: new Date(sub.submittedAt).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }),
      Overall: sub.overallBand,
      TR: sub.criteriaScores?.TR?.score || 0,
      CC: sub.criteriaScores?.CC?.score || 0,
      LR: sub.criteriaScores?.LR?.score || 0,
      GRA: sub.criteriaScores?.GRA?.score || 0
    }));

  const getBadge = (group) => {
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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* User Overview Top Card */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-wrap justify-between items-center gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-xs font-bold rounded-full">
              Hồ Sơ Học Viên Adaptive LMS
            </span>
            <h1 className="text-3xl font-black">{user?.name}</h1>
            <p className="text-xs text-blue-100">{user?.email}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center">
              <p className="text-[11px] uppercase font-bold text-blue-200 mb-1">Cấp độ hiện tại</p>
              {getBadge(user?.studentGroup)}
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[110px]">
              <p className="text-[11px] uppercase font-bold text-blue-200 mb-1">Mục tiêu Band</p>
              <p className="text-2xl font-black text-yellow-300">{user?.targetBand || 6.5}</p>
            </div>
          </div>
        </div>

        {/* SPECIAL FEATURE FOR EXCELLENT STUDENTS: AI MASTER EXAM GENERATOR */}
        {user?.studentGroup === 'excellent' && (
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-500/30 flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="px-3.5 py-1 bg-purple-500/30 border border-purple-400/40 text-purple-200 font-extrabold text-xs rounded-full uppercase tracking-wider flex items-center w-fit">
                <Sparkles className="w-4 h-4 mr-1.5 text-yellow-300 animate-spin" />
                ĐẶC QUYỀN HỌC VIÊN XUẤT SẮC (EXCELLENT CLUB)
              </span>
              <h2 className="text-2xl font-black text-white">AI Master Exam Generator & Lexical Booster 8.5+</h2>
              <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
                Là học viên nhóm Xuất Sắc, bạn được cấp quyền kích hoạt AI tự động sáng tạo ra **Đề thi thử IELTS Task 2 chủ đề phức tạp độc bản**. Trong quá trình làm bài và nộp bài, AI sẽ phân tích chuyên sâu tiêu chí Lexical Resource và **hướng dẫn nâng cấp các từ vựng đơn giản thành các cụm Collocations / Cấu trúc từ vựng nâng cao đồng nghĩa chuẩn Band 8.5+**.
              </p>
            </div>

            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await api.post('/grading/generate-ai-exam').catch(() => api.post('/grading/generate-promotion-prompt'));
                  if (res && res.data && res.data.success) {
                    const assignId = res.data.data.assignment._id;
                    navigate(`/workspace/${assignId}`);
                  }
                } catch (e) {
                  alert('Có lỗi xảy ra khi tạo đề thi AI. Vui lòng thử lại!');
                } finally {
                  setLoading(false);
                }
              }}
              className="px-7 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition transform active:scale-95 flex items-center space-x-2 shrink-0"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span>Yêu Cầu AI Sinh Đề Thi Khó Độc Bản</span>
            </button>
          </div>
        )}

        {/* SECTION 1: RECHARTS MULTI-AXIS LINE CHART */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Biểu Đồ Tiến Bộ 4 Tiêu Chí IELTS Task 2 (TR, CC, LR, GRA)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi biến động Band điểm qua từng mốc bài nộp để phát hiện điểm nghẽn
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Đang tải biểu đồ tiến bộ...</div>
          ) : chartData.length > 0 ? (
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[1, 9]} ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9]} stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="TR" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name="Task Response (TR)" />
                  <Line type="monotone" dataKey="CC" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Coherence & Cohesion (CC)" />
                  <Line type="monotone" dataKey="LR" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Lexical Resource (LR)" />
                  <Line type="monotone" dataKey="GRA" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} name="Grammar Range & Accuracy" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              Chưa có dữ liệu tiến bộ. Hãy làm và nộp ít nhất 1 bài luận để xem biểu đồ!
            </div>
          )}
        </div>

        {/* SECTION 2: AI RECOMMENDATION ENGINE (KHẮC PHỤC ĐIỂM NGHẼN) */}
        {weakestCriterion && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-7 h-7 text-yellow-200 animate-bounce" />
              <div>
                <h3 className="text-xl font-black">AI ĐỀ XUẤT KHẮC PHỤC ĐIỂM NGHẼN HỌC THUẬT</h3>
                <p className="text-xs text-amber-100">
                  Dựa trên bài nộp gần đây nhất, tiêu chí <span className="font-extrabold underline uppercase">{weakestCriterion.key}</span> của bạn đang đạt mức thấp nhất ({weakestCriterion.score} Band).
                </p>
              </div>
            </div>

            {/* List of recommended lectures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {recommendedLectures.map((lec) => (
                <div key={lec._id} className="bg-white/95 text-slate-900 rounded-2xl p-4 space-y-2 shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded-md">
                      Tập trung: {lec.focusCriterion}
                    </span>
                    <span className="text-[11px] text-slate-500">Dành cho: {lec.targetGroup}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">{lec.title}</h4>
                  <button
                    onClick={() => navigate('/lectures')}
                    className="w-full mt-2 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1"
                  >
                    <span>Ôn Luyện Bài Giảng Ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: TRA CỨU RUBRIC CHÍNH THỨC */}
        <IELTSWritingRubric />
      </div>
    </div>
  );
};

export default StudentDashboard;
