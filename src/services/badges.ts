import {
  BadgeDefinition,
  EvaluatedBadge,
  Habit,
  HabitLog,
  UnlockedBadgeRecord,
} from '../types';

const BADGES_STORAGE_KEY = 'lm_unlocked_badges';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'badge-3d-spark',
    name: 'First Spark',
    subtitle: 'Racha de 3 días',
    description: 'Completa cualquier hábito durante 3 días consecutivos para encender tu impulso inicial.',
    tier: 'bronze',
    iconName: 'Flame',
    ruleType: 'habit_streak',
    threshold: 3,
  },
  {
    id: 'badge-7d-crusader',
    name: '7-Day Crusader',
    subtitle: 'Racha de 7 días',
    description: 'Mantén una racha ininterrumpida de 7 días en un hábito. Una semana entera sin fallar.',
    tier: 'bronze',
    iconName: 'Shield',
    ruleType: 'habit_streak',
    threshold: 7,
  },
  {
    id: 'badge-14d-forger',
    name: 'Fortnight Forger',
    subtitle: 'Racha de 14 días',
    description: 'Dos semanas consecutivas de ejecución constante en un mismo ritual diario.',
    tier: 'silver',
    iconName: 'Zap',
    ruleType: 'habit_streak',
    threshold: 14,
  },
  {
    id: 'badge-21d-architect',
    name: 'Habit Architect',
    subtitle: 'Racha de 21 días',
    description: 'Alcanza 21 días seguidos en un hábito y consolida el circuito neuronal de tu rutina.',
    tier: 'silver',
    iconName: 'Compass',
    ruleType: 'habit_streak',
    threshold: 21,
  },
  {
    id: 'badge-30d-monthly-momentum',
    name: 'Monthly Momentum',
    subtitle: 'Racha de 30 días',
    description: 'Sostén una racha de 30 días continuos en un hábito. Un mes completo de disciplina luminosa.',
    tier: 'gold',
    iconName: 'Award',
    ruleType: 'habit_streak',
    threshold: 30,
  },
  {
    id: 'badge-triple-7d',
    name: 'Triple Momentum',
    subtitle: '3 hábitos en racha de 7+ días',
    description: 'Mantén 3 hábitos distintos con racha activa de al menos 7 días al mismo tiempo.',
    tier: 'gold',
    iconName: 'Star',
    ruleType: 'simultaneous_streaks',
    threshold: 3,
    secondaryThreshold: 7,
  },
  {
    id: 'badge-60d-unbreakable',
    name: 'Iron Discipline',
    subtitle: 'Racha de 60 días',
    description: 'Alcanza 60 días consecutivos en cualquier hábito. Consistencia de alto rendimiento.',
    tier: 'platinum',
    iconName: 'Trophy',
    ruleType: 'habit_streak',
    threshold: 60,
  },
  {
    id: 'badge-100d-century',
    name: 'Century Legend',
    subtitle: 'Racha de 100 días',
    description: 'Logra el hito supremo de 100 días seguidos en un hábito sin perder el ritmo.',
    tier: 'platinum',
    iconName: 'Crown',
    ruleType: 'habit_streak',
    threshold: 100,
  },
];

export class BadgesService {
  static getStoredRecords(userId: string): UnlockedBadgeRecord[] {
    try {
      const raw = localStorage.getItem(BADGES_STORAGE_KEY);
      if (raw) {
        const parsed: Record<string, UnlockedBadgeRecord[]> = JSON.parse(raw);
        return parsed[userId] || [];
      }
    } catch (e) {
      console.error('Error reading badges storage:', e);
    }
    return [];
  }

  static saveStoredRecords(userId: string, records: UnlockedBadgeRecord[]): void {
    try {
      const raw = localStorage.getItem(BADGES_STORAGE_KEY);
      const parsed: Record<string, UnlockedBadgeRecord[]> = raw ? JSON.parse(raw) : {};
      parsed[userId] = records;
      localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.error('Error saving badges storage:', e);
    }
  }

