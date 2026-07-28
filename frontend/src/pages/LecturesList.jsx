import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Sparkles, CheckCircle2, HelpCircle } from 'lucide-react';

const LecturesList = () => {
  const { user } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState({});
  const [exerciseResults, setExerciseResults] = useState({});

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const res = await api.get('/lectures');
        if (res.data.success) {
          setLectures(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching lectures:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLectures();
  }, []);

  const handleAnswerChange = (exId, qIdx, value) => {
    setUserAnswers(prev => ({
      ...prev,
      [`${exId}_${qIdx}`]: value
    }));
  };

  const handleCheckAnswer = (exId, qIdx, correctAnswer) => {
    const key = `${exId}_${qIdx}`;
    const ans = userAnswers[key] || '';
    const isCorrect = ans.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

    setExerciseResults(prev => ({
      ...prev,
      [key]: isCorrect
    }));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Bài Học Lý Thuyết & Bài Tập Thích Ứng</h1>
          <p className="text-xs text-slate-500 mt-1">
            Các bài giảng bóc tách tiêu chí TR, CC, LR, GRA dành cho học viên nhóm <span className="font-bold uppercase text-blue-600">{user?.studentGroup}</span>.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : lectures.length > 0 ? (
          <div className="space-y-6">
            {lectures.map((lec) => (
              <div key={lec._id} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-extrabold text-xs rounded-full">
                      Tiêu chí: {lec.focusCriterion}
                    </span>
                    <h2 className="text-xl font-bold text-slate-800 pt-1">{lec.title}</h2>
                  </div>
                </div>

                {/* Markdown Content Representation */}
                <div className="prose prose-slate max-w-none text-slate-700 text-sm bg-slate-50 p-5 rounded-2xl border border-slate-200/60 leading-relaxed font-sans whitespace-pre-wrap">
                  {lec.content}
                </div>

                {/* Attached Interactive Exercises */}
                {lec.exercises && lec.exercises.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center">
                      <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" />
                      Bài Tập Nhỏ Tương Tác Củng Cố Kiến Thức
                    </h3>

                    {lec.exercises.map((ex) => (
                      <div key={ex._id} className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                        <h4 className="font-bold text-slate-800 text-xs">{ex.title}</h4>
                        {ex.questions && ex.questions.map((q, qIdx) => {
                          const key = `${ex._id}_${qIdx}`;
                          const result = exerciseResults[key];

                          return (
                            <div key={qIdx} className="space-y-2 text-xs bg-white p-3.5 rounded-xl border border-slate-200">
                              <p className="font-medium text-slate-700">{q.prompt}</p>
                              <p className="italic text-slate-500 font-serif">{q.blankSpaceText}</p>

                              <div className="flex items-center space-x-2 pt-1">
                                <input
                                  type="text"
                                  placeholder="Nhập đáp án của bạn..."
                                  value={userAnswers[key] || ''}
                                  onChange={(e) => handleAnswerChange(ex._id, qIdx, e.target.value)}
                                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs flex-grow focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                  onClick={() => handleCheckAnswer(ex._id, qIdx, q.correctAnswer)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition"
                                >
                                  Kiểm tra
                                </button>
                              </div>

                              {result !== undefined && (
                                <div className={`p-2.5 rounded-lg text-xs mt-2 ${result ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                  {result ? (
                                    <span className="font-bold flex items-center"><CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" /> Chính xác!</span>
                                  ) : (
                                    <div>
                                      <span className="font-bold">Chưa đúng! Đáp án gợi ý: <span className="underline">{q.correctAnswer}</span></span>
                                    </div>
                                  )}
                                  <p className="text-[11px] mt-1 text-slate-600">{q.explanation}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-500">
            Chưa có bài giảng nào dành cho nhóm năng lực hiện tại của bạn.
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturesList;
