import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Clock,
  Check,
  AlertCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts';
import {
  Category,
  DayOfWeek,
  Habit,
  HabitLog,
  MomentumForecastResult,
  WeeklyForecastPoint,
} from '../../types';
import { formatDate, getDayOfWeek, getTodayDateString } from '../../services/storage';

interface Props {
  habits: Habit[];
  logs: HabitLog[];
  categories: Category[];
  selectedHabitId?: string | 'all';
  timezone?: string;
  onApplyReminderTime?: (habitId: string, newReminderTime: string) => void;
}

const WEEK_DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface ChartForecastPoint extends WeeklyForecastPoint {
  dayIndex: number;
}

const FORECAST_CACHE_PREFIX = 'impulso_diario_ai_forecast_v1';

export const MomentumForecast: React.FC<Props> = ({
  habits,
  logs,
  categories,
  selectedHabitId = 'all',
  timezone,
  onApplyReminderTime,
}) => {
  const [forecast, setForecast] = useState<MomentumForecastResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeHabits = useMemo(() => {
    const active = habits.filter((h) => h.isActive);
    if (selectedHabitId !== 'all') {
      return active.filter((h) => h.id === selectedHabitId);
    }
    return active;
  }, [habits, selectedHabitId]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const habitMap = useMemo(
    () => new Map(habits.map((h) => [h.id, h])),
    [habits]
  );

  const historicalPayload = useMemo(() => {
    const todayStr = getTodayDateString(timezone);
    const [yr, mo, dy] = todayStr.split('-').map(Number);
    const anchorDate =
      yr && mo && dy ? new Date(yr, mo - 1, dy, 12, 0, 0) : new Date();

    const completedByDateAndHabit = new Set<string>();
    const logsLast30ByHabit = new Map<string, number>();

    const cutoff30 = new Date(anchorDate);
    cutoff30.setDate(cutoff30.getDate() - 29);
    const cutoff30Str = formatDate(cutoff30);

    logs.forEach((log) => {
      if (!log.isCompleted) return;
      completedByDateAndHabit.add(`${log.logDate}::${log.habitId}`);
      if (log.logDate >= cutoff30Str) {
        logsLast30ByHabit.set(
          log.habitId,
          (logsLast30ByHabit.get(log.habitId) || 0) + 1
        );
      }
    });

    const weekdayBuckets = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: (i + 1) as DayOfWeek,
      dayLabel: WEEK_DAY_LABELS[i],
      completedCount: 0,
      scheduledCount: 0,
    }));

    for (let offset = 0; offset < 56; offset++) {
      const d = new Date(anchorDate);
      d.setDate(d.getDate() - offset);
      const dateStr = formatDate(d);
      const dow = getDayOfWeek(d);
      const bucket = weekdayBuckets[dow - 1];

      activeHabits.forEach((h) => {
        if (h.scheduledDays.includes(dow)) {
          bucket.scheduledCount += 1;
          if (completedByDateAndHabit.has(`${dateStr}::${h.id}`)) {
            bucket.completedCount += 1;
          }
        }
      });
    }

    const weekdayHistory = weekdayBuckets.map((b) => ({
      dayLabel: b.dayLabel,
      dayOfWeek: b.dayOfWeek,
      baselineRate:
        b.scheduledCount > 0
          ? Math.min(100, Math.round((b.completedCount / b.scheduledCount) * 100))
          : 0,
      completedCount: b.completedCount,
      scheduledCount: b.scheduledCount,
    }));

    const habitSummaries = activeHabits.map((h) => {
      let scheduledIn30 = 0;
      for (let offset = 0; offset < 30; offset++) {
        const d = new Date(anchorDate);
        d.setDate(d.getDate() - offset);
        if (h.scheduledDays.includes(getDayOfWeek(d))) {
          scheduledIn30 += 1;
        }
      }
      const completed30 = logsLast30ByHabit.get(h.id) || 0;
      const rate30 =
        scheduledIn30 > 0
          ? Math.min(100, Math.round((completed30 / scheduledIn30) * 100))
          : 0;

      return {
        id: h.id,
        title: h.title,
        categoryName: categoryMap.get(h.categoryId)?.name || 'General',
        currentReminderTime: h.reminderTime || '',
        scheduledDaysCount: h.scheduledDays.length,
        completionRate30d: rate30,
        currentStreak: h.currentStreak,
        bestStreak: h.bestStreak,
      };
    });

    const completedTotalCount = logs.filter((l) => l.isCompleted).length;
    const cacheKey = `${FORECAST_CACHE_PREFIX}_${todayStr}_${selectedHabitId}_${activeHabits
      .map((h) => h.id)
      .sort()
      .join(',')}_${completedTotalCount}`;

    return {
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      weekdayHistory,
      habits: habitSummaries,
      cacheKey,
    };
  }, [activeHabits, logs, categoryMap, timezone, selectedHabitId]);

  const fetchForecast = useCallback(
    async (forceRefresh = false) => {
      if (historicalPayload.habits.length === 0) {
        setForecast(null);
        setError(null);
        return;
      }

      if (!forceRefresh) {
        try {
          const cachedRaw = localStorage.getItem(historicalPayload.cacheKey);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw) as MomentumForecastResult;
            if (cached?.weeklyForecast?.length === 7) {
              setForecast(cached);
              setError(null);
              return;
            }
          }
        } catch {
          // Ignore malformed cache
        }
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/forecast/momentum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timezone: historicalPayload.timezone,
            weekdayHistory: historicalPayload.weekdayHistory,
            habits: historicalPayload.habits,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data?.error === 'string'
              ? data.error
              : `No se pudo generar el pronóstico (código ${res.status}).`
          );
        }

        const result = data as MomentumForecastResult;
        setForecast(result);
        try {
          localStorage.setItem(historicalPayload.cacheKey, JSON.stringify(result));
        } catch {
          // Ignore quota
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'No se pudo conectar con el servicio de pronóstico IA.';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [historicalPayload]
  );

  useEffect(() => {
    fetchForecast(false);
  }, [fetchForecast]);

  const chartData: ChartForecastPoint[] = useMemo(() => {
    if (!forecast?.weeklyForecast) return [];
    return forecast.weeklyForecast.map((pt, idx) => ({
      ...pt,
      dayIndex: idx,
    }));
  }, [forecast]);

  const projectedWeeklyAvg = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.round(
      chartData.reduce((sum, d) => sum + d.predictedScore, 0) / chartData.length
    );
  }, [chartData]);

  const baselineWeeklyAvg = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.round(
      chartData.reduce((sum, d) => sum + d.baselineRate, 0) / chartData.length
    );
  }, [chartData]);

  const projectedDelta = projectedWeeklyAvg - baselineWeeklyAvg;

  const peakDaysLabel = useMemo(() => {
    const peaks = chartData.filter((d) => d.zoneType === 'peak').map((d) => d.dayLabel);
    return peaks.length > 0 ? peaks.join(', ') : 'Lun, Mié, Vie';
  }, [chartData]);

  if (activeHabits.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Pronóstico IA de zonas de impulso semanal"
      className="rounded-[24px] p-6 bg-white border border-[#ececec]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-[18px] font-medium text-[#17191c] tracking-[-0.01em] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#5d2a1a] shrink-0" />
            <span>Pronóstico IA · Zonas de impulso semanal</span>
          </h2>
          <p className="text-[14px] text-[#777b86] mt-0.5">
            {forecast?.headline ||
              'Análisis predictivo de tu historial para detectar bloques horarios de máxima adherencia.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchForecast(true)}
          disabled={isLoading}
          className="px-4 py-2 rounded-full bg-white hover:bg-[#fafafb] border border-[#17191c]/25 hover:border-[#17191c] text-[13px] text-[#17191c] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Analizando historial...' : 'Recalcular con IA'}</span>
        </button>
      </div>

      {error && !isLoading && (
        <div className="rounded-[16px] bg-[#fbe1d1] text-[#5d2a1a] px-4 py-3 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-[13px]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchForecast(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#5d2a1a] text-white text-[12px] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {isLoading && !forecast && (
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 border-y border-[#ececec]">
            <div className="h-10 rounded-[12px] bg-[#f2f2f3] animate-pulse" />
            <div className="h-10 rounded-[12px] bg-[#f2f2f3] animate-pulse" />
            <div className="h-10 rounded-[12px] bg-[#f2f2f3] animate-pulse" />
          </div>
          <div className="h-64 rounded-[16px] bg-[#fafafb] animate-pulse" />
        </div>
      )}

      {forecast && chartData.length === 7 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 mb-5 border-y border-[#ececec]">
            <div>
              <span className="text-[12px] text-[#979799] block">
                Zona de impulso principal
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-[22px] font-medium text-[#5d2a1a] tabular-nums">
                  {forecast.peakMomentumWindow}
                </span>
                <span className="text-[13px] text-[#777b86]">Días pico: {peakDaysLabel}</span>
              </div>
            </div>

            <div>
              <span className="text-[12px] text-[#979799] block">
                Ventana secundaria óptima
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-[22px] font-medium text-[#17191c] tabular-nums">
                  {forecast.secondaryMomentumWindow}
                </span>
                <span className="text-[13px] text-[#777b86]">Bloque de respaldo</span>
              </div>
            </div>

            <div>
              <span className="text-[12px] text-[#979799] block">
                Impulso semanal proyectado
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-[22px] font-medium text-[#17191c] tabular-nums">
                  {projectedWeeklyAvg}%
                </span>
                <span className="text-[13px] text-[#5d2a1a] tabular-nums inline-flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  {projectedDelta >= 0 ? `+${projectedDelta}%` : `${projectedDelta}%`} vs base ({baselineWeeklyAvg}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-[#777b86] mb-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-[#5d2a1a] inline-block rounded-full" />
              <span className="text-[#17191c] font-medium">Impulso predicho (IA)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#a3a6af] inline-block" />
              <span>Línea base histórica</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#fbe1d1] border border-[#e5b89e] inline-block" />
              <span>Zona de impulso pico</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#f2f2f3] border border-[#dcdce0] inline-block" />
              <span>Zona de recuperación</span>
            </span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 16, left: -16, bottom: 4 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(23,25,28,0.06)"
                  vertical={false}
                />

                {chartData.map((pt) =>
                  pt.zoneType !== 'steady' ? (
                    <ReferenceArea
                      key={`zone-${pt.dayOfWeek}`}
                      x1={pt.dayIndex - 0.42}
                      x2={pt.dayIndex + 0.42}
                      fill={pt.zoneType === 'peak' ? '#fbe1d1' : '#f2f2f3'}
                      fillOpacity={pt.zoneType === 'peak' ? 0.55 : 0.85}
                      strokeOpacity={0}
                    />
                  ) : null
                )}

                <XAxis
                  dataKey="dayIndex"
                  type="number"
                  domain={[-0.45, 6.45]}
                  ticks={[0, 1, 2, 3, 4, 5, 6]}
                  tickFormatter={(val: number) => WEEK_DAY_LABELS[val] ?? ''}
                  stroke="#a3a6af"
                  tick={{ fill: '#777b86', fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: '#ececec' }}
                />
                <YAxis
                  stroke="#a3a6af"
                  tick={{ fill: '#777b86', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  unit="%"
                />

                <Tooltip
                  cursor={{ stroke: 'rgba(93, 42, 26, 0.3)', strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const pt = payload[0].payload as ChartForecastPoint;
                    const zoneLabel =
                      pt.zoneType === 'peak'
                        ? 'Zona de Impulso Pico'
                        : pt.zoneType === 'risk'
                        ? 'Zona de Recuperación'
                        : 'Zona Estable';

                    return (
                      <div className="max-w-xs steep-popover px-3.5 py-2.5 text-[12px] space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-[#17191c]">{pt.dayLabel}</span>
                          <span className="text-[11px] text-[#5d2a1a]">{zoneLabel}</span>
                        </div>
                        <p className="text-[#5d2a1a] font-medium tabular-nums">
                          Impulso predicho: {pt.predictedScore}%{' '}
                          <span className="text-[#777b86] font-normal">
                            (base {pt.baselineRate}%)
                          </span>
                        </p>
                        <p className="text-[#17191c] tabular-nums">
                          Ventana óptima: <strong className="font-medium">{pt.optimalWindow}</strong>
                        </p>
                        <p className="text-[#777b86] text-[11px] leading-relaxed pt-0.5">
                          {pt.focusTip}
                        </p>
                      </div>
                    );
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="baselineRate"
                  name="Línea base histórica"
                  stroke="#a3a6af"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#a3a6af', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#777b86', stroke: '#ffffff', strokeWidth: 2 }}
                />

                <Line
                  type="monotone"
                  dataKey="predictedScore"
                  name="Impulso predicho (IA)"
                  stroke="#5d2a1a"
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props as {
                      cx?: number;
                      cy?: number;
                      payload?: ChartForecastPoint;
                    };
                    if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) {
                      return <g key="empty" />;
                    }
                    const fill =
                      payload.zoneType === 'peak'
                        ? '#5d2a1a'
                        : payload.zoneType === 'risk'
                        ? '#777b86'
                        : '#17191c';
                    return (
                      <circle
                        key={`dot-${payload.dayIndex}`}
                        cx={cx}
                        cy={cy}
                        r={payload.zoneType === 'peak' ? 5 : 4}
                        fill={fill}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 6, fill: '#5d2a1a', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {forecast.habitTimeRecommendations.length > 0 && (
            <div className="mt-6 pt-5 border-t border-[#ececec]">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-[15px] font-medium text-[#17191c] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#17191c] shrink-0" />
                  <span>Horarios óptimos recomendados</span>
                </h3>
                <span className="text-[12px] text-[#979799]">
                  Ajusta tus recordatorios en 1 clic
                </span>
              </div>

              <div className="divide-y divide-[#ececec]">
                {forecast.habitTimeRecommendations.map((rec) => {
                  const liveHabit = habitMap.get(rec.habitId);
                  const category = liveHabit
                    ? categoryMap.get(liveHabit.categoryId)
                    : undefined;
                  const liveTime = liveHabit?.reminderTime || '';
                  const isApplied = liveTime === rec.suggestedOptimalTime;

                  return (
                    <div
                      key={rec.habitId}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: category?.colorHex || '#17191c' }}
                          />
                          <span className="font-medium text-[#17191c] truncate">
                            {liveHabit?.title || rec.habitTitle}
                          </span>
                          <span className="text-[#a3a6af]">·</span>
                          <span className="text-[#777b86] tabular-nums inline-flex items-center gap-1">
                            <span>{liveTime || 'Sin horario'}</span>
                            <ArrowRight className="w-3 h-3 text-[#979799]" />
                            <strong className="font-medium text-[#17191c]">
                              {rec.suggestedOptimalTime}
                            </strong>
                          </span>
                          <span className="text-[#a3a6af]">·</span>
                          <span className="text-[#5d2a1a] font-medium tabular-nums">
                            +{rec.expectedLiftPercent}% prob.
                          </span>
                        </div>
                        <p className="text-[13px] text-[#777b86] leading-relaxed pl-4">
                          {rec.rationale}
                        </p>
                      </div>

                      {onApplyReminderTime && (
                        <button
                          type="button"
                          disabled={isApplied}
                          onClick={() =>
                            onApplyReminderTime(rec.habitId, rec.suggestedOptimalTime)
                          }
                          className={`px-4 py-1.5 rounded-full text-[12px] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer ${
                            isApplied
                              ? 'bg-[#f2f2f3] text-[#777b86] cursor-default'
                              : 'bg-[#17191c] hover:bg-[#2a2d32] text-white'
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span>Aplicado</span>
                            </>
                          ) : (
                            <span>Aplicar {rec.suggestedOptimalTime}</span>
                          )}
                        </button>
                      )}
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
