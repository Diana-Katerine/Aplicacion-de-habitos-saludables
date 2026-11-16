import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Flame, Trophy } from 'lucide-react';
import { Habit } from '../../types';

interface Props {
  habits: Habit[];
  selectedHabitId: string | 'all';
  isDark?: boolean;
}

interface StreakChartDatum {
  id: string;
  label: string;
  shortLabel: string;
  currentStreak: number;
  bestStreak: number;
  ratioPercent: number;
  isAtRecord: boolean;
}

function truncateLabel(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trim()}…`;
}

function roundedTopBarPath(x: number, y: number, width: number, height: number, radius: number): string {
  if (height <= 0 || width <= 0) {
    return `M ${x} ${y} h ${Math.max(0, width)} v 0 h -${Math.max(0, width)} Z`;
  }
  const r = Math.min(radius, width / 2, height);
  return [
    `M ${x} ${y + height}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${y + height}`,
    'Z',
  ].join(' ');
}

export const StreakComparisonBarChart: React.FC<Props> = ({
  habits,
  selectedHabitId,
  isDark = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [hoveredItem, setHoveredItem] = useState<{
    datum: StreakChartDatum;
    x: number;
    y: number;
  } | null>(null);

  const { chartData, maxCurrent, maxHistorical, progressPercent } = useMemo(() => {
    const filtered =
      selectedHabitId === 'all'
        ? habits.filter((h) => h.isActive && !h.deletedAt)
        : habits.filter((h) => h.id === selectedHabitId && !h.deletedAt);

    const data: StreakChartDatum[] = filtered
      .map((h) => {
        const current = Math.max(0, h.currentStreak || 0);
        const best = Math.max(current, h.bestStreak || 0);
        const ratio = best > 0 ? Math.min(100, Math.round((current / best) * 100)) : 0;
        return {
          id: h.id,
          label: h.title,
          shortLabel: truncateLabel(h.title, filtered.length > 5 ? 12 : 16),
          currentStreak: current,
          bestStreak: best,
          ratioPercent: ratio,
          isAtRecord: best > 0 && current >= best,
        };
      })
      .sort((a, b) => b.bestStreak - a.bestStreak || b.currentStreak - a.currentStreak)
      .slice(0, 8);

    const topCurr = data.reduce((max, d) => Math.max(max, d.currentStreak), 0);
    const topHist = data.reduce((max, d) => Math.max(max, d.bestStreak), 0);
    const overallPct = topHist > 0 ? Math.min(100, Math.round((topCurr / topHist) * 100)) : 0;

    return {
      chartData: data,
      maxCurrent: topCurr,
      maxHistorical: topHist,
      progressPercent: overallPct,
    };
  }, [habits, selectedHabitId]);

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

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || containerWidth <= 0 || chartData.length === 0) return;

    const isCompact = containerWidth < 460;
    const estBand = (containerWidth - (isCompact ? 46 : 62)) / Math.max(1, chartData.length);
    const shouldRotateLabels = estBand < 68 && chartData.length > 3;
    const height = shouldRotateLabels ? 276 : 250;
    const margin = {
      top: 24,
      right: isCompact ? 10 : 20,
      bottom: shouldRotateLabels ? 68 : 42,
      left: isCompact ? 34 : 42,
    };
    const innerWidth = Math.max(120, containerWidth - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${containerWidth} ${height}`);

    const currentColor = isDark ? '#fb923c' : '#EA580C';
    const currentLight = isDark ? '#fdba74' : '#f97316';
    const bestColor = isDark ? '#818cf8' : '#4F46E5';
    const bestLight = isDark ? '#a5b4fc' : '#6366F1';
    const gridColor = isDark ? 'rgba(241, 245, 249, 0.08)' : 'rgba(23, 25, 28, 0.07)';
    const axisLineColor = isDark ? '#252e3a' : '#ececec';
    const tickTextColor = isDark ? '#9aa4b2' : '#777b86';
    const strongTextColor = isDark ? '#f1f5f9' : '#17191c';

    const defs = svg.append('defs');

    const currGrad = defs
      .append('linearGradient')
      .attr('id', 'd3StreakCurrentGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    currGrad.append('stop').attr('offset', '0%').attr('stop-color', currentLight);
    currGrad.append('stop').attr('offset', '100%').attr('stop-color', currentColor);

    const bestGrad = defs
      .append('linearGradient')
      .attr('id', 'd3StreakBestGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    bestGrad.append('stop').attr('offset', '0%').attr('stop-color', bestLight);
    bestGrad.append('stop').attr('offset', '100%').attr('stop-color', bestColor);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x0 = d3
      .scaleBand<string>()
      .domain(chartData.map((d) => d.id))
      .range([0, innerWidth])
      .paddingInner(0.3)
      .paddingOuter(0.14);

    const x1 = d3
      .scaleBand<'current' | 'best'>()
      .domain(['current', 'best'])
      .range([0, x0.bandwidth()])
      .padding(0.16);

    const maxVal = Math.max(
      5,
      d3.max(chartData, (d) => Math.max(d.currentStreak, d.bestStreak)) || 5
    );
    const yDomainMax = Math.ceil(maxVal * 1.15);

    const y = d3.scaleLinear().domain([0, yDomainMax]).nice(4).range([innerHeight, 0]);

    // Horizontal Y gridlines
    const yTicks = y.ticks(4).filter((t) => Number.isInteger(t));
    const yAxisGrid = d3
      .axisLeft(y)
      .tickValues(yTicks)
      .tickSize(-innerWidth)
      .tickFormat(() => '');

    g.append('g')
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
      .axisLeft(y)
      .tickValues(yTicks)
      .tickSize(0)
      .tickPadding(10)
      .tickFormat((d) => `${d}d`);

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
    const maxDynamicChars = Math.max(6, Math.min(16, Math.floor(x0.bandwidth() / 6.8)));
    const labelMap = new Map(
      chartData.map((d) => [d.id, truncateLabel(d.label, shouldRotateLabels ? 14 : maxDynamicChars)])
    );
    const xAxis = d3
      .axisBottom(x0)
      .tickSize(0)
      .tickPadding(shouldRotateLabels ? 8 : 12)
      .tickFormat((id) => labelMap.get(id) || id);

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', axisLineColor);
    const xTextSel = xAxisGroup
      .selectAll('text')
      .attr('fill', tickTextColor)
      .attr('font-size', isCompact || chartData.length > 6 ? '10.5px' : '12px')
      .attr('font-weight', '500');

    if (shouldRotateLabels) {
      xTextSel
        .attr('text-anchor', 'end')
        .attr('dx', '-0.4em')
        .attr('dy', '0.25em')
        .attr('transform', 'rotate(-30)');
    }

    // Grouped bars per habit
    const maxBarWidth = 36;
    const rawSubBandwidth = x1.bandwidth();
    const barWidth = Math.min(maxBarWidth, rawSubBandwidth);
    const barCenterOffset = (rawSubBandwidth - barWidth) / 2;

    const groups = g
      .selectAll('.streak-group')
      .data(chartData)
      .enter()
      .append('g')
      .attr('class', 'streak-group')
      .attr('transform', (d) => `translate(${x0(d.id) ?? 0},0)`);

    // Subtle hover highlight column
    groups
      .append('rect')
      .attr('class', 'hover-bg')
      .attr('x', -4)
      .attr('y', 0)
      .attr('width', x0.bandwidth() + 8)
      .attr('height', innerHeight)
      .attr('rx', 10)
      .attr('fill', isDark ? 'rgba(241, 245, 249, 0.04)' : 'rgba(23, 25, 28, 0.03)')
      .attr('opacity', 0);

    const renderSeriesBar = (
      series: 'current' | 'best',
      fillUrl: string,
      valueAccessor: (d: StreakChartDatum) => number,
      textColor: string
    ) => {
      const xPos = (x1(series) ?? 0) + barCenterOffset;
      const paths = groups
        .append('path')
        .attr('fill', fillUrl)
        .attr('d', (d) => {
          const val = valueAccessor(d);
          if (prefersReducedMotion) {
            const barY = y(val);
            return roundedTopBarPath(xPos, barY, barWidth, Math.max(0, innerHeight - barY), 6);
          }
          return roundedTopBarPath(xPos, innerHeight, barWidth, 0, 6);
        });

      if (!prefersReducedMotion) {
        paths
          .transition()
          .duration(480)
          .delay((_, i) => i * 45)
          .ease(d3.easeCubicOut)
          .attrTween('d', (d) => {
            const val = valueAccessor(d);
            const targetY = y(val);
            const targetH = Math.max(0, innerHeight - targetY);
            const interpH = d3.interpolateNumber(0, targetH);
            return (t) => {
              const h = interpH(t);
              return roundedTopBarPath(xPos, innerHeight - h, barWidth, h, 6);
            };
          });
      }

      // Crisp value label above each bar
      groups
        .append('text')
        .attr('x', xPos + barWidth / 2)
        .attr('y', (d) => Math.max(10, y(valueAccessor(d)) - 6))
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('fill', textColor)
        .style('font-variant-numeric', 'tabular-nums')
        .text((d) => `${valueAccessor(d)}d`);
    };

    renderSeriesBar('current', 'url(#d3StreakCurrentGrad)', (d) => d.currentStreak, currentColor);
    renderSeriesBar('best', 'url(#d3StreakBestGrad)', (d) => d.bestStreak, bestColor);

    // Interactive invisible hit zone for tooltips
    groups
      .append('rect')
      .attr('x', -4)
      .attr('y', 0)
      .attr('width', x0.bandwidth() + 8)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseenter', function (_event, d) {
        d3.select(this.parentNode as SVGGElement)
          .select('.hover-bg')
          .attr('opacity', 1);
        const cx = (x0(d.id) ?? 0) + x0.bandwidth() / 2 + margin.left;
        const topBarY = y(Math.max(d.currentStreak, d.bestStreak)) + margin.top;
        setHoveredItem({ datum: d, x: cx, y: topBarY });
      })
      .on('click', function (_event, d) {
        const cx = (x0(d.id) ?? 0) + x0.bandwidth() / 2 + margin.left;
        const topBarY = y(Math.max(d.currentStreak, d.bestStreak)) + margin.top;
        setHoveredItem((prev) =>
          prev?.datum.id === d.id ? null : { datum: d, x: cx, y: topBarY }
        );
      })
      .on('mouseleave', function () {
        d3.select(this.parentNode as SVGGElement)
          .select('.hover-bg')
          .attr('opacity', 0);
        setHoveredItem(null);
      });

    // Ensure accessibility stroke contrast
    void strongTextColor;
  }, [chartData, containerWidth, isDark]);

  return (
    <section
      aria-label="Comparativa de racha actual frente a racha histórica"
      className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#EA580C] dark:text-[#fb923c] shrink-0" />
            <h2 className="text-[18px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
              Progresión de rachas · Actual vs. récord histórico
            </h2>
          </div>
          <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-1 tabular-nums flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span>
              Racha actual máx.{' '}
              <strong className="font-medium text-[#EA580C] dark:text-[#fb923c]">
                {maxCurrent}d
              </strong>
            </span>
            <span aria-hidden="true" className="text-[#a3a6af] dark:text-[#6f7a8a]">·</span>
            <span>
              Récord histórico{' '}
              <strong className="font-medium text-[#4F46E5] dark:text-[#818cf8]">
                {maxHistorical}d
              </strong>
            </span>
            {maxHistorical > 0 && (
              <>
                <span aria-hidden="true" className="text-[#a3a6af] dark:text-[#6f7a8a]">·</span>
                <span>
                  {maxCurrent >= maxHistorical
                    ? '¡Igualando tu mejor marca!'
                    : `${progressPercent}% hacia tu récord`}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[12px] text-[#777b86] dark:text-[#9aa4b2] shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[4px] bg-[#EA580C] dark:bg-[#fb923c]" />
            <span>Racha actual</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[4px] bg-[#4F46E5] dark:bg-[#818cf8]" />
            <span>Racha más larga</span>
          </span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="py-12 text-center text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
          No hay hábitos activos para comparar rachas todavía.
        </div>
      ) : (
        <div ref={containerRef} className="relative w-full min-h-[250px]">
          <svg
            ref={svgRef}
            className="w-full h-full overflow-visible"
            role="img"
            aria-label="Gráfico de barras D3 comparando la racha actual frente a la racha más larga histórica por hábito"
          />

          {hoveredItem && (
            <div
              className="pointer-events-none absolute z-20 steep-popover px-3.5 py-2.5 text-[12px] max-w-[min(240px,calc(100%-16px))] whitespace-normal sm:whitespace-nowrap -translate-x-1/2 -translate-y-full"
              style={{
                left: `${Math.min(Math.max(hoveredItem.x, 100), Math.max(100, containerWidth - 100))}px`,
                top: `${Math.max(66, hoveredItem.y - 10)}px`,
              }}
            >
              <p className="font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1 max-w-[220px] truncate">
                {hoveredItem.datum.label}
              </p>
              <div className="flex items-center justify-between gap-4 text-[#EA580C] dark:text-[#fb923c] font-medium tabular-nums">
                <span>Racha actual:</span>
                <span>{hoveredItem.datum.currentStreak} días</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[#4F46E5] dark:text-[#a5b4fc] font-medium tabular-nums mt-0.5">
                <span>Racha histórica:</span>
                <span>{hoveredItem.datum.bestStreak} días</span>
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-[#ececec] dark:border-[#252e3a] flex items-center gap-1.5 text-[11px] text-[#777b86] dark:text-[#9aa4b2] tabular-nums">
                <Trophy className="w-3 h-3 text-[#D97706] dark:text-[#fbbf24] shrink-0" />
                <span>
                  {hoveredItem.datum.isAtRecord
                    ? 'En récord personal'
                    : `${hoveredItem.datum.ratioPercent}% de tu récord (${Math.max(0, hoveredItem.datum.bestStreak - hoveredItem.datum.currentStreak)}d restantes)`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
