import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Rocket, Frown, FileEdit, BookOpen, Sparkles, CheckCircle2, 
  HelpCircle, ArrowRight, Home, ChevronRight, Volume2, Award, Lightbulb, CheckSquare, Play, Pause, RotateCcw
} from 'lucide-react';

const Task2ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Adaptive Sample Answer State
  const [adaptiveSample, setAdaptiveSample] = useState('');
  const [adaptiveBand, setAdaptiveBand] = useState('');
  const [loadingSample, setLoadingSample] = useState(false);

  // Audio Player State (Web Speech API - Native Voice Reading)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  // Interactive Exercises State
  const [userAnswers, setUserAnswers] = useState({});
  const [exerciseResults, setExerciseResults] = useState({});

  // Audio Playback Controls
  const handleToggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng đọc phát âm tự động!');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      if (!adaptiveSample) return;
      
      window.speechSynthesis.cancel(); // Reset any previous queue
      const utterance = new SpeechSynthesisUtterance(adaptiveSample);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Tốc độ đọc phát âm tự nhiên chuẩn giọng Mỹ

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        setPlaybackProgress(100);
      };
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Stop Audio when leaving page
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Helper parse & render Dàn ý 4 phần dưới dạng Card Box hiện đại
  const renderFormattedOutline = (text) => {
    if (!text) return <p className="text-xs text-slate-500 italic">Đang cập nhật dàn ý chi tiết...</p>;

    // Xóa bớt ký tự markdown thô dư thừa
    const cleanedText = text
      .replace(/###\s*🚀\s*Đề bài:[\s\S]*?(?=###|$)/gi, '')
      .replace(/###\s*😵\s*Dàn ý chi tiết 4 phần \(Outline\):/gi, '')
      .replace(/###\s*📌\s*Dàn ý 4 Phần \(Outline\):/gi, '')
      .trim();

    const sections = cleanedText.split(/(?=\d+\.\s*\*)/g).filter(Boolean);

    if (sections.length === 0) {
      return (
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
          {cleanedText.replace(/\*\*/g, '').replace(/###/g, '')}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((sec, idx) => {
          const lines = sec.trim().split('\n').filter(Boolean);
          const titleLine = lines[0] ? lines[0].replace(/^\d+\.\s*\*\*/, '').replace(/\*\*:?/, '').trim() : `Phần ${idx + 1}`;
          const bulletPoints = lines.slice(1).map(l => l.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim());

          return (
            <div key={idx} className="p-5 bg-gradient-to-b from-slate-50 to-amber-50/20 rounded-3xl border border-amber-200/60 shadow-sm space-y-2.5">
              <div className="flex items-center space-x-2 border-b border-amber-200/50 pb-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <h3 className="font-extrabold text-amber-900 text-sm">{titleLine}</h3>
              </div>
              <ul className="space-y-1.5 pl-2">
                {bulletPoints.map((bp, bIdx) => (
                  <li key={bIdx} className="text-xs text-slate-700 leading-relaxed flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                    <span>{bp}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await api.get(`/assignments/${id}`);
        if (res.data.success) {
          const assignData = res.data.data;
          setAssignment(assignData);

          // Nếu học viên 'excellent' -> dùng bài mẫu Band 8.5+ từ DB
          if (user?.studentGroup === 'excellent') {
            setAdaptiveSample(assignData.sampleAnswer);
            setAdaptiveBand('8.5+');
          } else {
            // Render bài mẫu thích ứng vừa sức bằng AI GPT-4o (Band 6.0 hoặc 7.0)
            setLoadingSample(true);
            try {
              const sampleRes = await api.post(`/assignments/${id}/generate-adaptive-sample`);
              if (sampleRes.data.success) {
                setAdaptiveSample(sampleRes.data.data.sampleAnswer);
                setAdaptiveBand(sampleRes.data.data.targetBand);
              }
            } catch (err) {
              setAdaptiveSample(assignData.sampleAnswer);
              setAdaptiveBand(user?.studentGroup === 'support' ? '6.0' : '7.0');
            } finally {
              setLoadingSample(false);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching assignment details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id, user]);

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
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy bài học đề thi</h2>
        <button onClick={() => navigate('/assignments')} className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium">
          Quay lại danh sách đề thi
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafa] text-slate-800 font-sans pb-16">
      {/* Breadcrumb Header Chuẩn DOL English */}
      <div className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center space-x-2 text-xs font-semibold text-slate-500 overflow-x-auto">
          <span onClick={() => navigate('/')} className="hover:text-red-600 cursor-pointer flex items-center">
            <Home className="w-3.5 h-3.5 mr-1" /> TRANG CHỦ
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span onClick={() => navigate('/assignments')} className="hover:text-red-600 cursor-pointer">
            IELTS WRITING SAMPLE
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-bold truncate">
            {assignment.title}
          </span>
        </div>
      </div>

      {/* Main Article Container Page Layout (Mở Rộng Tối Đa Ra 2 Bên max-w-7xl) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Title Header */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="px-3.5 py-1 bg-red-100 text-red-700 text-xs font-black rounded-full uppercase tracking-wider">
              TASK 2
            </span>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
              Chủ đề: {assignment.topic}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
            {assignment.title} & sample band {adaptiveBand || '8.5+'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Tổng hợp bài mẫu IELTS Writing Task 2 – Dạng {assignment.topic} kèm dàn ý chi tiết, từ vựng đắt giá và bài tập ôn luyện tương tác.
          </p>
        </div>

        {/* Sticky Table of Contents Header (Tương Tác Cuộn Nhanh Giống DOL) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-3">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">MỤC LỤC BÀI HỌC (TABLE OF CONTENTS):</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-bold text-slate-700">
            <a href="#section-prompt" className="p-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-2xl border border-slate-200 transition text-center flex items-center justify-center">
              🚀 Đề bài
            </a>
            <a href="#section-outline" className="p-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-2xl border border-slate-200 transition text-center flex items-center justify-center">
              😵 Dàn ý
            </a>
            <a href="#section-sample" className="p-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-2xl border border-slate-200 transition text-center flex items-center justify-center">
              📝 Bài mẫu
            </a>
            <a href="#section-vocab" className="p-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-2xl border border-slate-200 transition text-center flex items-center justify-center">
              📚 Vocab
            </a>
            <a href="#section-exercise" className="p-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-2xl border border-slate-200 transition text-center flex items-center justify-center">
              ✨ Exercise
            </a>
          </div>
        </div>

        {/* SECTION 1: 🚀 ĐỀ BÀI */}
        <div id="section-prompt" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <Rocket className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900">🚀 Đề Bài (Prompt)</h2>
          </div>
          <div className="p-5 bg-red-50/50 rounded-2xl border border-red-100 italic font-serif text-base text-slate-800 leading-relaxed">
            "{assignment.prompt}"
          </div>
        </div>

        {/* SECTION 2: 😵 DÀN Ý */}
        <div id="section-outline" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Frown className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900">😵 Dàn Ý Chi Tiết (Outline)</h2>
          </div>
          {renderFormattedOutline(assignment.scaffoldingTemplate)}
        </div>

        {/* SECTION 3: 📝 BÀI MẪU (BAND THÍCH ỨNG HOẶC 8.5+) */}
        <div id="section-sample" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileEdit className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-900">📝 Bài Mẫu (Sample Answer)</h2>
            </div>

            {/* BAR ÂM THANH ĐỌC BÀI MẪU GIỐNG HỆT GIAO DIỆN DOL ENGLISH (AUDIO PLAYER WIDGET) */}
            <div className="flex items-center space-x-3 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 shadow-inner">
              <button
                onClick={handleToggleAudio}
                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition shadow-md shrink-0"
                title={isPlaying ? 'Tạm dừng đọc' : 'Phát âm thanh đọc bài mẫu'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <div className="flex items-center space-x-2">
                <div className="w-32 sm:w-48 h-2 bg-slate-200 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full bg-blue-600 transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
                    style={{ width: isPlaying ? '65%' : '0%' }}
                  ></div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600">
                  {isPlaying ? 'Reading...' : '00:00'}
                </span>
              </div>

              <span className="px-3 py-1 bg-emerald-600 text-white font-black text-xs rounded-full shadow-sm ml-2">
                Band {adaptiveBand || '8.5+'}
              </span>
            </div>
          </div>

          {loadingSample ? (
            <div className="p-8 text-center space-y-3 bg-slate-50 rounded-3xl border border-slate-200">
              <Sparkles className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm text-slate-700 font-bold">AI Đang Render Bài Mẫu Phù Hợp Trình Độ Của Bạn...</p>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-base leading-relaxed text-slate-900 font-serif whitespace-pre-wrap">
              {adaptiveSample || 'Đang cập nhật bài mẫu...'}
            </div>
          )}
        </div>

        {/* SECTION 4: 📚 VOCABULARY & COLLOCATIONS */}
        <div id="section-vocab" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900">📚 Từ Vựng & Collocations</h2>
          </div>

          {assignment.suggestedVocabulary && assignment.suggestedVocabulary.length > 0 ? (
            <div className="space-y-3">
              {assignment.suggestedVocabulary.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-blue-700 text-base">{item.word}</span>
                    <span className="text-xs text-slate-600 bg-slate-200 px-3 py-0.5 rounded-md font-bold">
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

        {/* SECTION 5: ✨ BÀI TẬP EXERCISE TƯƠNG TÁC (CHIA THÀNH 2 BÀI CHUẨN DOL ENGLISH) */}
        <div id="section-exercise" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-8">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">✨ Bài Tập Ôn Luyện (Exercise)</h2>
              <p className="text-xs text-slate-500">Hoàn thành 2 bài tập dưới đây (Mỗi bài 10 câu) để củng cố từ vựng & cấu trúc bài viết.</p>
            </div>
          </div>

          {assignment.exercises && assignment.exercises.length > 0 ? (
            <div className="space-y-10">
              
              {/* BÀI TẬP 1: 10 CÂU ĐIỀN TỪ & COLLOCATIONS */}
              <div className="space-y-4">
                <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 flex items-center justify-between">
                  <span className="font-extrabold text-blue-900 text-sm flex items-center">
                    <CheckSquare className="w-4 h-4 mr-2 text-blue-600" />
                    BÀI TẬP 1: Điền Từ Vựng & Collocations Thích Hợp Vào Chỗ Trống (10 Câu)
                  </span>
                  <span className="text-xs font-black bg-blue-600 text-white px-3 py-1 rounded-full">
                    Câu 1 - 10
                  </span>
                </div>

                <div className="space-y-4">
                  {assignment.exercises.slice(0, 10).map((ex, exIdx) => {
                    const isChecked = exerciseResults[exIdx] !== undefined;
                    const isCorrect = exerciseResults[exIdx];

                    return (
                      <div key={exIdx} className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
                        <p className="font-bold text-slate-800 text-sm flex items-start">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center mr-2 shrink-0">
                            {exIdx + 1}
                          </span>
                          <span>{ex.prompt.replace(/Bài tập \d+ \(Câu \d+\/\d+\):\s*/gi, '')}</span>
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
                            className="p-3 border border-slate-300 rounded-2xl text-sm flex-grow focus:ring-2 focus:ring-blue-500 focus:bg-white bg-white font-medium"
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
              </div>

              {/* BÀI TẬP 2: 10 CÂU DỊCH THUẬT NGHĨA TIẾNG VIỆT SANG THUẬT NGỮ CHUYÊN SÂU */}
              {assignment.exercises.length > 10 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 flex items-center justify-between">
                    <span className="font-extrabold text-purple-900 text-sm flex items-center">
                      <CheckSquare className="w-4 h-4 mr-2 text-purple-600" />
                      BÀI TẬP 2: Dịch Thuật Ngữ Sang Tiếng Anh & Ứng Dụng Thuật Ngữ (10 Câu)
                    </span>
                    <span className="text-xs font-black bg-purple-600 text-white px-3 py-1 rounded-full">
                      Câu 11 - 20
                    </span>
                  </div>

                  <div className="space-y-4">
                    {assignment.exercises.slice(10, 20).map((ex, realIdx) => {
                      const exIdx = realIdx + 10;
                      const isChecked = exerciseResults[exIdx] !== undefined;
                      const isCorrect = exerciseResults[exIdx];

                      return (
                        <div key={exIdx} className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
                          <p className="font-bold text-slate-800 text-sm flex items-start">
                            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center mr-2 shrink-0">
                              {realIdx + 1}
                            </span>
                            <span>{ex.prompt.replace(/Bài tập \d+ \(Câu \d+\/\d+\):\s*/gi, '')}</span>
                          </p>
                          
                          <p className="italic text-slate-800 font-serif bg-white p-4 rounded-2xl border border-slate-200 leading-relaxed text-sm">
                            {ex.blankSpaceText}
                          </p>

                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-1">
                            <input
                              type="text"
                              placeholder="Nhập thuật ngữ Tiếng Anh..."
                              value={userAnswers[exIdx] || ''}
                              onChange={(e) => setUserAnswers({ ...userAnswers, [exIdx]: e.target.value })}
                              className="p-3 border border-slate-300 rounded-2xl text-sm flex-grow focus:ring-2 focus:ring-purple-500 focus:bg-white bg-white font-medium"
                            />
                            <button
                              onClick={() => handleCheckExercise(exIdx, ex.correctAnswer)}
                              className="w-full sm:w-auto px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl transition shrink-0 shadow-md shadow-purple-500/20 uppercase tracking-wider"
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
                </div>
              )}

            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Chưa có bài tập tương tác cho đề thi này.</p>
          )}
        </div>

        {/* FLOATING ACTION BANNER: SANG TRANG VIẾT BÀI THI & AI CHẤM ĐIỂM */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-wrap items-center justify-between gap-6 border border-white/20">
          <div className="space-y-2 max-w-xl">
            <span className="px-3 py-1 bg-yellow-400 text-slate-900 font-black text-xs rounded-full uppercase tracking-wider">
              BẮT ĐẦU THỰC HÀNH VIẾT BÀI
            </span>
            <h3 className="text-2xl font-black">Bạn Đã Sẵn Sàng Làm Bài Luận Đánh Giá AI?</h3>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Sau khi học xong dàn ý, từ vựng và bài tập củng cố, hãy chuyển sang giao diện viết bài thi thực hành. Giám khảo AI sẽ lập tức phân tích và chấm điểm bài viết của bạn theo 4 tiêu chí IELTS Task 2.
            </p>
          </div>

          <button
            onClick={() => navigate(`/workspace/${assignment._id}`)}
            className="px-8 py-4 bg-white hover:bg-yellow-300 text-slate-900 font-black text-sm rounded-2xl shadow-2xl transition transform active:scale-95 flex items-center space-x-2 shrink-0"
          >
            <span>Vào Viết Bài Thi & Chấm AI</span>
            <ArrowRight className="w-5 h-5 text-blue-600" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Task2ArticleDetail;
