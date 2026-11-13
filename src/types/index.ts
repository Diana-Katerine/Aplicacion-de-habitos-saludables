export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Monday, 7 = Sunday

export interface Category {
  id: number;
  name: string;
  iconName: string;
  colorHex: string;
}

export interface Habit {
  id: string;
  userId: string;
  categoryId: number;
  title: string;
  targetValue: number;
  unitLabel: string;
  scheduledDays: DayOfWeek[]; // [1,2,3,4,5,6,7]
  currentStreak: number;
  bestStreak: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  reminderTime?: string; // "HH:mm"
  notes?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  logDate: string; // YYYY-MM-DD
  completedValue: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitWithTodayLog extends Habit {
  category: Category;
  todayLog?: HabitLog;
  past7Days: {
    date: string;
    dayNum: DayOfWeek;
    dayLabel: string;
    isScheduled: boolean;
    isCompleted: boolean;
    completedValue: number;
    targetValue: number;
  }[];
}

export interface HabitTemplate {
  id: string;
  categoryId: number;
  title: string;
  targetValue: number;
  unitLabel: string;
  scheduledDays: DayOfWeek[];
  recommendedTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  description?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  timezone: string;
  themePreference: 'DARK' | 'LIGHT';
  role: 'USER' | 'ADMIN';
  createdAt: string;
  reminderEnabled?: boolean;
  reminderMorningTime?: string;
  reminderEveningTime?: string;
}

export interface DailyFocus {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  intent: string;
  isCompleted: boolean;
  updatedAt: string;
}

export type ChallengeKind = 'community' | 'milestone' | 'custom';

export interface Challenge {
  id: string;
  kind: ChallengeKind;
  title: string;
  description: string;
  categoryId?: number;
  targetCount: number;
  unitLabel: string;
  monthLabel?: string;
  participantsCount?: number;
  communityTotalTarget?: number;
  communityCurrentTotal?: number;
  metricRule:
    | 'monthly_total_checkins'
    | 'monthly_category_checkins'
    | 'max_streak'
    | 'total_checkins'
    | 'perfect_days'
    | 'daily_focus_completed'
    | 'manual';
  manualProgress?: number;
  rewardLabel: string;
  endDate?: string;
}

export type ViewRoute = 'today' | 'habits' | 'stats' | 'challenges' | 'templates' | 'profile';
