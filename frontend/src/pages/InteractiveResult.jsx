import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Award, CheckCircle2, AlertTriangle, ArrowLeft, Sparkles, HelpCircle, BookOpen, Layers } from 'lucide-react';

const InteractiveResult = () => {
  const { id } = useParams(); // Submission ID
  const location = useLocation();
  const navigate = useNavigate();
  const { updateUserGroup } = useAuth();

  const [submission, setSubmission] = useState(location.state?.submissionData?.submission || null);
  const [adaptiveRouting, setAdaptiveRouting] = useState(location.state?.submissionData?.adaptiveRouting || null);
  const [loading, setLoading] = useState(!submission);

  // Promotion Test state
  const isPromotionTest = location.state?.isPromotionTest || false;
  const promoted = location.state?.promoted || false;
  const newGroup = location.state?.newGroup || null;

  // Hover state cho Tooltip Popover bóc tách câu sai
  const [activeCorrection, setActiveCorrection] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!submission && id) {
      const fetchSubmission = async () => {
        try {
          const res = await api.get('/submissions');
          if (res.data.success) {
            const found = res.data.data.find(s => s._id === id);
            if (found) {
              setSubmission(found);
            }
          }
        } catch (err) {
          console.error('Error fetching submission result:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchSubmission();
    }
  }, [id, submission]);

  // Cập nhật lại Auth Context nếu có sự di chuyển nhóm năng lực (Level Migration tự động từ bài thường)
  useEffect(() => {
    if (adaptiveRouting?.groupMigrated && adaptiveRouting?.currentGroup) {
      updateUserGroup(adaptiveRouting.currentGroup);
    }
    // Nhóm khi Chuyển Cấp đã được cập nhật ngay trong Workspace.jsx trước khi navigate
    // → Không cần updateUserGroup lại ở đây để tránh race condition
  }, [adaptiveRouting, updateUserGroup]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-sm text-center border border-slate-200">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy kết quả chấm bài</h2>
        <button onClick={() => navigate('/assignments')} className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium">
          Quay lại danh sách bài tập
        </button>
      </div>
    );
  }

  const { overallBand, criteriaScores, detailedCorrections, studentAnswers } = submission;

  // Render văn bản kèm thẻ bọc câu lỗi tương quan
  const renderInteractiveEssay = () => {
    if (!detailedCorrections || detailedCorrections.length === 0) {
      return <p className="whitespace-pre-wrap font-serif leading-relaxed text-slate-800">{studentAnswers}</p>;
    }

    // Lọc các lỗi thực sự xuất hiện trong bài làm (Fuzzy & Trim Check)
    const validCorrections = detailedCorrections.filter(corr => {
      if (!corr.original || !corr.original.trim()) return false;
      const target = corr.original.trim();
      return studentAnswers.includes(target) || studentAnswers.toLowerCase().includes(target.toLowerCase());
    });

    if (validCorrections.length === 0) {
      return <p className="whitespace-pre-wrap font-serif leading-relaxed text-slate-800">{studentAnswers}</p>;
    }

    // Tách và tìm vị trí các đoạn sai
    let parts = [studentAnswers];

    validCorrections.forEach((corr, index) => {
      const target = corr.original.trim();
      let newParts = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          // Check case-insensitive regex match
          const regex = new RegExp(`(${target.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
          const splitArray = part.split(regex);
          for (let i = 0; i < splitArray.length; i++) {
            if (splitArray[i].toLowerCase() === target.toLowerCase()) {
              newParts.push({
                isCorrection: true,
                corrObj: corr,
                text: splitArray[i],
                key: `${index}-${i}`
              });
            } else if (splitArray[i]) {
              newParts.push(splitArray[i]);
            }
          }
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return (
      <div className="whitespace-pre-wrap font-serif text-base leading-relaxed text-slate-800">
        {parts.map((part, idx) => {
          if (typeof part === 'string') {
            return <span key={idx}>{part}</span>;
          }

          if (part.isCorrection) {
            return (
              <span
                key={part.key}
                onMouseEnter={(e) => {
                  const rect = e.target.getBoundingClientRect();
                  setPopoverPos({ x: rect.left, y: rect.bottom + window.scrollY });
                  setActiveCorrection(part.corrObj);
                }}
                onMouseLeave={() => setActiveCorrection(null)}
                className="bg-red-100 text-red-950 border-b-2 border-red-500 font-semibold cursor-pointer px-1 rounded-sm transition duration-150 hover:bg-red-200"
              >
                {part.text}
              </span>
            );
          }
          return null;
        })}
      </div>
    );
  };


  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Popover / Tooltip khi hover vào câu sai */}
      {activeCorrection && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(popoverPos.x, window.innerWidth - 360)}px`,
            top: `${popoverPos.y + 8}px`
          }}
          className="z-50 max-w-sm w-80 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 text-xs space-y-2.5 animate-fadeIn"
        >
          <div className="flex items-center text-red-400 font-bold border-b border-slate-800 pb-1.5">
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            <span>Lỗi Ngữ Pháp / Từ Vựng Bị Phát Hiện</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold">Gốc của học viên:</span>
            <p className="line-through text-red-300 font-mono mt-0.5">{activeCorrection.original}</p>
          </div>

          <div>
            <span className="text-emerald-400 font-semibold">Đã được AI tối ưu lại:</span>
            <p className="text-emerald-300 font-bold font-mono mt-0.5">{activeCorrection.corrected}</p>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-blue-300 font-bold block mb-1">Giải thích chi tiết:</span>
            <p className="text-slate-300 leading-normal">{activeCorrection.explanation}</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/assignments')}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Danh sách Đề thi</span>
          </button>
          <span className="text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
            Kết quả Chấm AI IELTS Task 2
          </span>
        </div>

        {/* Level Migration Banner (Thông báo thích ứng nếu chuyển nhóm) */}
        {adaptiveRouting?.groupMigrated && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-bounce" />
              <div>
                <p className="font-extrabold text-sm sm:text-base">
                  CHÚC MỪNG! BẠN ĐÃ ĐƯỢC CHUYỂN NHÓM NĂNG LỰC TỰ ĐỘNG!
                </p>
                <p className="text-xs text-purple-100">
                  Dựa trên 3 bài nộp gần nhất (Overall di động: {adaptiveRouting.movingAverageBand}), nhóm năng lực của bạn đã chuyển sang <span className="font-bold underline uppercase">{adaptiveRouting.currentGroup}</span>!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Kết quả Bài Thi Chuyển Cấp ── */}
        {isPromotionTest && promoted && newGroup && (
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-300">
            <div className="flex items-center space-x-4">
              <div className="text-5xl animate-bounce">🎉</div>
              <div>
                <p className="font-black text-lg sm:text-xl tracking-tight">
                  CHÚC MỪNG! BẠN ĐÃ VƯỢT QUA BÀI THI CHUYỂN CẤP!
                </p>
                <p className="text-sm text-emerald-100 mt-0.5">
                  Nhóm năng lực của bạn đã được nâng lên <span className="font-extrabold uppercase underline">{newGroup}</span>. Hãy vào Dashboard để xem đề thi mới dành cho nhóm của bạn!
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 bg-white text-emerald-700 font-extrabold text-sm rounded-2xl shadow hover:bg-emerald-50 transition shrink-0"
            >
              Xem Dashboard Mới →
            </button>
          </div>
        )}

        {isPromotionTest && !promoted && (
          <div className="bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-3xl p-6 shadow-xl border border-rose-300">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">😔</div>
              <div>
                <p className="font-black text-base sm:text-lg">
                  CHƯA ĐẠT YÊU CẦU CHUYỂN CẤP LẦN NÀY
                </p>
                <p className="text-sm text-rose-100 mt-0.5">
                  Điểm bài thi chưa đủ để chuyển cấp. Hãy ôn luyện thêm và thử lại khi sẵn sàng. Bạn có thể xem phần nhận xét bên dưới để cải thiện!
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Section 1: Top Hero Card (Overall Score & 4 Criteria Grid) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Center Overall Band Circle */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 text-center">
              <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">
                OVERALL BAND SCORE
              </span>
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-5xl shadow-xl shadow-blue-500/30 mb-3">
                {overallBand}
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Đánh giá theo chuẩn IELTS Task 2 Band Descriptors
              </p>
            </div>

            {/* 4 Criteria Scores Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* TR */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-700">Task Response (TR)</span>
                  <span className="font-black text-blue-600 text-base">{criteriaScores?.TR?.score}</span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">{criteriaScores?.TR?.feedback}</p>
              </div>

              {/* CC */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-700">Coherence & Cohesion (CC)</span>
                  <span className="font-black text-blue-600 text-base">{criteriaScores?.CC?.score}</span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">{criteriaScores?.CC?.feedback}</p>
              </div>

              {/* LR */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-700">Lexical Resource (LR)</span>
                  <span className="font-black text-blue-600 text-base">{criteriaScores?.LR?.score}</span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">{criteriaScores?.LR?.feedback}</p>
              </div>

              {/* GRA */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-700">Grammar Range & Accuracy</span>
                  <span className="font-black text-blue-600 text-base">{criteriaScores?.GRA?.score}</span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">{criteriaScores?.GRA?.feedback}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Interactive Corrections Canvas (Bản đồ sửa lỗi trực quan) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                Bản Đồ Sửa Lỗi Trực Quan (Interactive Corrections Canvas)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rê chuột (hover) vào các câu có <span className="bg-red-100 text-red-800 font-bold px-1 rounded">nền đỏ</span> để xem gợi ý sửa lỗi & giải thích ngữ pháp từ AI.
              </p>
            </div>

            <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Tổng số lỗi bóc tách: <span className="font-extrabold text-red-600">
                {detailedCorrections?.filter(c => c.original && c.original.trim() && (studentAnswers.includes(c.original.trim()) || studentAnswers.toLowerCase().includes(c.original.trim().toLowerCase()))).length || 0}
              </span>
            </div>

          </div>

          <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200 min-h-[250px]">
            {renderInteractiveEssay()}
          </div>
        </div>

        {/* Section 3: ✨ HƯỚNG DẪN NÂNG CAP TỪ VỰNG XUẤT SẮC (ADVANCED VOCABULARY ENHANCEMENTS) */}
        {submission.advancedVocabularyEnhancements && submission.advancedVocabularyEnhancements.length > 0 && (
          <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-xl border border-purple-500/30 p-6 sm:p-8 space-y-6">
            <div className="flex items-center space-x-3 border-b border-purple-400/20 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white flex items-center space-x-2">
                  <span>✨ Hướng Dẫn Nâng Cấp Từ Vựng Xuất Sắc (Band 8.5+ Lexical Booster)</span>
                </h3>
                <p className="text-xs text-purple-200">
                  AI gợi ý các cụm từ vựng học thuật đồng nghĩa cấp độ cao hơn để thay thế các từ đơn giản trong bài làm của bạn.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submission.advancedVocabularyEnhancements.map((item, idx) => (
                <div key={idx} className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 space-y-3 hover:border-purple-400/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-red-300 line-through bg-red-950/60 px-2.5 py-1 rounded-md border border-red-800/40">
                      Từ gốc: "{item.originalWord}"
                    </span>
                    <span className="text-xs font-black text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40 flex items-center">
                      <Sparkles className="w-3 h-3 mr-1 text-yellow-300" />
                      Nâng cấp: {item.advancedSynonym}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 italic bg-black/30 p-3 rounded-xl border border-white/5">
                    "{item.contextSentence}"
                  </p>

                  <div className="space-y-1 text-xs">
                    {item.collocationUsage && (
                      <p className="text-purple-200">
                        <strong className="text-white">Collocation chuẩn:</strong> <span className="text-yellow-300 font-mono">{item.collocationUsage}</span>
                      </p>
                    )}
                    <p className="text-slate-300 leading-relaxed pt-1">
                      💡 {item.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveResult;
