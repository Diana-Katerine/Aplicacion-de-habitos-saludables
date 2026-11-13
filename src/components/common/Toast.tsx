import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, RotateCcw, AlertCircle, Info, BellRing, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'undo' | 'error' | 'info' | 'reminder';
  title: string;
  description?: string;
  metaLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  onUndo?: () => void;
  undoLabel?: string;
  durationMs?: number;
}

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<Props> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
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
    const delay = toast.durationMs ?? (toast.type === 'reminder' ? 9000 : 4500);
    const timer = setTimeout(() => {
      onDismiss();
    }, delay);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.durationMs, toast.type]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#17191c] shrink-0 mt-0.5" />,
    undo: <RotateCcw className="w-5 h-5 text-[#5d2a1a] shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-[#777b86] shrink-0 mt-0.5" />,
    reminder: <BellRing className="w-5 h-5 text-[#5d2a1a] shrink-0 mt-0.5" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className={`pointer-events-auto flex items-start gap-3 p-4 steep-popover ${
        toast.type === 'reminder' ? 'bg-[#fbe1d1] text-[#5d2a1a]' : 'bg-white text-[#17191c]'
      }`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        {toast.metaLabel && (
          <p className="text-[11px] font-normal text-[#5d2a1a]/80 mb-0.5">
            {toast.metaLabel}
          </p>
        )}
        <p
          className={`text-[14px] font-medium tracking-tight ${
            toast.type === 'reminder' ? 'text-[#5d2a1a]' : 'text-[#17191c]'
          }`}
        >
          {toast.title}
        </p>
        {toast.description && (
          <p
            className={`text-[12px] mt-0.5 leading-snug ${
              toast.type === 'reminder' ? 'text-[#5d2a1a]/85' : 'text-[#777b86]'
            }`}
          >
            {toast.description}
          </p>
        )}

        {(toast.onAction || toast.onSecondaryAction) && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {toast.onAction && toast.actionLabel && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  onDismiss();
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[12px] font-normal transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {toast.actionLabel}
              </button>
            )}
            {toast.onSecondaryAction && toast.secondaryLabel && (
              <button
                type="button"
                onClick={() => {
                  toast.onSecondaryAction?.();
                  onDismiss();
                }}
                className="px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#5d2a1a]/30 text-[#5d2a1a] text-[12px] font-normal transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {toast.secondaryLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {toast.onUndo && (
        <button
          type="button"
          onClick={() => {
            toast.onUndo?.();
            onDismiss();
          }}
          className="text-[12px] font-medium text-[#17191c] hover:underline transition-colors shrink-0 px-2.5 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e5e7] cursor-pointer"
        >
          {toast.undoLabel || 'Deshacer'}
        </button>
      )}

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar notificación"
        className={`transition-colors shrink-0 p-1 rounded-full cursor-pointer ${
          toast.type === 'reminder'
            ? 'text-[#5d2a1a]/70 hover:text-[#5d2a1a]'
            : 'text-[#979799] hover:text-[#17191c]'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
