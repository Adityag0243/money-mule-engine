import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={clsx(
        "fixed bottom-8 right-8 z-50 px-4 py-3 rounded-lg shadow-2xl border flex items-center gap-3 min-w-[300px]",
        type === 'success' ? "bg-green-900/90 border-green-500/30 text-green-100" :
        type === 'error' ? "bg-red-900/90 border-red-500/30 text-red-100" :
        "bg-slate-800/90 border-slate-600/30 text-slate-100"
      )}
    >
        {type === 'success' && <CheckCircle size={18} className="text-green-400" />}
        {type === 'error' && <AlertTriangle size={18} className="text-red-400" />}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-auto hover:bg-white/10 rounded p-1">
            <X size={14} />
        </button>
    </motion.div>
  );
}

// Custom hook to manage toast state locally in App or Context
export function useToast() {
   const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);
   
   const showToast = (message: string, type: ToastType = 'info') => {
       setToast({ message, type });
   };
   
   const hideToast = () => setToast(null);
   
   return { toast, showToast, hideToast };
}
