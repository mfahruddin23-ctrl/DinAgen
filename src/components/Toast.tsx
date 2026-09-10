import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<{
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  let bgColor = 'bg-white text-slate-800 border-slate-200';
  let Icon = Info;
  let iconColor = 'text-blue-600';

  if (type === 'success') {
    bgColor = 'bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-100';
    Icon = CheckCircle2;
    iconColor = 'text-emerald-600 dark:text-emerald-400';
  } else if (type === 'error') {
    bgColor = 'bg-rose-50 border-rose-300 text-rose-950 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-100';
    Icon = XCircle;
    iconColor = 'text-rose-600 dark:text-rose-400';
  } else if (type === 'warning') {
    bgColor = 'bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-100';
    Icon = AlertCircle;
    iconColor = 'text-amber-600 dark:text-amber-400';
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full px-4 sm:px-0 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-xl ${bgColor}`}>
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
        <div className="flex-1 text-xs font-semibold leading-relaxed break-words">{message}</div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let bgColor = 'bg-white text-slate-800 border-slate-200';
        let Icon = Info;
        let iconColor = 'text-blue-600';

        if (toast.type === 'success') {
          bgColor = 'bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-100';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-600 dark:text-emerald-400';
        } else if (toast.type === 'error') {
          bgColor = 'bg-rose-50 border-rose-300 text-rose-950 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-100';
          Icon = XCircle;
          iconColor = 'text-rose-600 dark:text-rose-400';
        } else if (toast.type === 'warning') {
          bgColor = 'bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-100';
          Icon = AlertCircle;
          iconColor = 'text-amber-600 dark:text-amber-400';
        } else {
          bgColor = 'bg-blue-50 border-blue-300 text-blue-950 dark:bg-slate-900 dark:border-blue-700 dark:text-blue-100';
          Icon = Info;
          iconColor = 'text-blue-600 dark:text-blue-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 ${bgColor}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold tracking-tight leading-snug">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed break-words">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
