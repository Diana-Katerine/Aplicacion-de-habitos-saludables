import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { DayOfWeek, Habit, HabitLog } from '../../types';
import { formatDate, getDayOfWeek, getTodayDateString } from '../../services/storage';

interface Props {
  habits: Habit[];
  logs: HabitLog[];
  selectedHabitId: string | 'all';
  timezone?: string;
  isDark?: boolean;
}

type DateRangePreset = '1m' | '3m' | 'custom';

interface WeeklyAdherenceDatum {
  key: string;
  weekLabel: string;
  rangeLabel: string;
  adherenceRate: number;
  historicalMean: number;
  deltaVsMean: number;
  completed: number;
  scheduled: number;
  isCurrentWeek: boolean;
}

const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function parseIsoAnchor(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

function formatShortSpanishDate(d: Date): string {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

function subtractMonthsIso(anchor: Date, months: number): string {
  const d = new Date(anchor);
  d.setMonth(d.getMonth() - months);
  return formatDate(d);
}

export const WeeklyAdherenceBarChart: React.FC<Props> = ({
  habits,
  logs,
  selectedHabitId,
  timezone,
  isDark = false,
}) => {
  const todayStr = useMemo(() => getTodayDateString(timezone), [timezone]);
  const defaultOneMonthAgo = useMemo(
    () => subtractMonthsIso(parseIsoAnchor(todayStr), 1),
    [todayStr]
  );

  const [rangePreset, setRangePreset] = useState<DateRangePreset>('3m');
  const [customStart, setCustomStart] = useState<string>(defaultOneMonthAgo);
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  useEffect(() => {
    setCustomEnd((prev) => (prev > todayStr ? todayStr : prev));
  }, [todayStr]);

  const {
    weeklyData,
    historicalMean,
    latestWeekRate,
    latestWeekCompleted,
    latestWeekScheduled,
    latestIsCurrentWeek,
    periodRate,
    periodCompleted,
    periodScheduled,
    deltaVsHistorical,
    weeksBeatMean,
    activeRangeLabel,
  } = useMemo(() => {
    const todayAnchor = parseIsoAnchor(todayStr);

    let effectiveStartStr: string;
    let effectiveEndStr: string;

    if (rangePreset === '1m') {
      effectiveStartStr = subtractMonthsIso(todayAnchor, 1);
      effectiveEndStr = todayStr;
    } else if (rangePreset === '3m') {
      effectiveStartStr = subtractMonthsIso(todayAnchor, 3);
      effectiveEndStr = todayStr;
    } else {
      const safeStart = customStart || defaultOneMonthAgo;
      const safeEnd = customEnd || todayStr;
      const orderedStart = safeStart <= safeEnd ? safeStart : safeEnd;
      const orderedEnd = safeEnd >= safeStart ? safeEnd : safeStart;
      effectiveStartStr = orderedStart > todayStr ? todayStr : orderedStart;
      effectiveEndStr = orderedEnd > todayStr ? todayStr : orderedEnd;
    }

    const startAnchor = parseIsoAnchor(effectiveStartStr);
    const endAnchor = parseIsoAnchor(effectiveEndStr);
    const rangeLabelText = `${formatShortSpanishDate(startAnchor)} – ${
      effectiveEndStr === todayStr ? 'Hoy' : formatShortSpanishDate(endAnchor)
    }`;

    const targetHabits =
      selectedHabitId === 'all'
        ? habits.filter((h) => h.isActive && !h.deletedAt)
        : habits.filter((h) => h.id === selectedHabitId && !h.deletedAt);

    if (targetHabits.length === 0) {
      return {
        weeklyData: [] as WeeklyAdherenceDatum[],
        historicalMean: 0,
        latestWeekRate: 0,
        latestWeekCompleted: 0,
        latestWeekScheduled: 0,
        latestIsCurrentWeek: true,
        periodRate: 0,
        periodCompleted: 0,
        periodScheduled: 0,
        deltaVsHistorical: 0,
        weeksBeatMean: 0,
        activeRangeLabel: rangeLabelText,
      };
    }

    const targetHabitIds = new Set(targetHabits.map((h) => h.id));
    const completedByDate = new Map<string, Set<string>>();
    const earliestLogByHabit = new Map<string, string>();

    logs.forEach((log) => {
      if (!targetHabitIds.has(log.habitId)) return;
      const prevEarliest = earliestLogByHabit.get(log.habitId);
      if (!prevEarliest || log.logDate < prevEarliest) {
        earliestLogByHabit.set(log.habitId, log.logDate);
      }
      if (!log.isCompleted) return;
      const set = completedByDate.get(log.logDate) || new Set<string>();
      set.add(log.habitId);
      completedByDate.set(log.logDate, set);
    });

    const activeSinceByHabit = new Map<string, string>();
    let globalEarliestDate = todayStr;

    targetHabits.forEach((h) => {
      const createdDate = h.createdAt ? h.createdAt.slice(0, 10) : todayStr;
      const firstLog = earliestLogByHabit.get(h.id);
      const since = firstLog && firstLog < createdDate ? firstLog : createdDate;
      activeSinceByHabit.set(h.id, since);
      if (since < globalEarliestDate) {
        globalEarliestDate = since;
      }
    });

    // Compute true historical mean across all elapsed days since the user's earliest habit record
    const earliestAnchor = parseIsoAnchor(globalEarliestDate);
    const maxLookback = new Date(todayAnchor);
    maxLookback.setDate(todayAnchor.getDate() - 365);
    const historyStart = earliestAnchor > maxLookback ? earliestAnchor : maxLookback;

    let histCompleted = 0;
    let histScheduled = 0;
    const histCursor = new Date(historyStart);
    while (formatDate(histCursor) <= todayStr) {
      const dateStr = formatDate(histCursor);
      const dayNum = getDayOfWeek(histCursor) as DayOfWeek;
      const completedSet = completedByDate.get(dateStr);

      targetHabits.forEach((h) => {
        const since = activeSinceByHabit.get(h.id) || todayStr;
        if (dateStr >= since && h.scheduledDays.includes(dayNum)) {
          histScheduled += 1;
          if (completedSet?.has(h.id)) {
            histCompleted += 1;
          }
        }
      });

      histCursor.setDate(histCursor.getDate() + 1);
    }

    const histMean =
      histScheduled > 0 ? Math.min(100, Math.round((histCompleted / histScheduled) * 100)) : 0;

    // Identify current week Monday so we can highlight it cleanly when present in range
    const todayDayNum = getDayOfWeek(todayAnchor);
    const currentWeekMonday = new Date(todayAnchor);
    currentWeekMonday.setDate(todayAnchor.getDate() - (todayDayNum - 1));
    const currentWeekMondayStr = formatDate(currentWeekMonday);

    // Start iterating from the Monday of effectiveStartStr through effectiveEndStr
    const startDayNum = getDayOfWeek(startAnchor);
    const weekCursorMonday = new Date(startAnchor);
    weekCursorMonday.setDate(startAnchor.getDate() - (startDayNum - 1));

    const rawWeeks: WeeklyAdherenceDatum[] = [];
    let sumPeriodCompleted = 0;
    let sumPeriodScheduled = 0;

    while (formatDate(weekCursorMonday) <= effectiveEndStr) {
      const weekMonday = new Date(weekCursorMonday);
      const weekMondayStr = formatDate(weekMonday);
      const isCurrentWeek = weekMondayStr === currentWeekMondayStr;

      let completed = 0;
      let scheduled = 0;
      let firstIncludedDay: Date | null = null;
      let lastIncludedDay: Date | null = null;

      for (let i = 0; i < 7; i++) {
        const day = new Date(weekMonday);
        day.setDate(weekMonday.getDate() + i);
        const dateStr = formatDate(day);
        if (dateStr < effectiveStartStr || dateStr > effectiveEndStr || dateStr > todayStr) {
          continue;
        }

        if (!firstIncludedDay) firstIncludedDay = new Date(day);
        lastIncludedDay = new Date(day);

        const dayNum = (i + 1) as DayOfWeek;
        const completedSet = completedByDate.get(dateStr);

        targetHabits.forEach((h) => {
          const since = activeSinceByHabit.get(h.id) || todayStr;
          if (dateStr >= since && h.scheduledDays.includes(dayNum)) {
            scheduled += 1;
            if (completedSet?.has(h.id)) {
              completed += 1;
            }
          }
        });
      }

      weekCursorMonday.setDate(weekCursorMonday.getDate() + 7);

      if (scheduled === 0 && !isCurrentWeek) {
        continue;
      }
      if (!firstIncludedDay || !lastIncludedDay) {
        continue;
      }

      sumPeriodCompleted += completed;
      sumPeriodScheduled += scheduled;

      const rate = scheduled > 0 ? Math.min(100, Math.round((completed / scheduled) * 100)) : 0;
      const startLabel = formatShortSpanishDate(firstIncludedDay);
      const endLabel =
        formatDate(lastIncludedDay) === todayStr && isCurrentWeek
          ? 'Hoy (en curso)'
          : formatShortSpanishDate(lastIncludedDay);

      rawWeeks.push({
        key: weekMondayStr,
        weekLabel: isCurrentWeek ? 'Actual' : formatShortSpanishDate(firstIncludedDay),
        rangeLabel: startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`,
        adherenceRate: rate,
        historicalMean: histMean,
        deltaVsMean: rate - histMean,
        completed,
        scheduled,
        isCurrentWeek,
      });
    }

    const latest = rawWeeks[rawWeeks.length - 1];
    const latestRate = latest ? latest.adherenceRate : 0;
    const latestComp = latest ? latest.completed : 0;
    const latestSched = latest ? latest.scheduled : 0;
    const periodAvg =
      sumPeriodScheduled > 0
        ? Math.min(100, Math.round((sumPeriodCompleted / sumPeriodScheduled) * 100))
        : 0;
    const beatCount = rawWeeks.filter(
      (item) => item.adherenceRate >= histMean && item.scheduled > 0
    ).length;

    return {
      weeklyData: rawWeeks,
      historicalMean: histMean,
      latestWeekRate: latestRate,
      latestWeekCompleted: latestComp,
      latestWeekScheduled: latestSched,
      latestIsCurrentWeek: Boolean(latest?.isCurrentWeek),
      periodRate: periodAvg,
      periodCompleted: sumPeriodCompleted,
      periodScheduled: sumPeriodScheduled,
      deltaVsHistorical: latestRate - histMean,
      weeksBeatMean: beatCount,
      activeRangeLabel: rangeLabelText,
    };
  }, [habits, logs, selectedHabitId, todayStr, rangePreset, customStart, customEnd, defaultOneMonthAgo]);

  const currentGradientId = 'rechartsWeeklyCurrentGrad';
  const aboveMeanGradientId = 'rechartsWeeklyAboveMeanGrad';
  const belowMeanGradientId = 'rechartsWeeklyBelowMeanGrad';

  const deltaLabel =
    deltaVsHistorical > 0
      ? `+${deltaVsHistorical} pts vs. media`
      : deltaVsHistorical < 0
      ? `${deltaVsHistorical} pts vs. media`
      : 'Igual a tu media';

  return (
    <section
      aria-label="Adherencia semanal frente a media histórica"
      className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]"
    >
      {/* Header & Range Controls */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#4F46E5] dark:text-[#818cf8] shrink-0" />
            <h2 className="text-[18px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
              Adherencia semana a semana · Actual vs. media histórica
            </h2>
          </div>

          <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-1.5 tabular-nums flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              {latestIsCurrentWeek ? 'Semana actual' : 'Última semana'}:{' '}
              <strong className="font-medium text-[#059669] dark:text-[#34d399]">
                {latestWeekRate}%
              </strong>{' '}
              <span className="text-[#979799] dark:text-[#6f7a8a]">
                ({latestWeekCompleted}/{latestWeekScheduled})
              </span>
            </span>
            <span aria-hidden="true" className="text-[#a3a6af] dark:text-[#6f7a8a]">·</span>
            <span>
              Media del rango:{' '}
              <strong className="font-medium text-[#0284C7] dark:text-[#38bdf8]">
                {periodRate}%
              </strong>{' '}
              <span className="text-[#979799] dark:text-[#6f7a8a]">
                ({periodCompleted}/{periodScheduled})
              </span>
            </span>
            <span aria-hidden="true" className="text-[#a3a6af] dark:text-[#6f7a8a]">·</span>
            <span>
              Media histórica:{' '}
              <strong className="font-medium text-[#4F46E5] dark:text-[#a5b4fc]">
                {historicalMean}%
              </strong>
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium ${
                deltaVsHistorical > 0
                  ? 'bg-[#D1FAE5]/80 dark:bg-[#059669]/20 text-[#047857] dark:text-[#34d399]'
                  : deltaVsHistorical < 0
                  ? 'bg-[#FEF3C7]/80 dark:bg-[#D97706]/20 text-[#B45309] dark:text-[#fbbf24]'
                  : 'bg-[#EEF2FF] dark:bg-[#4F46E5]/20 text-[#4338CA] dark:text-[#c7d2fe]'
              }`}
            >
              {deltaLabel}
            </span>
          </p>
        </div>

        {/* Date Range Preset Buttons */}
        <div className="flex flex-col items-start lg:items-end gap-2 shrink-0 max-w-full">
          <div
            role="group"
            aria-label="Filtrar rango de fechas"
            className="inline-flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] max-w-full overflow-x-auto"
          >
            {(
              [
                { id: '1m', label: 'Último mes' },
                { id: '3m', label: 'Últimos 3 meses' },
                { id: 'custom', label: 'Rango de fechas' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setRangePreset(preset.id)}
                className={`px-3 py-1 rounded-full text-[12px] transition-all whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
                  rangePreset === preset.id
                    ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                    : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
                }`}
              >
                {preset.id === 'custom' && <Calendar className="w-3 h-3 shrink-0" />}
                <span>{preset.label}</span>
              </button>
            ))}
          </div>

          {rangePreset === 'custom' ? (
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <label className="inline-flex items-center gap-1.5 text-[#777b86] dark:text-[#9aa4b2]">
                <span>Desde</span>
                <input
                  type="date"
                  aria-label="Fecha inicial"
                  value={customStart}
                  max={customEnd || todayStr}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next) setCustomStart(next);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#fafafb] dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] text-[12px] tabular-nums focus:outline-none focus:border-[#4F46E5] dark:focus:border-[#818cf8] dark:[color-scheme:dark]"
                />
              </label>
              <label className="inline-flex items-center gap-1.5 text-[#777b86] dark:text-[#9aa4b2]">
                <span>Hasta</span>
                <input
                  type="date"
                  aria-label="Fecha final"
                  value={customEnd}
                  min={customStart}
                  max={todayStr}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next) setCustomEnd(next > todayStr ? todayStr : next);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#fafafb] dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] text-[12px] tabular-nums focus:outline-none focus:border-[#4F46E5] dark:focus:border-[#818cf8] dark:[color-scheme:dark]"
                />
              </label>
            </div>
          ) : (
            <span className="text-[11.5px] text-[#979799] dark:text-[#6f7a8a] tabular-nums">
              Mostrando {activeRangeLabel} ({weeklyData.length}{' '}
              {weeklyData.length === 1 ? 'semana' : 'semanas'})
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-[#777b86] dark:text-[#9aa4b2] mb-4">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[4px] bg-[#059669] dark:bg-[#34d399]" />
          <span>Semana actual</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[4px] bg-[#0284C7] dark:bg-[#38bdf8]" />
          <span>Sobre o igual a tu media ({weeksBeatMean}/{weeklyData.length})</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[4px] bg-[#94A3B8] dark:bg-[#475569]" />
          <span>Bajo tu media</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed border-[#4F46E5] dark:border-[#a5b4fc]" />
          <span>Media histórica ({historicalMean}%)</span>
        </span>
      </div>

      {weeklyData.length === 0 ? (
        <div className="py-12 text-center text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
          No hay registros de hábitos dentro del rango de fechas seleccionado ({activeRangeLabel}).
        </div>
      ) : (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyData}
              margin={{ top: 18, right: 12, left: 0, bottom: 4 }}
              barCategoryGap="22%"
            >
              <defs>
                <linearGradient id={currentGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isDark ? '#6ee7b7' : '#10B981'} />
                  <stop offset="100%" stopColor={isDark ? '#10b981' : '#059669'} />
                </linearGradient>
                <linearGradient id={aboveMeanGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isDark ? '#7dd3fc' : '#0EA5E9'} />
                  <stop offset="100%" stopColor={isDark ? '#0284C7' : '#0369A1'} />
                </linearGradient>
                <linearGradient id={belowMeanGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isDark ? '#64748b' : '#cbd5e1'} />
                  <stop offset="100%" stopColor={isDark ? '#475569' : '#94a3b8'} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? 'rgba(241,245,249,0.07)' : 'rgba(23,25,28,0.06)'}
                vertical={false}
              />

              <XAxis
                dataKey="weekLabel"
                stroke={isDark ? '#6f7a8a' : '#a3a6af'}
                tick={{ fill: isDark ? '#9aa4b2' : '#777b86', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: isDark ? '#252e3a' : '#ececec' }}
                interval="preserveStartEnd"
                minTickGap={weeklyData.length > 9 ? 14 : 6}
              />

              <YAxis
                width={38}
                stroke={isDark ? '#6f7a8a' : '#a3a6af'}
                tick={{ fill: isDark ? '#9aa4b2' : '#777b86', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                unit="%"
              />

              <Tooltip
                cursor={{
                  fill: isDark ? 'rgba(241, 245, 249, 0.05)' : 'rgba(79, 70, 229, 0.05)',
                }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as WeeklyAdherenceDatum;
                  const deltaText =
                    item.deltaVsMean > 0
                      ? `+${item.deltaVsMean} pts sobre tu media`
                      : item.deltaVsMean < 0
                      ? `${item.deltaVsMean} pts bajo tu media`
                      : 'Exacto en tu media histórica';

                  return (
                    <div className="steep-popover px-3.5 py-2.5 text-[12px] min-w-[205px]">
                      <p className="font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1">
                        {item.rangeLabel}
                      </p>
                      <div className="flex items-center justify-between gap-4 tabular-nums">
                        <span className="text-[#777b86] dark:text-[#9aa4b2]">Rendimiento:</span>
                        <span
                          className={`font-semibold ${
                            item.isCurrentWeek
                              ? 'text-[#059669] dark:text-[#34d399]'
                              : item.adherenceRate >= item.historicalMean
                              ? 'text-[#0284C7] dark:text-[#38bdf8]'
                              : 'text-[#17191c] dark:text-[#f1f5f9]'
                          }`}
                        >
                          {item.adherenceRate}% ({item.completed}/{item.scheduled})
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 tabular-nums mt-0.5">
                        <span className="text-[#777b86] dark:text-[#9aa4b2]">Media histórica:</span>
                        <span className="font-medium text-[#4F46E5] dark:text-[#a5b4fc]">
                          {item.historicalMean}%
                        </span>
                      </div>
                      <div className="mt-1.5 pt-1.5 border-t border-[#ececec] dark:border-[#252e3a] text-[11px] font-medium tabular-nums">
                        <span
                          className={
                            item.deltaVsMean >= 0
                              ? 'text-[#059669] dark:text-[#34d399]'
                              : 'text-[#D97706] dark:text-[#fbbf24]'
                          }
                        >
                          {deltaText}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />

              <ReferenceLine
                y={historicalMean}
                stroke={isDark ? '#a5b4fc' : '#4F46E5'}
                strokeWidth={2}
                strokeDasharray="5 4"
                ifOverflow="extendDomain"
                label={{
                  value: `Media ${historicalMean}%`,
                  position: 'insideTopRight',
                  fill: isDark ? '#c7d2fe' : '#4338CA',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />

              <Bar
                dataKey="adherenceRate"
                name="Adherencia semanal"
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
              >
                {weeklyData.map((entry) => {
                  const fillUrl = entry.isCurrentWeek
                    ? `url(#${currentGradientId})`
                    : entry.adherenceRate >= historicalMean
                    ? `url(#${aboveMeanGradientId})`
                    : `url(#${belowMeanGradientId})`;
                  return <Cell key={entry.key} fill={fillUrl} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};
