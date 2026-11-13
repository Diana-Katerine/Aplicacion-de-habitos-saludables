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
      className="rounded-[24px] p-6 bg-white border border-[#ececec]"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-[18px] font-medium text-[#17191c] tracking-[-0.01em] flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-[#5d2a1a] shrink-0" />
            <span>Comparador mensual de constancia</span>
          </h2>
          <p className="text-[14px] text-[#777b86] mt-0.5">
            Superposición diaria entre <strong className="font-medium text-[#17191c]">{currentMonthLabel}</strong> y{' '}
            <strong className="font-medium text-[#777b86]">{prevMonthLabel}</strong> (días 1 al {currentDayOfMonth}).
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] shrink-0 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setOverlayMode('rate')}
            className={`px-3.5 py-1 rounded-full text-[12px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              overlayMode === 'rate'
                ? 'bg-white text-[#17191c] font-medium shadow-xs'
                : 'text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            Tasa diaria (%)
          </button>
          <button
            type="button"
            onClick={() => setOverlayMode('cumulative')}
            className={`px-3.5 py-1 rounded-full text-[12px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              overlayMode === 'cumulative'
                ? 'bg-white text-[#17191c] font-medium shadow-xs'
                : 'text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            Acumulado (check-ins)
          </button>
        </div>
      </div>

      {/* Comparison Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 mb-5 border-y border-[#ececec]">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-[#777b86]">
            <span className="w-3.5 h-0.5 bg-[#5d2a1a] inline-block rounded-full" />
            <span>{currentMonthLabel} (días 1–{currentDayOfMonth})</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-[28px] leading-none font-medium text-[#17191c] tabular-nums">
              {currentToDateRate}%
            </span>
            <span className="text-[13px] text-[#777b86] tabular-nums">
              {currentCompletedTotal}/{currentScheduledTotal} check-ins
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-[12px] text-[#777b86]">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#a3a6af] inline-block" />
            <span>{prevMonthLabel} (días 1–{currentDayOfMonth})</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-[28px] leading-none font-medium text-[#777b86] tabular-nums">
              {prevToDateRate}%
            </span>
            <span className="text-[13px] text-[#979799] tabular-nums">
              {prevToDateCompleted}/{prevToDateScheduled} · mes {prevFullRate}%
            </span>
          </div>
        </div>

        <div>
          <span className="text-[12px] text-[#777b86] block">
            Variación de constancia
          </span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span
              className={`text-[28px] leading-none font-medium tabular-nums inline-flex items-center gap-1.5 ${
                deltaPositive
                  ? 'text-[#5d2a1a]'
                  : deltaNegative
                  ? 'text-[#777b86]'
                  : 'text-[#17191c]'
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
            <span className="text-[13px] text-[#777b86]">
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
          <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="steepCurrentMonthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbe1d1" stopOpacity={0.75} />
                <stop offset="95%" stopColor="#fbe1d1" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="steepPrevMonthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a3a6af" stopOpacity={0.14} />
                <stop offset="95%" stopColor="#a3a6af" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(23,25,28,0.06)" vertical={false} />
            <XAxis
              dataKey="dayLabel"
              stroke="#a3a6af"
              tick={{ fill: '#777b86', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#ececec' }}
              interval={2}
            />
            <YAxis
              stroke="#a3a6af"
              tick={{ fill: '#777b86', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={overlayMode === 'rate' ? [0, 100] : [0, 'auto']}
              unit={overlayMode === 'rate' ? '%' : ''}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(23,25,28,0.18)', strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload as DayComparisonPoint;
                const dayDiff =
                  pt.currentRate !== null && pt.prevRate !== null
                    ? pt.currentRate - pt.prevRate
                    : null;

                return (
                  <div className="steep-popover px-3.5 py-2.5 text-[12px] space-y-1">
                    <p className="font-medium text-[#17191c]">Día {pt.day} del mes</p>
                    {pt.currentRate !== null ? (
                      <p className="text-[#5d2a1a] font-medium tabular-nums">
                        {currentMonthLabel}:{' '}
                        {overlayMode === 'rate'
                          ? `${pt.currentRate}% (${pt.currentCompleted}/${pt.currentScheduled})`
                          : `${pt.currentCumulative} acumulados (${pt.currentCompleted} hoy)`}
                      </p>
                    ) : (
                      <p className="text-[#979799]">{currentMonthLabel}: Pendiente</p>
                    )}

                    {pt.prevRate !== null && (
                      <p className="text-[#777b86] tabular-nums">
                        {prevMonthLabel}:{' '}
                        {overlayMode === 'rate'
                          ? `${pt.prevRate}% (${pt.prevCompleted}/${pt.prevScheduled})`
                          : `${pt.prevCumulative} acumulados (${pt.prevCompleted} ese día)`}
                      </p>
                    )}

                    {overlayMode === 'rate' && dayDiff !== null && (
                      <p className="text-[11px] font-medium text-[#17191c] tabular-nums pt-0.5">
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
              stroke="#a3a6af"
              strokeWidth={1.8}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#steepPrevMonthGrad)"
              connectNulls={false}
              activeDot={{ r: 4, fill: '#777b86', stroke: '#ffffff', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey={overlayMode === 'rate' ? 'currentRate' : 'currentCumulative'}
              name={currentMonthLabel}
              stroke="#5d2a1a"
              strokeWidth={2.2}
              fillOpacity={1}
              fill="url(#steepCurrentMonthGrad)"
              connectNulls={false}
              activeDot={{ r: 5, fill: '#5d2a1a', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
