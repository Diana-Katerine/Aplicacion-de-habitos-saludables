import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, RotateCcw, AlertCircle, Info, BellRing, Sparkles, X } from 'lucide-react';
import { ActionHint } from './ActionHint';

export interface ToastMessage {
  id: string;
  type: 'success' | 'undo' | 'error' | 'info' | 'reminder' | 'ai';
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
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2.5 sm:max-w-sm sm:w-full pointer-events-none">
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
    success: <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />,
    undo: <RotateCcw className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-[#dc2626] shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-[#0284c7] shrink-0 mt-0.5" />,
    reminder: <BellRing className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />,
    ai: <Sparkles className="w-5 h-5 text-[#4F46E5] dark:text-[#a5b4fc] shrink-0 mt-0.5" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className={`pointer-events-auto flex items-start gap-2.5 sm:gap-3 p-3.5 sm:p-4 steep-popover border ${
        toast.type === 'reminder'
          ? 'bg-[#FFFBEB] dark:bg-[#2a1f10] border-[#D97706]/30 dark:border-[#FBBF24]/35 text-[#78350F] dark:text-[#fde68a]'
          : toast.type === 'ai'
          ? 'bg-[#EEF2FF] dark:bg-[#191d2e] border-[#4F46E5]/25 dark:border-[#818CF8]/35 text-[#17191c] dark:text-[#f1f5f9]'
          : toast.type === 'success'
          ? 'bg-white dark:bg-[#181f28] border-[#059669]/25 dark:border-[#34d399]/30 text-[#17191c] dark:text-[#f1f5f9]'
          : toast.type === 'error'
          ? 'bg-white dark:bg-[#181f28] border-[#dc2626]/25 dark:border-[#f87171]/35 text-[#17191c] dark:text-[#f1f5f9]'
          : 'bg-white dark:bg-[#181f28] border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9]'
      }`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        {toast.metaLabel && (
          <p
            className={`text-[11px] font-medium mb-0.5 break-words ${
              toast.type === 'ai'
                ? 'text-[#4338CA] dark:text-[#a5b4fc]'
                : 'text-[#B45309] dark:text-[#fbbf24]'
            }`}
          >
            {toast.metaLabel}
          </p>
        )}
        <p
          className={`text-[14px] font-medium tracking-tight break-words ${
            toast.type === 'reminder' ? 'text-[#78350F] dark:text-[#fef3c7]' : 'text-[#17191c] dark:text-[#f1f5f9]'
          }`}
        >
          {toast.title}
        </p>
        {toast.description && (
          <p
            className={`text-[12px] mt-0.5 leading-snug break-words ${
              toast.type === 'reminder' ? 'text-[#92400E] dark:text-[#fde68a]/85' : 'text-[#777b86] dark:text-[#9aa4b2]'
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
                className="px-3.5 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[12px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
                className="px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#141920] hover:bg-white dark:hover:bg-[#1b222b] border border-[#5d2a1a]/30 dark:border-[#fbbf24]/35 text-[#5d2a1a] dark:text-[#fde68a] text-[12px] font-normal transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
          className="text-[12px] font-medium text-[#17191c] dark:text-[#f1f5f9] hover:underline transition-colors shrink-0 px-2.5 py-1 rounded-full bg-[#f2f2f3] dark:bg-[#252e3a] hover:bg-[#e5e5e7] dark:hover:bg-[#313c4b] cursor-pointer"
        >
          {toast.undoLabel || 'Deshacer'}
        </button>
      )}

      <ActionHint
        message="Ocultará esta notificación"
        tone="neutral"
        position="top"
        align="right"
      >
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar notificación"
          className={`transition-colors shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ${
            toast.type === 'reminder'
              ? 'text-[#5d2a1a]/80 dark:text-[#fde68a]/80 hover:text-[#5d2a1a] dark:hover:text-[#fef3c7] hover:bg-[#5d2a1a]/10 dark:hover:bg-white/10'
              : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] hover:bg-[#f2f2f3] dark:hover:bg-[#252e3a]'
          }`}
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>
      </ActionHint>
    </motion.div>
  );
};
