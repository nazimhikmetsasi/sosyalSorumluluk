import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts } = useApp();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[2100] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border text-sm font-medium transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === 'error'
              ? 'bg-[#FFDAD6] text-[#93000A] border-[#BA1A1A]/30'
              : toast.type === 'info'
              ? 'bg-[#E0F2FE] text-[#0369A1] border-[#38BDF8]/40'
              : 'bg-[#2D6A4F] text-white border-[#52B788]/40'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#BA1A1A]" />
          ) : toast.type === 'info' ? (
            <Info className="w-5 h-5 flex-shrink-0 text-[#0284C7]" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#95D5B2]" />
          )}
          <span className="flex-1">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
