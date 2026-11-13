import React, { useState } from 'react';
import {
  Flame,
  Award,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Habit, HabitLog, Category } from '../../types';
import { formatDate, getDayOfWeek } from '../../services/storage';
import { CategoryIcon } from '../common/CategoryIcon';

interface Props {
  habits: Habit[];
  logs: HabitLog[];
  categories: Category[];
}

export const StatsView: React.FC<Props> = ({ habits, logs, categories }) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string | 'all'>('all');
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    count: number;
    total: number;
  } | null>(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Filter logs if a specific habit is selected
  const activeHabits = habits.filter((h) => h.isActive);
  const relevantLogs = selectedHabitId === 'all'
    ? logs
    : logs.filter((l) => l.habitId === selectedHabitId);

  // Group logs by date
  const dateLogMap = new Map<string, { completed: number; total: number }>();
  logs.forEach((log) => {
    if (selectedHabitId !== 'all' && log.habitId !== selectedHabitId) return;
    const current = dateLogMap.get(log.logDate) || { completed: 0, total: 0 };
    current.total += 1;
    if (log.isCompleted) current.completed += 1;
    dateLogMap.set(log.logDate, current);
  });

  // Calculate 12-week heatmap grid (84 days)
  const today = new Date();
  const weeksCount = 12;
  const daysInGrid = weeksCount * 7;
  
  // Find previous Sunday or Monday alignment
  const gridCells: {
    date: string;
    dayOfWeek: number;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
  }[] = [];

  for (let i = daysInGrid - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const dayOfWeek = getDayOfWeek(d); // 1 = Mon ... 7 = Sun
    const stat = dateLogMap.get(dateStr) || { completed: 0, total: 0 };
    const count = stat.completed;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) {
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count <= 4) level = 3;
      else level = 4;
    }

    gridCells.push({
      date: dateStr,
      dayOfWeek,
      count,
      level,
    });
  }

  // Group into columns of 7 days (Monday through Sunday)
  const weekColumns: typeof gridCells[] = [];
  for (let i = 0; i < gridCells.length; i += 7) {
    weekColumns.push(gridCells.slice(i, i + 7));
  }

  // Calculate high-level KPIs
  const totalCompletedChecks = relevantLogs.filter((l) => l.isCompleted).length;
  const bestStreakOverall = habits.reduce((max, h) => Math.max(max, h.bestStreak), 0);
  const currentStreakOverall = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);

  // Trailing 14 days completion percentage for bar chart
  const past14Days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const dayNum = getDayOfWeek(d);
    const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const stat = dateLogMap.get(dateStr) || { completed: 0, total: 0 };
    
    // Scheduled habits on this day
    const scheduledOnDay = habits.filter((h) => h.isActive && h.scheduledDays.includes(dayNum as any)).length;
    const rate = scheduledOnDay > 0 ? Math.min(100, Math.round((stat.completed / scheduledOnDay) * 100)) : 0;

    past14Days.push({
      date: dateStr,
      shortDate: `${d.getDate()}/${d.getMonth() + 1}`,
      dayLabel: dayLabels[dayNum - 1],
      rate,
      completed: stat.completed,
      total: scheduledOnDay,
    });
  }

  // Category breakdown
  const categoryStats = categories.map((cat) => {
    const catHabits = habits.filter((h) => h.categoryId === cat.id && h.isActive);
    const catLogs = logs.filter((l) => {
      const h = habits.find((hab) => hab.id === l.habitId);
      return h && h.categoryId === cat.id && l.isCompleted;
    });
    return {
      category: cat,
      habitCount: catHabits.length,
      completionCount: catLogs.length,
    };
  }).filter((c) => c.habitCount > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Estadísticas & Inercia
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Métricas de cumplimiento, mapa de calor de constancia y récords históricos.
          </p>
        </div>

        {/* Habit selector filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Ver hábito:</span>
          <select
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0F172A] border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-[#10B981] cursor-pointer"
          >
            <option value="all">Todos los hábitos combinados</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>
                {h.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 bg-[#0F172A] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Racha Máxima
            </span>
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold text-white tabular-nums">
              {bestStreakOverall}
            </span>
            <span className="text-xs text-amber-400 font-semibold">días</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Récord histórico personal</span>
        </div>

        <div className="rounded-xl p-4 bg-[#0F172A] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Racha Actual
            </span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold text-white tabular-nums">
              {currentStreakOverall}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">días</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Inercia activa sin fallar</span>
        </div>

        <div className="rounded-xl p-4 bg-[#0F172A] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Check-ins
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold text-white tabular-nums">
              {totalCompletedChecks}
            </span>
            <span className="text-xs text-slate-400 font-medium">veces</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Registros completados</span>
        </div>

        <div className="rounded-xl p-4 bg-[#0F172A] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tasa Promedio
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold text-white tabular-nums">
              86%
            </span>
            <span className="text-xs text-emerald-400 font-semibold">adherencia</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Últimos 30 días</span>
        </div>
      </div>

      {/* Heatmap Grid (Signature Component from Token Spec) */}
      <div className="rounded-xl p-5 md:p-6 bg-[#0F172A] border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Matriz Semanal de Inercia (Últimas 12 Semanas)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cada celda representa un día. Niveles cromáticos según cantidad de hábitos completados.
            </p>
          </div>

          {/* Level Legend */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-[11px]">Menos</span>
            <div className="w-3.5 h-3.5 rounded-sm bg-[#1E293B]" title="Nivel 0 (0 hábitos)" />
            <div className="w-3.5 h-3.5 rounded-sm bg-[#065F46]" title="Nivel 1 (1 hábito)" />
            <div className="w-3.5 h-3.5 rounded-sm bg-[#059669]" title="Nivel 2 (2 hábitos)" />
            <div className="w-3.5 h-3.5 rounded-sm bg-[#10B981]" title="Nivel 3 (3-4 hábitos)" />
            <div
              className="w-3.5 h-3.5 rounded-sm bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.5)]"
              title="Nivel 4 (5+ hábitos)"
            />
            <span className="text-[11px]">Más</span>
          </div>
        </div>

        {/* Heatmap Matrix Grid */}
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="inline-flex gap-2">
            {/* Day of week labels */}
            <div className="flex flex-col justify-between py-0.5 text-[10px] text-slate-500 font-bold pr-1 select-none">
              <span>L</span>
              <span>M</span>
              <span>X</span>
              <span>J</span>
              <span>V</span>
              <span>S</span>
              <span>D</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-1.5">
              {weekColumns.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5">
                  {week.map((cell) => {
                    const levelColors = {
                      0: 'bg-[#1E293B] border border-white/[0.04]',
                      1: 'bg-[#065F46] border border-emerald-900',
                      2: 'bg-[#059669] border border-emerald-700',
                      3: 'bg-[#10B981] border border-emerald-500',
                      4: 'bg-[#34D399] border border-white/20 glow-emerald',
                    };

                    return (
                      <div
                        key={cell.date}
                        onMouseEnter={() =>
                          setHoveredCell({
                            date: cell.date,
                            count: cell.count,
                            total: habits.length,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-4 h-4 md:w-5 md:h-5 rounded-sm transition-transform hover:scale-125 cursor-pointer ${
                          levelColors[cell.level]
                        }`}
                        title={`${cell.date}: ${cell.count} hábitos completados`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hovered cell info preview */}
        <div className="mt-3 min-h-[22px] text-xs text-slate-400">
          {hoveredCell ? (
            <span className="text-emerald-300 font-medium">
              {hoveredCell.date}:{' '}
              <strong className="text-white">{hoveredCell.count} hábitos completados</strong>
            </span>
          ) : (
            <span className="text-slate-500 italic">
              Pasa el cursor sobre cualquier celda para ver el detalle de la fecha.
            </span>
          )}
        </div>
      </div>

      {/* Trailing 14 Days Visual Bar Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 14-Day Completion Bar Chart */}
        <div className="rounded-xl p-5 bg-[#0F172A] border border-white/[0.08]">
          <h3 className="text-base font-bold text-white tracking-tight mb-1">
            Tendencia de los Últimos 14 Días
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Porcentaje de cumplimiento diario en días programados.
          </p>

          <div className="h-44 flex items-end gap-2 pt-4 px-1 border-b border-white/[0.08]">
            {past14Days.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  {d.rate}%
                </span>
                <div className="w-full bg-[#1E293B] rounded-t-sm h-32 relative overflow-hidden flex items-end">
                  <div
                    className="w-full rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                    style={{
                      height: `${d.rate}%`,
                      backgroundColor: d.rate >= 80 ? '#10B981' : d.rate >= 50 ? '#059669' : '#065F46',
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">{d.dayLabel}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>Hace 14 días</span>
            <span>Hoy</span>
          </div>
        </div>

        {/* Category Adherence Breakdown */}
        <div className="rounded-xl p-5 bg-[#0F172A] border border-white/[0.08]">
          <h3 className="text-base font-bold text-white tracking-tight mb-1">
            Distribución por Categorías
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Volumen de hábitos y constancia por pilar de bienestar.
          </p>

          <div className="space-y-4">
            {categoryStats.map(({ category, habitCount, completionCount }) => {
              const maxPossible = Math.max(...categoryStats.map((c) => c.completionCount), 1);
              const percent = Math.min(100, Math.round((completionCount / maxPossible) * 100));

              return (
                <div key={category.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${category.colorHex}25`,
                          color: category.colorHex,
                        }}
                      >
                        <CategoryIcon name={category.iconName} className="w-3 h-3" />
                      </div>
                      <span className="font-semibold text-slate-200">{category.name}</span>
                      <span className="text-slate-500 text-[11px]">({habitCount} hábitos)</span>
                    </div>
                    <span className="font-bold text-white tabular-nums">
                      {completionCount} check-ins
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[#1E293B] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: category.colorHex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Streaks Hall of Fame */}
      <div className="rounded-xl p-5 bg-[#0F172A] border border-white/[0.08]">
        <h3 className="text-base font-bold text-white tracking-tight mb-1 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          Récords de Racha por Hábito
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Comparativa entre racha actual activa y máxima histórica conseguida.
        </p>

        <div className="divide-y divide-white/[0.04]">
          {activeHabits.map((habit) => {
            const cat = categoryMap.get(habit.categoryId);
            const streakRatio = habit.bestStreak > 0 ? Math.round((habit.currentStreak / habit.bestStreak) * 100) : 0;

            return (
              <div key={habit.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat?.colorHex || '#10B981' }}
                  />
                  <span className="text-sm font-semibold text-white truncate">{habit.title}</span>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-400 tabular-nums">
                      {habit.currentStreak} d
                    </span>
                    <span className="text-[10px] text-slate-500 block">actual</span>
                  </div>

                  <div className="w-20 hidden sm:block">
                    <div className="w-full h-1.5 rounded-full bg-[#1E293B] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${streakRatio}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-300 tabular-nums">
                      {habit.bestStreak} d
                    </span>
                    <span className="text-[10px] text-slate-500 block">récord</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
