import React, { createContext, useState, useContext, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Notification Container (Top-Right) */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-slideInRight max-w-sm w-full">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-center justify-between space-x-3 transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                : toast.type === 'error'
                ? 'bg-red-600 text-white border-red-500 shadow-red-600/30'
                : 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
            }`}
          >
            <div className="flex items-center space-x-3">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-red-200" />}
              {toast.type === 'info' && <Info className="w-5 h-5 shrink-0 text-indigo-200" />}
              <span className="text-xs font-extrabold leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={hideToast}
              className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
