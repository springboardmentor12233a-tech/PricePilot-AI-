import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

/**
 * Toast Notification System
 * Accessible, stacked, subtle, professional auto-dismissing notifications
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', message, title, duration = 4000 }) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast = { id, type, message, title };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, title = 'Success') => addToast({ type: 'success', message, title }),
    error: (message, title = 'Error') => addToast({ type: 'error', message, title, duration: 6000 }),
    warning: (message, title = 'Warning') => addToast({ type: 'warning', message, title }),
    info: (message, title = 'Info') => addToast({ type: 'info', message, title }),
    dismiss: removeToast,
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#2563EB] shrink-0" />,
  };

  const borders = {
    success: 'border-[#BBF7D0]',
    error: 'border-[#FECACA]',
    warning: 'border-[#FDE68A]',
    info: 'border-[#BFDBFE]',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast viewport container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 bg-white rounded-xl border shadow-md transition-all duration-200 animate-in slide-in-from-bottom-2 ${
              borders[t.type] || 'border-[#E2E8F0]'
            }`}
          >
            {icons[t.type]}
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-xs font-semibold text-[#0F172A]">{t.title}</p>}
              <p className="text-xs text-[#64748B] mt-0.5 leading-normal">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#94A3B8] hover:text-[#0F172A] p-0.5 rounded cursor-pointer transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
