import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { UserCheck, Shield, Sparkles } from 'lucide-react';

const AdminStudents = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllSubmissions = async () => {
      try {
        const res = await api.get('/submissions');
        if (res.data.success) {
          setSubmissions(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching admin student submissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSubmissions();
  }, []);

  const getBadge = (group) => {
    switch (group) {
      case 'support':
        return <span className="px-2.5 py-0.5 bg-red-100 text-red-700 font-bold text-[11px] rounded-full">CẦN HỖ TRỢ</span>;
      case 'average':
        return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold text-[11px] rounded-full">TRUNG BÌNH</span>;
      case 'excellent':
        return <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 font-bold text-[11px] rounded-full">XUẤT SẮC</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Giám Sát Tiến Độ Học Viên (Admin)</h1>
          <p className="text-xs text-slate-500">Theo dõi toàn bộ lịch sử làm bài, Band điểm và phân nhóm thích ứng của các học viên</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Đang tải lịch sử giám sát...</div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">Tên học viên</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Nhóm hiện tại</th>
                  <th className="p-4">Đề thi đã làm</th>
                  <th className="p-4 text-center">Overall Band</th>
                  <th className="p-4">Thời gian nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-slate-800">{sub.studentId?.name || 'Học viên'}</td>
                    <td className="p-4 text-slate-600 text-xs">{sub.studentId?.email}</td>
                    <td className="p-4">{getBadge(sub.studentId?.studentGroup)}</td>
                    <td className="p-4 font-medium text-slate-700 text-xs">{sub.assignmentId?.title}</td>
                    <td className="p-4 text-center">
                      <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs inline-flex items-center justify-center shadow-md">
                        {sub.overallBand}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudents;
