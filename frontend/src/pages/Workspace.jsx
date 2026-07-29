import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Clock, Send, Save, BookOpen, AlertCircle, Sparkles, CheckCircle2, FileText, ChevronRight, CheckSquare, HelpCircle } from 'lucide-react';
import AdminConfirmModal from '../components/AdminConfirmModal';

const Workspace = () => {
  const { id } = useParams(); // Assignment ID
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'warning' });


  // Adaptive Sample State
  const [adaptiveSample, setAdaptiveSample] = useState('');
  const [adaptiveBand, setAdaptiveBand] = useState('');
  const [loadingSample, setLoadingSample] = useState(false);

  // Active Tab cho Sidebar Giải Đề: 🚀 Đề bài, 😵 Dàn ý, 📝 Bài mẫu, 📚 Vocab, ✨ Exercise
  const [activeTab, setActiveTab] = useState('prompt');

  // Interactive Exercises State
  const [userAnswers, setUserAnswers] = useState({});
  const [exerciseResults, setExerciseResults] = useState({});

  // Timer 40 mins
  const [timeLeft, setTimeLeft] = useState(2400);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await api.get(`/assignments/${id}`);
        if (res.data.success) {
          const assignData = res.data.data;
          setAssignment(assignData);

          // Lấy trực tiếp bài mẫu mà Admin đã thêm tùy theo nhóm năng lực của học viên (Support -> 6.0, Average -> 7.0, Excellent -> 8.5+)
          const group = user?.studentGroup || 'support';
          const groupSample = assignData.groupSampleAnswers?.[group] || assignData.sampleAnswer;
          const bandLabel = group === 'support' ? '6.0' : (group === 'average' ? '7.0' : '8.5+');
          
          setAdaptiveSample(groupSample);
          setAdaptiveBand(bandLabel);
        }
      } catch (err) {
        console.error('Error fetching assignment details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id, user]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const wordCount = studentAnswers.trim() ? studentAnswers.trim().split(/\s+/).length : 0;

  const handleSaveDraft = () => {
    setSavingDraft(true);
    setSaveSuccessMsg('');
    setTimeout(() => {
      localStorage.setItem(`draft_${id}`, studentAnswers);
      setSavingDraft(false);
      setSaveSuccessMsg('Đã lưu bản nháp thành công!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }, 600);
  };

  // Nộp bài chấm AI
  const handleSubmitEssay = async () => {
    if (!studentAnswers.trim() || wordCount < 50) {
      setAlertModal({
        isOpen: true,
        title: 'Yêu Cầu Độ Dài Bài Viết',
        message: 'Bài luận quá ngắn! Vui lòng viết tối thiểu 50 từ trước khi nộp bài.',
        type: 'warning'
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/grading/submit', {
        assignmentId: id,
        studentAnswers
      });

      if (res.data.success) {
        const submissionId = res.data.data.submission._id;
        navigate(`/results/${submissionId}`, { state: { submissionData: res.data.data } });
      }
    } catch (err) {
      console.error('Error submitting essay:', err);
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra trong quá trình chấm bài AI. Vui lòng thử lại!';
      setAlertModal({
        isOpen: true,
        title: 'Cảnh Báo Bài Làm',
        message: errMsg,
        type: 'warning'
      });
    } finally {
      setSubmitting(false);
    }
  };


  // Chấm bài tập Exercise tương tác trực tiếp
  const handleCheckExercise = (exIdx, correctAnswer) => {
    const userAns = userAnswers[exIdx] || '';
    const isCorrect = userAns.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    setExerciseResults(prev => ({ ...prev, [exIdx]: isCorrect }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-sm text-center border border-slate-200">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy bài thi</h2>
        <button onClick={() => navigate('/assignments')} className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium">
          Quay lại danh sách đề thi
        </button>
      </div>
    );
  }

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
            <h3 className="text-2xl font-black text-slate-800">Giám Khảo AI Đang Chấm Bài...</h3>
            <p className="text-slate-600 text-xs">
              Hệ thống đang phân tích bài luận của bạn khắt khe theo 4 tiêu chí IELTS Writing Task 2 (TR, CC, LR, GRA) từ Cambridge.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Card Giống Giao Diện Giải Đề DOL English */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3.5 py-1 bg-blue-100 text-blue-800 text-xs font-black rounded-full uppercase tracking-wider">
                Chủ đề: {assignment.topic}
              </span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                Real IELTS Writing Task 2
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">{assignment.title}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 px-4 py-2 rounded-2xl border border-amber-200 font-black text-base shadow-sm">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-100 text-slate-800 px-4 py-2 rounded-2xl border border-slate-200 font-black text-base">
              <FileText className="w-5 h-5 text-slate-600" />
              <span>{wordCount} từ</span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Bên Trái Soạn Thảo (Tự Động Mở Rộng Kích Thước), Bên Phải Giải Đề DOL English Mở Rộng Rãi */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cột Trái: Ô Soạn Thảo Viết Bài Luận (Chiếm 7 Cột, Tự Động Mở Rộng Chiều Cao Theo Nội Dung) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
                  Khu Vực Soạn Thảo Bài Luận Thực Hành
                </span>
                {saveSuccessMsg && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    {saveSuccessMsg}
                  </span>
                )}
              </div>

              {/* Textarea Mở Rộng Thoải Mái (Min height 520px) */}
              <textarea
                value={studentAnswers}
                onChange={(e) => setStudentAnswers(e.target.value)}
                placeholder="Nhập bài luận IELTS Writing Task 2 của bạn tại đây để gửi Giám khảo AI chấm điểm chi tiết..."
                className="w-full min-h-[520px] p-5 bg-slate-50/50 rounded-2xl border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 font-serif text-base leading-relaxed"
              ></textarea>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100 flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveDraft}
                    disabled={savingDraft}
                    className="flex items-center space-x-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingDraft ? 'Đang lưu...' : 'Lưu Nháp'}</span>
                  </button>

              {/* AI Support Hint Button dành riêng cho Nhóm Cần Hỗ Trợ */}
                  {user?.studentGroup === 'support' && (
                    <button
                      onClick={() => {
                        setAlertModal({
                          isOpen: true,
                          title: 'Gợi Ý Ý Tưởng & Cấu Trúc',
                          message: '1. Mở bài (Introduction): Diễn đạt lại đề bài bằng cấu trúc "While some argue that [Ý 1], I believe that [Ý 2]".\n2. Thân bài 1 (Body 1): Đưa ra 2 lý do hỗ trợ quan điểm 1. Dùng từ nối: "Firstly", "Furthermore".\n3. Thân bài 2 (Body 2): Phân tích quan điểm thứ 2 với từ vựng gợi ý: "Substantial benefit", "Imperative role".\n4. Kết bài (Conclusion): Tóm tắt bằng "In conclusion, balancing both approaches is essential".',
                          type: 'info'
                        });
                      }}
                      className="flex items-center space-x-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold rounded-2xl text-sm border border-amber-200 transition"
                    >
                      <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                      <span>Gợi Ý AI Trợ Lý</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={handleSubmitEssay}
                  disabled={submitting}
                  className="flex items-center space-x-2 px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 text-sm transition transform active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Nộp Bài Chấm AI</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cột Phải: Thanh Công Cụ Giải Đề Chuẩn Format DOL English (Chiếm 5 Cột, Hiển Thị To Rộng Rãi Mở Dài Xuống Màn Hình) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
              
              {/* Navigation Tabs DOL English To Rõ Ràng */}
              <div className="grid grid-cols-5 gap-1.5 bg-slate-100 p-2 rounded-2xl text-xs font-black text-slate-600">
                <button
                  onClick={() => setActiveTab('prompt')}
                  className={`py-2.5 rounded-xl transition ${activeTab === 'prompt' ? 'bg-white text-blue-600 shadow-md font-black' : 'hover:text-slate-900'}`}
                >
                  Đề bài
                </button>
                <button
                  onClick={() => setActiveTab('outline')}
                  className={`py-2.5 rounded-xl transition ${activeTab === 'outline' ? 'bg-white text-blue-600 shadow-md font-black' : 'hover:text-slate-900'}`}
                >
                  Dàn ý
                </button>
                <button
                  onClick={() => setActiveTab('sample')}
                  className={`py-2.5 rounded-xl transition ${activeTab === 'sample' ? 'bg-white text-blue-600 shadow-md font-black' : 'hover:text-slate-900'}`}
                >
                  Bài mẫu
                </button>
                <button
                  onClick={() => setActiveTab('vocab')}
                  className={`py-2.5 rounded-xl transition ${activeTab === 'vocab' ? 'bg-white text-blue-600 shadow-md font-black' : 'hover:text-slate-900'}`}
                >
                  Vocab
                </button>
                <button
                  onClick={() => setActiveTab('exercise')}
                  className={`py-2.5 rounded-xl transition ${activeTab === 'exercise' ? 'bg-white text-blue-600 shadow-md font-black' : 'hover:text-slate-900'}`}
                >
                  Exercise
                </button>
              </div>


              {/* Tab Content Box Mở Rộng Rãi Dài Xuống Toàn Bộ Màn Hình */}
              <div className="space-y-6 min-h-[480px]">
                {/* 1. Tab Đề Bài */}
                {activeTab === 'prompt' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="p-5 bg-blue-50/80 rounded-3xl border border-blue-100 space-y-3">
                      <p className="text-xs font-black text-blue-800 uppercase tracking-widest">🚀 CÂU HỎI ĐỀ THI THẬT (REAL IELTS TASK 2):</p>
                      <p className="text-base text-slate-900 leading-relaxed font-serif italic">
                        "{assignment.prompt}"
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                      💡 <strong>Yêu cầu kỳ thi:</strong> Viết tối thiểu 250 từ trong thời gian 40 phút. Hãy đưa ra lập luận chặt chẽ và ví dụ minh họa thực tế.
                    </div>
                  </div>
                )}

                {/* 2. Tab Dàn Ý Card-Grid Box trực quan & Sentence Starters cho Nhóm Support */}
                {activeTab === 'outline' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-center justify-between">
                      <p className="text-xs font-black text-amber-900 uppercase">😵 DÀN Ý GIÀN GIÁO 4 PHẦN (CARD-GRID SCAFFOLDING):</p>
                      {user?.studentGroup === 'support' && (
                        <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 font-extrabold text-[10px] rounded-full">
                          Kèm Mẫu Câu Gợi Mở
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center">1</span>
                          <h4 className="font-extrabold text-amber-900 text-xs uppercase">Mở bài (Introduction)</h4>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">Paraphrase đề bài + Nêu quan điểm cá nhân.</p>
                        {user?.studentGroup === 'support' && (
                          <div className="p-2.5 bg-white rounded-xl border border-amber-100 text-[11px] text-amber-900 font-mono">
                            👉 <strong>Mẫu câu mở đầu:</strong> "It is argued that... While I accept that..., I believe..."
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">2</span>
                          <h4 className="font-extrabold text-blue-900 text-xs uppercase">Thân bài 1 (Body 1)</h4>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">Phân tích lý do hoặc khía cạnh thứ nhất của vấn đề.</p>
                        {user?.studentGroup === 'support' && (
                          <div className="p-2.5 bg-white rounded-xl border border-blue-100 text-[11px] text-blue-900 font-mono">
                            👉 <strong>Mẫu câu mở đầu:</strong> "On the one hand, there are several reasons why..."
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">3</span>
                          <h4 className="font-extrabold text-indigo-900 text-xs uppercase">Thân bài 2 (Body 2)</h4>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">Phân tích khía cạnh thứ hai và lập luận bảo vệ quan điểm cá nhân.</p>
                        {user?.studentGroup === 'support' && (
                          <div className="p-2.5 bg-white rounded-xl border border-indigo-100 text-[11px] text-indigo-900 font-mono">
                            👉 <strong>Mẫu câu mở đầu:</strong> "On the other hand, I strongly believe that..."
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">4</span>
                          <h4 className="font-extrabold text-emerald-900 text-xs uppercase">Kết bài (Conclusion)</h4>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">Tóm tắt các ý chính và khẳng định lại kết luận cuối cùng.</p>
                        {user?.studentGroup === 'support' && (
                          <div className="p-2.5 bg-white rounded-xl border border-emerald-100 text-[11px] text-emerald-900 font-mono">
                            👉 <strong>Mẫu câu mở đầu:</strong> "In conclusion, although..., I am convinced that..."
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Tab Bài Mẫu (Thích ứng theo Band điểm) */}
                {activeTab === 'sample' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex justify-between items-center">
                      <p className="text-xs font-black text-emerald-900 uppercase">📝 BÀI MẪU THÍCH ỨNG (ADAPTIVE SAMPLE):</p>
                      <span className="px-3 py-1 bg-emerald-600 text-white font-black text-xs rounded-full shadow-sm">
                        Band {adaptiveBand || '6.5'}
                      </span>
                    </div>

                    {loadingSample ? (
                      <div className="p-8 text-center space-y-3 bg-slate-50 rounded-3xl border border-slate-200">
                        <Sparkles className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                        <p className="text-sm text-slate-700 font-bold">AI Đang Render Bài Mẫu Phù Hợp Trình Độ Của Bạn...</p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-sm leading-relaxed text-slate-900 font-serif whitespace-pre-wrap">
                        {adaptiveSample || 'Đang cập nhật bài mẫu...'}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Tab Vocabulary & Collocations */}
                {activeTab === 'vocab' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200">
                      <p className="text-xs font-black text-purple-900 uppercase">📚 TỪ VỰNG & COLLOCATIONS ĐẮT GIÁ:</p>
                    </div>
                    {assignment.suggestedVocabulary && assignment.suggestedVocabulary.length > 0 ? (
                      <div className="space-y-3">
                        {assignment.suggestedVocabulary.map((item, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-black text-blue-700 text-base">{item.word}</span>
                              <span className="text-xs text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-md font-bold">
                                {item.meaning}
                              </span>
                            </div>
                            {item.collocation && (
                              <p className="text-xs text-slate-600 font-mono italic pt-1">
                                Collocation: <span className="font-semibold text-slate-800">{item.collocation}</span>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Chưa có từ vựng đính kèm.</p>
                    )}
                  </div>
                )}

                {/* 5. Tab Bài Tập Exercise Tương Tác Củng Cố Kiến Thức (Không Bị Co Cụm, Mở Rộng Rãi Xuống Trang) */}
                {activeTab === 'exercise' && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200">
                      <p className="text-xs font-black text-indigo-900 uppercase">✨ BÀI TẬP EXERCISE TƯƠNG TÁC THỰC HÀNH:</p>
                    </div>

                    {assignment.exercises && assignment.exercises.length > 0 ? (
                      <div className="space-y-5">
                        {assignment.exercises.map((ex, exIdx) => {
                          const isChecked = exerciseResults[exIdx] !== undefined;
                          const isCorrect = exerciseResults[exIdx];

                          return (
                            <div key={exIdx} className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                              <p className="font-bold text-slate-800 text-sm flex items-start">
                                <HelpCircle className="w-5 h-5 mr-2 text-indigo-600 shrink-0 mt-0.5" />
                                <span>{ex.prompt}</span>
                              </p>
                              
                              <p className="italic text-slate-800 font-serif bg-white p-4 rounded-2xl border border-slate-200 leading-relaxed text-sm">
                                {ex.blankSpaceText}
                              </p>

                              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-1">
                                <input
                                  type="text"
                                  placeholder="Nhập câu trả lời của bạn..."
                                  value={userAnswers[exIdx] || ''}
                                  onChange={(e) => setUserAnswers({ ...userAnswers, [exIdx]: e.target.value })}
                                  className="p-3 border border-slate-300 rounded-2xl text-sm flex-grow focus:ring-2 focus:ring-blue-500 focus:bg-white bg-white"
                                />
                                <button
                                  onClick={() => handleCheckExercise(exIdx, ex.correctAnswer)}
                                  className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl transition shrink-0 shadow-md shadow-blue-500/20 uppercase tracking-wider"
                                >
                                  Check Đáp Án
                                </button>
                              </div>

                              {isChecked && (
                                <div className={`p-4 rounded-2xl text-xs space-y-1.5 ${isCorrect ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                  {isCorrect ? (
                                    <span className="font-black flex items-center text-emerald-700 text-sm">
                                      <CheckCircle2 className="w-5 h-5 mr-1.5 text-emerald-600" /> Chính xác 100%!
                                    </span>
                                  ) : (
                                    <div className="text-red-700 text-xs">
                                      <span className="font-bold">Chưa chính xác! Đáp án chuẩn: <span className="underline font-extrabold text-sm">{ex.correctAnswer}</span></span>
                                    </div>
                                  )}
                                  <p className="text-xs text-slate-600 pt-1 leading-relaxed">{ex.explanation}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                    ) : (
                      <p className="text-xs text-slate-500 italic">Chưa có bài tập tương tác cho đề thi này.</p>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Alert Modal */}
      <AdminConfirmModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        onConfirm={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="Đã Hiểu"
      />
    </div>
  );
};

export default Workspace;

