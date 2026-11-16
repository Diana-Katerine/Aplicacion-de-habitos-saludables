import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Compass,
  Flame,
  Trophy,
  Check,
  TrendingUp,
} from 'lucide-react';
import { Category, EvaluatedBadge, Habit, HabitLog, WeeklyFocus } from '../../types';
import { buildWeeklyReportSummary } from '../../services/pdfReport';
import { CategoryIcon } from '../common/CategoryIcon';
import { ActionHint } from '../common/ActionHint';

interface Props {
  isOpen: boolean;
  habits: Habit[];
  logs: HabitLog[];
  categories: Category[];
  badges: EvaluatedBadge[];
  timezone?: string;
  userName?: string;
  existingWeeklyFocus: WeeklyFocus | null;
  onSaveWeeklyFocus: (intent: string, reflectionNote?: string) => void;
  onDismiss: () => void;
}

const WEEKLY_FOCUS_SUGGESTIONS = [
  'Consolidar mi rutina matutina sin excepciones',
  'Proteger mi descanso nocturno y energía diaria',
  'Avanzar con foco profundo en mis 3 hábitos clave',
];

export const WeeklyReflectionModal: React.FC<Props> = ({
  isOpen,
  habits,
  logs,
  categories,
  badges,
  timezone,
  userName,
  existingWeeklyFocus,
  onSaveWeeklyFocus,
  onDismiss,
}) => {
  const [intent, setIntent] = useState(existingWeeklyFocus?.intent || '');
  const [reflectionNote, setReflectionNote] = useState(existingWeeklyFocus?.reflectionNote || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIntent(existingWeeklyFocus?.intent || '');
      setReflectionNote(existingWeeklyFocus?.reflectionNote || '');
      setError(null);
    }
  }, [isOpen, existingWeeklyFocus]);

  const summary = useMemo(
    () =>
      buildWeeklyReportSummary({
        habits,
        logs,
        categories,
        badges,
        timezone,
      }),
    [habits, logs, categories, badges, timezone]
  );

  if (!isOpen) return null;

  const topCategory = summary.topCategories[0] || null;
  const topHabit = summary.habitBreakdown[0] || null;
  const firstName = userName ? userName.split(' ')[0] : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim()) {
      setError('Define una intención de enfoque para tu próxima semana.');
      return;
    }
    onSaveWeeklyFocus(intent.trim(), reflectionNote.trim() || undefined);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="weekly-reflection-title"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-5 bg-[#17191c]/35 dark:bg-[#050709]/75 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl steep-modal p-4 sm:p-8 my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-[#ececec] dark:border-[#252e3a]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[12px] sm:text-[13px] text-[#979799] dark:text-[#6f7a8a]">
              <span>Reflexión dominical</span>
              <span aria-hidden="true">·</span>
              <span>{summary.periodLabel}</span>
            </div>
            <h2
              id="weekly-reflection-title"
              className="font-signifier font-normal text-[24px] sm:text-[30px] leading-[1.2] tracking-[-0.015em] text-[#17191c] dark:text-[#f1f5f9] mt-1 break-words"
            >
              {firstName ? (
                <>
                  {firstName}, así fue <em className="italic font-normal text-[#059669] dark:text-[#34d399]">tu semana</em>
                </>
              ) : (
                'Retrospectiva de los últimos 7 días'
              )}
            </h2>
            <p className="text-[14px] text-[#777b86] dark:text-[#9aa4b2] mt-1">
              Revisa tu impulso reciente y define tu ancla de enfoque para la semana entrante.
            </p>
          </div>

          <ActionHint
            message="Cerrará la reflexión semanal sin guardar cambios"
            tone="neutral"
            position="bottom"
            align="right"
          >
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Cerrar reflexión semanal"
              className="w-11 h-11 rounded-full border border-[#ececec] dark:border-[#252e3a] bg-[#fafafb] dark:bg-[#1b222b] text-[#5c616d] dark:text-[#9aa4b2] hover:text-[#b91c1c] dark:hover:text-[#fca5a5] hover:bg-[#fee2e2]/60 dark:hover:bg-[#7f1d1d]/30 hover:border-[#ef4444]/40 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>
          </ActionHint>
        </div>

        {/* Retrospective KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 sm:mt-5">
          <div className="rounded-[18px] sm:rounded-[20px] p-3 sm:p-4 min-w-0 bg-[#ECFDF5] dark:bg-[#059669]/12 border border-[#059669]/15 dark:border-[#10b981]/25">
            <span className="text-[11px] sm:text-[12px] text-[#047857] dark:text-[#34d399] font-medium block truncate">Adherencia 7d</span>
            <span className="text-[20px] sm:text-[24px] font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums mt-0.5 block">
              {summary.weeklyRate}%
            </span>
          </div>

          <div className="rounded-[18px] sm:rounded-[20px] p-3 sm:p-4 min-w-0 bg-[#E0F2FE] dark:bg-[#0284C7]/12 border border-[#0284C7]/15 dark:border-[#38BDF8]/25">
            <span className="text-[11px] sm:text-[12px] text-[#0369A1] dark:text-[#38bdf8] font-medium block truncate">Check-ins</span>
            <span className="text-[20px] sm:text-[24px] font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums mt-0.5 block">
              {summary.totalCompleted}
              <span className="text-[12px] sm:text-[13px] font-normal text-[#777b86] dark:text-[#9aa4b2]">/{summary.totalScheduled}</span>
            </span>
          </div>

          <div className="rounded-[18px] sm:rounded-[20px] p-3 sm:p-4 min-w-0 bg-[#EEF2FF] dark:bg-[#4F46E5]/14 border border-[#4F46E5]/15 dark:border-[#818CF8]/25">
            <span className="text-[11px] sm:text-[12px] text-[#4338CA] dark:text-[#a5b4fc] font-medium block truncate">Días perfectos</span>
            <span className="text-[20px] sm:text-[24px] font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums mt-0.5 block">
              {summary.perfectDays}
              <span className="text-[12px] sm:text-[13px] font-normal text-[#777b86] dark:text-[#9aa4b2]">/7</span>
            </span>
          </div>

          <div className="rounded-[18px] sm:rounded-[20px] p-3 sm:p-4 min-w-0 bg-[#FFFBEB] dark:bg-[#D97706]/12 border border-[#D97706]/20 dark:border-[#FBBF24]/25">
            <span className="text-[11px] sm:text-[12px] text-[#B45309] dark:text-[#fbbf24] font-medium block truncate">Racha activa</span>
            <span className="text-[20px] sm:text-[24px] font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums mt-0.5 inline-flex items-center gap-1">
              <Flame className="w-4 h-4 text-[#D97706] dark:text-[#fbbf24] shrink-0" />
              {summary.currentStreakOverall} d
            </span>
          </div>
        </div>

        {/* 7-Day Visual Cadence Strip */}
        <div className="mt-4 rounded-[20px] p-3.5 sm:p-5 bg-[#fafafb] dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] inline-flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#059669] dark:text-[#34d399] shrink-0" />
              Cadencia de los últimos 7 días
            </span>
            {summary.bestDay && (
              <span className="text-[12px] text-[#777b86] dark:text-[#9aa4b2] tabular-nums">
                Mejor día: <strong className="text-[#17191c] dark:text-[#f1f5f9] font-medium">{summary.bestDay.dayName}</strong> ({summary.bestDay.rate}%)
              </span>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 items-end h-20 sm:h-24 pt-2">
            {summary.days.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[10px] text-[#777b86] dark:text-[#9aa4b2] tabular-nums">
                  {day.rate}%
                </span>
                <div className="w-full max-w-[30px] flex-1 bg-[#f2f2f3] dark:bg-[#141920] rounded-md overflow-hidden flex items-end">
                  <div
                    className="w-full rounded-md transition-all"
                    style={{
                      height: `${Math.max(day.rate > 0 ? 10 : 0, day.rate)}%`,
                      backgroundColor:
                        day.rate >= 80 ? '#059669' : day.rate >= 50 ? '#0284C7' : '#F59E0B',
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium text-[#777b86] dark:text-[#9aa4b2]">{day.dayLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights */}
        {(topCategory || topHabit) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {topCategory && (
              <div className="rounded-[20px] p-4 bg-[#f2f2f3] dark:bg-[#1b222b] flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${topCategory.category.colorHex}22`,
                    color: topCategory.category.colorHex,
                  }}
                >
                  <CategoryIcon name={topCategory.category.iconName} className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] block">Categoría líder</span>
                  <p className="text-[14px] font-medium text-[#17191c] dark:text-[#f1f5f9] truncate">
                    {topCategory.category.name}
                  </p>
                </div>
                <span className="text-[14px] font-medium text-[#059669] dark:text-[#34d399] tabular-nums shrink-0">
                  {topCategory.weeklyRate}%
                </span>
              </div>
            )}

            {topHabit && (
              <div className="rounded-[20px] p-4 bg-[#f2f2f3] dark:bg-[#1b222b] flex items-center gap-3">
                <div className="w-11 h-11 rounded-[12px] bg-[#FEF3C7] dark:bg-[#D97706]/25 text-[#D97706] dark:text-[#fbbf24] flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] block">Hábito más constante</span>
                  <p className="text-[14px] font-medium text-[#17191c] dark:text-[#f1f5f9] truncate">{topHabit.habit.title}</p>
                </div>
                <span className="text-[14px] font-medium text-[#0284C7] dark:text-[#38bdf8] tabular-nums shrink-0">
                  {topHabit.weeklyCompleted}/{topHabit.weeklyScheduled}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Upcoming Week Focus Intent Form */}
        <form onSubmit={handleSubmit} className="mt-6 pt-5 border-t border-[#ececec] dark:border-[#252e3a] space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#4F46E5] dark:text-[#818cf8] shrink-0" />
              <label
                htmlFor="weekly-focus-intent-input"
                className="text-[15px] font-medium text-[#17191c] dark:text-[#f1f5f9]"
              >
                Intención de enfoque para la próxima semana
              </label>
            </div>
            <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-0.5">
              Elige un norte claro para guiar tus decisiones de los próximos 7 días.
            </p>
          </div>

          <input
            id="weekly-focus-intent-input"
            type="text"
            maxLength={120}
            value={intent}
            onChange={(e) => {
              setIntent(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ej: Completar mi ritual matutino antes de revisar el teléfono..."
            className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[15px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#818cf8]"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a]">Ideas:</span>
            {WEEKLY_FOCUS_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setIntent(suggestion);
                  if (error) setError(null);
                }}
                className="px-3 py-1.5 sm:py-1 rounded-[14px] sm:rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] hover:bg-[#EEF2FF] dark:hover:bg-[#4F46E5]/20 hover:text-[#4338CA] dark:hover:text-[#a5b4fc] text-[12px] text-left text-[#17191c] dark:text-[#cbd5e1] transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div>
            <label
              htmlFor="weekly-reflection-note-input"
              className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-1.5"
            >
              Nota breve de aprendizaje (opcional)
            </label>
            <input
              id="weekly-reflection-note-input"
              type="text"
              maxLength={160}
              value={reflectionNote}
              onChange={(e) => setReflectionNote(e.target.value)}
              placeholder="¿Qué hábito fluyó mejor o qué horario ajustarás esta semana?"
              className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[14px] focus:outline-none focus:border-[#059669] dark:focus:border-[#34d399]"
            />
          </div>

          {error && <p className="text-[13px] text-[#b91c1c] dark:text-[#fca5a5]">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
            <button
              type="button"
              onClick={onDismiss}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-transparent hover:bg-[#fafafb] dark:hover:bg-[#1b222b] border border-[#17191c]/25 dark:border-[#252e3a] text-[14px] text-center text-[#17191c] dark:text-[#f1f5f9] transition-colors cursor-pointer"
            >
              Omitir por esta semana
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[14px] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Fijar enfoque semanal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
