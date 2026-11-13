import { jsPDF } from 'jspdf';
import { Category, DayOfWeek, EvaluatedBadge, Habit, HabitLog } from '../types';
import { formatDate, getDayOfWeek, getTodayDateString } from './storage';

export interface WeeklyDayPerformance {
  date: string;
  shortDate: string;
  dayName: string;
  dayLabel: string;
  completed: number;
  scheduled: number;
  rate: number;
}

export interface CategoryPerformanceRank {
  category: Category;
  habitCount: number;
  weeklyCompleted: number;
  weeklyScheduled: number;
  weeklyRate: number;
  totalAllTimeCompletions: number;
  maxStreak: number;
}

export interface HabitWeeklyRow {
  habit: Habit;
  categoryName: string;
  colorHex: string;
  weeklyCompleted: number;
  weeklyScheduled: number;
  weeklyRate: number;
}

export interface WeeklyReportSummary {
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  generatedAtLabel: string;
  days: WeeklyDayPerformance[];
  totalCompleted: number;
  totalScheduled: number;
  weeklyRate: number;
  perfectDays: number;
  bestDay: WeeklyDayPerformance | null;
  bestStreakOverall: number;
  currentStreakOverall: number;
  topCategories: CategoryPerformanceRank[];
  habitBreakdown: HabitWeeklyRow[];
  unlockedBadges: EvaluatedBadge[];
  totalBadgesCount: number;
}

