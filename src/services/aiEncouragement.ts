import {
  AiEncouragementMessage,
  DailyFocus,
  EncouragementTrigger,
  EnergyLevel,
  HabitWithTodayLog,
  MoodTag,
  User,
} from '../types';
import { getTodayDateString, StorageService } from './storage';
import { getGreetingFirstName, getTimeOfDayPeriod } from './greeting';

const ENCOURAGEMENT_CACHE_PREFIX = 'impulso_diario_ai_encouragement_v1';

export interface FetchEncouragementParams {
  user: User;
  habits: HabitWithTodayLog[];
  dailyFocus: DailyFocus | null;
  trigger: EncouragementTrigger;
  habitTitle?: string;
  habitStreak?: number;
  energyLevel?: EnergyLevel;
  moodTag?: MoodTag;
  forceRefresh?: boolean;
}

export function getTimeOfDayBucket(timezone?: string): 'morning' | 'afternoon' | 'evening' {
  return getTimeOfDayPeriod(timezone);
}

function buildSnapshotSignature(
  user: User,
  habits: HabitWithTodayLog[],
  dailyFocus: DailyFocus | null
): string {
  const todayStr = getTodayDateString(user.timezone);
  const period = getTimeOfDayPeriod(user.timezone);
  const firstName = getGreetingFirstName(user.fullName, user.email);
  const completedToday = habits.filter((h) => h.todayLog?.isCompleted).length;
  const topStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);
  const focusKey = dailyFocus?.intent?.slice(0, 24) || '';
  return `${todayStr}::${period}::${firstName}::${completedToday}/${habits.length}::${topStreak}::${focusKey}`;
}

export function getCachedEncouragement(
  userId: string,
  expectedSignature?: string
): AiEncouragementMessage | null {
  try {
    const raw = localStorage.getItem(`${ENCOURAGEMENT_CACHE_PREFIX}::${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      signature: string;
      data: AiEncouragementMessage;
    };
    if (!parsed?.data?.message) return null;
    if (expectedSignature && parsed.signature !== expectedSignature) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function setCachedEncouragement(
  userId: string,
  signature: string,
  data: AiEncouragementMessage
) {
  try {
    localStorage.setItem(
      `${ENCOURAGEMENT_CACHE_PREFIX}::${userId}`,
      JSON.stringify({ signature, data })
    );
  } catch {
    // ignore storage quota errors
  }
}

export async function requestAiEncouragement(
  params: FetchEncouragementParams
): Promise<AiEncouragementMessage> {
  const { user, habits, dailyFocus, trigger, forceRefresh } = params;
  const signature = buildSnapshotSignature(user, habits, dailyFocus);

  if (trigger === 'daily_brief' && !forceRefresh) {
    const cached = getCachedEncouragement(user.id, signature);
    if (cached) return cached;
  }

  const completedToday = habits.filter((h) => h.todayLog?.isCompleted).length;
  const totalToday = habits.length;
  const topStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);

  const past7Totals = habits.reduce(
    (acc, h) => {
      h.past7Days.forEach((d) => {
        if (d.isScheduled) {
          acc.scheduled += 1;
          if (d.isCompleted) acc.completed += 1;
        }
      });
      return acc;
    },
    { scheduled: 0, completed: 0 }
  );
  const weeklyRate =
    past7Totals.scheduled > 0
      ? Math.round((past7Totals.completed / past7Totals.scheduled) * 100)
      : 0;

  const pendingHabitTitle = habits.find((h) => !h.todayLog?.isCompleted)?.title;
  const firstName = getGreetingFirstName(user.fullName, user.email);

  const res = await fetch('/api/coach/encouragement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trigger,
      userName: firstName,
      timeOfDay: getTimeOfDayBucket(user.timezone),
      completedToday,
      totalToday,
      topStreak,
      weeklyRate,
      habitTitle: params.habitTitle,
      habitStreak: params.habitStreak,
      energyLevel: params.energyLevel,
      moodTag: params.moodTag,
      dailyFocus: dailyFocus?.intent,
      pendingHabitTitle,
      requestSeed: Date.now(),
    }),
  });

  const body = (await res.json()) as Partial<AiEncouragementMessage> & { error?: string };
  if (!res.ok) {
    throw new Error(body.error || 'No se pudo obtener un mensaje de ánimo en este momento.');
  }

  const result: AiEncouragementMessage = {
    id: `ai-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    headline: body.headline || `Ánimo, ${firstName}`,
    message: body.message || 'Cada pequeño paso suma a tu constancia diaria.',
    microAction: body.microAction || 'Elige un hábito corto para mantener el impulso.',
    tone: body.tone || 'momentum',
    trigger: body.trigger || trigger,
    generatedAt: body.generatedAt || new Date().toISOString(),
  };

  setCachedEncouragement(user.id, signature, result);
  StorageService.saveAiEncouragementToHistory(user.id, result);
  return result;
}
