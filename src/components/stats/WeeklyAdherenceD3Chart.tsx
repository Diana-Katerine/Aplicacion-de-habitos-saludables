import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TrendingUp } from 'lucide-react';
import { DayOfWeek, Habit, HabitLog } from '../../types';
import { formatDate, getDayOfWeek, getTodayDateString } from '../../services/storage';

interface Props {
  habits: Habit[];
  logs: HabitLog[];
  selectedHabitId: string | 'all';
  timezone?: string;
  isDark?: boolean;
}

interface WeekDayPoint {
  date: string;
  dayShort: string;
  dayFull: string;
  dateLabel: string;
  dayNum: DayOfWeek;
  completed: number;
  scheduled: number;
  rate: number | null;
  isToday: boolean;
  isFuture: boolean;
  isRestDay: boolean;
}

const DAY_SHORT_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_FULL_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const WeeklyAdherenceD3Chart: React.FC<Props> = ({
  habits,
  logs,
  selectedHabitId,
  timezone,
  isDark = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [hoveredDay, setHoveredDay] = useState<{
    point: WeekDayPoint;
    x: number;
    y: number;
  } | null>(null);

  const { weekPoints, weekRangeLabel, averageRate, totalCompleted, totalScheduled } = useMemo(() => {
    const todayStr = getTodayDateString(timezone);
    const parts = todayStr.split('-').map(Number);
    const todayAnchor =
      parts.length === 3 && parts.every((n) => !Number.isNaN(n))
        ? new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
        : new Date();

    const todayDayNum = getDayOfWeek(todayAnchor);
    const monday = new Date(todayAnchor);
    monday.setDate(todayAnchor.getDate() - (todayDayNum - 1));

    const targetHabits =
      selectedHabitId === 'all'
        ? habits.filter((h) => h.isActive && !h.deletedAt)
        : habits.filter((h) => h.id === selectedHabitId && !h.deletedAt);

    const targetHabitIds = new Set(targetHabits.map((h) => h.id));

    const completedByDate = new Map<string, Set<string>>();
    logs.forEach((log) => {
      if (!log.isCompleted || !targetHabitIds.has(log.habitId)) return;
      const set = completedByDate.get(log.logDate) || new Set<string>();
      set.add(log.habitId);
      completedByDate.set(log.logDate, set);
    });

    const points: WeekDayPoint[] = [];
    let sumCompleted = 0;
    let sumScheduled = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatDate(d);
      const dayNum = (i + 1) as DayOfWeek;
      const isFuture = dateStr > todayStr;
      const isToday = dateStr === todayStr;

      const scheduledHabits = targetHabits.filter((h) => h.scheduledDays.includes(dayNum));
      const scheduled = scheduledHabits.length;
      const completedSet = completedByDate.get(dateStr);
      const completed = scheduledHabits.filter((h) => completedSet?.has(h.id)).length;
      const isRestDay = !isFuture && scheduled === 0;
      const rate =
        isFuture || scheduled === 0
          ? null
          : Math.min(100, Math.round((completed / scheduled) * 100));

      if (!isFuture) {
        sumCompleted += completed;
        sumScheduled += scheduled;
      }

      points.push({
        date: dateStr,
        dayShort: DAY_SHORT_LABELS[i],
        dayFull: DAY_FULL_LABELS[i],
        dateLabel: `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`,
        dayNum,
        completed,
        scheduled,
        rate,
        isToday,
        isFuture,
        isRestDay,
      });
    }

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const rangeStr = `${monday.getDate()} ${MONTH_SHORT[monday.getMonth()]} – ${sunday.getDate()} ${MONTH_SHORT[sunday.getMonth()]}`;
    const avg = sumScheduled > 0 ? Math.round((sumCompleted / sumScheduled) * 100) : 0;

    return {
      weekPoints: points,
      weekRangeLabel: rangeStr,
      averageRate: avg,
      totalCompleted: sumCompleted,
      totalScheduled: sumScheduled,
    };
  }, [habits, logs, selectedHabitId, timezone]);

  // Responsive ResizeObserver for crisp D3 SVG layout
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const nextWidth = Math.round(el.getBoundingClientRect().width);
      if (nextWidth > 0) setContainerWidth(nextWidth);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Render D3 Line Chart
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || containerWidth <= 0) return;

    const isCompact = containerWidth < 420;
    const height = 240;
    const margin = {
      top: 20,
      right: isCompact ? 12 : 22,
      bottom: 32,
      left: isCompact ? 36 : 42,
    };
    const innerWidth = Math.max(120, containerWidth - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${containerWidth} ${height}`);

    const accentColor = isDark ? '#34d399' : '#059669';
    const gridColor = isDark ? 'rgba(241, 245, 249, 0.08)' : 'rgba(23, 25, 28, 0.07)';
    const axisLineColor = isDark ? '#252e3a' : '#ececec';
    const tickTextColor = isDark ? '#9aa4b2' : '#777b86';
    const todayTextColor = isDark ? '#34d399' : '#059669';
    const futureTextColor = isDark ? '#475569' : '#a3a6af';
    const surfaceBg = isDark ? '#141920' : '#ffffff';

    const defs = svg.append('defs');
    const strokeGrad = defs
      .append('linearGradient')
      .attr('id', 'd3WeeklyAdherenceStroke')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    strokeGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', isDark ? '#34d399' : '#059669');
    strokeGrad
      .append('stop')
      .attr('offset', '50%')
      .attr('stop-color', isDark ? '#38bdf8' : '#0284C7');
    strokeGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', isDark ? '#c084fc' : '#7C3AED');

    const areaGrad = defs
      .append('linearGradient')
      .attr('id', 'd3WeeklyAdherenceArea')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', isDark ? '#38bdf8' : '#06B6D4')
      .attr('stop-opacity', isDark ? 0.34 : 0.28);

    areaGrad
      .append('stop')
      .attr('offset', '55%')
      .attr('stop-color', isDark ? '#34d399' : '#10B981')
      .attr('stop-opacity', isDark ? 0.14 : 0.11);

    areaGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', isDark ? '#c084fc' : '#7C3AED')
      .attr('stop-opacity', 0.0);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scalePoint<string>()
      .domain(weekPoints.map((p) => p.dayShort))
      .range([0, innerWidth])
      .padding(0.25);

    const yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Horizontal Y gridlines (0, 25, 50, 75, 100)
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickValues([0, 25, 50, 75, 100])
      .tickSize(-innerWidth)
      .tickFormat(() => '');

    g.append('g')
      .attr('class', 'grid-lines')
      .call(yAxisGrid)
      .call((sel) => sel.select('.domain').remove())
      .call((sel) =>
        sel
          .selectAll('.tick line')
          .attr('stroke', gridColor)
          .attr('stroke-dasharray', '3 3')
      );

    // Y Axis labels
    const yAxis = d3
      .axisLeft(yScale)
      .tickValues([0, 25, 50, 75, 100])
      .tickSize(0)
      .tickPadding(10)
      .tickFormat((d) => `${d}%`);

    g.append('g')
      .call(yAxis)
      .call((sel) => sel.select('.domain').remove())
      .call((sel) =>
        sel
          .selectAll('text')
          .attr('fill', tickTextColor)
          .attr('font-size', '11px')
          .style('font-variant-numeric', 'tabular-nums')
      );

    // X Axis
    const xAxis = d3.axisBottom(xScale).tickSize(0).tickPadding(12);

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup
      .select('.domain')
      .attr('stroke', axisLineColor);

    xAxisGroup.selectAll<SVGTextElement, string>('text').each(function (dayLabel) {
      const pt = weekPoints.find((p) => p.dayShort === dayLabel);
      d3.select(this)
        .attr('font-size', '12px')
        .attr('font-weight', pt?.isToday ? '600' : '400')
        .attr(
          'fill',
          pt?.isToday ? todayTextColor : pt?.isFuture ? futureTextColor : tickTextColor
        );
    });

    // Subtle weekly average reference line
    if (totalScheduled > 0) {
      const avgY = yScale(averageRate);
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', avgY)
        .attr('y2', avgY)
        .attr('stroke', isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.3)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4 4');
    }

    // Vertical marker for Today
    const todayPoint = weekPoints.find((p) => p.isToday);
    if (todayPoint) {
      const todayX = xScale(todayPoint.dayShort) ?? 0;
      g.append('line')
        .attr('x1', todayX)
        .attr('x2', todayX)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', accentColor)
        .attr('stroke-opacity', 0.2)
        .attr('stroke-width', 1);
    }

    const definedPoints = weekPoints.filter((p) => p.rate !== null);

    // Area under the adherence line
    if (definedPoints.length >= 2) {
      const areaGen = d3
        .area<WeekDayPoint>()
        .defined((d) => d.rate !== null)
        .x((d) => xScale(d.dayShort) ?? 0)
        .y0(innerHeight)
        .y1((d) => yScale(d.rate ?? 0))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(weekPoints)
        .attr('fill', 'url(#d3WeeklyAdherenceArea)')
        .attr('d', areaGen);
    }

    // D3 Adherence Line Path
    if (definedPoints.length >= 2) {
      const lineGen = d3
        .line<WeekDayPoint>()
        .defined((d) => d.rate !== null)
        .x((d) => xScale(d.dayShort) ?? 0)
        .y((d) => yScale(d.rate ?? 0))
        .curve(d3.curveMonotoneX);

      const linePath = g
        .append('path')
        .datum(weekPoints)
        .attr('fill', 'none')
        .attr('stroke', 'url(#d3WeeklyAdherenceStroke)')
        .attr('stroke-width', 2.8)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', lineGen);

      const totalLength = linePath.node()?.getTotalLength() ?? 0;
      if (totalLength > 0 && !prefersReducedMotion) {
        linePath
          .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(550)
          .ease(d3.easeCubicOut)
          .attr('stroke-dashoffset', 0)
          .on('end', () => {
            linePath.attr('stroke-dasharray', null);
          });
      }
    }

    // Future day baseline dots (subtle uncompleted markers along 0 line)
    g.selectAll('.future-dot')
      .data(weekPoints.filter((p) => p.isFuture))
      .enter()
      .append('circle')
      .attr('class', 'future-dot')
      .attr('cx', (d) => xScale(d.dayShort) ?? 0)
      .attr('cy', innerHeight)
      .attr('r', 2.5)
      .attr('fill', isDark ? '#334155' : '#d1d5db');

    // Data point nodes for elapsed days with scheduled habits
    const nodeGroups = g
      .selectAll('.adherence-node')
      .data(definedPoints)
      .enter()
      .append('g')
      .attr('class', 'adherence-node');

    // Soft outer halo for today's node
    nodeGroups
      .filter((d) => d.isToday)
      .append('circle')
      .attr('cx', (d) => xScale(d.dayShort) ?? 0)
      .attr('cy', (d) => yScale(d.rate ?? 0))
      .attr('r', 9)
      .attr('fill', accentColor)
      .attr('fill-opacity', 0.16);

    nodeGroups
      .append('circle')
      .attr('cx', (d) => xScale(d.dayShort) ?? 0)
      .attr('cy', (d) => yScale(d.rate ?? 0))
      .attr('r', (d) => (d.isToday ? 5 : 4))
      .attr('fill', (d) => (d.isToday ? accentColor : surfaceBg))
      .attr('stroke', accentColor)
      .attr('stroke-width', 2.25);

    // Value labels above points when width allows
    nodeGroups
      .append('text')
      .attr('x', (d) => xScale(d.dayShort) ?? 0)
      .attr('y', (d) => Math.max(10, yScale(d.rate ?? 0) - 11))
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', (d) => (d.isToday ? '600' : '500'))
      .attr('fill', (d) => (d.isToday ? accentColor : tickTextColor))
      .style('font-variant-numeric', 'tabular-nums')
      .text((d) => `${d.rate}%`);

    // Interactive invisible hit columns for hover tooltip across all 7 days
    const stepWidth = innerWidth / 7;
    g.selectAll('.day-hit-area')
      .data(weekPoints)
      .enter()
      .append('rect')
      .attr('class', 'day-hit-area')
      .attr('x', (d) => (xScale(d.dayShort) ?? 0) - stepWidth / 2)
      .attr('y', 0)
      .attr('width', stepWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseenter', function (_event, d) {
        const cx = (xScale(d.dayShort) ?? 0) + margin.left;
        const cy = (d.rate !== null ? yScale(d.rate) : innerHeight * 0.55) + margin.top;
        setHoveredDay({ point: d, x: cx, y: cy });
      })
      .on('click', function (_event, d) {
        const cx = (xScale(d.dayShort) ?? 0) + margin.left;
        const cy = (d.rate !== null ? yScale(d.rate) : innerHeight * 0.55) + margin.top;
        setHoveredDay((prev) =>
          prev?.point.date === d.date ? null : { point: d, x: cx, y: cy }
        );
      })
      .on('mouseleave', () => {
        setHoveredDay(null);
      });
  }, [weekPoints, containerWidth, isDark, averageRate, totalScheduled]);

  return (
    <section
      aria-label="Adherencia semanal en D3"
      className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#059669] dark:text-[#34d399] shrink-0" />
            <h2 className="text-[18px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
              Adherencia de la semana actual
            </h2>
          </div>
          <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-1 tabular-nums flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span>{weekRangeLabel}</span>
            <span aria-hidden="true" className="text-[#a3a6af] dark:text-[#6f7a8a]">·</span>
            <span>
              Promedio{' '}
              <strong className="font-medium text-[#059669] dark:text-[#34d399]">
                {averageRate}%
              </strong>
            </span>
            <span aria-hidden="true" className="text-[#a3a6af] dark:text-[#6f7a8a]">·</span>
            <span>{totalCompleted}/{totalScheduled} hábitos cumplidos</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[12px] text-[#777b86] dark:text-[#9aa4b2] shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 rounded-full bg-gradient-to-r from-[#059669] via-[#0284C7] to-[#7C3AED] dark:from-[#34d399] dark:via-[#38bdf8] dark:to-[#c084fc]" />
            <span>Adherencia diaria</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 border-t border-dashed border-[#0284C7] dark:border-[#38bdf8]" />
            <span>Media semanal</span>
          </span>
        </div>
      </div>

      {totalScheduled === 0 && weekPoints.every((p) => p.rate === null) ? (
        <div className="py-12 text-center text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
          No hay hábitos programados para los días transcurridos de esta semana.
        </div>
      ) : (
        <div ref={containerRef} className="relative w-full h-[240px]">
          <svg
            ref={svgRef}
            className="w-full h-full overflow-visible"
            role="img"
            aria-label="Gráfico de líneas D3 de adherencia a hábitos de lunes a domingo de la semana actual"
          />

          {hoveredDay && (
            <div
              className="pointer-events-none absolute z-20 steep-popover px-3.5 py-2.5 text-[12px] max-w-[min(220px,calc(100%-16px))] whitespace-normal sm:whitespace-nowrap -translate-x-1/2 -translate-y-full"
              style={{
                left: `${Math.min(Math.max(hoveredDay.x, 86), Math.max(86, containerWidth - 86))}px`,
                top: `${Math.max(58, hoveredDay.y - 12)}px`,
              }}
            >
              <p className="font-medium text-[#17191c] dark:text-[#f1f5f9]">
                {hoveredDay.point.dayFull}, {hoveredDay.point.dateLabel}
                {hoveredDay.point.isToday && (
                  <span className="ml-1.5 text-[#059669] dark:text-[#34d399]">· Hoy</span>
                )}
              </p>
              {hoveredDay.point.isFuture ? (
                <p className="text-[#777b86] dark:text-[#9aa4b2] mt-0.5 tabular-nums">
                  {hoveredDay.point.scheduled > 0
                    ? `${hoveredDay.point.scheduled} hábitos programados`
                    : 'Sin hábitos programados'}
                </p>
              ) : hoveredDay.point.isRestDay ? (
                <p className="text-[#777b86] dark:text-[#9aa4b2] mt-0.5">Día de descanso</p>
              ) : (
                <p className="text-[#059669] dark:text-[#34d399] font-medium mt-0.5 tabular-nums">
                  {hoveredDay.point.rate}% ({hoveredDay.point.completed}/{hoveredDay.point.scheduled} hábitos)
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
