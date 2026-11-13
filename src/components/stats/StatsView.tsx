import React, { useMemo, useState } from 'react';
import {
  Flame,
  Award,
  TrendingUp,
  CheckCircle2,
  Activity,
  FileDown,
  Check,
  Trophy,
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
import { BadgesModule } from '../badges/BadgesModule';
import { HistoricalStreaksHeatmap } from './HistoricalStreaksHeatmap';
import { MonthlyComparator } from './MonthlyComparator';
import { MomentumForecast } from './MomentumForecast';
import { ContextualJournalStats } from './ContextualJournalStats';

interface Props {
  habits: Habit[];
  logs: HabitLog[];
  categories: Category[];
  badges: EvaluatedBadge[];
  userName?: string;
  timezone?: string;
  onReportExported?: (filename: string, topCategoryName?: string, weeklyRate?: number) => void;
  onApplyReminderTime?: (habitId: string, newReminderTime: string) => void;
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
}) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string | 'all'>('all');
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

  const past14Days = past30Days.slice(-14);

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
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#ececec]">
        <div>
          <span className="text-[14px] text-[#979799] block">Analítica personal</span>
          <h1 className="font-signifier font-normal text-[36px] md:text-[44px] leading-[1.2] tracking-[-0.015em] text-[#17191c] mt-1">
            Estadísticas <em className="italic font-normal">&amp; Inercia</em>
          </h1>
          <p className="text-[16px] text-[#777b86] mt-1">
            Métricas de cumplimiento, mapa de calor de constancia y pronóstico de impulso.
          </p>
        </div>

        {/* Controls: Habit filter & Weekly PDF Report button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#777b86] whitespace-nowrap">Ver hábito:</span>
            <select
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              className="px-4 py-2 rounded-full bg-white border border-[#ececec] text-[#17191c] text-[13px] focus:outline-none focus:border-[#17191c] cursor-pointer"
            >
              <option value="all">Todos los hábitos combinados</option>
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportWeeklyPdf}
            className={`px-5 py-2.5 rounded-full text-[13px] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              pdfExported
                ? 'bg-[#fbe1d1] text-[#5d2a1a]'
                : 'bg-[#17191c] hover:bg-[#2a2d32] text-white'
            }`}
          >
            {pdfExported ? (
              <>
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>PDF descargado</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 shrink-0" />
                <span>Reporte semanal PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Weekly Report & Top Category Summary Strip */}
      <div className="rounded-[24px] px-6 py-4 bg-[#fafafb] border border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px]">
          <span className="font-medium text-[#17191c] inline-flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-[#5d2a1a] shrink-0" />
            Resumen de los últimos 7 días
          </span>
          <span className="text-[#a3a6af]">·</span>
          <span className="text-[#777b86] tabular-nums">
            Adherencia semanal:{' '}
            <strong className="font-medium text-[#17191c]">{weeklySummary.weeklyRate}%</strong>{' '}
            <span className="text-[#979799]">
              ({weeklySummary.totalCompleted}/{weeklySummary.totalScheduled} check-ins)
            </span>
          </span>
          {topCategory && (
            <>
              <span className="text-[#a3a6af]">·</span>
              <span className="text-[#777b86] tabular-nums">
                Top categoría:{' '}
                <strong className="font-medium text-[#17191c]">{topCategory.category.name}</strong>{' '}
                <span>({topCategory.weeklyRate}%)</span>
              </span>
            </>
          )}
        </div>
        <span className="text-[13px] text-[#979799] whitespace-nowrap shrink-0">
          {weeklySummary.periodLabel}
        </span>
      </div>

      {/* KPI Cards Row — Steep Mist Gray 24px cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="steep-card-mist p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#979799]">Racha máxima</span>
            <Flame className="w-4 h-4 text-[#5d2a1a]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-[30px] leading-none font-medium text-[#17191c] tabular-nums">
              {bestStreakOverall}
            </span>
            <span className="text-[13px] text-[#777b86]">días</span>
          </div>
          <span className="text-[12px] text-[#777b86] mt-2 block">Récord histórico</span>
        </div>

        <div className="steep-card-mist p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#979799]">Racha actual</span>
            <Award className="w-4 h-4 text-[#17191c]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-[30px] leading-none font-medium text-[#17191c] tabular-nums">
              {currentStreakOverall}
            </span>
            <span className="text-[13px] text-[#777b86]">días</span>
          </div>
          <span className="text-[12px] text-[#777b86] mt-2 block">Inercia activa</span>
        </div>

        <div className="steep-card-mist p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#979799]">Total check-ins</span>
            <CheckCircle2 className="w-4 h-4 text-[#17191c]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-[30px] leading-none font-medium text-[#17191c] tabular-nums">
              {totalCompletedChecks}
            </span>
            <span className="text-[13px] text-[#777b86]">veces</span>
          </div>
          <span className="text-[12px] text-[#777b86] mt-2 block">Registros completados</span>
        </div>

        <div className="steep-card-mist p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#979799]">Tasa promedio</span>
            <TrendingUp className="w-4 h-4 text-[#5d2a1a]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-[30px] leading-none font-medium text-[#17191c] tabular-nums">
              {avg30DayRate}%
            </span>
            <span className="text-[13px] text-[#777b86]">adherencia</span>
          </div>
          <span className="text-[12px] text-[#777b86] mt-2 block">Últimos 30 días</span>
        </div>
      </div>

      {/* Trends Section (Last 30 Days with Recharts) */}
      <section
        aria-label="Tendencias de los últimos 30 días"
        className="rounded-[24px] p-6 bg-white border border-[#ececec]"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#5d2a1a] shrink-0" />
              <h2 className="text-[18px] font-medium text-[#17191c] tracking-[-0.01em]">
                Tendencias · Frecuencia de cumplimiento (30 días)
              </h2>
            </div>
            <p className="text-[14px] text-[#777b86] mt-1">
              Promedio de <strong className="font-medium text-[#17191c] tabular-nums">{avg30DayFrequency}</strong> hábitos/día ·{' '}
              <strong className="font-medium text-[#17191c] tabular-nums">{total30DayCompletions}</strong> completados en 30d · Pico diario de{' '}
              <strong className="font-medium text-[#5d2a1a] tabular-nums">{peak30DayCount}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3]">
              <button
                type="button"
                onClick={() => setTrendMetric('count')}
                className={`px-3.5 py-1 rounded-full text-[12px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  trendMetric === 'count'
                    ? 'bg-white text-[#17191c] font-medium shadow-xs'
                    : 'text-[#777b86] hover:text-[#17191c]'
                }`}
              >
                Frecuencia diaria
              </button>
              <button
                type="button"
                onClick={() => setTrendMetric('rate')}
                className={`px-3.5 py-1 rounded-full text-[12px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  trendMetric === 'rate'
                    ? 'bg-white text-[#17191c] font-medium shadow-xs'
                    : 'text-[#777b86] hover:text-[#17191c]'
                }`}
              >
                Tasa (%)
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3]">
              <button
                type="button"
                onClick={() => setTrendChartType('area')}
                className={`px-3 py-1 rounded-full text-[12px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  trendChartType === 'area'
                    ? 'bg-white text-[#17191c] font-medium shadow-xs'
                    : 'text-[#777b86] hover:text-[#17191c]'
                }`}
              >
                Área
              </button>
              <button
                type="button"
                onClick={() => setTrendChartType('bar')}
                className={`px-3 py-1 rounded-full text-[12px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  trendChartType === 'bar'
                    ? 'bg-white text-[#17191c] font-medium shadow-xs'
                    : 'text-[#777b86] hover:text-[#17191c]'
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
              <AreaChart data={past30Days} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="steepTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbe1d1" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="#fbe1d1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(23,25,28,0.06)" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  stroke="#a3a6af"
                  tick={{ fill: '#777b86', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#ececec' }}
                  interval={4}
                />
                <YAxis
                  stroke="#a3a6af"
                  tick={{ fill: '#777b86', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={trendMetric === 'rate' ? [0, 100] : [0, 'auto']}
                  unit={trendMetric === 'rate' ? '%' : ''}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(93, 42, 26, 0.3)', strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as (typeof past30Days)[number];
                    return (
                      <div className="steep-popover px-3.5 py-2.5 text-[12px]">
                        <p className="font-medium text-[#17191c] mb-1">
                          {item.fullDateLabel} ({item.dayLabel})
                        </p>
                        <p className="text-[#5d2a1a] font-medium tabular-nums">
                          {item.completed} / {item.scheduled} hábitos completados
                        </p>
                        <p className="text-[#777b86] tabular-nums mt-0.5">
                          Cumplimiento diario: <span className="text-[#17191c] font-medium">{item.rate}%</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={trendMetric === 'count' ? 'completed' : 'rate'}
                  stroke="#5d2a1a"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  fill="url(#steepTrendGradient)"
                  activeDot={{ r: 5, fill: '#5d2a1a', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart data={past30Days} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(23,25,28,0.06)" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  stroke="#a3a6af"
                  tick={{ fill: '#777b86', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#ececec' }}
                  interval={4}
                />
                <YAxis
                  stroke="#a3a6af"
                  tick={{ fill: '#777b86', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={trendMetric === 'rate' ? [0, 100] : [0, 'auto']}
                  unit={trendMetric === 'rate' ? '%' : ''}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(23, 25, 28, 0.04)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as (typeof past30Days)[number];
                    return (
                      <div className="steep-popover px-3.5 py-2.5 text-[12px]">
                        <p className="font-medium text-[#17191c] mb-1">
                          {item.fullDateLabel} ({item.dayLabel})
                        </p>
                        <p className="text-[#5d2a1a] font-medium tabular-nums">
                          {item.completed} / {item.scheduled} hábitos completados
                        </p>
                        <p className="text-[#777b86] tabular-nums mt-0.5">
                          Cumplimiento diario: <span className="text-[#17191c] font-medium">{item.rate}%</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey={trendMetric === 'count' ? 'completed' : 'rate'}
                  fill="#17191c"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>

      {/* AI Weekly Momentum Zones & Optimal Timing Forecast */}
      <MomentumForecast
        habits={habits}
        logs={logs}
        categories={categories}
        selectedHabitId={selectedHabitId}
        timezone={timezone}
        onApplyReminderTime={onApplyReminderTime}
      />

      {/* Current Month vs Previous Month Consistency Comparator */}
      <MonthlyComparator
        habits={habits}
        logs={logs}
        selectedHabitId={selectedHabitId}
        timezone={timezone}
      />

      {/* 90-Day GitHub-Style Historical Streaks Heatmap */}
      <HistoricalStreaksHeatmap
        habits={habits}
        logs={logs}
        selectedHabitId={selectedHabitId}
        timezone={timezone}
      />

      {/* Contextual Journaling: Energy Level & Mood Performance Correlation */}
      <ContextualJournalStats
        habits={habits}
        logs={logs}
        selectedHabitId={selectedHabitId}
      />

      {/* Trailing 14 Days + Top Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-[24px] p-6 bg-white border border-[#ececec]">
          <h3 className="text-[17px] font-medium text-[#17191c] tracking-[-0.01em] mb-1">
            Tendencia de los últimos 14 días
          </h3>
          <p className="text-[13px] text-[#777b86] mb-6">
            Porcentaje de cumplimiento diario en días programados.
          </p>

          <div className="h-44 flex items-end gap-2 pt-4 px-1 border-b border-[#ececec]">
            {past14Days.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                <span className="text-[10px] text-[#777b86] opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  {d.rate}%
                </span>
                <div className="w-full bg-[#f2f2f3] rounded-t-sm h-32 relative overflow-hidden flex items-end">
                  <div
                    className="w-full rounded-t-sm transition-all duration-300"
                    style={{
                      height: `${d.rate}%`,
                      backgroundColor: d.rate >= 80 ? '#17191c' : d.rate >= 50 ? '#5d2a1a' : '#a3a6af',
                    }}
                  />
                </div>
                <span className="text-[11px] text-[#777b86]">{d.dayLabel}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[12px] text-[#979799] mt-2.5">
            <span>Hace 14 días</span>
            <span>Hoy</span>
          </div>
        </div>

        <div className="rounded-[24px] p-6 bg-white border border-[#ececec]">
          <div className="flex items-start justify-between gap-2 mb-5">
            <div>
              <h3 className="text-[17px] font-medium text-[#17191c] tracking-[-0.01em] mb-1">
                Top categorías (últimos 7 días)
              </h3>
              <p className="text-[13px] text-[#777b86]">
                Ranking por tasa de cumplimiento semanal y volumen de check-ins.
              </p>
            </div>
            <span className="text-[12px] text-[#979799] whitespace-nowrap shrink-0">
              {weeklySummary.topCategories.length} activas
            </span>
          </div>

          <div className="space-y-4">
            {weeklySummary.topCategories.length === 0 ? (
              <p className="text-[13px] text-[#979799] py-6 text-center">
                Aún no hay categorías con hábitos activos para clasificar.
              </p>
            ) : (
              weeklySummary.topCategories.map(
                (
                  { category, habitCount, weeklyCompleted, weeklyScheduled, weeklyRate, totalAllTimeCompletions },
                  idx
                ) => (
                  <div key={category.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[13px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[12px] tabular-nums w-5 shrink-0 ${
                            idx === 0 ? 'text-[#5d2a1a] font-medium' : 'text-[#979799]'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-[#f2f2f3] text-[#17191c] flex items-center justify-center shrink-0">
                          <CategoryIcon name={category.iconName} className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-[#17191c] truncate">{category.name}</span>
                        <span className="text-[#979799] text-[12px] whitespace-nowrap shrink-0">
                          {habitCount} h · {totalAllTimeCompletions} tot.
                        </span>
                      </div>
                      <span className="font-medium text-[#17191c] tabular-nums whitespace-nowrap shrink-0">
                        {weeklyRate}%{' '}
                        <span className="text-[#979799] font-normal">
                          ({weeklyCompleted}/{weeklyScheduled})
                        </span>
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-[#f2f2f3] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${weeklyRate}%`,
                          backgroundColor: idx === 0 ? '#5d2a1a' : '#17191c',
                        }}
                      />
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>

      {/* Streaks Hall of Fame */}
      <div className="rounded-[24px] p-6 bg-white border border-[#ececec]">
        <h3 className="text-[17px] font-medium text-[#17191c] tracking-[-0.01em] mb-1 flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#5d2a1a]" />
          Récords de racha por hábito
        </h3>
        <p className="text-[13px] text-[#777b86] mb-4">
          Comparativa entre racha actual activa y máxima histórica conseguida.
        </p>

        <div className="divide-y divide-[#ececec]">
          {activeHabits.map((habit) => {
            const cat = categoryMap.get(habit.categoryId);
            const streakRatio = habit.bestStreak > 0 ? Math.round((habit.currentStreak / habit.bestStreak) * 100) : 0;

            return (
              <div key={habit.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat?.colorHex || '#17191c' }}
                  />
                  <span className="text-[14px] font-medium text-[#17191c] truncate">{habit.title}</span>
                </div>

                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-right">
                    <span className="text-[13px] font-medium text-[#5d2a1a] tabular-nums">
                      {habit.currentStreak} d
                    </span>
                    <span className="text-[11px] text-[#979799] block">actual</span>
                  </div>

                  <div className="w-24 hidden sm:block">
                    <div className="w-full h-1.5 rounded-full bg-[#f2f2f3] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#17191c]"
                        style={{ width: `${streakRatio}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[13px] font-medium text-[#17191c] tabular-nums">
                      {habit.bestStreak} d
                    </span>
                    <span className="text-[11px] text-[#979799] block">récord</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Automated Streak Badges Showcase */}
      <BadgesModule badges={badges} />
    </div>
  );
};
