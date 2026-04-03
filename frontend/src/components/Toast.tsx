import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: number) => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose(toast.id), 6000);
    return () => clearTimeout(t);
  }, [toast.id, onClose]);

  const isSuccess = toast.type === 'success';
  const isInfo = toast.type === 'info';

  return (
    <div
      className={`
        flex items-start gap-3 w-80 p-4 rounded-xl shadow-card border
        animate-slide-up bg-surface-50
        ${isSuccess ? 'border-green-500/20' : isInfo ? 'border-blue-500/20' : 'border-red-500/20'}
      `}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
          ${isSuccess ? 'bg-green-500/15' : isInfo ? 'bg-blue-500/15' : 'bg-red-500/15'}`}
      >
        {isSuccess ? (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              fill="#22C55E"
            />
          </svg>
        ) : isInfo ? (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 102 0V9a1 1 0 10-2 0v4zm1-7a1 1 0 100 2 1 1 0 000-2z"
              fill="#3B82F6"
            />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 102 0V9a1 1 0 10-2 0v4zm1-7a1 1 0 100 2 1 1 0 000-2z"
              fill="#EF4444"
            />
          </svg>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isSuccess ? 'text-green-300' : isInfo ? 'text-blue-300' : 'text-red-300'}`}>
          {toast.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 break-all">{toast.message}</p>
      </div>

      {/* Close */}
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-gray-600 hover:text-gray-300 transition-colors"
        aria-label="Dismiss"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.293 4.293a1 1 0 011.414 0L8 6.586l2.293-2.293a1 1 0 111.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 010-1.414z" />
        </svg>
      </button>
    </div>
  );
}

// ---- Toast container (fixed top-right) --------------------------------------

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: number) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  );
}

// ---- useToast hook -----------------------------------------------------------

import { useState, useCallback } from 'react';

let _nextId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = ++_nextId;
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
