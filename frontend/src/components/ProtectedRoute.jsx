import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
            403
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">
            Bạn không có quyền truy cập vào trang quản trị này. Quyền truy cập yêu cầu vai trò <span className="font-semibold text-blue-600">{requiredRole}</span>.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl shadow-md hover:bg-blue-700 transition duration-200"
          >
            Quay về Trang chủ
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