  static clearUserBadges(userId: string): void {
    try {
      const raw = localStorage.getItem(BADGES_STORAGE_KEY);
      if (!raw) return;
      const parsed: Record<string, UnlockedBadgeRecord[]> = JSON.parse(raw);
      delete parsed[userId];
      localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Evaluates all badge milestones against the user's current habits and logs,
   * automatically persisting any newly achieved badges.
   */
  static syncAndEvaluateBadges(
    userId: string,
    habits: Habit[],
    logs: HabitLog[]
  ): { badges: EvaluatedBadge[]; newlyUnlocked: EvaluatedBadge[] } {
    const stored = this.getStoredRecords(userId);
    const storedMap = new Map(stored.map((r) => [r.badgeId, r]));
    const updatedRecords: UnlockedBadgeRecord[] = [...stored];
    const newlyUnlocked: EvaluatedBadge[] = [];
    const now = new Date().toISOString();

    const totalCompletedLogs = logs.filter((l) => l.isCompleted).length;

    const evaluated: EvaluatedBadge[] = BADGE_DEFINITIONS.map((def) => {
      let currentValue = 0;
      let qualifyingHabitTitle: string | undefined;

      if (def.ruleType === 'habit_streak') {
        let bestHabit: Habit | null = null;
        let maxStreak = 0;
        for (const h of habits) {
          const effectiveStreak = Math.max(h.bestStreak || 0, h.currentStreak || 0);
          if (effectiveStreak >= maxStreak) {
            maxStreak = effectiveStreak;
            bestHabit = h;
          }
        }
        currentValue = maxStreak;
        if (bestHabit && maxStreak >= def.threshold) {
          qualifyingHabitTitle = bestHabit.title;
        }
      } else if (def.ruleType === 'simultaneous_streaks') {
        const minStreakRequired = def.secondaryThreshold || 7;
        const qualifying = habits.filter(
          (h) => h.isActive && (h.currentStreak || 0) >= minStreakRequired
        );
        currentValue = qualifying.length;
        if (qualifying.length >= def.threshold) {
          qualifyingHabitTitle = qualifying
            .slice(0, 3)
            .map((h) => h.title)
            .join(', ');
        }
      } else if (def.ruleType === 'total_completions') {
        currentValue = totalCompletedLogs;
      }

      const existingRecord = storedMap.get(def.id);
      const meetsRuleNow = currentValue >= def.threshold;
      const isUnlocked = Boolean(existingRecord) || meetsRuleNow;

      let unlockedAt = existingRecord?.unlockedAt;
      let savedHabitTitle = existingRecord?.habitTitle || qualifyingHabitTitle;

      if (meetsRuleNow && !existingRecord) {
        unlockedAt = now;
        const newRecord: UnlockedBadgeRecord = {
          badgeId: def.id,
          unlockedAt: now,
          habitTitle: qualifyingHabitTitle,
        };
        updatedRecords.push(newRecord);
        storedMap.set(def.id, newRecord);

        const badgeItem: EvaluatedBadge = {
          definition: def,
          isUnlocked: true,
          unlockedAt,
          qualifyingHabitTitle: savedHabitTitle,
          currentValue: Math.min(currentValue, def.threshold),
          targetValue: def.threshold,
          percentage: 100,
        };
        newlyUnlocked.push(badgeItem);
        return badgeItem;
      }

      const clamped = isUnlocked ? def.threshold : Math.min(currentValue, def.threshold);
      const percentage = isUnlocked
        ? 100
        : Math.min(100, Math.round((clamped / Math.max(1, def.threshold)) * 100));

      return {
        definition: def,
        isUnlocked,
        unlockedAt,
        qualifyingHabitTitle: savedHabitTitle,
        currentValue: isUnlocked ? Math.max(currentValue, def.threshold) : currentValue,
        targetValue: def.threshold,
        percentage,
      };
    });

    if (newlyUnlocked.length > 0) {
      this.saveStoredRecords(userId, updatedRecords);
    }

    return { badges: evaluated, newlyUnlocked };
  }
}
