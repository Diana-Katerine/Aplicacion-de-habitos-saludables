import React, { useMemo, useState } from 'react';
import {
  Flame,
  Activity,
  FileDown,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Habit, HabitLog, Category, DayOfWeek, EvaluatedBadge } from '../../types';
import { formatDate, getDayOfWeek } from '../../services/storage';
import { buildWeeklyReportSummary, generateWeeklyStatsPdf } from '../../services/pdfReport';
import { CategoryIcon } from '../common/CategoryIcon';
import { HistoricalStreaksHeatmap } from './HistoricalStreaksHeatmap';
import { MonthlyComparator } from './MonthlyComparator';
import { MomentumForecast } from './MomentumForecast';
import { ContextualJournalStats } from './ContextualJournalStats';
import { WeeklyAdherenceD3Chart } from './WeeklyAdherenceD3Chart';
import { StreakComparisonBarChart } from './StreakComparisonBarChart';

interface Props {
  habits: Habit[];
  logs: HabitLog[];
  categories: Category[];
  badges: EvaluatedBadge[];
  userName?: string;
  timezone?: string;
  onReportExported?: (filename: string, topCategoryName?: string, weeklyRate?: number) => void;
  onApplyReminderTime?: (habitId: string, newReminderTime: string) => void;
  isDark?: boolean;
}

