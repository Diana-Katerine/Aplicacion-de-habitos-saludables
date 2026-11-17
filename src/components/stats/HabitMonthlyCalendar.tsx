import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  Check,
  Sparkles,
  PauseCircle,
} from 'lucide-react';
import { Category, DayOfWeek, Habit, HabitLog } from '../../types';
import { formatDate, getDayOfWeek, getTodayDateString } from '../../services/storage';
import { CategoryIcon } from '../common/CategoryIcon';
import { getCategoryBioluminescentTheme } from '../../services/bioluminescentTheme';

interface Props {
  habits: Habit[];
  logs: HabitLog[];
  categories: Category[];
  selectedHabitId: string | 'all';
  onSelectHabit?: (habitId: string) => void;
  timezone?: string;
  isDark?: boolean;
}

interface StreakSegment {
  id: string;
  startDate: string;
  endDate: string;
  completedDays: number;
  isCurrent: boolean;
}

interface DayStreakMeta {
  streakId: string;
  streakLength: number;
  positionInStreak: number;
  isBridgeRestDay: boolean;
  isCurrentStreak: boolean;
}

interface CalendarDayCell {
  date: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  dayOfWeek: DayOfWeek;
  isToday: boolean;
  isFuture: boolean;
  isScheduled: boolean;
  isCompleted: boolean;
  isMissedScheduled: boolean;
  isRestDay: boolean;
  streakMeta: DayStreakMeta | null;
  log: HabitLog | null;
  isRibbonStart: boolean;
  isRibbonEnd: boolean;
}

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const MONTH_SHORT_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAY_FULL_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function parseIsoAnchor(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

function formatShortDateEs(dateStr: string): string {
  const d = parseIsoAnchor(dateStr);
  return `${d.getDate()} ${MONTH_SHORT_ES[d.getMonth()]}`;
}

export const HabitMonthlyCalendar: React.FC<Props> = ({
  habits,
  logs,
  categories,
  selectedHabitId,
  onSelectHabit,
  timezone,
  isDark = false,
}) => {
  const todayStr = useMemo(() => getTodayDateString(timezone), [timezone]);
  const todayAnchor = useMemo(() => parseIsoAnchor(todayStr), [todayStr]);

  const availableHabits = useMemo(
    () =>
      habits
        .filter((h) => !h.deletedAt)
        .sort((a, b) => Number(b.isActive) - Number(a.isActive) || b.currentStreak - a.currentStreak),
    [habits]
  );

  const defaultHabitId = availableHabits[0]?.id || '';
  const [localHabitId, setLocalHabitId] = useState<string>(defaultHabitId);

  useEffect(() => {
    if (selectedHabitId !== 'all') {
      setLocalHabitId(selectedHabitId);
    } else if (!availableHabits.some((h) => h.id === localHabitId)) {
      setLocalHabitId(defaultHabitId);
    }
  }, [selectedHabitId, availableHabits, localHabitId, defaultHabitId]);

  const activeHabitId = selectedHabitId !== 'all' ? selectedHabitId : localHabitId;
  const targetHabit = useMemo(
    () => availableHabits.find((h) => h.id === activeHabitId) || null,
    [availableHabits, activeHabitId]
  );

  const [viewMonth, setViewMonth] = useState<{ year: number; month: number }>(() => ({
    year: todayAnchor.getFullYear(),
    month: todayAnchor.getMonth(),
  }));

  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(todayStr);
  const [highlightedStreakId, setHighlightedStreakId] = useState<string | null>(null);

  const isViewingCurrentMonth =
    viewMonth.year === todayAnchor.getFullYear() && viewMonth.month === todayAnchor.getMonth();

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const category = targetHabit
    ? categoryMap.get(targetHabit.categoryId) || {
        id: targetHabit.categoryId,
        name: 'General',
        iconName: 'Activity',
        colorHex: '#059669',
      }
    : { id: 0, name: 'General', iconName: 'Activity', colorHex: '#059669' };
  const bioTheme = getCategoryBioluminescentTheme(category);

  // Build full historical streak timeline + current displayed month grid
  const {
    weeks,
    monthCompletedCount,
    monthScheduledElapsedCount,
    monthAdherenceRate,
    monthStreaks,
    bestMonthStreak,
    dayCellMap,
    earliestAllowedMonth,
  } = useMemo(() => {
    const emptyResult = {
      weeks: [] as CalendarDayCell[][],
      monthCompletedCount: 0,
      monthScheduledElapsedCount: 0,
      monthAdherenceRate: 0,
      monthStreaks: [] as StreakSegment[],
      bestMonthStreak: 0,
      dayCellMap: new Map<string, CalendarDayCell>(),
      earliestAllowedMonth: { year: todayAnchor.getFullYear(), month: todayAnchor.getMonth() },
    };

    if (!targetHabit) return emptyResult;

    const habitLogs = logs.filter((l) => l.habitId === targetHabit.id);
    const logByDate = new Map<string, HabitLog>();
    let earliestDateStr = targetHabit.createdAt ? targetHabit.createdAt.slice(0, 10) : todayStr;

    habitLogs.forEach((log) => {
      logByDate.set(log.logDate, log);
      if (log.logDate < earliestDateStr) {
        earliestDateStr = log.logDate;
      }
    });

    // Ensure at least 365 days cap so timeline walk is always fast
    const maxHistoryDate = new Date(todayAnchor);
    maxHistoryDate.setDate(todayAnchor.getDate() - 365);
    const maxHistoryStr = formatDate(maxHistoryDate);
    if (earliestDateStr < maxHistoryStr) {
      earliestDateStr = maxHistoryStr;
    }

    const earliestAnchor = parseIsoAnchor(earliestDateStr);
    const earliestMonthObj = {
      year: earliestAnchor.getFullYear(),
      month: earliestAnchor.getMonth(),
    };

    // Walk full timeline from earliestDateStr to todayStr to detect all past & current streaks accurately
    const streakDayMap = new Map<string, DayStreakMeta>();
    const allStreaks: StreakSegment[] = [];

    let runCompletedEntries: { date: string; pos: number }[] = [];
    let pendingRestDates: string[] = [];
    let runStartDate = '';
    let runLastCompletedDate = '';
    let streakCounter = 0;

    const flushStreak = (isCurrent: boolean) => {
      if (runCompletedEntries.length === 0) {
        pendingRestDates = [];
        return;
      }
      streakCounter += 1;
      const streakId = `streak-${streakCounter}`;
      const length = runCompletedEntries.length;

      allStreaks.push({
        id: streakId,
        startDate: runStartDate,
        endDate: runLastCompletedDate,
        completedDays: length,
        isCurrent,
      });

      // Mark completed days
      runCompletedEntries.forEach((entry) => {
        streakDayMap.set(entry.date, {
          streakId,
          streakLength: length,
          positionInStreak: entry.pos,
          isBridgeRestDay: false,
          isCurrentStreak: isCurrent,
        });
      });

      // Mark rest days that fell strictly inside the streak between two completed days
      for (let idx = 1; idx < runCompletedEntries.length; idx++) {
        const prevD = parseIsoAnchor(runCompletedEntries[idx - 1].date);
        const currD = parseIsoAnchor(runCompletedEntries[idx].date);
        const bridgeCursor = new Date(prevD);
        bridgeCursor.setDate(bridgeCursor.getDate() + 1);
        while (formatDate(bridgeCursor) < formatDate(currD)) {
          const bStr = formatDate(bridgeCursor);
          if (!streakDayMap.has(bStr)) {
            streakDayMap.set(bStr, {
              streakId,
              streakLength: length,
              positionInStreak: runCompletedEntries[idx - 1].pos,
              isBridgeRestDay: true,
              isCurrentStreak: isCurrent,
            });
          }
          bridgeCursor.setDate(bridgeCursor.getDate() + 1);
        }
      }

      runCompletedEntries = [];
      pendingRestDates = [];
      runStartDate = '';
      runLastCompletedDate = '';
    };

    const walkCursor = new Date(earliestAnchor);
    while (formatDate(walkCursor) <= todayStr) {
      const dateStr = formatDate(walkCursor);
      const dayNum = getDayOfWeek(walkCursor) as DayOfWeek;
      const isScheduled = targetHabit.scheduledDays.includes(dayNum);
      const log = logByDate.get(dateStr);
      const isCompleted = Boolean(log?.isCompleted);

      if (isCompleted) {
        if (runCompletedEntries.length === 0) {
          runStartDate = dateStr;
        }
        runLastCompletedDate = dateStr;
        runCompletedEntries.push({
          date: dateStr,
          pos: runCompletedEntries.length + 1,
        });
        pendingRestDates = [];
      } else if (isScheduled) {
        if (dateStr !== todayStr) {
          flushStreak(false);
        }
      } else if (runCompletedEntries.length > 0) {
        pendingRestDates.push(dateStr);
      }

      walkCursor.setDate(walkCursor.getDate() + 1);
    }

    // Any streak still open at todayStr is the current streak
    void pendingRestDates;
    flushStreak(true);

    // Build calendar month grid (Monday - Sunday)
    const firstOfMonth = new Date(viewMonth.year, viewMonth.month, 1, 12, 0, 0);
    const lastOfMonth = new Date(viewMonth.year, viewMonth.month + 1, 0, 12, 0, 0);
    const startOffset = getDayOfWeek(firstOfMonth) - 1;
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - startOffset);

    const endOffset = 7 - getDayOfWeek(lastOfMonth);
    const gridEnd = new Date(lastOfMonth);
    gridEnd.setDate(lastOfMonth.getDate() + endOffset);

    const cells: CalendarDayCell[] = [];
    const byDate = new Map<string, CalendarDayCell>();
    const monthStreakIds = new Set<string>();
    let mCompleted = 0;
    let mScheduledElapsed = 0;

    const gridCursor = new Date(gridStart);
    while (formatDate(gridCursor) <= formatDate(gridEnd)) {
      const dateStr = formatDate(gridCursor);
      const inCurrentMonth =
        gridCursor.getFullYear() === viewMonth.year && gridCursor.getMonth() === viewMonth.month;
      const dayOfWeek = getDayOfWeek(gridCursor) as DayOfWeek;
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;
      const isScheduled = targetHabit.scheduledDays.includes(dayOfWeek);
      const log = logByDate.get(dateStr) || null;
      const isCompleted = Boolean(log?.isCompleted);
      const isRestDay = !isScheduled && !isCompleted;
      const isMissedScheduled =
        !isFuture && !isToday && isScheduled && !isCompleted && dateStr >= earliestDateStr;
      const streakMeta = streakDayMap.get(dateStr) || null;

      if (inCurrentMonth) {
        if (isCompleted) mCompleted += 1;
        if (isScheduled && !isFuture && dateStr >= earliestDateStr) {
          mScheduledElapsed += 1;
        }
        if (streakMeta && streakMeta.streakLength >= 2) {
          monthStreakIds.add(streakMeta.streakId);
        }
      }

      const cell: CalendarDayCell = {
        date: dateStr,
        dayNumber: gridCursor.getDate(),
        inCurrentMonth,
        dayOfWeek,
        isToday,
        isFuture,
        isScheduled,
        isCompleted,
        isMissedScheduled,
        isRestDay,
        streakMeta,
        log,
        isRibbonStart: false,
        isRibbonEnd: false,
      };
      cells.push(cell);
      byDate.set(dateStr, cell);
      gridCursor.setDate(gridCursor.getDate() + 1);
    }

    // Group into 7-day weeks and compute visual ribbon start/end boundaries per row
    const weekRows: CalendarDayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      const row = cells.slice(i, i + 7);
      for (let col = 0; col < row.length; col++) {
        const curr = row[col];
        if (!curr.inCurrentMonth || !curr.streakMeta || curr.streakMeta.streakLength < 2) {
          continue;
        }
        const prev = col > 0 ? row[col - 1] : null;
        const next = col < row.length - 1 ? row[col + 1] : null;

        const samePrev =
          prev &&
          prev.inCurrentMonth &&
          prev.streakMeta?.streakId === curr.streakMeta.streakId &&
          prev.streakMeta.streakLength >= 2;
        const sameNext =
          next &&
          next.inCurrentMonth &&
          next.streakMeta?.streakId === curr.streakMeta.streakId &&
          next.streakMeta.streakLength >= 2;

        curr.isRibbonStart = !samePrev;
        curr.isRibbonEnd = !sameNext;
      }
      weekRows.push(row);
    }

    const streaksInMonth = allStreaks
      .filter((s) => monthStreakIds.has(s.id))
      .sort((a, b) => (a.endDate < b.endDate ? 1 : -1));
    const maxMonthStreak = streaksInMonth.reduce((max, s) => Math.max(max, s.completedDays), 0);
    const adherence =
      mScheduledElapsed > 0
        ? Math.min(100, Math.round((mCompleted / mScheduledElapsed) * 100))
        : 0;

    return {
      weeks: weekRows,
      monthCompletedCount: mCompleted,
      monthScheduledElapsedCount: mScheduledElapsed,
      monthAdherenceRate: adherence,
      monthStreaks: streaksInMonth,
      bestMonthStreak: maxMonthStreak,
      dayCellMap: byDate,
      earliestAllowedMonth: earliestMonthObj,
    };
  }, [targetHabit, logs, viewMonth, todayStr, todayAnchor]);

  const canGoPrev =
    viewMonth.year > earliestAllowedMonth.year ||
    (viewMonth.year === earliestAllowedMonth.year &&
      viewMonth.month > earliestAllowedMonth.month);

  const canGoNext =
    viewMonth.year < todayAnchor.getFullYear() ||
    (viewMonth.year === todayAnchor.getFullYear() && viewMonth.month < todayAnchor.getMonth());

  const handleStepMonth = (delta: -1 | 1) => {
    setHighlightedStreakId(null);
    setViewMonth((prev) => {
      const nextDate = new Date(prev.year, prev.month + delta, 1, 12, 0, 0);
      return { year: nextDate.getFullYear(), month: nextDate.getMonth() };
    });
  };

  const handleJumpToday = () => {
    setHighlightedStreakId(null);
    setViewMonth({ year: todayAnchor.getFullYear(), month: todayAnchor.getMonth() });
    setSelectedDayStr(todayStr);
  };

  const inspectedCell = selectedDayStr ? dayCellMap.get(selectedDayStr) || null : null;

  return (
    <section
      aria-label="Vista de calendario mensual por hábito"
      className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]"
    >
      {/* Header & Habit Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#ececec] dark:border-[#252e3a]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#059669] dark:text-[#34d399] shrink-0" />
            <h2 className="text-[18px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
              Calendario mensual · Días completados y rachas
            </h2>
          </div>
          {targetHabit && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#17191c] dark:text-[#f1f5f9]">
                <span
                  className="w-5 h-5 rounded-md inline-flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `rgba(${bioTheme.rgb}, 0.14)`,
                    color: 'var(--bio-text)',
                    ...bioTheme.cssVars,
                  }}
                >
                  <CategoryIcon name={category.iconName} className="w-3.5 h-3.5" />
                </span>
                <span>{category.name}</span>
              </span>
              {!targetHabit.isActive && (
                <span className="inline-flex items-center gap-1 text-[11.5px] px-2 py-0.5 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] text-[#777b86] dark:text-[#9aa4b2]">
                  <PauseCircle className="w-3 h-3" />
                  En pausa
                </span>
              )}
              <span aria-hidden="true" className="text-[#a3a6af] dark:text-[#6f7a8a]">·</span>
              <span className="tabular-nums">
                Racha actual:{' '}
                <strong className="font-medium text-[#EA580C] dark:text-[#fb923c]">
                  {targetHabit.currentStreak}d
                </strong>
              </span>
              <span aria-hidden="true" className="text-[#a3a6af] dark:text-[#6f7a8a]">·</span>
              <span className="tabular-nums">
                Récord:{' '}
                <strong className="font-medium text-[#4F46E5] dark:text-[#a5b4fc]">
                  {targetHabit.bestStreak}d
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Specific Habit Dropdown */}
        {availableHabits.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto">
            <select
              aria-label="Seleccionar hábito para el calendario mensual"
              value={activeHabitId}
              onChange={(e) => {
                const nextId = e.target.value;
                setLocalHabitId(nextId);
                setHighlightedStreakId(null);
                if (selectedHabitId !== 'all' && onSelectHabit) {
                  onSelectHabit(nextId);
                }
              }}
              className="w-full sm:w-auto max-w-full min-w-0 px-3.5 py-2 rounded-full bg-[#fafafb] dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] text-[13px] focus:outline-none focus:border-[#059669] dark:focus:border-[#34d399] cursor-pointer"
            >
              {availableHabits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title} {h.isActive ? '' : '(Pausado)'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!targetHabit ? (
        <div className="py-12 text-center text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
          Crea o activa un hábito para visualizar su calendario mensual y rachas pasadas.
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {/* Month Navigation + Monthly KPI Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => handleStepMonth(-1)}
                aria-label="Mes anterior"
                className="w-9 h-9 rounded-full border border-[#ececec] dark:border-[#252e3a] bg-[#fafafb] dark:bg-[#1b222b] hover:bg-[#f2f2f3] dark:hover:bg-[#252e3a] disabled:opacity-35 text-[#17191c] dark:text-[#f1f5f9] flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <h3 className="font-signifier font-normal text-[21px] sm:text-[23px] text-[#17191c] dark:text-[#f1f5f9] min-w-[165px] text-center">
                {MONTH_NAMES_ES[viewMonth.month]} {viewMonth.year}
              </h3>

              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => handleStepMonth(1)}
                aria-label="Mes siguiente"
                className="w-9 h-9 rounded-full border border-[#ececec] dark:border-[#252e3a] bg-[#fafafb] dark:bg-[#1b222b] hover:bg-[#f2f2f3] dark:hover:bg-[#252e3a] disabled:opacity-35 text-[#17191c] dark:text-[#f1f5f9] flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {!isViewingCurrentMonth && (
                <button
                  type="button"
                  onClick={handleJumpToday}
                  className="ml-1 px-3 py-1.5 rounded-full text-[12px] font-medium bg-[#ECFDF5] dark:bg-[#059669]/20 text-[#047857] dark:text-[#34d399] hover:bg-[#D1FAE5] dark:hover:bg-[#059669]/30 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Hoy
                </button>
              )}
            </div>

            {/* Monthly Stats Summary */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] tabular-nums">
              <span className="text-[#777b86] dark:text-[#9aa4b2]">
                Completados:{' '}
                <strong className="font-medium text-[#059669] dark:text-[#34d399]">
                  {monthCompletedCount}/{monthScheduledElapsedCount}
                </strong>{' '}
                <span className="text-[12px]">({monthAdherenceRate}%)</span>
              </span>
              <span className="text-[#777b86] dark:text-[#9aa4b2] inline-flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#EA580C] dark:text-[#fb923c] shrink-0" />
                Mejor racha del mes:{' '}
                <strong className="font-medium text-[#17191c] dark:text-[#f1f5f9]">
                  {bestMonthStreak}d
                </strong>
              </span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="rounded-[20px] border border-[#ececec] dark:border-[#252e3a] bg-[#fafafb]/60 dark:bg-[#101419]/60 p-2.5 sm:p-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAY_HEADERS.map((wd) => (
                <div
                  key={wd}
                  className="text-center text-[11px] font-medium uppercase tracking-[0.05em] text-[#777b86] dark:text-[#9aa4b2] py-1"
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="space-y-1.5">
              {weeks.map((row, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-7">
                  {row.map((cell) => {
                    const isPartOfMultiStreak =
                      cell.inCurrentMonth &&
                      Boolean(cell.streakMeta) &&
                      (cell.streakMeta?.streakLength ?? 0) >= 2;
                    const isHighlightedStreak =
                      Boolean(highlightedStreakId) &&
                      cell.streakMeta?.streakId === highlightedStreakId;
                    const isSelected = selectedDayStr === cell.date;

                    const ribbonBg = isPartOfMultiStreak
                      ? isHighlightedStreak
                        ? isDark
                          ? 'rgba(251, 146, 60, 0.24)'
                          : 'rgba(234, 88, 12, 0.16)'
                        : isDark
                        ? 'rgba(16, 185, 129, 0.18)'
                        : 'rgba(5, 150, 105, 0.12)'
                      : 'transparent';

                    return (
                      <div
                        key={cell.date}
                        className={`relative flex items-center justify-center py-1 ${
                          cell.isRibbonStart ? 'rounded-l-full' : ''
                        } ${cell.isRibbonEnd ? 'rounded-r-full' : ''}`}
                        style={{ backgroundColor: ribbonBg }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedDayStr((prev) => (prev === cell.date ? null : cell.date))
                          }
                          aria-label={`${cell.dayNumber} de ${MONTH_NAMES_ES[viewMonth.month]}: ${
                            cell.isCompleted
                              ? `Completado${
                                  cell.streakMeta
                                    ? ` (día ${cell.streakMeta.positionInStreak} de racha de ${cell.streakMeta.streakLength} días)`
                                    : ''
                                }`
                              : cell.streakMeta?.isBridgeRestDay
                              ? 'Día de descanso dentro de la racha'
                              : cell.isMissedScheduled
                              ? 'Día programado no completado'
                              : cell.isFuture
                              ? 'Día futuro'
                              : 'Día de descanso'
                          }`}
                          className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex flex-col items-center justify-center text-[13px] tabular-nums transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] ${
                            !cell.inCurrentMonth
                              ? 'opacity-30 text-[#979799] dark:text-[#6f7a8a] hover:opacity-60'
                              : cell.isCompleted
                              ? isHighlightedStreak
                                ? 'bg-[#EA580C] dark:bg-[#fb923c] text-white dark:text-[#0c0f12] font-semibold shadow-sm'
                                : 'bg-[#059669] dark:bg-[#10b981] text-white font-semibold shadow-xs'
                              : cell.streakMeta?.isBridgeRestDay
                              ? 'bg-white/70 dark:bg-[#141920]/80 border border-dashed border-[#059669]/45 dark:border-[#34d399]/45 text-[#047857] dark:text-[#6ee7b7] font-medium'
                              : cell.isMissedScheduled
                              ? 'bg-white dark:bg-[#141920] border border-[#f59e0b]/40 dark:border-[#fbbf24]/30 text-[#777b86] dark:text-[#9aa4b2] hover:border-[#d97706]'
                              : cell.isFuture
                              ? 'text-[#a3a6af] dark:text-[#475569]'
                              : 'text-[#777b86] dark:text-[#9aa4b2] hover:bg-white dark:hover:bg-[#1b222b]'
                          } ${
                            cell.isToday
                              ? 'ring-2 ring-[#4F46E5] dark:ring-[#818cf8] ring-offset-2 ring-offset-white dark:ring-offset-[#101419]'
                              : ''
                          } ${
                            isSelected && !cell.isToday
                              ? 'ring-2 ring-[#17191c] dark:ring-[#f1f5f9] ring-offset-1 ring-offset-white dark:ring-offset-[#101419]'
                              : ''
                          }`}
                        >
                          <span className="leading-none">{cell.dayNumber}</span>

                          {cell.inCurrentMonth && cell.isCompleted && (
                            <Check className="w-2.5 h-2.5 stroke-[3] mt-0.5 opacity-95" />
                          )}

                          {cell.inCurrentMonth && !cell.isCompleted && cell.isMissedScheduled && (
                            <span
                              aria-hidden="true"
                              className="w-1 h-1 rounded-full bg-[#D97706] dark:bg-[#fbbf24] mt-0.5"
                            />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[#777b86] dark:text-[#9aa4b2]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#059669] dark:bg-[#10b981] inline-flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
              </span>
              <span>Día completado</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-6 h-3 rounded-full bg-[#059669]/20 dark:bg-[#10b981]/25 border border-[#059669]/35 dark:border-[#34d399]/35" />
              <span>Racha continua</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full border border-dashed border-[#059669]/55 dark:border-[#34d399]/55" />
              <span>Descanso en racha</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full border border-[#f59e0b]/55 bg-white dark:bg-[#141920] inline-flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-[#D97706] dark:bg-[#fbbf24]" />
              </span>
              <span>Día programado omitido</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full ring-2 ring-[#4F46E5] dark:ring-[#818cf8]" />
              <span>Hoy</span>
            </span>
          </div>

          {/* Past & Active Streaks Detected in this Month */}
          <div className="pt-3.5 border-t border-[#ececec] dark:border-[#252e3a] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12.5px] font-medium text-[#17191c] dark:text-[#f1f5f9] inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#EA580C] dark:text-[#fb923c]" />
                Rachas en {MONTH_NAMES_ES[viewMonth.month]}
              </span>
              {highlightedStreakId && (
                <button
                  type="button"
                  onClick={() => setHighlightedStreakId(null)}
                  className="text-[11.5px] text-[#059669] dark:text-[#34d399] hover:underline cursor-pointer"
                >
                  Quitar resaltado
                </button>
              )}
            </div>

            {monthStreaks.length === 0 ? (
              <p className="text-[12.5px] text-[#777b86] dark:text-[#9aa4b2]">
                No se registraron rachas de 2 o más días durante {MONTH_NAMES_ES[viewMonth.month].toLowerCase()}.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {monthStreaks.map((st) => {
                  const isHighlighted = highlightedStreakId === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setHighlightedStreakId((prev) => (prev === st.id ? null : st.id));
                        setSelectedDayStr(st.endDate);
                      }}
                      className={`px-3 py-1.5 rounded-full text-[12px] tabular-nums inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-[#FFF7ED] dark:bg-[#EA580C]/20 border-[#EA580C] dark:border-[#fb923c] text-[#9A3412] dark:text-[#fdba74] font-medium'
                          : st.isCurrent
                          ? 'bg-[#ECFDF5] dark:bg-[#059669]/15 border-[#059669]/35 dark:border-[#34d399]/35 text-[#047857] dark:text-[#34d399]'
                          : 'bg-[#fafafb] dark:bg-[#1b222b] border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] hover:border-[#EA580C]/50'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-[#EA580C] dark:text-[#fb923c] shrink-0" />
                      <span className="font-medium">{st.completedDays} días</span>
                      <span className="text-[#777b86] dark:text-[#9aa4b2]">
                        ({formatShortDateEs(st.startDate)} – {formatShortDateEs(st.endDate)})
                      </span>
                      {st.isCurrent && (
                        <span className="text-[10.5px] font-semibold uppercase tracking-wide">
                          · Activa
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Day Inspector */}
          {inspectedCell && (
            <div className="rounded-[16px] px-4 py-3 bg-[#fafafb] dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[13px]">
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium text-[#17191c] dark:text-[#f1f5f9]">
                  {WEEKDAY_FULL_ES[inspectedCell.dayOfWeek - 1]}, {formatShortDateEs(inspectedCell.date)}
                  {inspectedCell.isToday && (
                    <span className="ml-1.5 text-[12px] text-[#4F46E5] dark:text-[#a5b4fc]">
                      · Hoy
                    </span>
                  )}
                </p>
                <p className="text-[#777b86] dark:text-[#9aa4b2] text-[12.5px]">
                  {inspectedCell.isCompleted
                    ? `Completado (${inspectedCell.log?.completedValue ?? targetHabit.targetValue}/${targetHabit.targetValue} ${targetHabit.unitLabel})`
                    : inspectedCell.streakMeta?.isBridgeRestDay
                    ? 'Día de descanso programado (mantiene la continuidad de la racha)'
                    : inspectedCell.isMissedScheduled
                    ? 'Día programado sin registro de cumplimiento'
                    : inspectedCell.isFuture
                    ? inspectedCell.isScheduled
                      ? 'Día programado próximo'
                      : 'Día de descanso próximo'
                    : 'Día de descanso programado'}
                  {inspectedCell.log?.journalEntry && (
                    <span className="block italic text-[#5c616d] dark:text-[#cbd5e1] mt-0.5">
                      “{inspectedCell.log.journalEntry}”
                    </span>
                  )}
                </p>
              </div>

              {inspectedCell.streakMeta && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] dark:bg-[#059669]/20 text-[#047857] dark:text-[#34d399] text-[12px] font-medium whitespace-nowrap shrink-0 self-start sm:self-center tabular-nums">
                  <Flame className="w-3.5 h-3.5 text-[#EA580C] dark:text-[#fb923c] shrink-0" />
                  {inspectedCell.streakMeta.isBridgeRestDay
                    ? `Racha de ${inspectedCell.streakMeta.streakLength} días`
                    : `Día ${inspectedCell.streakMeta.positionInStreak} de ${inspectedCell.streakMeta.streakLength} en racha`}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
