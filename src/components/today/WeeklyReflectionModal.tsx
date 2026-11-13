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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17191c]/35 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl steep-modal p-6 sm:p-8 my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#ececec]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#979799]">
              <span>Reflexión dominical</span>
              <span aria-hidden="true">·</span>
              <span>{summary.periodLabel}</span>
            </div>
            <h2
              id="weekly-reflection-title"
              className="font-signifier font-normal text-[30px] leading-[1.2] tracking-[-0.015em] text-[#17191c] mt-1"
            >
              {firstName ? (
                <>
                  {firstName}, así fue <em className="italic font-normal">tu semana</em>
                </>
              ) : (
                'Retrospectiva de los últimos 7 días'
              )}
            </h2>
            <p className="text-[14px] text-[#777b86] mt-1">
              Revisa tu impulso reciente y define tu ancla de enfoque para la semana entrante.
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar reflexión semanal"
            className="p-2 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Retrospective KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="rounded-[20px] p-4 bg-[#f2f2f3]">
            <span className="text-[12px] text-[#979799] block">Adherencia 7d</span>
            <span className="text-[24px] font-medium text-[#17191c] tabular-nums mt-0.5 block">
              {summary.weeklyRate}%
            </span>
          </div>

          <div className="rounded-[20px] p-4 bg-[#f2f2f3]">
            <span className="text-[12px] text-[#979799] block">Check-ins</span>
            <span className="text-[24px] font-medium text-[#17191c] tabular-nums mt-0.5 block">
              {summary.totalCompleted}
              <span className="text-[13px] font-normal text-[#777b86]">/{summary.totalScheduled}</span>
            </span>
          </div>

          <div className="rounded-[20px] p-4 bg-[#f2f2f3]">
            <span className="text-[12px] text-[#979799] block">Días perfectos</span>
            <span className="text-[24px] font-medium text-[#17191c] tabular-nums mt-0.5 block">
              {summary.perfectDays}
              <span className="text-[13px] font-normal text-[#777b86]">/7</span>
            </span>
          </div>

          <div className="rounded-[20px] p-4 bg-[#f2f2f3]">
            <span className="text-[12px] text-[#979799] block">Racha activa</span>
            <span className="text-[24px] font-medium text-[#17191c] tabular-nums mt-0.5 inline-flex items-center gap-1">
              <Flame className="w-4 h-4 text-[#5d2a1a] shrink-0" />
              {summary.currentStreakOverall} d
            </span>
          </div>
        </div>

        {/* 7-Day Visual Cadence Strip */}
        <div className="mt-4 rounded-[20px] p-5 bg-[#fafafb] border border-[#ececec]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[13px] font-medium text-[#17191c] inline-flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#5d2a1a] shrink-0" />
              Cadencia de los últimos 7 días
            </span>
            {summary.bestDay && (
              <span className="text-[12px] text-[#777b86] tabular-nums">
                Mejor día: <strong className="text-[#17191c] font-medium">{summary.bestDay.dayName}</strong> ({summary.bestDay.rate}%)
              </span>
            )}
          </div>

          <div className="grid grid-cols-7 gap-2 items-end h-24 pt-2">
            {summary.days.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[10px] text-[#777b86] tabular-nums">
                  {day.rate}%
                </span>
                <div className="w-full max-w-[30px] flex-1 bg-[#f2f2f3] rounded-md overflow-hidden flex items-end">
                  <div
                    className="w-full rounded-md transition-all"
                    style={{
                      height: `${Math.max(day.rate > 0 ? 10 : 0, day.rate)}%`,
                      backgroundColor:
                        day.rate >= 80 ? '#17191c' : day.rate >= 50 ? '#5d2a1a' : '#a3a6af',
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium text-[#777b86]">{day.dayLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights */}
        {(topCategory || topHabit) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {topCategory && (
              <div className="rounded-[20px] p-4 bg-[#f2f2f3] flex items-center gap-3">
                <div className="w-9 h-9 rounded-[12px] bg-white text-[#17191c] flex items-center justify-center shrink-0">
                  <CategoryIcon name={topCategory.category.iconName} className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] text-[#979799] block">Categoría líder</span>
                  <p className="text-[14px] font-medium text-[#17191c] truncate">
                    {topCategory.category.name}
                  </p>
                </div>
                <span className="text-[14px] font-medium text-[#17191c] tabular-nums shrink-0">
                  {topCategory.weeklyRate}%
                </span>
              </div>
            )}

            {topHabit && (
              <div className="rounded-[20px] p-4 bg-[#f2f2f3] flex items-center gap-3">
                <div className="w-9 h-9 rounded-[12px] bg-white text-[#5d2a1a] flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] text-[#979799] block">Hábito más constante</span>
                  <p className="text-[14px] font-medium text-[#17191c] truncate">{topHabit.habit.title}</p>
                </div>
                <span className="text-[14px] font-medium text-[#17191c] tabular-nums shrink-0">
                  {topHabit.weeklyCompleted}/{topHabit.weeklyScheduled}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Upcoming Week Focus Intent Form */}
        <form onSubmit={handleSubmit} className="mt-6 pt-5 border-t border-[#ececec] space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#17191c] shrink-0" />
              <label
                htmlFor="weekly-focus-intent-input"
                className="text-[15px] font-medium text-[#17191c]"
              >
                Intención de enfoque para la próxima semana
              </label>
            </div>
            <p className="text-[13px] text-[#777b86] mt-0.5">
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
            className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] placeholder-[#a3a6af] text-[15px] focus:outline-none focus:border-[#17191c]"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-[#979799]">Ideas:</span>
            {WEEKLY_FOCUS_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setIntent(suggestion);
                  if (error) setError(null);
                }}
                className="px-3 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e5e7] text-[12px] text-[#17191c] transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div>
            <label
              htmlFor="weekly-reflection-note-input"
              className="block text-[13px] text-[#777b86] mb-1.5"
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
              className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] placeholder-[#a3a6af] text-[14px] focus:outline-none focus:border-[#17191c]"
            />
          </div>

          {error && <p className="text-[13px] text-[#b91c1c]">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
            <button
              type="button"
              onClick={onDismiss}
              className="px-5 py-2.5 rounded-full bg-transparent hover:bg-[#fafafb] border border-[#17191c]/25 text-[14px] text-[#17191c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Omitir por esta semana
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[14px] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