export const StatsView: React.FC<Props> = ({
  habits,
  logs,
  categories,
  badges,
  userName,
  timezone,
  onReportExported,
  onApplyReminderTime,
  isDark = false,
}) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'compare' | 'forecast' | 'journal'>('overview');
  const [trendMetric, setTrendMetric] = useState<'count' | 'rate'>('count');
  const [trendChartType, setTrendChartType] = useState<'area' | 'bar'>('area');
  const [pdfExported, setPdfExported] = useState(false);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const activeHabits = habits.filter((h) => h.isActive);
  const relevantLogs = selectedHabitId === 'all'
    ? logs
    : logs.filter((l) => l.habitId === selectedHabitId);

  const dateLogMap = new Map<string, { completed: number; total: number }>();
  logs.forEach((log) => {
    if (selectedHabitId !== 'all' && log.habitId !== selectedHabitId) return;
    const current = dateLogMap.get(log.logDate) || { completed: 0, total: 0 };
    current.total += 1;
    if (log.isCompleted) current.completed += 1;
    dateLogMap.set(log.logDate, current);
  });

  const today = new Date();

  const totalCompletedChecks = relevantLogs.filter((l) => l.isCompleted).length;
  const bestStreakOverall = habits.reduce((max, h) => Math.max(max, h.bestStreak), 0);
  const currentStreakOverall = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);

  const selectedHabitObj =
    selectedHabitId === 'all' ? null : habits.find((h) => h.id === selectedHabitId) || null;

  const past30Days: {
    date: string;
    shortDate: string;
    fullDateLabel: string;
    dayLabel: string;
    completed: number;
    scheduled: number;
    rate: number;
  }[] = [];

  const shortMonthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const dayLabelsAll = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const dayNum = getDayOfWeek(d) as DayOfWeek;
    const stat = dateLogMap.get(dateStr) || { completed: 0, total: 0 };

    const scheduledOnDay = selectedHabitObj
      ? selectedHabitObj.scheduledDays.includes(dayNum)
        ? 1
        : 0
      : habits.filter((h) => h.isActive && h.scheduledDays.includes(dayNum)).length;

    const rate =
      scheduledOnDay > 0
        ? Math.min(100, Math.round((stat.completed / scheduledOnDay) * 100))
        : 0;

    past30Days.push({
      date: dateStr,
      shortDate: `${d.getDate()}/${d.getMonth() + 1}`,
      fullDateLabel: `${d.getDate()} ${shortMonthNames[d.getMonth()]}`,
      dayLabel: dayLabelsAll[dayNum - 1],
      completed: stat.completed,
      scheduled: scheduledOnDay,
      rate,
    });
  }

  const scheduledDaysIn30 = past30Days.filter((d) => d.scheduled > 0);
  const avg30DayRate =
    scheduledDaysIn30.length > 0
      ? Math.round(
          scheduledDaysIn30.reduce((sum, d) => sum + d.rate, 0) / scheduledDaysIn30.length
        )
      : 0;
  const total30DayCompletions = past30Days.reduce((sum, d) => sum + d.completed, 0);
  const avg30DayFrequency = (total30DayCompletions / 30).toFixed(1);
  const peak30DayCount = past30Days.reduce((max, d) => Math.max(max, d.completed), 0);

  const weeklySummary = useMemo(
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

  const topCategory = weeklySummary.topCategories[0] || null;

  const handleExportWeeklyPdf = () => {
    const { filename, summary } = generateWeeklyStatsPdf({
      habits,
      logs,
      categories,
      badges,
      userName,
      timezone,
    });
    setPdfExported(true);
    window.setTimeout(() => setPdfExported(false), 3000);
    onReportExported?.(
      filename,
      summary.topCategories[0]?.category.name,
      summary.weeklyRate
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#ececec] dark:border-[#252e3a]">
        <h1 className="font-signifier font-normal text-[36px] md:text-[42px] leading-[1.15] tracking-[-0.015em] text-[#17191c] dark:text-[#f1f5f9]">
          Estadísticas <em className="italic font-normal chromatic-gradient-text">&amp; Inercia</em>
        </h1>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <select
            aria-label="Filtrar por hábito"
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="w-full sm:w-auto max-w-full min-w-0 px-4 py-2 rounded-full bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] text-[13px] focus:outline-none focus:border-[#0284C7] dark:focus:border-[#38bdf8] cursor-pointer"
          >
            <option value="all">Todos los hábitos</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>
                {h.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportWeeklyPdf}
            className={`px-4 py-2 rounded-full text-[13px] font-medium inline-flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              pdfExported
                ? 'bg-[#D1FAE5] dark:bg-[#059669]/20 text-[#047857] dark:text-[#34d399]'
                : 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white shadow-sm shadow-[#4F46E5]/25'
            }`}
          >
            {pdfExported ? (
              <>
                <Check className="w-4 h-4 shrink-0" />
                <span>PDF descargado</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 shrink-0" />
                <span>Reporte PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unified 4-Column Hairline KPI Strip */}
      <div className="rounded-[24px] bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a] overflow-hidden">
        <div className="h-1 w-full chromatic-accent-bar" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#ececec] dark:bg-[#252e3a]">
          <div className="bg-white dark:bg-[#141920] px-4 sm:px-5 py-3.5 sm:py-4 min-w-0">
            <span className="text-[12px] text-[#777b86] dark:text-[#9aa4b2] block">Adherencia 7 días</span>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[24px] sm:text-[26px] leading-none font-medium text-[#059669] dark:text-[#34d399] tabular-nums">
                {weeklySummary.weeklyRate}%
              </span>
              <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] tabular-nums">
                {weeklySummary.totalCompleted}/{weeklySummary.totalScheduled}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#141920] px-4 sm:px-5 py-3.5 sm:py-4 min-w-0">
            <span className="text-[12px] text-[#777b86] dark:text-[#9aa4b2] block">Tasa 30 días</span>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[24px] sm:text-[26px] leading-none font-medium text-[#0284C7] dark:text-[#38bdf8] tabular-nums">
                {avg30DayRate}%
              </span>
              <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] tabular-nums">
                {totalCompletedChecks} totales
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#141920] px-4 sm:px-5 py-3.5 sm:py-4 min-w-0">
            <span className="text-[12px] text-[#777b86] dark:text-[#9aa4b2] block">Racha actual</span>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[24px] sm:text-[26px] leading-none font-medium text-[#EA580C] dark:text-[#fb923c] tabular-nums inline-flex items-center gap-1">
                <Flame className="w-4 h-4 text-[#EA580C] dark:text-[#fb923c] shrink-0" />
                {currentStreakOverall}d
              </span>
              <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] tabular-nums">
                récord {bestStreakOverall}d
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#141920] px-4 sm:px-5 py-3.5 sm:py-4 min-w-0">
            <span className="text-[12px] text-[#777b86] dark:text-[#9aa4b2] block">Top categoría (7d)</span>
            <div className="mt-1.5 flex items-baseline gap-2 min-w-0">
              <span className="text-[17px] sm:text-[18px] leading-tight font-medium text-[#7C3AED] dark:text-[#c084fc] truncate">
                {topCategory ? topCategory.category.name : '—'}
              </span>
              {topCategory && (
                <span className="text-[12px] font-medium text-[#4F46E5] dark:text-[#a5b4fc] tabular-nums shrink-0">
                  {topCategory.weeklyRate}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Analytics Navigation */}
      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] max-w-full overflow-x-auto">
        {(
          [
            { id: 'overview', label: 'Resumen' },
            { id: 'compare', label: 'Comparativa mensual' },
            { id: 'forecast', label: 'Pronóstico IA' },
            { id: 'journal', label: 'Diario contextual' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Current Week Adherence Line Chart (D3) */}
          <WeeklyAdherenceD3Chart
            habits={habits}
            logs={logs}
            selectedHabitId={selectedHabitId}
            timezone={timezone}
            isDark={isDark}
          />

          {/* Current vs Longest Historical Streak Bar Chart (D3) */}
          <StreakComparisonBarChart
            habits={habits}
            selectedHabitId={selectedHabitId}
            isDark={isDark}
          />

      {/* Trends Section (Last 30 Days with Recharts) */}
      <section
        aria-label="Tendencias de los últimos 30 días"
        className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#059669] dark:text-[#34d399] shrink-0" />
              <h2 className="text-[18px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
                Tendencias · Frecuencia de cumplimiento (30 días)
              </h2>
            </div>
            <p className="text-[14px] text-[#777b86] dark:text-[#9aa4b2] mt-1">
              Promedio de <strong className="font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums">{avg30DayFrequency}</strong> hábitos/día ·{' '}
              <strong className="font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums">{total30DayCompletions}</strong> completados en 30d · Pico diario de{' '}
              <strong className="font-medium text-[#059669] dark:text-[#34d399] tabular-nums">{peak30DayCount}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 max-w-full">
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] max-w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => setTrendMetric('count')}
                className={`px-3.5 py-1 rounded-full text-[12px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  trendMetric === 'count'
                    ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                    : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
                }`}
              >
                Frecuencia diaria
              </button>
              <button
                type="button"
                onClick={() => setTrendMetric('rate')}
                className={`px-3.5 py-1 rounded-full text-[12px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  trendMetric === 'rate'
                    ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                    : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
                }`}
              >
                Tasa (%)
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b]">
              <button
                type="button"
                onClick={() => setTrendChartType('area')}
                className={`px-3 py-1 rounded-full text-[12px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  trendChartType === 'area'
                    ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                    : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
                }`}
              >
                Área
              </button>
              <button
                type="button"
                onClick={() => setTrendChartType('bar')}
                className={`px-3 py-1 rounded-full text-[12px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  trendChartType === 'bar'
                    ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                    : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
                }`}
              >
                Barras
              </button>
            </div>
          </div>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            {trendChartType === 'area' ? (
              <AreaChart data={past30Days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="steepTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={isDark ? 0.42 : 0.38} />
                    <stop offset="55%" stopColor="#10B981" stopOpacity={isDark ? 0.16 : 0.14} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="steepTrendStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={isDark ? '#34d399' : '#059669'} />
                    <stop offset="50%" stopColor={isDark ? '#38bdf8' : '#0284C7'} />
                    <stop offset="100%" stopColor={isDark ? '#c084fc' : '#7C3AED'} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(241,245,249,0.07)' : 'rgba(23,25,28,0.06)'}
                  vertical={false}
                />
                <XAxis
                  dataKey="shortDate"
                  stroke={isDark ? '#6f7a8a' : '#a3a6af'}
                  tick={{ fill: isDark ? '#9aa4b2' : '#777b86', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#252e3a' : '#ececec' }}
                  interval="preserveStartEnd"
                  minTickGap={22}
                />
                <YAxis
                  width={trendMetric === 'rate' ? 38 : 28}
                  stroke={isDark ? '#6f7a8a' : '#a3a6af'}
                  tick={{ fill: isDark ? '#9aa4b2' : '#777b86', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={trendMetric === 'rate' ? [0, 100] : [0, 'auto']}
                  unit={trendMetric === 'rate' ? '%' : ''}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(16, 185, 129, 0.35)', strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as (typeof past30Days)[number];
                    return (
                      <div className="steep-popover px-3.5 py-2.5 text-[12px]">
                        <p className="font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1">
                          {item.fullDateLabel} ({item.dayLabel})
                        </p>
                        <p className="text-[#059669] dark:text-[#34d399] font-medium tabular-nums">
                          {item.completed} / {item.scheduled} hábitos completados
                        </p>
                        <p className="text-[#777b86] dark:text-[#9aa4b2] tabular-nums mt-0.5">
                          Cumplimiento diario: <span className="text-[#17191c] dark:text-[#f1f5f9] font-medium">{item.rate}%</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={trendMetric === 'count' ? 'completed' : 'rate'}
                  stroke="url(#steepTrendStroke)"
                  strokeWidth={2.6}
                  fillOpacity={1}
                  fill="url(#steepTrendGradient)"
                  activeDot={{
                    r: 5,
                    fill: isDark ? '#38bdf8' : '#0284C7',
                    stroke: isDark ? '#141920' : '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            ) : (
              <BarChart data={past30Days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(241,245,249,0.07)' : 'rgba(23,25,28,0.06)'}
                  vertical={false}
                />
                <XAxis
                  dataKey="shortDate"
                  stroke={isDark ? '#6f7a8a' : '#a3a6af'}
                  tick={{ fill: isDark ? '#9aa4b2' : '#777b86', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#252e3a' : '#ececec' }}
                  interval="preserveStartEnd"
                  minTickGap={22}
                />
                <YAxis
                  width={trendMetric === 'rate' ? 38 : 28}
                  stroke={isDark ? '#6f7a8a' : '#a3a6af'}
                  tick={{ fill: isDark ? '#9aa4b2' : '#777b86', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={trendMetric === 'rate' ? [0, 100] : [0, 'auto']}
                  unit={trendMetric === 'rate' ? '%' : ''}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as (typeof past30Days)[number];
                    return (
                      <div className="steep-popover px-3.5 py-2.5 text-[12px]">
                        <p className="font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1">
                          {item.fullDateLabel} ({item.dayLabel})
                        </p>
                        <p className="text-[#059669] dark:text-[#34d399] font-medium tabular-nums">
                          {item.completed} / {item.scheduled} hábitos completados
                        </p>
                        <p className="text-[#777b86] dark:text-[#9aa4b2] tabular-nums mt-0.5">
                          Cumplimiento diario: <span className="text-[#17191c] dark:text-[#f1f5f9] font-medium">{item.rate}%</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey={trendMetric === 'count' ? 'completed' : 'rate'}
                  fill={isDark ? '#10b981' : '#059669'}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>

          {/* 90-Day Historical Streaks Heatmap */}
          <HistoricalStreaksHeatmap
            habits={habits}
            logs={logs}
            selectedHabitId={selectedHabitId}
            timezone={timezone}
          />

          {/* Top Categories + Habit Streaks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]">
              <div className="flex items-center justify-between gap-2 mb-5">
                <h3 className="text-[17px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
                  Top categorías (7 días)
                </h3>
                <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] whitespace-nowrap shrink-0">
                  {weeklySummary.topCategories.length} activas
                </span>
              </div>

              <div className="space-y-4">
                {weeklySummary.topCategories.length === 0 ? (
                  <p className="text-[13px] text-[#979799] dark:text-[#6f7a8a] py-6 text-center">
                    Sin categorías activas todavía.
                  </p>
                ) : (
                  weeklySummary.topCategories.map(
                    (
                      { category, weeklyCompleted, weeklyScheduled, weeklyRate },
                      idx
                    ) => (
                      <div key={category.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[13px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="text-[12px] tabular-nums w-5 shrink-0 font-medium"
                              style={{ color: idx === 0 ? category.colorHex : isDark ? '#9aa4b2' : '#777b86' }}
                            >
                              #{idx + 1}
                            </span>
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${category.colorHex}1A`,
                                color: category.colorHex,
                              }}
                            >
                              <CategoryIcon name={category.iconName} className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-[#17191c] dark:text-[#f1f5f9] truncate">{category.name}</span>
                          </div>
                          <span className="font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums whitespace-nowrap shrink-0">
                            {weeklyRate}%{' '}
                            <span className="text-[#979799] dark:text-[#6f7a8a] font-normal">
                              ({weeklyCompleted}/{weeklyScheduled})
                            </span>
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${weeklyRate}%`,
                              backgroundColor: category.colorHex || '#059669',
                            }}
                          />
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>

            <div className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]">
              <h3 className="text-[17px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em] mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#D97706] dark:text-[#fbbf24]" />
                Récords por hábito
              </h3>

              <div className="divide-y divide-[#ececec] dark:divide-[#252e3a]">
                {activeHabits.map((habit) => {
                  const cat = categoryMap.get(habit.categoryId);
                  const streakRatio = habit.bestStreak > 0 ? Math.round((habit.currentStreak / habit.bestStreak) * 100) : 0;

                  return (
                    <div key={habit.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat?.colorHex || '#059669' }}
                        />
                        <span className="text-[14px] font-medium text-[#17191c] dark:text-[#f1f5f9] truncate">{habit.title}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-[13px] tabular-nums">
                        <span className="font-medium text-[#D97706] dark:text-[#fbbf24]">
                          {habit.currentStreak}d
                        </span>
                        <div className="w-16 hidden sm:block">
                          <div className="w-full h-1.5 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${streakRatio}%`,
                                backgroundColor: cat?.colorHex || '#059669',
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-[#777b86] dark:text-[#9aa4b2]">
                          máx {habit.bestStreak}d
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compare' && (
        <MonthlyComparator
          habits={habits}
          logs={logs}
          selectedHabitId={selectedHabitId}
          timezone={timezone}
          isDark={isDark}
        />
      )}

      {activeTab === 'forecast' && (
        <MomentumForecast
          habits={habits}
          logs={logs}
          categories={categories}
          selectedHabitId={selectedHabitId}
          timezone={timezone}
          onApplyReminderTime={onApplyReminderTime}
          isDark={isDark}
        />
      )}

      {activeTab === 'journal' && (
        <ContextualJournalStats
          habits={habits}
          logs={logs}
          selectedHabitId={selectedHabitId}
          isDark={isDark}
        />
      )}
    </div>
  );
};
