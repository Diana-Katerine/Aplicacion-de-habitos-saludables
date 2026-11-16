import React, { useMemo } from 'react';
import { BatteryCharging, Smile, TrendingUp, BookOpen } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { EnergyLevel, Habit, HabitLog, MoodTag } from '../../types';
import { formatDate, getDayOfWeek } from '../../services/storage';
import { ENERGY_OPTIONS, MOOD_OPTIONS, getMoodMeta } from '../../services/journaling';

interface Props {
  habits: Habit[];
  logs: HabitLog[];
  selectedHabitId: string | 'all';
  isDark?: boolean;
}

interface EnergyBucketPoint {
  level: EnergyLevel;
  label: string;
  shortLabel: string;
  checkInsCount: number;
  avgDailyCompletionRate: number;
}

interface MoodStatRow {
  mood: MoodTag;
  label: string;
  colorHex: string;
  count: number;
  sharePercent: number;
  avgEnergy: number;
  avgDailyCompletionRate: number;
}

export const ContextualJournalStats: React.FC<Props> = ({
  habits,
  logs,
  selectedHabitId,
  isDark = false,
}) => {
  const habitMap = useMemo(() => new Map(habits.map((h) => [h.id, h])), [habits]);

  const {
    journaledCount,
    avgEnergy,
    dominantMood,
    highEnergyRate,
    lowEnergyRate,
    energyBuckets,
    moodRows,
    recentEntries,
  } = useMemo(() => {
    const activeHabits = habits.filter((h) => h.isActive);
    const selectedHabit =
      selectedHabitId === 'all' ? null : habits.find((h) => h.id === selectedHabitId) || null;

    const completedByDate = new Map<string, number>();
    logs.forEach((l) => {
      if (!l.isCompleted) return;
      if (selectedHabitId !== 'all' && l.habitId !== selectedHabitId) return;
      completedByDate.set(l.logDate, (completedByDate.get(l.logDate) || 0) + 1);
    });

    const dailyRateByDate = new Map<string, number>();
    const allDates = new Set(logs.map((l) => l.logDate));
    allDates.forEach((dateStr) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return;
      const dt = new Date(y, m - 1, d, 12, 0, 0);
      const dow = getDayOfWeek(dt);
      const scheduled = selectedHabit
        ? selectedHabit.scheduledDays.includes(dow)
          ? 1
          : 0
        : activeHabits.filter((h) => h.scheduledDays.includes(dow)).length;
      const completed = completedByDate.get(dateStr) || 0;
      const rate =
        scheduled > 0
          ? Math.min(100, Math.round((completed / scheduled) * 100))
          : completed > 0
          ? 100
          : 0;
      dailyRateByDate.set(dateStr, rate);
    });

    const scopedJournalLogs = logs.filter((l) => {
      if (!l.isCompleted) return false;
      if (selectedHabitId !== 'all' && l.habitId !== selectedHabitId) return false;
      return l.energyLevel !== undefined || l.moodTag !== undefined || Boolean(l.journalEntry);
    });

    const energyLogs = scopedJournalLogs.filter((l) => l.energyLevel !== undefined);
    const avgE =
      energyLogs.length > 0
        ? Number(
            (
              energyLogs.reduce((sum, l) => sum + (l.energyLevel || 0), 0) /
              energyLogs.length
            ).toFixed(1)
          )
        : 0;

    const buckets: EnergyBucketPoint[] = ENERGY_OPTIONS.map((opt) => {
      const matching = energyLogs.filter((l) => l.energyLevel === opt.level);
      const avgRate =
        matching.length > 0
          ? Math.round(
              matching.reduce((sum, l) => sum + (dailyRateByDate.get(l.logDate) ?? 100), 0) /
                matching.length
            )
          : 0;

      return {
        level: opt.level,
        label: `Nivel ${opt.level}`,
        shortLabel: `${opt.level} · ${opt.shortLabel}`,
        checkInsCount: matching.length,
        avgDailyCompletionRate: avgRate,
      };
    });

    const highEnergyLogs = energyLogs.filter((l) => (l.energyLevel || 0) >= 4);
    const lowEnergyLogs = energyLogs.filter((l) => (l.energyLevel || 0) <= 2);

    const highERate =
      highEnergyLogs.length > 0
        ? Math.round(
            highEnergyLogs.reduce((sum, l) => sum + (dailyRateByDate.get(l.logDate) ?? 100), 0) /
              highEnergyLogs.length
          )
        : null;

    const lowERate =
      lowEnergyLogs.length > 0
        ? Math.round(
            lowEnergyLogs.reduce((sum, l) => sum + (dailyRateByDate.get(l.logDate) ?? 100), 0) /
              lowEnergyLogs.length
          )
        : null;

    const moodLogs = scopedJournalLogs.filter((l) => l.moodTag !== undefined);
    const rows: MoodStatRow[] = MOOD_OPTIONS.map((opt) => {
      const matching = moodLogs.filter((l) => l.moodTag === opt.id);
      const withEnergy = matching.filter((l) => l.energyLevel !== undefined);
      const avgMoodEnergy =
        withEnergy.length > 0
          ? Number(
              (
                withEnergy.reduce((sum, l) => sum + (l.energyLevel || 0), 0) /
                withEnergy.length
              ).toFixed(1)
            )
          : 0;
      const avgRate =
        matching.length > 0
          ? Math.round(
              matching.reduce((sum, l) => sum + (dailyRateByDate.get(l.logDate) ?? 100), 0) /
                matching.length
            )
          : 0;

      return {
        mood: opt.id,
        label: opt.label,
        colorHex: opt.colorHex,
        count: matching.length,
        sharePercent:
          moodLogs.length > 0 ? Math.round((matching.length / moodLogs.length) * 100) : 0,
        avgEnergy: avgMoodEnergy,
        avgDailyCompletionRate: avgRate,
      };
    })
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);

    const topMood = rows[0] || null;

    const recent = [...scopedJournalLogs]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5);

    return {
      journaledCount: scopedJournalLogs.length,
      avgEnergy: avgE,
      dominantMood: topMood,
      highEnergyRate: highERate,
      lowEnergyRate: lowERate,
      energyBuckets: buckets,
      moodRows: rows,
      recentEntries: recent,
    };
  }, [habits, logs, selectedHabitId]);

  const formatDateDisplay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    return formatDate(new Date(y, m - 1, d)) === formatDate(new Date())
      ? 'Hoy'
      : new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(
          new Date(y, m - 1, d)
        );
  };

  return (
    <section
      aria-label="Correlación de diario contextual, energía y estado de ánimo"
      className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <h2 className="text-[18px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em] flex items-center gap-2">
          <BatteryCharging className="w-4 h-4 text-[#059669] dark:text-[#34d399] shrink-0" />
          <span>Diario contextual · Energía y ánimo</span>
        </h2>

        <span className="text-[13px] text-[#047857] dark:text-[#34d399] font-medium tabular-nums whitespace-nowrap shrink-0">
          {journaledCount} registros
        </span>
      </div>

      {journaledCount === 0 ? (
        <div className="py-10 text-center border-t border-[#ececec] dark:border-[#252e3a]">
          <p className="text-[15px] font-medium text-[#17191c] dark:text-[#f1f5f9]">
            Aún no hay registros de energía y ánimo en este filtro.
          </p>
          <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-1 max-w-md mx-auto">
            Completa un hábito en la vista Hoy para registrar tu nivel de energía (1–5) y estado de ánimo y descubrir cómo impactan en tu constancia.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 mb-6 border-y border-[#ececec] dark:border-[#252e3a]">
            <div className="min-w-0">
              <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] block">
                Energía promedio al completar
              </span>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[24px] sm:text-[26px] leading-none font-medium text-[#0284C7] dark:text-[#38bdf8] tabular-nums">
                  {avgEnergy > 0 ? `${avgEnergy}/5` : '—'}
                </span>
                <span className="text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
                  {avgEnergy >= 4 ? 'Reserva óptima' : avgEnergy >= 3 ? 'Ritmo estable' : 'Requiere descanso'}
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] block">
                Estado de ánimo dominante
              </span>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span
                  className="text-[24px] sm:text-[26px] leading-none font-medium"
                  style={{ color: dominantMood?.colorHex || (isDark ? '#f1f5f9' : '#17191c') }}
                >
                  {dominantMood?.label || '—'}
                </span>
                {dominantMood && (
                  <span className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] tabular-nums">
                    {dominantMood.sharePercent}% ({dominantMood.avgDailyCompletionRate}% adh.)
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] block">
                Impacto en rendimiento diario
              </span>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[24px] sm:text-[26px] leading-none font-medium text-[#059669] dark:text-[#34d399] tabular-nums inline-flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  {highEnergyRate !== null ? `${highEnergyRate}%` : '—'}
                </span>
                <span className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] tabular-nums">
                  {lowEnergyRate !== null
                    ? `en energía 4–5 (vs ${lowEnergyRate}% en 1–2)`
                    : 'adherencia promedio en 4–5'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <div className="mb-3">
                <h3 className="text-[14px] font-medium text-[#17191c] dark:text-[#f1f5f9]">
                  Nivel de energía (1–5) vs. adherencia diaria
                </h3>
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={energyBuckets}
                    margin={{ top: 10, right: 4, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? 'rgba(241,245,249,0.07)' : 'rgba(23,25,28,0.06)'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="shortLabel"
                      stroke={isDark ? '#6f7a8a' : '#a3a6af'}
                      tick={{ fill: isDark ? '#9aa4b2' : '#777b86', fontSize: 10.5 }}
                      tickLine={false}
                      axisLine={{ stroke: isDark ? '#252e3a' : '#ececec' }}
                      interval={0}
                    />
                    <YAxis
                      yAxisId="left"
                      width={26}
                      stroke={isDark ? '#6f7a8a' : '#a3a6af'}
                      tick={{ fill: isDark ? '#9aa4b2' : '#777b86', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      width={38}
                      stroke={isDark ? '#6f7a8a' : '#a3a6af'}
                      tick={{ fill: isDark ? '#fbbf24' : '#D97706', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      unit="%"
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(56, 189, 248, 0.08)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const pt = payload[0].payload as EnergyBucketPoint;
                        return (
                          <div className="steep-popover px-3.5 py-2.5 text-[12px] space-y-1">
                            <p className="font-medium text-[#17191c] dark:text-[#f1f5f9]">{pt.shortLabel}</p>
                            <p className="text-[#D97706] dark:text-[#fbbf24] font-medium tabular-nums">
                              Adherencia diaria promedio: {pt.avgDailyCompletionRate}%
                            </p>
                            <p className="text-[#0284C7] dark:text-[#38bdf8] tabular-nums">
                              Sesiones registradas: {pt.checkInsCount}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="checkInsCount"
                      name="Sesiones"
                      fill={isDark ? 'rgba(56, 189, 248, 0.25)' : '#BAE6FD'}
                      stroke="#38BDF8"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={34}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgDailyCompletionRate"
                      name="Adherencia %"
                      stroke={isDark ? '#fbbf24' : '#D97706'}
                      strokeWidth={2.5}
                      dot={{
                        r: 4,
                        fill: isDark ? '#fbbf24' : '#D97706',
                        stroke: isDark ? '#141920' : '#ffffff',
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: isDark ? '#fbbf24' : '#D97706',
                        stroke: isDark ? '#141920' : '#ffffff',
                        strokeWidth: 2,
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-[14px] font-medium text-[#17191c] dark:text-[#f1f5f9] flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-[#4F46E5] dark:text-[#a5b4fc]" />
                  <span>Rendimiento por estado de ánimo</span>
                </h3>
              </div>

              <div className="space-y-4">
                {moodRows.map((row) => (
                  <div key={row.mood} className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[13px]">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                        <span
                          className="font-medium truncate"
                          style={{ color: row.colorHex }}
                        >
                          {row.label}
                        </span>
                        <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] tabular-nums">
                          {row.count} ses. · E:{row.avgEnergy}/5
                        </span>
                      </div>
                      <span className="font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums whitespace-nowrap shrink-0">
                        {row.avgDailyCompletionRate}%{' '}
                        <span className="text-[#979799] dark:text-[#6f7a8a] font-normal">({row.sharePercent}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${row.avgDailyCompletionRate}%`,
                          backgroundColor: row.colorHex,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {recentEntries.length > 0 && (
            <div className="mt-6 pt-5 border-t border-[#ececec] dark:border-[#252e3a]">
              <h3 className="text-[14px] font-medium text-[#17191c] dark:text-[#f1f5f9] flex items-center gap-1.5 mb-3">
                <BookOpen className="w-4 h-4 text-[#0284C7] dark:text-[#38bdf8]" />
                <span>Últimos registros contextuales</span>
              </h3>
              <div className="divide-y divide-[#ececec] dark:divide-[#252e3a]">
                {recentEntries.map((entry) => {
                  const h = habitMap.get(entry.habitId);
                  const mood = getMoodMeta(entry.moodTag);
                  return (
                    <div
                      key={entry.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[13px]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-medium text-[#17191c] dark:text-[#f1f5f9] truncate">
                            {h?.title || 'Hábito'}
                          </span>
                          <span className="text-[#a3a6af] dark:text-[#6f7a8a]">·</span>
                          <span className="text-[#777b86] dark:text-[#9aa4b2] tabular-nums">
                            {formatDateDisplay(entry.logDate)}
                          </span>
                        </div>
                        {entry.journalEntry && (
                          <p className="text-[#777b86] dark:text-[#9aa4b2] text-[12px] mt-0.5">
                            “{entry.journalEntry}”
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[12px] tabular-nums shrink-0">
                        {entry.energyLevel !== undefined && (
                          <span className="text-[#17191c] dark:text-[#f1f5f9] font-medium">
                            Energía {entry.energyLevel}/5
                          </span>
                        )}
                        {entry.energyLevel !== undefined && mood && (
                          <span className="text-[#a3a6af] dark:text-[#6f7a8a]">·</span>
                        )}
                        {mood && (
                          <span className="font-medium" style={{ color: mood.colorHex }}>
                            {mood.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