const DAY_NAMES_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_SHORT_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_NAMES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function getAnchorDate(timezone?: string): Date {
  const todayStr = getTodayDateString(timezone);
  const parts = todayStr.split('-').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

function formatReadableDate(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES_ES[date.getMonth()]} ${date.getFullYear()}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [16, 185, 129];
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return [16, 185, 129];
  return [r, g, b];
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 3)}...`;
}

export function buildWeeklyReportSummary(params: {
  habits: Habit[];
  logs: HabitLog[];
  categories: Category[];
  badges: EvaluatedBadge[];
  timezone?: string;
}): WeeklyReportSummary {
  const { habits, logs, categories, badges, timezone } = params;
  const activeHabits = habits.filter((h) => h.isActive);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const anchor = getAnchorDate(timezone);
  const days: WeeklyDayPerformance[] = [];
  const weekDateSet = new Set<string>();
  const weekDayNums: { date: string; dayNum: DayOfWeek }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const dayNum = getDayOfWeek(d);
    weekDateSet.add(dateStr);
    weekDayNums.push({ date: dateStr, dayNum });

    const scheduledHabits = activeHabits.filter((h) => h.scheduledDays.includes(dayNum));
    const scheduledIds = new Set(scheduledHabits.map((h) => h.id));
    const completed = logs.filter(
      (l) => l.logDate === dateStr && l.isCompleted && (scheduledIds.has(l.habitId) || activeHabits.some((h) => h.id === l.habitId))
    ).length;
    const scheduled = scheduledHabits.length;
    const rate = scheduled > 0 ? Math.min(100, Math.round((completed / scheduled) * 100)) : 0;

    days.push({
      date: dateStr,
      shortDate: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      dayName: DAY_NAMES_ES[dayNum - 1],
      dayLabel: DAY_SHORT_ES[dayNum - 1],
      completed,
      scheduled,
      rate,
    });
  }

  const startDate = new Date(anchor);
  startDate.setDate(startDate.getDate() - 6);

  const totalCompleted = days.reduce((acc, d) => acc + d.completed, 0);
  const totalScheduled = days.reduce((acc, d) => acc + d.scheduled, 0);
  const weeklyRate = totalScheduled > 0 ? Math.min(100, Math.round((totalCompleted / totalScheduled) * 100)) : 0;
  const perfectDays = days.filter((d) => d.scheduled > 0 && d.completed >= d.scheduled).length;

  const daysWithScheduled = days.filter((d) => d.scheduled > 0);
  const bestDay =
    daysWithScheduled.length > 0
      ? [...daysWithScheduled].sort((a, b) => b.rate - a.rate || b.completed - a.completed)[0]
      : null;

  const bestStreakOverall = habits.reduce((max, h) => Math.max(max, h.bestStreak), 0);
  const currentStreakOverall = activeHabits.reduce((max, h) => Math.max(max, h.currentStreak), 0);

  // Category ranking based on weekly performance + all-time check-ins
  const topCategories: CategoryPerformanceRank[] = categories
    .map((cat) => {
      const catActiveHabits = activeHabits.filter((h) => h.categoryId === cat.id);
      const catAllHabits = habits.filter((h) => h.categoryId === cat.id);
      const catHabitIds = new Set(catAllHabits.map((h) => h.id));
      const catActiveIds = new Set(catActiveHabits.map((h) => h.id));

      const weeklyScheduled = weekDayNums.reduce((sum, item) => {
        return sum + catActiveHabits.filter((h) => h.scheduledDays.includes(item.dayNum)).length;
      }, 0);

      const weeklyCompleted = logs.filter(
        (l) =>
          l.isCompleted &&
          weekDateSet.has(l.logDate) &&
          (catActiveIds.has(l.habitId) || catHabitIds.has(l.habitId))
      ).length;

      const weeklyRate =
        weeklyScheduled > 0
          ? Math.min(100, Math.round((weeklyCompleted / weeklyScheduled) * 100))
          : weeklyCompleted > 0
          ? 100
          : 0;

      const totalAllTimeCompletions = logs.filter(
        (l) => l.isCompleted && catHabitIds.has(l.habitId)
      ).length;

      const maxStreak = catAllHabits.reduce((max, h) => Math.max(max, h.currentStreak, h.bestStreak), 0);

      return {
        category: cat,
        habitCount: catActiveHabits.length,
        weeklyCompleted,
        weeklyScheduled,
        weeklyRate,
        totalAllTimeCompletions,
        maxStreak,
      };
    })
    .filter((c) => c.habitCount > 0 || c.weeklyCompleted > 0 || c.totalAllTimeCompletions > 0)
    .sort(
      (a, b) =>
        b.weeklyRate - a.weeklyRate ||
        b.weeklyCompleted - a.weeklyCompleted ||
        b.totalAllTimeCompletions - a.totalAllTimeCompletions
    );

  // Per-habit weekly breakdown
  const habitBreakdown: HabitWeeklyRow[] = activeHabits
    .map((habit) => {
      const cat = categoryMap.get(habit.categoryId);
      const weeklyScheduled = weekDayNums.filter((d) => habit.scheduledDays.includes(d.dayNum)).length;
      const weeklyCompleted = logs.filter(
        (l) => l.habitId === habit.id && l.isCompleted && weekDateSet.has(l.logDate)
      ).length;
      const hRate =
        weeklyScheduled > 0
          ? Math.min(100, Math.round((weeklyCompleted / weeklyScheduled) * 100))
          : 0;

      return {
        habit,
        categoryName: cat?.name || 'General',
        colorHex: cat?.colorHex || '#10B981',
        weeklyCompleted,
        weeklyScheduled,
        weeklyRate: hRate,
      };
    })
    .sort(
      (a, b) =>
        b.weeklyRate - a.weeklyRate ||
        b.weeklyCompleted - a.weeklyCompleted ||
        b.habit.currentStreak - a.habit.currentStreak
    );

  const unlockedBadges = badges.filter((b) => b.isUnlocked);

  const now = new Date();
  const generatedAtLabel = `${String(now.getDate()).padStart(2, '0')}/${String(
    now.getMonth() + 1
  ).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  return {
    periodStart: days[0].date,
    periodEnd: days[days.length - 1].date,
    periodLabel: `${formatReadableDate(startDate)} - ${formatReadableDate(anchor)}`,
    generatedAtLabel,
    days,
    totalCompleted,
    totalScheduled,
    weeklyRate,
    perfectDays,
    bestDay,
    bestStreakOverall,
    currentStreakOverall,
    topCategories,
    habitBreakdown,
    unlockedBadges,
    totalBadgesCount: badges.length,
  };
}

