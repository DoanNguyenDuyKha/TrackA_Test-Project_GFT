import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Award, FileText, UserCheck, LogOut, Menu, X, Shield, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper render Badge nhóm năng lực cho Học viên
  const renderStudentBadge = () => {
    if (!user || user.role !== 'student') return null;

    const group = user.studentGroup || 'support';

    switch (group) {
      case 'support':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 shadow-sm animate-pulse">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-red-500"></span>
            CẦN HỖ TRỢ
          </span>
        );
      case 'average':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-amber-500"></span>
            TRUNG BÌNH
          </span>
        );
      case 'excellent':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600" />
            XUẤT SẮC
          </span>
        );
      default:
        return null;
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Adaptive LMS
                </span>
                <span className="hidden sm:inline-block ml-1.5 text-xs px-2 py-0.5 bg-blue-50 text-blue-600 font-semibold rounded-md border border-blue-100">
                  IELTS Writing
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex md:items-center md:space-x-1">
              {isStudent && (
                <>
                  <Link
                    to="/"
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition duration-150 ${
                      isActive('/')
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/assignments"
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition duration-150 ${
                      isActive('/assignments')
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Đề Thi Thực Hành
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link
                    to="/admin/assignments"
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition duration-150 ${
                      isActive('/admin/assignments')
                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Quản Lý Đề Thi
                  </Link>
                  <Link
                    to="/admin/students"
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition duration-150 ${
                      isActive('/admin/students')
                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Giám Sát Học Viên
                  </Link>
                </>
              )}
            </div>
          )}

          {/* User Profile & Badge & Logout */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.role === 'admin' ? 'Quản trị viên' : user.email}</p>
                  </div>

                  {/* Render Badge Nhóm Năng Lực cho Học viên */}
                  {renderStudentBadge()}

                  {isAdmin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                      <Shield className="w-3 h-3 mr-1" />
                      ADMIN
                    </span>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition duration-150"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition"
                >
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="py-2 border-b border-slate-100 mb-2">
                <p className="font-bold text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500 mb-1.5">{user.email}</p>
                {renderStudentBadge()}
              </div>

              {isStudent && (
                <>
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/assignments"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Đề Thi Thực Hành
                  </Link>
                  <Link
                    to="/lectures"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Bài Học Thích Ứng
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link
                    to="/admin/assignments"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Quản Lý Đề Thi
                  </Link>
                  <Link
                    to="/admin/lectures"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Quản Lý Bài Giảng
                  </Link>
                  <Link
                    to="/admin/students"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Giám Sát Học Viên
                  </Link>
                </>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Đăng xuất</span>
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 text-base font-medium text-slate-700 bg-slate-100 rounded-xl"
              >
                Đăng Nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 text-base font-medium text-white bg-blue-600 rounded-xl"
              >
                Đăng Ký
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
