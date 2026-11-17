import { EnergyLevel, MoodTag } from '../types';
import { DEMO_USER_ID, formatDate, getTodayDateString } from './storage';

export type SleepQuality = 'poor' | 'fair' | 'restful';

export interface DailyHealthEntry {
  date: string; // YYYY-MM-DD
  sleepHours?: number;
  sleepQuality?: SleepQuality;
  energyOverride?: EnergyLevel;
  moodOverride?: MoodTag;
  updatedAt: string;
}

interface HealthStoragePayload {
  sleepTargetHours: number;
  entries: DailyHealthEntry[];
}

const HEALTH_STORAGE_PREFIX = 'impulso_diario_health_widgets_v1';

function parseIsoAnchor(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

function buildDemoSeedEntries(todayStr: string): DailyHealthEntry[] {
  const anchor = parseIsoAnchor(todayStr);
  const sleepPattern = [7.5, 8.0, 7.0, 6.5, 8.0, 8.5, 7.5, 7.5, 8.0, 7.0, 7.5, 8.5, 8.0, 7.5];
  const entries: DailyHealthEntry[] = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    const dateStr = formatDate(d);
    const hours = sleepPattern[13 - i] ?? 7.5;
    const quality: SleepQuality = hours >= 7.5 ? 'restful' : hours >= 7.0 ? 'fair' : 'poor';
    entries.push({
      date: dateStr,
      sleepHours: hours,
      sleepQuality: quality,
      updatedAt: new Date(d.getTime()).toISOString(),
    });
  }

  return entries;
}

function readPayload(userId: string, timezone?: string): HealthStoragePayload {
  const key = `${HEALTH_STORAGE_PREFIX}::${userId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<HealthStoragePayload>;
      const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
      const sleepTargetHours =
        typeof parsed.sleepTargetHours === 'number' &&
        parsed.sleepTargetHours >= 5 &&
        parsed.sleepTargetHours <= 11
          ? parsed.sleepTargetHours
          : 8;

      if (userId === DEMO_USER_ID && entries.length === 0) {
        const seeded: HealthStoragePayload = {
          sleepTargetHours,
          entries: buildDemoSeedEntries(getTodayDateString(timezone)),
        };
        localStorage.setItem(key, JSON.stringify(seeded));
        return seeded;
      }

      return { sleepTargetHours, entries };
    }
  } catch {
    // ignore corrupted storage
  }

  if (userId === DEMO_USER_ID) {
    const seeded: HealthStoragePayload = {
      sleepTargetHours: 8,
      entries: buildDemoSeedEntries(getTodayDateString(timezone)),
    };
    try {
      localStorage.setItem(key, JSON.stringify(seeded));
    } catch {
      // ignore quota errors
    }
    return seeded;
  }

  return { sleepTargetHours: 8, entries: [] };
}

function writePayload(userId: string, payload: HealthStoragePayload): void {
  try {
    localStorage.setItem(`${HEALTH_STORAGE_PREFIX}::${userId}`, JSON.stringify(payload));
  } catch {
    // ignore storage quota errors
  }
}

export class HealthWidgetsService {
  static getHealthState(userId: string, timezone?: string): HealthStoragePayload {
    const payload = readPayload(userId, timezone);
    const sorted = [...payload.entries].sort((a, b) => a.date.localeCompare(b.date));
    return {
      sleepTargetHours: payload.sleepTargetHours,
      entries: sorted,
    };
  }

  static updateSleepTarget(userId: string, targetHours: number, timezone?: string): HealthStoragePayload {
    const current = readPayload(userId, timezone);
    const clamped = Math.max(5.5, Math.min(10.5, Math.round(targetHours * 2) / 2));
    const next: HealthStoragePayload = {
      ...current,
      sleepTargetHours: clamped,
    };
    writePayload(userId, next);
    return this.getHealthState(userId, timezone);
  }

  static upsertDayEntry(
    userId: string,
    updates: Partial<Omit<DailyHealthEntry, 'date' | 'updatedAt'>>,
    timezone?: string,
    targetDate?: string
  ): HealthStoragePayload {
    const dateStr = targetDate || getTodayDateString(timezone);
    const current = readPayload(userId, timezone);
    const idx = current.entries.findIndex((e) => e.date === dateStr);
    const nowIso = new Date().toISOString();

    if (idx !== -1) {
      current.entries[idx] = {
        ...current.entries[idx],
        ...updates,
        date: dateStr,
        updatedAt: nowIso,
      };
    } else {
      current.entries.push({
        date: dateStr,
        ...updates,
        updatedAt: nowIso,
      });
    }

    writePayload(userId, current);
    return this.getHealthState(userId, timezone);
  }

  static resetHealthData(userId: string): void {
    try {
      localStorage.removeItem(`${HEALTH_STORAGE_PREFIX}::${userId}`);
    } catch {
      // ignore storage errors
    }
  }
}