export function generateWeeklyStatsPdf(params: {
  habits: Habit[];
  logs: HabitLog[];
  categories: Category[];
  badges: EvaluatedBadge[];
  userName?: string;
  timezone?: string;
}): { filename: string; summary: WeeklyReportSummary } {
  const summary = buildWeeklyReportSummary(params);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const drawHeaderBanner = () => {
    // Deep Navy Header
    doc.setFillColor(15, 23, 42); // #0F172A
    doc.rect(0, 0, pageWidth, 38, 'F');

    // Emerald Top Accent Strip
    doc.setFillColor(16, 185, 129); // #10B981
    doc.rect(0, 0, pageWidth, 2.5, 'F');

    // Brand & Title
    doc.setTextColor(52, 211, 153); // #34D399
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('IMPULSO DIARIO', margin, 11);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('Reporte Semanal de Rendimiento', margin, 19);

    doc.setTextColor(148, 163, 184); // #94A3B8
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Periodo: ${summary.periodLabel}`, margin, 26.5);

    // Right side user metadata
    const displayName = truncateText(params.userName || 'Usuario Impulso Diario', 28);
    const tzLabel = truncateText(params.timezone || 'Zona local', 28);
    doc.setTextColor(226, 232, 240);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(displayName, pageWidth - margin, 15, { align: 'right' });

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Zona horaria: ${tzLabel}`, pageWidth - margin, 21, { align: 'right' });
    doc.text(`Generado: ${summary.generatedAtLabel}`, pageWidth - margin, 26.5, { align: 'right' });
  };

  drawHeaderBanner();
  let y = 46;

  // Section 1: KPI Cards
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Resumen Ejecutivo Semanal', margin, y);
  y += 4;

  const cardGap = 4;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const cardHeight = 22;

  const kpis = [
    {
      label: 'ADHERENCIA 7D',
      value: `${summary.weeklyRate}%`,
      sub: summary.bestDay ? `Mejor día: ${summary.bestDay.dayLabel} (${summary.bestDay.rate}%)` : 'Sin programación',
      accent: [16, 185, 129] as [number, number, number],
    },
    {
      label: 'CHECK-INS 7D',
      value: `${summary.totalCompleted} / ${summary.totalScheduled}`,
      sub: 'Completados vs meta',
      accent: [14, 165, 233] as [number, number, number],
    },
    {
      label: 'DÍAS PERFECTOS',
      value: `${summary.perfectDays} / 7`,
      sub: '100% cumplimiento diario',
      accent: [139, 92, 246] as [number, number, number],
    },
    {
      label: 'MEJOR RACHA',
      value: `${summary.currentStreakOverall} d`,
      sub: `Récord histórico: ${summary.bestStreakOverall} d`,
      accent: [245, 158, 11] as [number, number, number],
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (cardWidth + cardGap);
    doc.setFillColor(248, 250, 252); // #F8FAFC
    doc.setDrawColor(226, 232, 240); // #E2E8F0
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

    // Top thin accent bar
    doc.setFillColor(...kpi.accent);
    doc.rect(x, y, cardWidth, 1.5, 'F');

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(kpi.label, x + 3, y + 6.5);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.text(kpi.value, x + 3, y + 13.8);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(truncateText(kpi.sub, 25), x + 3, y + 19);
  });

  y += cardHeight + 9;

  // Section 2: Daily Performance (Last 7 Days)
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Rendimiento Diario (Últimos 7 Días)', margin, y);
  y += 4;

  const dailyBoxHeight = summary.days.length * 7.2 + 6;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, dailyBoxHeight, 2, 2, 'FD');

  let innerY = y + 6.5;
  summary.days.forEach((day) => {
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`${day.dayLabel} ${day.shortDate}`, margin + 4, innerY);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(day.dayName, margin + 25, innerY);

    // Progress Bar
    const barX = margin + 48;
    const barW = 92;
    const barH = 3.2;
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(barX, innerY - 2.6, barW, barH, 1, 1, 'F');

    if (day.rate > 0) {
      const fillW = Math.max(2, (barW * Math.min(100, day.rate)) / 100);
      if (day.rate >= 80) doc.setFillColor(16, 185, 129);
      else if (day.rate >= 50) doc.setFillColor(5, 150, 105);
      else doc.setFillColor(245, 158, 11);
      doc.roundedRect(barX, innerY - 2.6, fillW, barH, 1, 1, 'F');
    }

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${day.completed} / ${day.scheduled}`, margin + 157, innerY, { align: 'right' });

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`${day.rate}%`, pageWidth - margin - 4, innerY, { align: 'right' });

    innerY += 7.2;
  });

  y += dailyBoxHeight + 9;

  // Helper for page break
  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 18) {
      doc.addPage();
      y = 18;
    }
  };

  // Section 3: Top-Performing Categories
  ensureSpace(30);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Categorías con Mejor Desempeño (Top Performing)', margin, y);
  y += 4;

  if (summary.topCategories.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('No hay categorías con actividad registrada en este periodo.', margin + 4, y + 8.5);
    y += 20;
  } else {
    const displayedCats = summary.topCategories.slice(0, 7);
    const catBoxH = displayedCats.length * 9 + 6;
    ensureSpace(catBoxH + 6);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, catBoxH, 2, 2, 'FD');

    let catY = y + 7;
    displayedCats.forEach((item, index) => {
      const rgb = hexToRgb(item.category.colorHex);

      // Rank badge
      doc.setTextColor(index === 0 ? 16 : 100, index === 0 ? 185 : 116, index === 0 ? 129 : 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`#${index + 1}`, margin + 4, catY);

      // Category dot
      doc.setFillColor(...rgb);
      doc.circle(margin + 13, catY - 1.1, 1.6, 'F');

      // Name & Habit count
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(truncateText(item.category.name, 22), margin + 17.5, catY);

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`${item.habitCount} hab.`, margin + 55, catY);

      // Progress bar
      const barX = margin + 70;
      const barW = 62;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(barX, catY - 2.6, barW, 3.2, 1, 1, 'F');
      if (item.weeklyRate > 0) {
        doc.setFillColor(...rgb);
        doc.roundedRect(barX, catY - 2.6, Math.max(2, (barW * item.weeklyRate) / 100), 3.2, 1, 1, 'F');
      }

      // Weekly ratio + all-time
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.text(
        `${item.weeklyCompleted}/${item.weeklyScheduled} (7d) · ${item.totalAllTimeCompletions} tot.`,
        margin + 167,
        catY,
        { align: 'right' }
      );

      // Rate %
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`${item.weeklyRate}%`, pageWidth - margin - 4, catY, { align: 'right' });

      catY += 9;
    });

    y += catBoxH + 9;
  }

  // Section 4: Habit Weekly Breakdown Table
  ensureSpace(26);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Desglose Semanal por Hábito Activo', margin, y);
  y += 4;

  const drawTableHeader = () => {
    doc.setFillColor(241, 245, 249); // #F1F5F9
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 7.5, 'FD');

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('HÁBITO', margin + 3, y + 5);
    doc.text('CATEGORÍA', margin + 78, y + 5);
    doc.text('7 DÍAS', margin + 125, y + 5, { align: 'right' });
    doc.text('TASA', margin + 145, y + 5, { align: 'right' });
    doc.text('RACHA', margin + 164, y + 5, { align: 'right' });
    doc.text('RÉCORD', pageWidth - margin - 3, y + 5, { align: 'right' });
    y += 7.5;
  };

  if (summary.habitBreakdown.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('No hay hábitos activos configurados actualmente.', margin + 4, y + 8.5);
    y += 18;
  } else {
    drawTableHeader();

    summary.habitBreakdown.forEach((row, idx) => {
      if (y + 8 > pageHeight - 20) {
        doc.addPage();
        y = 18;
        drawTableHeader();
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 7.5, 'F');
      }
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

      const rgb = hexToRgb(row.colorHex);
      doc.setFillColor(...rgb);
      doc.circle(margin + 3.5, y + 3.8, 1.2, 'F');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(truncateText(row.habit.title, 34), margin + 7, y + 5);

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.text(truncateText(row.categoryName, 18), margin + 78, y + 5);

      doc.setTextColor(51, 65, 85);
      doc.text(`${row.weeklyCompleted}/${row.weeklyScheduled}`, margin + 125, y + 5, { align: 'right' });

      doc.setTextColor(row.weeklyRate >= 80 ? 5 : 15, row.weeklyRate >= 80 ? 150 : 23, row.weeklyRate >= 80 ? 105 : 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${row.weeklyRate}%`, margin + 145, y + 5, { align: 'right' });

      doc.setTextColor(180, 83, 9);
      doc.text(`${row.habit.currentStreak} d`, margin + 164, y + 5, { align: 'right' });

      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text(`${row.habit.bestStreak} d`, pageWidth - margin - 3, y + 5, { align: 'right' });

      y += 7.5;
    });

    y += 8;
  }

  // Optional Badges Line
  if (summary.unlockedBadges.length > 0) {
    ensureSpace(16);
    const badgeNames = summary.unlockedBadges.map((b) => b.definition.name).join(', ');
    const badgeText = `Insignias desbloqueadas (${summary.unlockedBadges.length}/${summary.totalBadgesCount}): ${badgeNames}`;
    const wrapped = doc.splitTextToSize(badgeText, contentWidth - 8);
    const boxH = wrapped.length * 4.5 + 6;

    doc.setFillColor(240, 253, 244); // #F0FDF4
    doc.setDrawColor(187, 247, 208); // #BBF7D0
    doc.roundedRect(margin, y, contentWidth, boxH, 2, 2, 'FD');

    doc.setTextColor(6, 95, 70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(wrapped, margin + 4, y + 5.5);
  }

  // Page Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(
      `Impulso Diario · Reporte semanal (${summary.periodStart} a ${summary.periodEnd})`,
      margin,
      pageHeight - 8
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  const filename = `impulso_diario_reporte_semanal_${summary.periodEnd}.pdf`;
  doc.save(filename);

  return { filename, summary };
}
