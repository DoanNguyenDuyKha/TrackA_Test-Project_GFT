import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

const AdminConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'warning', confirmText = 'Xác Nhận Xóa' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-8 h-8 text-red-600 animate-bounce" />;
      case 'success':
        return <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-pulse" />;
      default:
        return <Info className="w-8 h-8 text-amber-600 animate-bounce" />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 text-red-800 border-red-100';
      case 'success':
        return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-100';
    }
  };

  const getConfirmBtnClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 border border-slate-200 animate-scaleUp relative overflow-hidden text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border ${getHeaderBg()}`}>
          {getIcon()}
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-800">{title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-center space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-2.5 font-extrabold text-xs rounded-2xl shadow-lg transition ${getConfirmBtnClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfirmModal;
