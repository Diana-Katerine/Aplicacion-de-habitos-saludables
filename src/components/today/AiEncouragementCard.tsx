import React from 'react';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { AiEncouragementMessage, EncouragementTone } from '../../types';

interface Props {
  encouragement: AiEncouragementMessage | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const TONE_STYLES: Record<
  EncouragementTone,
  {
    container: string;
    iconBox: string;
    accentText: string;
  }
> = {
  celebration: {
    container:
      'bg-gradient-to-r from-[#ECFDF5] via-[#F0FDFA] to-[#E0F2FE] dark:from-[#059669]/22 dark:via-[#0D9488]/14 dark:to-[#0284C7]/14 border-[#10B981]/30 dark:border-[#34d399]/35',
    iconBox:
      'bg-gradient-to-br from-[#10B981] to-[#0D9488] text-white shadow-sm shadow-[#10B981]/30',
    accentText: 'text-[#047857] dark:text-[#34d399]',
  },
  momentum: {
    container:
      'bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#ECFEFF] dark:from-[#4F46E5]/20 dark:via-[#7C3AED]/14 dark:to-[#06B6D4]/14 border-[#6366F1]/28 dark:border-[#818CF8]/35',
    iconBox:
      'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-sm shadow-[#6366F1]/30',
    accentText: 'text-[#4338CA] dark:text-[#a5b4fc]',
  },
  resilience: {
    container:
      'bg-gradient-to-r from-[#FFFBEB] via-[#FFF1F2] to-[#FEF3C7]/70 dark:from-[#D97706]/20 dark:via-[#E11D48]/12 dark:to-[#F59E0B]/14 border-[#F59E0B]/30 dark:border-[#FBBF24]/35',
    iconBox:
      'bg-gradient-to-br from-[#F59E0B] to-[#F43F5E] text-white shadow-sm shadow-[#F59E0B]/30',
    accentText: 'text-[#B45309] dark:text-[#fbbf24]',
  },
  calm: {
    container:
      'bg-gradient-to-r from-[#E0F2FE] via-[#ECFEFF] to-[#F0FDF4] dark:from-[#0284C7]/20 dark:via-[#06B6D4]/14 dark:to-[#10B981]/14 border-[#0284C7]/28 dark:border-[#38BDF8]/35',
    iconBox:
      'bg-gradient-to-br from-[#0284C7] to-[#06B6D4] text-white shadow-sm shadow-[#0284C7]/30',
    accentText: 'text-[#0369A1] dark:text-[#38bdf8]',
  },
};

export const AiEncouragementCard: React.FC<Props> = ({
  encouragement,
  isLoading,
  error,
  onRefresh,
}) => {
  const toneStyle = TONE_STYLES[encouragement?.tone || 'momentum'];

  return (
    <section
      aria-label="Mensaje de ánimo con IA"
      className={`rounded-[24px] p-4 sm:p-5 border transition-colors ${toneStyle.container}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <div
            className={`w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 mt-0.5 ${toneStyle.iconBox}`}
          >
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="min-w-0 flex-1">
            {isLoading && !encouragement ? (
              <div className="space-y-2 py-0.5 animate-pulse">
                <div className="h-4 w-44 rounded bg-[#17191c]/10 dark:bg-white/10" />
                <div className="h-3.5 w-full max-w-lg rounded bg-[#17191c]/10 dark:bg-white/10" />
                <div className="h-3 w-2/3 max-w-sm rounded bg-[#17191c]/10 dark:bg-white/10" />
              </div>
            ) : error && !encouragement ? (
              <div className="flex items-start gap-2 text-[13px] text-[#5d2a1a] dark:text-[#fbdac7]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : encouragement ? (
              <>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className={`text-[12px] font-medium ${toneStyle.accentText}`}>
                    Impulso IA
                  </span>
                  <span aria-hidden="true" className="text-[#a3a6af] dark:text-[#6f7a8a]">
                    ·
                  </span>
                  <h3 className="text-[15px] font-medium text-[#17191c] dark:text-[#f1f5f9]">
                    {encouragement.headline}
                  </h3>
                </div>

                <p className="text-[14px] leading-relaxed text-[#454a54] dark:text-[#cbd5e1] mt-1">
                  {encouragement.message}
                </p>

                {encouragement.microAction && (
                  <p className="text-[12px] text-[#777b86] dark:text-[#9aa4b2] mt-1.5">
                    <span className={`font-medium ${toneStyle.accentText}`}>Siguiente paso:</span>{' '}
                    {encouragement.microAction}
                  </p>
                )}

                {error && (
                  <p className="text-[12px] text-[#b91c1c] dark:text-[#fca5a5] mt-1.5">
                    {error}
                  </p>
                )}
              </>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-full bg-white/85 dark:bg-[#141920]/85 hover:bg-white dark:hover:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[12px] font-medium text-[#17191c] dark:text-[#f1f5f9] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 sm:self-start cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Generando...' : 'Otro mensaje'}</span>
        </button>
      </div>
    </section>
  );
};
