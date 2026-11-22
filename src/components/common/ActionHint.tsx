import React, { useState, useEffect } from 'react';

export type ActionHintTone = 'neutral' | 'theme' | 'accent' | 'danger';
export type ActionHintPosition = 'top' | 'bottom';
export type ActionHintAlign = 'center' | 'left' | 'right';

interface Props {
  message: string;
  tone?: ActionHintTone;
  position?: ActionHintPosition;
  align?: ActionHintAlign;
  className?: string;
  children: React.ReactNode;
}

const TONE_BOX_CLASSES: Record<ActionHintTone, string> = {
  neutral:
    'bg-slate-900 text-slate-100 border-slate-700/80 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700',
  theme:
    'bg-emerald-950 text-emerald-100 border-emerald-700/80 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-700',
  accent:
    'bg-cyan-950 text-cyan-100 border-cyan-700/80 dark:bg-cyan-950 dark:text-cyan-100 dark:border-cyan-700',
  danger:
    'bg-rose-950 text-rose-100 border-rose-700/80 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-700',
};

const TONE_DOT_CLASSES: Record<ActionHintTone, string> = {
  neutral: 'bg-slate-400 dark:bg-slate-400',
  theme: 'bg-emerald-400',
  accent: 'bg-cyan-400',
  danger: 'bg-rose-400',
};

const POSITION_CLASSES: Record<ActionHintPosition, string> = {
  top: 'bottom-full mb-2',
  bottom: 'top-full mt-2',
};

const ALIGN_CLASSES: Record<ActionHintAlign, string> = {
  center: 'left-1/2 -translate-x-1/2',
  left: 'left-0',
  right: 'right-0',
};

export const ActionHint: React.FC<Props> = ({
  message,
  tone = 'neutral',
  position = 'top',
  align = 'center',
  className = '',
  children,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <span
      className={`relative inline-flex shrink-0 ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      onClickCapture={() => setVisible(false)}
    >
      {children}
      {visible && message && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute z-[80] ${POSITION_CLASSES[position]} ${ALIGN_CLASSES[align]} w-max max-w-[min(220px,calc(100vw-1.5rem))] px-3 py-1.5 rounded-[12px] border text-[12px] font-medium leading-snug shadow-lg flex items-center gap-2 whitespace-normal text-left ${TONE_BOX_CLASSES[tone]}`}
        >
          <span
            aria-hidden="true"
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${TONE_DOT_CLASSES[tone]}`}
          />
          <span>{message}</span>
        </span>
      )}
    </span>
  );
};
