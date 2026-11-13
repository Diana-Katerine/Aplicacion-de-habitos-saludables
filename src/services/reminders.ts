import { HabitWithTodayLog } from '../types';
import { getTodayDateString } from './storage';

export interface AdaptiveReminderSuggestion {
  habit: HabitWithTodayLog;
  currentReminderTime?: string;
  suggestedTime: string;
  reason: string;
  urgency: 'high' | 'medium';
  isOverdueNow: boolean;
}

export interface LocalTimeInfo {
  hours: number;
  minutes: number;
  totalMinutes: number;
  hhmm: string;
  isLateAfternoon: boolean; // >= 16:00
}

const LATE_AFTERNOON_START_MINUTES = 16 * 60; // 16:00
const PUSH_SENT_STORAGE_KEY = 'lm_adaptive_push_sent';

export function parseTimeToMinutes(hhmm?: string): number | null {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function formatMinutesToHHMM(totalMinutes: number): string {
  const clamped = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getLocalTimeInfo(timezone?: string, overrideMinutes?: number): LocalTimeInfo {
  let hours = new Date().getHours();
  let minutes = new Date().getMinutes();

  if (typeof overrideMinutes === 'number') {
    hours = Math.floor(overrideMinutes / 60) % 24;
    minutes = overrideMinutes % 60;
  } else if (timezone) {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(new Date());
      const hPart = parts.find((p) => p.type === 'hour')?.value;
      const mPart = parts.find((p) => p.type === 'minute')?.value;
      if (hPart && mPart) {
        const parsedH = parseInt(hPart, 10) % 24;
        const parsedM = parseInt(mPart, 10);
        if (!Number.isNaN(parsedH) && !Number.isNaN(parsedM)) {
          hours = parsedH;
          minutes = parsedM;
        }
      }
    } catch {
      // Fallback to browser local time
    }
  }

  const totalMinutes = hours * 60 + minutes;
  const hhmm = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return {
    hours,
    minutes,
    totalMinutes,
    hhmm,
    isLateAfternoon: totalMinutes >= LATE_AFTERNOON_START_MINUTES,
  };
}

/**
 * Generates adaptive reminder suggestions for today's incomplete habits
 * based on user-defined `reminderTime` fields and late-afternoon catch-up slots.
 */
export function buildAdaptiveReminders(params: {
  habits: HabitWithTodayLog[];
  timezone?: string;
  eveningCutoffTime?: string;
  simulatedLateAfternoonMinutes?: number;
}): {
  timeInfo: LocalTimeInfo;
  suggestions: AdaptiveReminderSuggestion[];
} {
  const { habits, timezone, eveningCutoffTime, simulatedLateAfternoonMinutes } = params;
  const timeInfo = getLocalTimeInfo(timezone, simulatedLateAfternoonMinutes);
  const eveningMinutes = parseTimeToMinutes(eveningCutoffTime) ?? 21 * 60; // default 21:00

  // Compute next clean late-afternoon rescue slot (17:00..20:30), staggered if multiple habits need one
  const baseRescueMinutes = Math.max(
    17 * 60,
    Math.min(
      Math.max(eveningMinutes - 60, 17 * 60),
      Math.ceil((timeInfo.totalMinutes + 20) / 30) * 30
    )
  );

  let staggerOffset = 0;

  const suggestions: AdaptiveReminderSuggestion[] = [];

  habits
    .filter((h) => !h.todayLog?.isCompleted)
    .forEach((habit) => {
      const reminderMins = parseTimeToMinutes(habit.reminderTime);
      const streakAtRisk = habit.currentStreak >= 3;

      if (reminderMins !== null) {
        // Case 1: Scheduled reminderTime has already passed without completion
        if (reminderMins <= timeInfo.totalMinutes) {
          const suggestedMins = Math.min(21 * 60 + 30, baseRescueMinutes + staggerOffset * 30);
          staggerOffset += 1;
          suggestions.push({
            habit,
            currentReminderTime: habit.reminderTime,
            suggestedTime: formatMinutesToHHMM(suggestedMins),
            reason: streakAtRisk
              ? `Alerta de ${habit.reminderTime} sin completar · Racha de ${habit.currentStreak}d en riesgo`
              : `Programado a las ${habit.reminderTime} · Rescate sugerido para la tarde`,
            urgency: streakAtRisk || timeInfo.isLateAfternoon ? 'high' : 'medium',
            isOverdueNow: true,
          });
          return;
        }

        // Case 2: Late afternoon and reminderTime is still coming up later this evening
        if (timeInfo.isLateAfternoon && reminderMins > timeInfo.totalMinutes) {
          // Suggest nudging 15 mins earlier if late evening (>= 20:30) or keep as active upcoming alert
          const earlyNudgeMins = reminderMins >= 20 * 60 ? reminderMins - 30 : reminderMins;
          suggestions.push({
            habit,
            currentReminderTime: habit.reminderTime,
            suggestedTime: formatMinutesToHHMM(earlyNudgeMins),
            reason:
              reminderMins >= 20 * 60
                ? `Alerta nocturna (${habit.reminderTime}) · Adelantar a ${formatMinutesToHHMM(earlyNudgeMins)} para asegurar cierre`
                : `Próximo recordatorio hoy a las ${habit.reminderTime}`,
            urgency: streakAtRisk ? 'high' : 'medium',
            isOverdueNow: false,
          });
        }
      } else if (timeInfo.isLateAfternoon || simulatedLateAfternoonMinutes !== undefined) {
        // Case 3: No reminderTime defined yet and habit is still incomplete in late afternoon
        const suggestedMins = Math.min(21 * 60, baseRescueMinutes + staggerOffset * 30);
        staggerOffset += 1;
        suggestions.push({
          habit,
          currentReminderTime: undefined,
          suggestedTime: formatMinutesToHHMM(suggestedMins),
          reason: streakAtRisk
            ? `Sin recordatorio asignado · Protege tu racha de ${habit.currentStreak}d esta tarde`
            : 'Sin hora definida · Sugerencia adaptativa para cerrar antes de la noche',
          urgency: streakAtRisk ? 'high' : 'medium',
          isOverdueNow: true,
        });
      }
    });

  // Sort high urgency & overdue first, then by streak descending
  suggestions.sort((a, b) => {
    if (a.urgency !== b.urgency) return a.urgency === 'high' ? -1 : 1;
    if (a.isOverdueNow !== b.isOverdueNow) return a.isOverdueNow ? -1 : 1;
    return b.habit.currentStreak - a.habit.currentStreak;
  });

  return { timeInfo, suggestions };
}

export function hasSentAdaptivePushToday(userId: string, timezone?: string): boolean {
  try {
    const todayStr = getTodayDateString(timezone);
    const raw = localStorage.getItem(PUSH_SENT_STORAGE_KEY);
    if (!raw) return false;
    const map: Record<string, string[]> = JSON.parse(raw);
    return (map[userId] || []).includes(todayStr);
  } catch {
    return false;
  }
}

export function markAdaptivePushSentToday(userId: string, timezone?: string): void {
  try {
    const todayStr = getTodayDateString(timezone);
    const raw = localStorage.getItem(PUSH_SENT_STORAGE_KEY);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    const existing = map[userId] || [];
    if (!existing.includes(todayStr)) {
      map[userId] = [...existing.slice(-14), todayStr];
      localStorage.setItem(PUSH_SENT_STORAGE_KEY, JSON.stringify(map));
    }
  } catch {
    // Ignore storage errors
  }
}

export function tryDispatchBrowserPushNotification(title: string, body: string): void {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    }
  } catch {
    // Ignore in restricted iframe environments
  }
}
