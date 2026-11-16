import React, { useMemo, useState } from 'react';
import { GitCompare, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Habit, HabitLog } from '../../types';
import { formatDate, getDayOfWeek, getTodayDateString } from '../../services/storage';

interface Props {
  habits: Habit[];
  logs: HabitLog[];
  selectedHabitId: string | 'all';
  timezone?: string;
  isDark?: boolean;
}

interface DayComparisonPoint {
  day: number;
  dayLabel: string;
  currentRate: number | null;
  prevRate: number | null;
  currentCompleted: number | null;
  currentScheduled: number | null;
  prevCompleted: number | null;
  prevScheduled: number | null;
  currentCumulative: number | null;
  prevCumulative: number | null;
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

function getLocalTodayParts(timezone?: string): { year: number; month: number; day: number } {
  const todayStr = getTodayDateString(timezone);
  const parts = todayStr.split('-').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return { year: parts[0], month: parts[1] - 1, day: parts[2] };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

export const MonthlyComparator: React.FC<Props> = ({
  habits,
  logs,
  selectedHabitId,
  timezone,
  isDark = false,
}) => {
  const [overlayMode, setOverlayMode] = useState<'rate' | 'cumulative'>('rate');

  const {
    chartData,
    currentMonthLabel,
    prevMonthLabel,
    currentDayOfMonth,
    currentToDateRate,
    currentCompletedTotal,
    currentScheduledTotal,
    prevToDateRate,
    prevToDateCompleted,
    prevToDateScheduled,
    prevFullRate,
    rateDelta,
  } = useMemo(() => {
    const { year: curYear, month: curMonth, day: curDay } = getLocalTodayParts(timezone);

    const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
    const prevYear = curMonth === 0 ? curYear - 1 : curYear;

    const daysInCurMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    const maxDays = Math.max(daysInCurMonth, daysInPrevMonth);

    const activeHabits = habits.filter((h) => h.isActive);
    const selectedHabit =
      selectedHabitId === 'all' ? null : habits.find((h) => h.id === selectedHabitId) || null;

    const completedByDate = new Map<string, number>();
    logs.forEach((log) => {
      if (!log.isCompleted) return;
      if (selectedHabitId !== 'all' && log.habitId !== selectedHabitId) return;
      completedByDate.set(log.logDate, (completedByDate.get(log.logDate) || 0) + 1);
    });

    const getDayMetrics = (yr: number, mo: number, dNum: number) => {
      const dateObj = new Date(yr, mo, dNum, 12, 0, 0);
      const dateStr = formatDate(dateObj);
      const dayOfWeek = getDayOfWeek(dateObj);
      const completed = completedByDate.get(dateStr) || 0;
      const scheduled = selectedHabit
        ? selectedHabit.scheduledDays.includes(dayOfWeek)
          ? 1
          : 0
        : activeHabits.filter((h) => h.scheduledDays.includes(dayOfWeek)).length;

      const rate =
        scheduled > 0
          ? Math.min(100, Math.round((completed / scheduled) * 100))
          : completed > 0
          ? 100
          : 0;

      return { completed, scheduled, rate };
    };

    const points: DayComparisonPoint[] = [];
    let curCum = 0;
    let prevCum = 0;
    let curSchedSum = 0;
    let prevToDateCompSum = 0;
    let prevToDateSchedSum = 0;
    let prevFullCompSum = 0;
    let prevFullSchedSum = 0;

    for (let d = 1; d <= maxDays; d++) {
      let currentRate: number | null = null;
      let currentCompleted: number | null = null;
      let currentScheduled: number | null = null;
      let currentCumulative: number | null = null;

      if (d <= curDay && d <= daysInCurMonth) {
        const m = getDayMetrics(curYear, curMonth, d);
        curCum += m.completed;
        curSchedSum += m.scheduled;
        currentCompleted = m.completed;
        currentScheduled = m.scheduled;
        currentRate = m.rate;
        currentCumulative = curCum;
      }

      let prevRate: number | null = null;
      let prevCompleted: number | null = null;
      let prevScheduled: number | null = null;
      let prevCumulative: number | null = null;

      if (d <= daysInPrevMonth) {
        const m = getDayMetrics(prevYear, prevMonth, d);
        prevCum += m.completed;
        prevFullCompSum += m.completed;
        prevFullSchedSum += m.scheduled;
        if (d <= curDay) {
          prevToDateCompSum += m.completed;
          prevToDateSchedSum += m.scheduled;
        }
        prevCompleted = m.completed;
        prevScheduled = m.scheduled;
        prevRate = m.rate;
        prevCumulative = prevCum;
      }

      points.push({
        day: d,
        dayLabel: `${d}`,
        currentRate,
        prevRate,
        currentCompleted,
        currentScheduled,
        prevCompleted,
        prevScheduled,
        currentCumulative,
        prevCumulative,
      });
    }

    const curRateTotal =
      curSchedSum > 0 ? Math.min(100, Math.round((curCum / curSchedSum) * 100)) : 0;
    const prevTDTotal =
      prevToDateSchedSum > 0
        ? Math.min(100, Math.round((prevToDateCompSum / prevToDateSchedSum) * 100))
        : 0;
    const prevFullTotal =
      prevFullSchedSum > 0
        ? Math.min(100, Math.round((prevFullCompSum / prevFullSchedSum) * 100))
        : 0;

    return {
      chartData: points,
      currentMonthLabel: `${MONTH_NAMES_ES[curMonth]} ${curYear}`,
      prevMonthLabel: `${MONTH_NAMES_ES[prevMonth]} ${prevYear}`,
      currentDayOfMonth: curDay,
      currentToDateRate: curRateTotal,
      currentCompletedTotal: curCum,
      currentScheduledTotal: curSchedSum,
      prevToDateRate: prevTDTotal,
      prevToDateCompleted: prevToDateCompSum,
      prevToDateScheduled: prevToDateSchedSum,
      prevFullRate: prevFullTotal,
      rateDelta: curRateTotal - prevTDTotal,
    };
  }, [habits, logs, selectedHabitId, timezone]);

  const deltaPositive = rateDelta > 0;
  const deltaNegative = rateDelta < 0;

  return (
    <section
      aria-label="Comparador mensual de completitud"
      className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h2 className="text-[18px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em] flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-[#059669] dark:text-[#34d399] shrink-0" />
            <span>Comparador mensual</span>
          </h2>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] max-w-full overflow-x-auto self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setOverlayMode('rate')}
            className={`px-3.5 py-1 rounded-full text-[12px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              overlayMode === 'rate'
                ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
            }`}
          >
            Tasa diaria (%)
          </button>
          <button
            type="button"
            onClick={() => setOverlayMode('cumulative')}
            className={`px-3.5 py-1 rounded-full text-[12px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              overlayMode === 'cumulative'
                ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
            }`}
          >
            Acumulado (check-ins)
          </button>
        </div>
      </div>

      {/* Comparison Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 mb-5 border-y border-[#ececec] dark:border-[#252e3a]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-[#777b86] dark:text-[#9aa4b2]">
            <span className="w-3.5 h-0.5 bg-[#059669] dark:bg-[#34d399] inline-block rounded-full shrink-0" />
            <span>{currentMonthLabel} (días 1–{currentDayOfMonth})</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[26px] sm:text-[28px] leading-none font-medium text-[#064E3B] dark:text-[#6ee7b7] tabular-nums">
              {currentToDateRate}%
            </span>
            <span className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] tabular-nums">
              {currentCompletedTotal}/{currentScheduledTotal} check-ins
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-[#777b86] dark:text-[#9aa4b2]">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#6366F1] dark:border-[#818cf8] inline-block shrink-0" />
            <span>{prevMonthLabel} (días 1–{currentDayOfMonth})</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[26px] sm:text-[28px] leading-none font-medium text-[#4F46E5] dark:text-[#a5b4fc] tabular-nums">
              {prevToDateRate}%
            </span>
            <span className="text-[13px] text-[#979799] dark:text-[#6f7a8a] tabular-nums">
              {prevToDateCompleted}/{prevToDateScheduled} · mes {prevFullRate}%
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <span className="text-[12px] text-[#777b86] dark:text-[#9aa4b2] block">
            Variación de constancia
          </span>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className={`text-[26px] sm:text-[28px] leading-none font-medium tabular-nums inline-flex items-center gap-1.5 ${
                deltaPositive
                  ? 'text-[#059669] dark:text-[#34d399]'
                  : deltaNegative
                  ? 'text-[#D97706] dark:text-[#fbbf24]'
                  : 'text-[#17191c] dark:text-[#f1f5f9]'
              }`}
            >
              {deltaPositive ? (
                <TrendingUp className="w-4 h-4 shrink-0" />
              ) : deltaNegative ? (
                <TrendingDown className="w-4 h-4 shrink-0" />
              ) : (
                <Minus className="w-4 h-4 shrink-0" />
              )}
              {rateDelta > 0 ? `+${rateDelta}%` : `${rateDelta}%`}
            </span>
            <span className="text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
              {deltaPositive
                ? 'Mejora frente al mes anterior'
                : deltaNegative
                ? 'Por debajo del mes anterior'
                : 'Igual que el mes anterior'}
            </span>
          </div>
        </div>
      </div>

      {/* Overlay Chart */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="steepCurrentMonthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={isDark ? 0.4 : 0.36} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="steepPrevMonthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={isDark ? 0.22 : 0.14} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? 'rgba(241,245,249,0.07)' : 'rgba(23,25,28,0.06)'}
              vertical={false}
            />
            <XAxis
              dataKey="dayLabel"
              stroke={isDark ? '#6f7a8a' : '#a3a6af'}
              tick={{ fill: isDark ? '#9aa4b2' : '#777b86', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: isDark ? '#252e3a' : '#ececec' }}
              interval="preserveStartEnd"
              minTickGap={18}
            />
            <YAxis
              width={overlayMode === 'rate' ? 38 : 28}
              stroke={isDark ? '#6f7a8a' : '#a3a6af'}
              tick={{ fill: isDark ? '#9aa4b2' : '#777b86', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={overlayMode === 'rate' ? [0, 100] : [0, 'auto']}
              unit={overlayMode === 'rate' ? '%' : ''}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(16, 185, 129, 0.3)', strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload as DayComparisonPoint;
                const dayDiff =
                  pt.currentRate !== null && pt.prevRate !== null
                    ? pt.currentRate - pt.prevRate
                    : null;

                return (
                  <div className="steep-popover px-3.5 py-2.5 text-[12px] space-y-1">
                    <p className="font-medium text-[#17191c] dark:text-[#f1f5f9]">Día {pt.day} del mes</p>
                    {pt.currentRate !== null ? (
                      <p className="text-[#059669] dark:text-[#34d399] font-medium tabular-nums">
                        {currentMonthLabel}:{' '}
                        {overlayMode === 'rate'
                          ? `${pt.currentRate}% (${pt.currentCompleted}/${pt.currentScheduled})`
                          : `${pt.currentCumulative} acumulados (${pt.currentCompleted} hoy)`}
                      </p>
                    ) : (
                      <p className="text-[#979799] dark:text-[#6f7a8a]">{currentMonthLabel}: Pendiente</p>
                    )}

                    {pt.prevRate !== null && (
                      <p className="text-[#4F46E5] dark:text-[#a5b4fc] tabular-nums">
                        {prevMonthLabel}:{' '}
                        {overlayMode === 'rate'
                          ? `${pt.prevRate}% (${pt.prevCompleted}/${pt.prevScheduled})`
                          : `${pt.prevCumulative} acumulados (${pt.prevCompleted} ese día)`}
                      </p>
                    )}

                    {overlayMode === 'rate' && dayDiff !== null && (
                      <p className="text-[11px] font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums pt-0.5">
                        Diferencia del día: {dayDiff > 0 ? `+${dayDiff}%` : `${dayDiff}%`}
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey={overlayMode === 'rate' ? 'prevRate' : 'prevCumulative'}
              name={prevMonthLabel}
              stroke={isDark ? '#818cf8' : '#6366F1'}
              strokeWidth={1.8}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#steepPrevMonthGrad)"
              connectNulls={false}
              activeDot={{
                r: 4,
                fill: isDark ? '#818cf8' : '#6366F1',
                stroke: isDark ? '#141920' : '#ffffff',
                strokeWidth: 2,
              }}
            />
            <Area
              type="monotone"
              dataKey={overlayMode === 'rate' ? 'currentRate' : 'currentCumulative'}
              name={currentMonthLabel}
              stroke={isDark ? '#34d399' : '#059669'}
              strokeWidth={2.4}
              fillOpacity={1}
              fill="url(#steepCurrentMonthGrad)"
              connectNulls={false}
              activeDot={{
                r: 5,
                fill: isDark ? '#34d399' : '#059669',
                stroke: isDark ? '#141920' : '#ffffff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
