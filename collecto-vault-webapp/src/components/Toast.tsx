import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 ${bgColor} text-white px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-300`}>
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
