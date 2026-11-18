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
    badge: string;
    accentText: string;
  }
> = {
  celebration: {
    container: 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800',
    iconBox: 'bg-emerald-600 text-white',
    badge: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    accentText: 'text-emerald-800 dark:text-emerald-300',
  },
  momentum: {
    container: 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800',
    iconBox: 'bg-indigo-600 text-white',
    badge: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    accentText: 'text-indigo-800 dark:text-indigo-300',
  },
  resilience: {
    container: 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800',
    iconBox: 'bg-amber-600 text-white',
    badge: 'bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    accentText: 'text-amber-900 dark:text-amber-300',
  },
  calm: {
    container: 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800',
    iconBox: 'bg-blue-600 text-white',
    badge: 'bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    accentText: 'text-blue-800 dark:text-blue-300',
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
    <article
      aria-label="Respuesta y recomendación de IA"
      className={`rounded-xl p-6 sm:p-8 border shadow-sm transition-colors ${toneStyle.container}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${toneStyle.iconBox}`}
          >
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="min-w-0 flex-1">
            {isLoading && !encouragement ? (
              <div className="space-y-3 py-1 animate-pulse">
                <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-full max-w-lg rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-2/3 max-w-sm rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ) : error && !encouragement ? (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-700 dark:text-rose-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            ) : encouragement ? (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-xs px-2.5 py-1 rounded-md font-medium border ${toneStyle.badge}`}>
                    Asistente de Estudio IA
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {encouragement.headline}
                  </h3>
                </div>

                <p className="text-base leading-relaxed text-slate-800 dark:text-slate-200 text-left max-w-prose">
                  {encouragement.message}
                </p>

                {encouragement.microAction && (
                  <div className="mt-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      <strong className={`font-semibold ${toneStyle.accentText}`}>Paso sugerido:</strong>{' '}
                      {encouragement.microAction}
                    </p>
                  </div>
                )}

                {error && (
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-400 mt-2">
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
          className="min-h-[44px] px-4 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-800 dark:text-slate-100 inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 sm:self-start cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Generando...' : 'Nueva sugerencia'}</span>
        </button>
      </div>
    </article>
  );
};
