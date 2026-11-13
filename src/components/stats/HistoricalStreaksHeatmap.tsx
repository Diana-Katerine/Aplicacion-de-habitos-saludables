import React, { useMemo, useState } from 'react';
import { Calendar, Flame, CheckCircle2, Sparkles } from 'lucide-react';
import { DayOfWeek, Habit, HabitLog } from '../../types';
import { formatDate, getDayOfWeek, getTodayDateString } from '../../services/storage';

interface Props {
  habits: Habit[];
  logs: HabitLog[];
  selectedHabitId: string | 'all';
  timezone?: string;
}

interface HeatmapDayCell {
  date: string;
  dayOfWeek: DayOfWeek;
  dayNumber: number;
  monthIndex: number;
  year: number;
  completedCount: number;
  scheduledCount: number;
  completedHabitTitles: string[];
  level: 0 | 1 | 2 | 3 | 4;
  formattedDate: string;
}

const MONTH_SHORT_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAY_FULL_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const WEEKDAY_ROW_LABELS = ['L', '', 'X', '', 'V', '', 'D'];

function getAnchorDate(timezone?: string): Date {
  const todayStr = getTodayDateString(timezone);
  const parts = todayStr.split('-').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

export const HistoricalStreaksHeatmap: React.FC<Props> = ({
  habits,
  logs,
  selectedHabitId,
  timezone,
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapDayCell | null>(null);
  const [pinnedDate, setPinnedDate] = useState<string | null>(null);

  const {
    weekColumns,
    monthMarkers,
    activeDaysCount,
    totalCompletions90d,
    longestStreak90d,
    currentStreak90d,
    peakDay,
    cellsByDate,
  } = useMemo(() => {
    const anchor = getAnchorDate(timezone);
    const habitMap = new Map(habits.map((h) => [h.id, h]));
    const activeHabits = habits.filter((h) => h.isActive);
    const selectedHabit =
      selectedHabitId === 'all' ? null : habits.find((h) => h.id === selectedHabitId) || null;

    const logsByDate = new Map<string, string[]>();
    logs.forEach((log) => {
      if (!log.isCompleted) return;
      if (selectedHabitId !== 'all' && log.habitId !== selectedHabitId) return;
      const existing = logsByDate.get(log.logDate) || [];
      if (!existing.includes(log.habitId)) {
        existing.push(log.habitId);
      }
      logsByDate.set(log.logDate, existing);
    });

    const daysList: HeatmapDayCell[] = [];
    const byDate = new Map<string, HeatmapDayCell>();

    for (let i = 89; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() - i);
      const dateStr = formatDate(d);
      const dayOfWeek = getDayOfWeek(d);
      const completedIds = logsByDate.get(dateStr) || [];
      const completedCount = completedIds.length;

      const scheduledCount = selectedHabit
        ? selectedHabit.scheduledDays.includes(dayOfWeek)
          ? 1
          : 0
        : activeHabits.filter((h) => h.scheduledDays.includes(dayOfWeek)).length;

      const completedHabitTitles = completedIds
        .map((id) => habitMap.get(id)?.title)
        .filter((t): t is string => Boolean(t));

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (completedCount > 0) {
        if (selectedHabit) {
          level = 4;
        } else if (scheduledCount > 0) {
          const ratio = completedCount / scheduledCount;
          if (ratio >= 1 || completedCount >= 5) level = 4;
          else if (ratio >= 0.65 || completedCount >= 3) level = 3;
          else if (ratio >= 0.35 || completedCount === 2) level = 2;
          else level = 1;
        } else {
          if (completedCount >= 4) level = 4;
          else if (completedCount === 3) level = 3;
          else if (completedCount === 2) level = 2;
          else level = 1;
        }
      }

      const cell: HeatmapDayCell = {
        date: dateStr,
        dayOfWeek,
        dayNumber: d.getDate(),
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        completedCount,
        scheduledCount,
        completedHabitTitles,
        level,
        formattedDate: `${WEEKDAY_FULL_ES[dayOfWeek - 1]} ${d.getDate()} ${MONTH_SHORT_ES[d.getMonth()]} ${d.getFullYear()}`,
      };

      daysList.push(cell);
      byDate.set(dateStr, cell);
    }

    const columns: (HeatmapDayCell | null)[][] = [];
    const firstDayOffset = daysList[0].dayOfWeek - 1;
    const paddedCells: (HeatmapDayCell | null)[] = [
      ...Array.from({ length: firstDayOffset }, () => null),
      ...daysList,
    ];
    while (paddedCells.length % 7 !== 0) {
      paddedCells.push(null);
    }
    for (let i = 0; i < paddedCells.length; i += 7) {
      columns.push(paddedCells.slice(i, i + 7));
    }

    const markers: { colIndex: number; label: string }[] = [];
    let lastMonthKey = '';
    columns.forEach((col, colIdx) => {
      const firstValid = col.find((c): c is HeatmapDayCell => c !== null);
      if (!firstValid) return;
      const monthStarter = col.find((c) => c !== null && c.dayNumber === 1) || firstValid;
      const monthKey = `${monthStarter.year}-${monthStarter.monthIndex}`;
      if (monthKey !== lastMonthKey) {
        if (markers.length > 0 && colIdx - markers[markers.length - 1].colIndex < 2) {
          markers[markers.length - 1] = {
            colIndex: colIdx,
            label: MONTH_SHORT_ES[monthStarter.monthIndex],
          };
        } else {
          markers.push({
            colIndex: colIdx,
            label: MONTH_SHORT_ES[monthStarter.monthIndex],
          });
        }
        lastMonthKey = monthKey;
      }
    });

    let activeDays = 0;
    let totalCompletions = 0;
    let longest = 0;
    let running = 0;
    let bestDay: HeatmapDayCell | null = null;

    daysList.forEach((cell) => {
      totalCompletions += cell.completedCount;
      if (cell.completedCount > 0) {
        activeDays += 1;
        running += 1;
        if (running > longest) longest = running;
        if (!bestDay || cell.completedCount > bestDay.completedCount) {
          bestDay = cell;
        }
      } else {
        running = 0;
      }
    });

    let trailing = 0;
    for (let i = daysList.length - 1; i >= 0; i--) {
      if (daysList[i].completedCount > 0) {
        trailing += 1;
      } else if (i === daysList.length - 1) {
        continue;
      } else {
        break;
      }
    }

    return {
      weekColumns: columns,
      monthMarkers: markers,
      activeDaysCount: activeDays,
      totalCompletions90d: totalCompletions,
      longestStreak90d: longest,
      currentStreak90d: trailing,
      peakDay: bestDay as HeatmapDayCell | null,
      cellsByDate: byDate,
    };
  }, [habits, logs, selectedHabitId, timezone]);

  const activeInspectCell =
    hoveredCell || (pinnedDate ? cellsByDate.get(pinnedDate) || null : null);

  // Steep Kraft-Paper Tonal Scale: Mist Gray -> Blush Peach -> Sienna Brown
  const levelClasses: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: 'bg-[#f2f2f3] border border-[#e5e5e8]',
    1: 'bg-[#fbe1d1] border border-[#f2ceb8]',
    2: 'bg-[#e5b89e] border border-[#d69f80]',
    3: 'bg-[#9b5741] border border-[#824431]',
    4: 'bg-[#5d2a1a] border border-[#481e11]',
  };

  return (
    <section
      aria-label="Calendario de rachas históricas de los últimos 90 días"
      className="rounded-[24px] p-6 bg-white border border-[#ececec]"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-[18px] font-medium text-[#17191c] tracking-[-0.01em] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#5d2a1a] shrink-0" />
            <span>Calendario de rachas históricas (últimos 90 días)</span>
          </h3>
          <p className="text-[13px] text-[#777b86] mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="tabular-nums">
              <strong className="font-medium text-[#17191c]">{totalCompletions90d}</strong> hábitos completados
            </span>
            <span aria-hidden="true" className="text-[#a3a6af]">·</span>
            <span className="tabular-nums">
              <strong className="font-medium text-[#17191c]">{activeDaysCount}/90</strong> días activos
            </span>
            <span aria-hidden="true" className="text-[#a3a6af]">·</span>
            <span className="tabular-nums">
              Mejor racha 90d: <strong className="font-medium text-[#5d2a1a]">{longestStreak90d} días</strong>
            </span>
            <span aria-hidden="true" className="text-[#a3a6af]">·</span>
            <span className="tabular-nums">
              Constancia actual: <strong className="font-medium text-[#17191c]">{currentStreak90d} días</strong>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[12px] text-[#777b86] shrink-0">
          <span>Menos</span>
          {([0, 1, 2, 3, 4] as const).map((lvl) => (
            <span
              key={lvl}
              className={`w-3.5 h-3.5 rounded-[4px] inline-block ${levelClasses[lvl]}`}
              title={`Nivel ${lvl}`}
            />
          ))}
          <span>Más</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full sm:min-w-0">
          <div className="flex items-center gap-2 mb-1.5 pl-6">
            <div
              className="grid gap-1.5 text-[11px] text-[#777b86] capitalize"
              style={{
                gridTemplateColumns: `repeat(${weekColumns.length}, minmax(18px, 1fr))`,
              }}
            >
              {weekColumns.map((_, colIdx) => {
                const marker = monthMarkers.find((m) => m.colIndex === colIdx);
                return (
                  <div key={colIdx} className="w-[18px] md:w-5 h-4 relative overflow-visible">
                    {marker && (
                      <span className="absolute left-0 top-0 whitespace-nowrap">
                        {marker.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="grid grid-rows-7 gap-1.5 text-[10px] font-medium text-[#979799] pr-1 select-none w-4">
              {WEEKDAY_ROW_LABELS.map((label, idx) => (
                <span key={idx} className="h-[18px] md:h-5 flex items-center justify-end">
                  {label}
                </span>
              ))}
            </div>

            <div className="flex gap-1.5">
              {weekColumns.map((week, wIdx) => (
                <div key={wIdx} className="grid grid-rows-7 gap-1.5">
                  {week.map((cell, rIdx) => {
                    if (!cell) {
                      return (
                        <div
                          key={`empty-${wIdx}-${rIdx}`}
                          className="w-[18px] h-[18px] md:w-5 md:h-5"
                          aria-hidden="true"
                        />
                      );
                    }

                    const isPinned = pinnedDate === cell.date;
                    return (
                      <button
                        key={cell.date}
                        type="button"
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onFocus={() => setHoveredCell(cell)}
                        onBlur={() => setHoveredCell(null)}
                        onClick={() =>
                          setPinnedDate((prev) => (prev === cell.date ? null : cell.date))
                        }
                        aria-label={`${cell.formattedDate}: ${cell.completedCount} hábitos completados`}
                        title={`${cell.formattedDate}: ${cell.completedCount} completados`}
                        className={`w-[18px] h-[18px] md:w-5 md:h-5 rounded-[4px] transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17191c] cursor-pointer ${
                          levelClasses[cell.level]
                        } ${isPinned ? 'ring-2 ring-[#17191c] scale-110' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Inspection */}
      <div className="mt-4 pt-3.5 border-t border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[13px] min-h-[28px]">
        {activeInspectCell ? (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="font-medium text-[#17191c] inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#5d2a1a] shrink-0" />
              {activeInspectCell.formattedDate}
            </span>
            <span aria-hidden="true" className="text-[#a3a6af]">·</span>
            <span className="text-[#17191c] tabular-nums">
              {activeInspectCell.completedCount}{' '}
              {activeInspectCell.completedCount === 1 ? 'hábito completado' : 'hábitos completados'}
              {activeInspectCell.scheduledCount > 0
                ? ` de ${activeInspectCell.scheduledCount} programados`
                : ''}
            </span>
            {activeInspectCell.completedHabitTitles.length > 0 && (
              <>
                <span aria-hidden="true" className="text-[#a3a6af]">·</span>
                <span className="text-[#777b86] truncate max-w-xl">
                  {activeInspectCell.completedHabitTitles.join(' · ')}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[#777b86]">
            <Sparkles className="w-3.5 h-3.5 text-[#979799] shrink-0" />
            <span>
              Pasa el cursor o haz clic en cualquier cuadro para inspeccionar los hábitos completados de ese día.
            </span>
          </div>
        )}

        {peakDay && (
          <span className="text-[12px] text-[#777b86] inline-flex items-center gap-1 whitespace-nowrap shrink-0 tabular-nums">
            <Flame className="w-3.5 h-3.5 text-[#5d2a1a] shrink-0" />
            Pico 90d: <strong className="text-[#17191c] font-medium">{peakDay.completedCount}</strong> ({peakDay.date.slice(5)})
          </span>
        )}
      </div>
    </section>
  );
};
