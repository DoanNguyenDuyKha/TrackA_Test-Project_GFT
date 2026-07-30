import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BookOpen, Lock, Mail, User, Sparkles, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentGroup, setStudentGroup] = useState('support');
  const [targetBand, setTargetBand] = useState(6.5);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Kiểm tra khớp mật khẩu trước khi gửi request
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không trùng khớp với mật khẩu đã tạo!');
      return;
    }

    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
        role: 'student',
        studentGroup: 'support', // Nhóm mặc định chờ bài Placement Test
        targetBand: Number(targetBand),
        isFirstLogin: true
      });
      
      // 🔔 Bật Toast tự ẩn góc trên bên phải
      showToast('🎉 Đăng ký tài khoản thành công! Vui lòng đăng nhập.', 'success', 3500);

      // Đăng ký xong quay về trang đăng nhập
      navigate('/login', { state: { registeredMessage: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập để thực hiện bài Test xếp lớp ban đầu.' } });
    } catch (err) {
      console.error('Register error:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình đăng ký tài khoản.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Đăng Ký Tài Khoản Học Viên</h2>
          <p className="text-xs text-slate-500">Tham gia hệ thống học tập IELTS Writing Thích ứng cá nhân hóa</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-700 mb-1">Họ và Tên</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-normal focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student.new@gft.edu.vn"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-normal focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1">Mật Khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-normal focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1">Xác Nhận Lại Mật Khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-normal focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-400 bg-red-50/30'
                    : confirmPassword && password === confirmPassword
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[11px] text-red-600 mt-1 font-medium">Mật khẩu nhập lại chưa trùng khớp</p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mật khẩu trùng khớp
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 mb-1">Mục Tiêu Target Band</label>
            <select
              value={targetBand}
              onChange={(e) => setTargetBand(e.target.value)}
              className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value={5.5}>Band 5.5</option>
              <option value={6.0}>Band 6.0</option>
              <option value={6.5}>Band 6.5</option>
              <option value={7.0}>Band 7.0</option>
              <option value={7.5}>Band 7.5</option>
              <option value={8.0}>Band 8.0+</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition duration-150 text-sm"
          >
            {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký Ngay'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
