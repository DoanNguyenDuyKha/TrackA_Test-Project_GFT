import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Tag, ArrowRight, Sparkles, Filter, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

const AssignmentsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [submissionsMap, setSubmissionsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignRes, subRes] = await Promise.all([
          api.get('/assignments'),
          api.get('/submissions')
        ]);

        if (assignRes.data.success) {
          setAssignments(assignRes.data.data);
        }

        // Tạo Map quản lý bài nộp mới nhất cho từng đề thi
        if (subRes.data.success) {
          const subMap = {};
          subRes.data.data.forEach(sub => {
            const assignId = sub.assignmentId?._id || sub.assignmentId;
            if (assignId) {
              // Lưu lại bản nộp mới nhất (do danh sách submissions đã sort theo submittedAt giảm dần)
              if (!subMap[assignId]) {
                subMap[assignId] = sub;
              }
            }
          });
          setSubmissionsMap(subMap);
        }
      } catch (err) {
        console.error('Error fetching assignments & submissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Hàm chuyển đổi studentGroup sang thang Band tham chiếu
  const getExpectedBandRange = (group) => {
    switch (group) {
      case 'support':
        return { min: 0, max: 5.5, label: 'Dưới 6.0 Band' };
      case 'average':
        return { min: 6.0, max: 7.0, label: '6.0 - 7.0 Band' };
      case 'excellent':
        return { min: 7.5, max: 9.0, label: '7.5+ Band' };
      default:
        return { min: 6.0, max: 7.0, label: '6.0 - 7.0 Band' };
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Đề Thi Thực Hành Thích Ứng</h1>
            <p className="text-xs text-slate-500 mt-1">
              Danh sách đề thi được tự động đề xuất dựa theo nhóm năng lực <span className="font-bold uppercase text-blue-600">{user?.studentGroup}</span> của bạn.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Phần phân loại: Thích ứng tự động</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : assignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignments.map((item) => {
              const submission = submissionsMap[item._id];
              const isCompleted = !!submission;
              const overallScore = submission?.overallBand;
              const expectedRange = getExpectedBandRange(user?.studentGroup);

              // Kiểm tra nếu bài nộp trước đó có Band điểm thấp hơn mức năng lực hiện tại của học viên
              const isLowerThanCurrentLevel = isCompleted && overallScore < expectedRange.min;

              return (
                <div
                  key={item._id}
                  className={`bg-white rounded-3xl p-6 shadow-sm border transition duration-200 flex flex-col justify-between space-y-4 ${
                    isCompleted ? 'border-blue-200/80 bg-gradient-to-b from-white to-blue-50/20' : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                        {item.topic}
                      </span>

                      {/* Hiển thị Badge Trạng Thái Đã Làm + Lưu Điểm AI */}
                      {isCompleted ? (
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full flex items-center shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            ĐÃ LÀM
                          </span>
                          <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                            {overallScore}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-md">
                          Mục tiêu: {item.targetGroup}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 leading-snug">{item.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                      "{item.prompt}"
                    </p>

                    {/* LỜI NHẮC AI NẾU BÀI ĐÃ LÀM CÓ BAND THẤP HƠN CẤP ĐỘ HIỆN TẠI */}
                    {isLowerThanCurrentLevel && (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1 animate-fadeIn">
                        <div className="flex items-center font-extrabold text-amber-800 space-x-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>LỜI NHẮC CẢI THIỆN TỪ AI COACH:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-800">
                          Bài làm trước đây của bạn chỉ đạt <span className="font-extrabold text-red-600">{overallScore} Band</span>, thấp hơn chuẩn phong độ cấp độ <span className="font-bold uppercase text-blue-700">{user?.studentGroup}</span> hiện tại ({expectedRange.label}). Hãy làm lại bài này để bứt phá điểm số nhé!
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    {isCompleted ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => navigate(`/results/${submission._id}`)}
                          className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition text-center"
                        >
                          Xem Chi Tiết AI Chấm
                        </button>
                        <button
                          onClick={() => navigate(`/assignment/${item._id}`)}
                          className="flex items-center justify-center space-x-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Học & Làm Bài Lại</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/assignment/${item._id}`)}
                        className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition"
                      >
                        <span>Học & Làm Bài Tập</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-500">
            Hiện chưa có đề thi nào được tạo cho nhóm năng lực của bạn.
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentsList;
