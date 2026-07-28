import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, FileText, Sparkles, TrendingUp, AlertTriangle, ShieldCheck, Plus, ArrowRight, CheckCircle2 } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    supportCount: 0,
    averageCount: 0,
    excellentCount: 0
  });

  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDashboardData = async () => {
      try {
        const [studentsRes, assignmentsRes, submissionsRes, aiAnalysisRes] = await Promise.all([
          api.get('/auth/students'),
          api.get('/assignments'),
          api.get('/submissions'),
          api.post('/auth/ai-monitoring-analysis').catch(() => ({ data: { success: false } }))
        ]);

        const students = studentsRes.data.success ? studentsRes.data.data : [];
        const assignments = assignmentsRes.data.success ? assignmentsRes.data.data : [];
        const submissions = submissionsRes.data.success ? submissionsRes.data.data : [];

        let supportC = 0;
        let avgC = 0;
        let excC = 0;

        students.forEach(s => {
          if (s.studentGroup === 'support') supportC++;
          else if (s.studentGroup === 'average') avgC++;
          else if (s.studentGroup === 'excellent') excC++;
        });

        setStats({
          totalStudents: students.length,
          totalAssignments: assignments.length,
          totalSubmissions: submissions.length,
          supportCount: supportC,
          averageCount: avgC,
          excellentCount: excC
        });

        setRecentSubmissions(submissions.slice(0, 6));

        if (aiAnalysisRes.data?.success && aiAnalysisRes.data.data?.criticalInterventions) {
          setAtRiskStudents(aiAnalysisRes.data.data.criticalInterventions.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching Admin Dashboard Data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDashboardData();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
        {/* Admin Command Center Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-8 text-white shadow-2xl flex flex-wrap justify-between items-center gap-6 border border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                🛡️ HỆ THỐNG ĐIỀU HÀNH SƯ PHẠM ADMIN
              </span>
            </div>
            <h1 className="text-3xl font-black">Trung Tâm Quản Trị LMS & Cố Vấn Sư Phạm</h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Theo dõi biến độ năng lực toàn bộ lớp học, phát hiện rủi ro ngưng trệ tự động bằng AI, gửi tài liệu bổ trợ Realtime và điều hành kho đề thi thích ứng.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/admin/assignments')}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Quản Lý Đề Thi</span>
            </button>
            <button
              onClick={() => navigate('/admin/students')}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs rounded-2xl border border-white/20 transition flex items-center space-x-2"
            >
              <Users className="w-4 h-4 text-yellow-400" />
              <span>Giám Sát Học Viên</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Học Viên</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-800">{stats.totalStudents}</div>
            <p className="text-[11px] text-slate-500 font-medium">Học viên đang học trong hệ thống</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Đề Thi Thích Ứng</span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-800">{stats.totalAssignments}</div>
            <p className="text-[11px] text-slate-500 font-medium">Đề thi IELTS Writing Task 2</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lượt Bài Nộp GPT-4o</span>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-800">{stats.totalSubmissions}</div>
            <p className="text-[11px] text-slate-500 font-medium">Lượt thực hành & chấm điểm AI</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phân Phối Nhóm Thích Ứng</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold pt-1">
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md">Supp: {stats.supportCount}</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">Avg: {stats.averageCount}</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md">Exc: {stats.excellentCount}</span>
            </div>
          </div>
        </div>

        {/* Section 2 Columns: AI At-Risk Student Follow-up & Recent Submissions Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Critical At-Risk Follow-up */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 border border-slate-800">
            <div className="flex justify-between items-center border-b border-indigo-800/60 pb-4">
              <h3 className="text-lg font-black text-yellow-300 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                Cảnh Báo Sư Phạm AI: Học Viên Cần Can Thiệp Gấp
              </h3>
              <button
                onClick={() => navigate('/admin/students')}
                className="text-xs font-bold text-indigo-300 hover:text-white transition flex items-center"
              >
                Tất cả <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="space-y-3">
              {atRiskStudents.length > 0 ? (
                atRiskStudents.map((st, idx) => (
                  <div key={idx} className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-red-500/30 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-yellow-200">{st.studentName}</span>
                      <span className="px-2.5 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full uppercase">
                        {st.riskLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300"><strong>Lý do:</strong> {st.reason}</p>
                    <p className="text-xs text-indigo-200 font-bold"><strong>Khuyến nghị:</strong> {st.suggestedAction}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-indigo-200">
                  Tất cả học viên trong lớp đều đang duy trì tiến độ học tập ổn định!
                </div>
              )}
            </div>
          </div>

          {/* Realtime Submission Stream */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Dòng Bài Nộp Thực Hành Mới Nhất
              </h3>
              <button
                onClick={() => navigate('/admin/students')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center"
              >
                Giám sát lớp <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentSubmissions.length > 0 ? (
                recentSubmissions.map((sub) => (
                  <div key={sub._id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{sub.studentId?.name || 'Học viên'}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{sub.assignmentId?.title || 'Bài thi Task 2'}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 bg-blue-600 text-white font-black text-xs rounded-full shadow-sm">
                        {sub.overallBand} Band
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">Chưa có bài nộp nào gần đây.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
