import { getTodayDateString } from './storage';

export const STREAK_MILESTONE_DAYS = [7, 15, 30, 60, 100] as const;

export type MilestoneAccent = 'emerald' | 'violet' | 'amber' | 'cyan' | 'rose';

export interface StreakMilestone {
  days: number;
  badgeLabel: string;
  headline: string;
  message: string;
  accent: MilestoneAccent;
}

export interface MilestoneEvaluationInput {
  previousStreak: number;
  currentStreak: number;
  isCompletedToday: boolean;
  wasCompletedBefore?: boolean;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 7,
    badgeLabel: 'Primera Semana',
    headline: '¡7 días de racha!',
    message: 'Completaste una semana entera sin fallar. El impulso ya trabaja a tu favor.',
    accent: 'emerald',
  },
  {
    days: 15,
    badgeLabel: 'Quincena Imparable',
    headline: '¡Hito de 15 días!',
    message: 'Quince días consecutivos sosteniendo tu compromiso. Ya superaste la fase más difícil.',
    accent: 'violet',
  },
  {
    days: 30,
    badgeLabel: 'Mes Maestro',
    headline: '¡30 días seguidos!',
    message: 'Un mes completo de constancia diaria. Este hábito ya es parte de tu identidad.',
    accent: 'amber',
  },
  {
    days: 60,
    badgeLabel: 'Disciplina de Hierro',
    headline: '¡60 días invicto!',
    message: 'Dos meses continuos cumpliendo tu palabra contigo mismo.',
    accent: 'cyan',
  },
  {
    days: 100,
    badgeLabel: 'Leyenda Centenaria',
    headline: '¡100 días de racha!',
    message: 'Cien jornadas acumuladas de disciplina luminosa. Logro extraordinario.',
    accent: 'rose',
  },
];

const DISMISSED_MILESTONES_KEY = 'lm_dismissed_streak_milestones';

export function getStreakMilestoneDefinition(days: number): StreakMilestone | null {
  return STREAK_MILESTONES.find((m) => m.days === days) || null;
}

/**
 * Calculates whether the user has just reached a streak milestone (7, 15, 30, 60, 100 days).
 * Evaluates in descending order so the highest newly reached milestone is celebrated.
 */
export function calculateReachedStreakMilestone(
  input: MilestoneEvaluationInput
): StreakMilestone | null {
  const { previousStreak, currentStreak, isCompletedToday, wasCompletedBefore = false } = input;
  if (!isCompletedToday || currentStreak <= 0) return null;

  const descending = [...STREAK_MILESTONES].sort((a, b) => b.days - a.days);

  // Primary check: streak crossed a milestone threshold upon completing today
  for (const milestone of descending) {
    if (previousStreak < milestone.days && currentStreak >= milestone.days) {
      return milestone;
    }
  }

  // Secondary check: transitioning to completed today while landing directly on a milestone day
  if (!wasCompletedBefore) {
    const exactMatch = descending.find((m) => m.days === currentStreak);
    if (exactMatch) return exactMatch;
  }

  return null;
}

/**
 * Checks if a habit already completed today sits on an exact milestone (7, 15, 30, 60, 100).
 */
export function getExactTodayStreakMilestone(
  currentStreak: number,
  isCompletedToday: boolean
): StreakMilestone | null {
  if (!isCompletedToday || currentStreak <= 0) return null;
  return getStreakMilestoneDefinition(currentStreak);
}

/**
 * Calculates the next upcoming streak milestone and how many days remain to reach it.
 */
export function getNextStreakMilestone(
  currentStreak: number
): { milestone: StreakMilestone; daysRemaining: number } | null {
  const next = STREAK_MILESTONES.find((m) => m.days > currentStreak);
  if (!next) return null;
  return {
    milestone: next,
    daysRemaining: Math.max(1, next.days - currentStreak),
  };
}

export function formatMilestoneCelebrationCopy(
  milestone: StreakMilestone,
  habitTitle: string
): string {
  return `${milestone.days} días seguidos en «${habitTitle}». ${milestone.message}`;
}

function buildDismissKey(
  userId: string,
  habitId: string,
  milestoneDays: number,
  timezone?: string
): string {
  const todayStr = getTodayDateString(timezone);
  return `${userId}::${habitId}::${milestoneDays}::${todayStr}`;
}

export function hasDismissedMilestoneToday(
  userId: string,
  habitId: string,
  milestoneDays: number,
  timezone?: string
): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_MILESTONES_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return list.includes(buildDismissKey(userId, habitId, milestoneDays, timezone));
  } catch {
    return false;
  }
}

export function dismissMilestoneToday(
  userId: string,
  habitId: string,
  milestoneDays: number,
  timezone?: string
): void {
  try {
    const key = buildDismissKey(userId, habitId, milestoneDays, timezone);
    const raw = localStorage.getItem(DISMISSED_MILESTONES_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(key)) {
      localStorage.setItem(DISMISSED_MILESTONES_KEY, JSON.stringify([...list.slice(-40), key]));
    }
  } catch {
    // ignore storage errors
  }
}

export function clearDismissedMilestoneToday(
  userId: string,
  habitId: string,
  timezone?: string
): void {
  try {
    const todayStr = getTodayDateString(timezone);
    const prefix = `${userId}::${habitId}::`;
    const suffix = `::${todayStr}`;
    const raw = localStorage.getItem(DISMISSED_MILESTONES_KEY);
    if (!raw) return;
    const list: string[] = JSON.parse(raw);
    const filtered = list.filter((entry) => !(entry.startsWith(prefix) && entry.endsWith(suffix)));
    localStorage.setItem(DISMISSED_MILESTONES_KEY, JSON.stringify(filtered));
  } catch {
    // ignore storage errors
  }
}
