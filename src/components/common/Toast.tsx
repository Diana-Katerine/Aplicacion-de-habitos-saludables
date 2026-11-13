import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, RotateCcw, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'undo' | 'error' | 'info';
  title: string;
  description?: string;
  onUndo?: () => void;
  undoLabel?: string;
}

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<Props> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />,
    undo: <RotateCcw className="w-5 h-5 text-[#F59E0B] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#38BDF8] shrink-0" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-[#111827] border border-white/10 shadow-2xl backdrop-blur-md"
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white tracking-tight">{toast.title}</p>
        {toast.description && <p className="text-xs text-slate-400 mt-0.5">{toast.description}</p>}
      </div>

      {toast.onUndo && (
        <button
          onClick={() => {
            toast.onUndo?.();
            onDismiss();
          }}
          className="text-xs font-semibold text-[#10B981] hover:text-[#34D399] transition-colors shrink-0 px-2 py-1 rounded bg-[#10B981]/10 hover:bg-[#10B981]/20 cursor-pointer"
        >
          {toast.undoLabel || 'Deshacer'}
        </button>
      )}

      <button
        onClick={onDismiss}
        className="text-slate-500 hover:text-white transition-colors shrink-0 p-0.5 rounded cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
