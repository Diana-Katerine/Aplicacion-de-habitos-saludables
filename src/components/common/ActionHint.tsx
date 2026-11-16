import React, { useState } from 'react';

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
    'bg-[#17191c] text-white border-[#2c323c] dark:bg-[#f1f5f9] dark:text-[#17191c] dark:border-white/80',
  theme:
    'bg-[#1e1b4b] text-[#eef2ff] border-[#6366f1]/60 dark:bg-[#1e2638] dark:text-[#f1f5f9] dark:border-[#818cf8]/60',
  accent:
    'bg-[#064e3b] text-[#ecfdf5] border-[#10b981]/55 dark:bg-[#052e24] dark:text-[#d1fae5] dark:border-[#34d399]/50',
  danger:
    'bg-[#7f1d1d] text-[#fef2f2] border-[#f87171]/55 dark:bg-[#450a0a] dark:text-[#fecaca] dark:border-[#f87171]/55',
};

const TONE_DOT_CLASSES: Record<ActionHintTone, string> = {
  neutral: 'bg-[#9aa4b2] dark:bg-[#5c616d]',
  theme: 'bg-[#fbbf24]',
  accent: 'bg-[#34d399]',
  danger: 'bg-[#fca5a5]',
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
