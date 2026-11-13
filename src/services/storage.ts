import { Category, Challenge, DailyFocus, EnergyLevel, Habit, HabitLog, HabitTemplate, HabitWithTodayLog, MoodTag, User, DayOfWeek, WeeklyFocus } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Hidratación', iconName: 'Droplets', colorHex: '#0EA5E9' },
  { id: 2, name: 'Ejercicio', iconName: 'Dumbbell', colorHex: '#10B981' },
  { id: 3, name: 'Mente & Foco', iconName: 'Brain', colorHex: '#8B5CF6' },
  { id: 4, name: 'Nutrición', iconName: 'Apple', colorHex: '#F59E0B' },
  { id: 5, name: 'Sueño & Calma', iconName: 'Moon', colorHex: '#6366F1' },
  { id: 6, name: 'Aprendizaje', iconName: 'BookOpen', colorHex: '#EC4899' },
  { id: 7, name: 'Productividad', iconName: 'CheckSquare', colorHex: '#14B8A6' },
];

export const DEFAULT_TEMPLATES: HabitTemplate[] = [
  {
    id: 'tpl-1',
    categoryId: 1,
    title: 'Tomar 8 vasos de agua',
    targetValue: 8,
    unitLabel: 'vasos',
    scheduledDays: [1, 2, 3, 4, 5, 6, 7],
    recommendedTimeOfDay: 'anytime',
    description: 'Mantente hidratado y con energía constante a lo largo del día.',
  },
  {
    id: 'tpl-2',
    categoryId: 2,
    title: 'Caminar 20 minutos',
    targetValue: 20,
    unitLabel: 'minutos',
    scheduledDays: [1, 2, 3, 4, 5, 6, 7],
    recommendedTimeOfDay: 'morning',
    description: 'Caminata ligera al aire libre para activar la circulación y despejar la mente.',
  },
  {
    id: 'tpl-3',
    categoryId: 3,
    title: 'Meditación consciente',
    targetValue: 10,
    unitLabel: 'minutos',
    scheduledDays: [1, 2, 3, 4, 5, 6, 7],
    recommendedTimeOfDay: 'morning',
    description: 'Respiración diafragmática y atención plena para reducir el estrés matutino.',
  },
  {
    id: 'tpl-4',
    categoryId: 6,
    title: 'Leer libro de no ficción',
    targetValue: 15,
    unitLabel: 'páginas',
    scheduledDays: [1, 2, 3, 4, 5, 6, 7],
    recommendedTimeOfDay: 'evening',
    description: '15 páginas diarias equivalen a más de 18 libros terminados al año.',
  },
  {
    id: 'tpl-5',
    categoryId: 2,
    title: 'Entrenamiento de fuerza',
    targetValue: 45,
    unitLabel: 'minutos',
    scheduledDays: [1, 2, 4, 5],
    recommendedTimeOfDay: 'afternoon',
    description: 'Rutina de resistencia muscular (pesas, calistenia o circuito funcional).',
  },
  {
    id: 'tpl-6',
    categoryId: 5,
    title: 'Desconexión digital nocturna',
    targetValue: 1,
    unitLabel: 'vez',
    scheduledDays: [1, 2, 3, 4, 5, 6, 7],
    recommendedTimeOfDay: 'evening',
    description: 'Cero pantallas 45 minutos antes de dormir para maximizar melatonina natural.',
  },
  {
    id: 'tpl-7',
    categoryId: 7,
    title: 'Planificar top 3 del día',
    targetValue: 1,
    unitLabel: 'vez',
    scheduledDays: [1, 2, 3, 4, 5],
    recommendedTimeOfDay: 'morning',
    description: 'Definir con absoluta claridad las 3 tareas cruciales de la jornada.',
  },
  {
    id: 'tpl-8',
    categoryId: 4,
    title: 'Comer porción de vegetales crudos',
    targetValue: 2,
    unitLabel: 'porciones',
    scheduledDays: [1, 2, 3, 4, 5, 6, 7],
    recommendedTimeOfDay: 'afternoon',
    description: 'Aporte de fibra, micronutrientes y enzimas digestivas en almuerzo y cena.',
  },
];

const STORAGE_KEYS = {
  USER: 'lm_habit_user',
  HABITS: 'lm_habits',
  LOGS: 'lm_habit_logs',
  CATEGORIES: 'lm_categories',
  TEMPLATES: 'lm_templates',
  THEME: 'lm_theme',
  DAILY_FOCUS: 'lm_daily_focus',
  WEEKLY_FOCUS: 'lm_weekly_focus',
  WEEKLY_REFLECTION_SEEN: 'lm_weekly_reflection_seen',
  JOINED_CHALLENGES: 'lm_joined_challenges',
  CUSTOM_CHALLENGES: 'lm_custom_challenges',
};

// Helper: Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper: get DayOfWeek (1=Mon ... 7=Sun)
export function getDayOfWeek(date: Date): DayOfWeek {
  const day = date.getDay();
  return (day === 0 ? 7 : day) as DayOfWeek;
}

// Helper: Get user's current local date in YYYY-MM-DD
export function getTodayDateString(timezone?: string): string {
  try {
    if (timezone) {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(now);
    }
  } catch (e) {
    console.warn('Invalid timezone, falling back to local date', e);
  }
  return formatDate(new Date());
}

export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function getLocalAnchorDate(timezone?: string): Date {
  const todayStr = getTodayDateString(timezone);
  const parts = todayStr.split('-').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

// Returns YYYY-MM-DD of the Sunday starting the current Sunday-Saturday week
export function getSundayWeekKey(timezone?: string): string {
  const anchor = getLocalAnchorDate(timezone);
  const sundayOffset = anchor.getDay(); // 0 = Sunday, 1 = Mon, ... 6 = Sat
  const sunday = new Date(anchor);
  sunday.setDate(anchor.getDate() - sundayOffset);
  return formatDate(sunday);
}

export function isTodaySunday(timezone?: string): boolean {
  return getLocalAnchorDate(timezone).getDay() === 0;
}

// Generate sample realistic past logs
function generateSeedData(userId: string) {
  const habits: Habit[] = [
    {
      id: 'h-1',
      userId,
      categoryId: 1,
      title: 'Tomar 8 vasos de agua',
      targetValue: 8,
      unitLabel: 'vasos',
      scheduledDays: [1, 2, 3, 4, 5, 6, 7],
      currentStreak: 12,
      bestStreak: 21,
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      reminderTime: '08:30',
      notes: 'Hidratación óptima durante todo el día',
    },
    {
      id: 'h-2',
      userId,
      categoryId: 2,
      title: 'Caminar 20 minutos al sol',
      targetValue: 20,
      unitLabel: 'minutos',
      scheduledDays: [1, 2, 3, 4, 5, 6, 7],
      currentStreak: 7,
      bestStreak: 14,
      isActive: true,
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      reminderTime: '09:00',
    },
    {
      id: 'h-3',
      userId,
      categoryId: 3,
      title: 'Meditación consciente matutina',
      targetValue: 1,
      unitLabel: 'sesión',
      scheduledDays: [1, 2, 3, 4, 5, 6, 7],
      currentStreak: 9,
      bestStreak: 15,
      isActive: true,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      reminderTime: '07:15',
    },
    {
      id: 'h-4',
      userId,
      categoryId: 6,
      title: 'Lectura de desarrollo personal',
      targetValue: 15,
      unitLabel: 'páginas',
      scheduledDays: [1, 2, 3, 4, 5],
      currentStreak: 5,
      bestStreak: 11,
      isActive: true,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      reminderTime: '21:30',
    },
    {
      id: 'h-5',
      userId,
      categoryId: 2,
      title: 'Entrenamiento de fuerza en gimnasio',
      targetValue: 45,
      unitLabel: 'minutos',
      scheduledDays: [1, 2, 4, 5],
      currentStreak: 4,
      bestStreak: 8,
      isActive: true,
      createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      reminderTime: '18:00',
    },
    {
      id: 'h-6',
      userId,
      categoryId: 7,
      title: 'Planificar top 3 del día',
      targetValue: 1,
      unitLabel: 'vez',
      scheduledDays: [1, 2, 3, 4, 5],
      currentStreak: 14,
      bestStreak: 14,
      isActive: true,
      createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      reminderTime: '08:00',
    },
  ];

  const logs: HabitLog[] = [];
  const today = new Date();

  const moodCycle: MoodTag[] = ['focused', 'motivated', 'calm', 'focused', 'calm', 'tired', 'stressed'];

  // Populate trailing 45 days
  for (let i = 45; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const dayOfWeek = getDayOfWeek(d);
    const dayEnergyBase = dayOfWeek <= 4 ? 4 : dayOfWeek === 5 ? 3 : 3;

    habits.forEach((habit) => {
      if (habit.scheduledDays.includes(dayOfWeek)) {
        // High completion probability (85%) for rich realistic data
        const pseudoRandom = (d.getDate() * 17 + habit.id.charCodeAt(2) * 11 + i * 3) % 100;
        const isCompleted = pseudoRandom < 82;
        const completedValue = isCompleted
          ? habit.targetValue
          : Math.floor((habit.targetValue * (pseudoRandom % 70)) / 100);

        const energyOffset = (pseudoRandom % 3) - 1;
        const energyLevel = isCompleted
          ? (Math.max(1, Math.min(5, dayEnergyBase + energyOffset)) as EnergyLevel)
          : undefined;
        const moodTag = isCompleted
          ? moodCycle[(d.getDate() + habit.categoryId + i) % moodCycle.length]
          : undefined;

        logs.push({
          id: `log-${habit.id}-${dateStr}`,
          habitId: habit.id,
          userId,
          logDate: dateStr,
          completedValue,
          isCompleted,
          energyLevel,
          moodTag,
          createdAt: d.toISOString(),
          updatedAt: d.toISOString(),
        });
      }
    });
  }

  // Today's partial logs (some completed, some in progress)
  const todayStr = formatDate(today);
  const todayDayOfWeek = getDayOfWeek(today);

  // h-1: water at 5/8
  logs.push({
    id: `log-h-1-${todayStr}`,
    habitId: 'h-1',
    userId,
    logDate: todayStr,
    completedValue: 5,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // h-3: meditation completed
  logs.push({
    id: `log-h-3-${todayStr}`,
    habitId: 'h-3',
    userId,
    logDate: todayStr,
    completedValue: 1,
    isCompleted: true,
    energyLevel: 4,
    moodTag: 'calm',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // h-6: plan top 3 completed
  if (habits[5].scheduledDays.includes(todayDayOfWeek)) {
    logs.push({
      id: `log-h-6-${todayStr}`,
      habitId: 'h-6',
      userId,
      logDate: todayStr,
      completedValue: 1,
      isCompleted: true,
      energyLevel: 5,
      moodTag: 'focused',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return { habits, logs };
}

// Storage Manager Service
export class StorageService {
  static getUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return null;
  }

  static setUser(user: User | null): void {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  }

  static getOrCreateDemoUser(): User {
    let user = this.getUser();
    if (!user) {
      user = {
        id: 'user-demo-1',
        email: 'alex.momentum@example.com',
        fullName: 'Alex Vance',
        timezone: detectBrowserTimezone(),
        themePreference: 'DARK',
        role: 'USER',
        createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
        reminderEnabled: true,
        reminderMorningTime: '08:00',
        reminderEveningTime: '21:00',
      };
      this.setUser(user);
      this.initializeSeedData(user.id);
    }
    return user;
  }

  static initializeSeedData(userId: string, force = false): void {
    const existingHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!existingHabits || force) {
      const seed = generateSeedData(userId);
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(seed.habits));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(seed.logs));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
    }
  }

  static getCategories(): Category[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CATEGORIES;
  }

  static saveCategories(categories: Category[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  static createCategory(data: {
    name: string;
    iconName: string;
    colorHex: string;
    bioluminescentTheme?: Category['bioluminescentTheme'];
  }): Category {
    const categories = this.getCategories();
    const nextId = categories.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const newCategory: Category = {
      id: nextId,
      name: data.name.trim(),
      iconName: data.iconName,
      colorHex: data.colorHex,
      bioluminescentTheme: data.bioluminescentTheme,
    };
    this.saveCategories([...categories, newCategory]);
    return newCategory;
  }

  static updateCategory(
    categoryId: number,
    updates: Partial<Omit<Category, 'id'>>
  ): Category {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === categoryId);
    if (index === -1) throw new Error('Categoría no encontrada');

    const updated: Category = {
      ...categories[index],
      ...updates,
      name: updates.name !== undefined ? updates.name.trim() : categories[index].name,
    };
    const next = [...categories];
    next[index] = updated;
    this.saveCategories(next);
    return updated;
  }

  static deleteCategory(
    userId: string,
    categoryId: number
  ): { deleted: boolean; reassignedCount: number; fallbackCategory?: Category } {
    const categories = this.getCategories();
    if (categories.length <= 1) {
      return { deleted: false, reassignedCount: 0 };
    }

    const remaining = categories.filter((c) => c.id !== categoryId);
    if (remaining.length === categories.length) {
      return { deleted: false, reassignedCount: 0 };
    }

    const fallbackCategory = remaining[0];
    this.saveCategories(remaining);

    // Reassign habits belonging to deleted category
    const allHabits = this.getAllHabits();
    let reassignedCount = 0;
    const updatedHabits = allHabits.map((h) => {
      if (h.userId === userId && h.categoryId === categoryId) {
        reassignedCount += 1;
        return { ...h, categoryId: fallbackCategory.id, updatedAt: new Date().toISOString() };
      }
      return h;
    });
    if (reassignedCount > 0) {
      this.saveHabits(updatedHabits);
    }

    return { deleted: true, reassignedCount, fallbackCategory };
  }

  static getTemplates(): HabitTemplate[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_TEMPLATES;
  }

  static getHabits(userId: string): Habit[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HABITS);
      if (data) {
        const habits: Habit[] = JSON.parse(data);
        return habits
          .filter((h) => h.userId === userId && !h.deletedAt)
          .map((h, idx) => ({ habit: h, idx }))
          .sort((a, b) => {
            const orderA = a.habit.sortOrder ?? a.idx;
            const orderB = b.habit.sortOrder ?? b.idx;
            if (orderA !== orderB) return orderA - orderB;
            return a.idx - b.idx;
          })
          .map((entry) => entry.habit);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  static getAllHabits(): Habit[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HABITS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveHabits(habits: Habit[]): void {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  }

  static getLogs(userId: string): HabitLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (data) {
        const logs: HabitLog[] = JSON.parse(data);
        return logs.filter((l) => l.userId === userId);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  static saveLogs(logs: HabitLog[]): void {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  // Recalculates streak taking into account scheduled days
  static calculateStreak(habit: Habit, logs: HabitLog[], timezone?: string): { currentStreak: number; bestStreak: number } {
    const todayStr = getTodayDateString(timezone);
    const habitLogs = logs
      .filter((l) => l.habitId === habit.id)
      .reduce((acc, l) => {
        acc[l.logDate] = l.isCompleted;
        return acc;
      }, {} as Record<string, boolean>);

    // Walk backwards from today or yesterday
    let currentStreak = 0;
    const testDate = new Date();
    
    // Check today: if today is scheduled and completed, start with 1
    const todayDayNum = getDayOfWeek(testDate);
    const isTodayScheduled = habit.scheduledDays.includes(todayDayNum);
    
    if (isTodayScheduled && habitLogs[todayStr]) {
      currentStreak++;
    }

    // Now walk previous days
    let daysBack = 1;
    let broken = false;

    while (!broken && daysBack <= 365) {
      const prevDate = new Date();
      prevDate.setDate(prevDate.getDate() - daysBack);
      const dateStr = formatDate(prevDate);
      const dayNum = getDayOfWeek(prevDate);

      if (habit.scheduledDays.includes(dayNum)) {
        if (habitLogs[dateStr]) {
          currentStreak++;
        } else {
          // Scheduled day missed! Streak ends
          broken = true;
          break;
        }
      }
      daysBack++;
    }

    const bestStreak = Math.max(habit.bestStreak || 0, currentStreak);
    return { currentStreak, bestStreak };
  }

  // Get Today's scheduled habits with logs
  static getTodayHabits(userId: string, timezone?: string): HabitWithTodayLog[] {
    const habits = this.getHabits(userId);
    const logs = this.getLogs(userId);
    const categories = this.getCategories();
    const todayStr = getTodayDateString(timezone);
    const todayDate = new Date();
    const todayDayOfWeek = getDayOfWeek(todayDate);

    // Filter habits scheduled for today
    const activeHabits = habits.filter((h) => h.isActive && h.scheduledDays.includes(todayDayOfWeek));

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    return activeHabits.map((habit) => {
      const todayLog = logs.find((l) => l.habitId === habit.id && l.logDate === todayStr);

      // Trailing 7 days history
      const past7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = formatDate(d);
        const dayNum = getDayOfWeek(d);
        const isScheduled = habit.scheduledDays.includes(dayNum);
        const log = logs.find((l) => l.habitId === habit.id && l.logDate === dStr);

        past7Days.push({
          date: dStr,
          dayNum,
          dayLabel: dayLabels[dayNum - 1],
          isScheduled,
          isCompleted: log ? log.isCompleted : false,
          completedValue: log ? log.completedValue : 0,
          targetValue: habit.targetValue,
        });
      }

      return {
        ...habit,
        category: categoryMap.get(habit.categoryId) || {
          id: habit.categoryId,
          name: 'General',
          iconName: 'Check',
          colorHex: '#10B981',
        },
        todayLog,
        past7Days,
      };
    });
  }

  // Update check-in log
  static checkInHabit(
    userId: string,
    habitId: string,
    completedValueChange?: number,
    forceCompleted?: boolean,
    timezone?: string
  ): { habit: Habit; log: HabitLog; allCompletedToday: boolean; dailyCompletionRate: number } {
    const todayStr = getTodayDateString(timezone);
    const allHabits = this.getAllHabits();
    const habitIndex = allHabits.findIndex((h) => h.id === habitId && h.userId === userId);
    if (habitIndex === -1) throw new Error('Hábito no encontrado');

    const habit = allHabits[habitIndex];
    const allLogs = this.getLogs(userId);
    let logIndex = allLogs.findIndex((l) => l.habitId === habitId && l.logDate === todayStr);

    let log: HabitLog;
    const now = new Date().toISOString();

    if (logIndex === -1) {
      const initialValue = completedValueChange !== undefined ? Math.max(0, completedValueChange) : habit.targetValue;
      const isCompleted = forceCompleted !== undefined ? forceCompleted : initialValue >= habit.targetValue;

      log = {
        id: `log-${habitId}-${todayStr}`,
        habitId,
        userId,
        logDate: todayStr,
        completedValue: initialValue,
        isCompleted,
        createdAt: now,
        updatedAt: now,
      };
      allLogs.push(log);
    } else {
      const currentLog = allLogs[logIndex];
      let newValue = currentLog.completedValue;

      if (completedValueChange !== undefined) {
        newValue = Math.max(0, currentLog.completedValue + completedValueChange);
      } else if (forceCompleted !== undefined) {
        newValue = forceCompleted ? habit.targetValue : 0;
      } else {
        // Toggle
        newValue = currentLog.isCompleted ? 0 : habit.targetValue;
      }

      const isCompleted = forceCompleted !== undefined ? forceCompleted : newValue >= habit.targetValue;

      log = {
        ...currentLog,
        completedValue: newValue,
        isCompleted,
        updatedAt: now,
      };
      allLogs[logIndex] = log;
    }

    this.saveLogs(allLogs);

    // Recalculate streak
    const { currentStreak, bestStreak } = this.calculateStreak(habit, allLogs, timezone);
    habit.currentStreak = currentStreak;
    habit.bestStreak = bestStreak;
    habit.updatedAt = now;
    allHabits[habitIndex] = habit;
    this.saveHabits(allHabits);

    // Check daily completion rate
    const todayHabits = this.getTodayHabits(userId, timezone);
    const totalScheduled = todayHabits.length;
    const completedCount = todayHabits.filter((h) => h.todayLog?.isCompleted).length;
    const dailyCompletionRate = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;
    const allCompletedToday = totalScheduled > 0 && completedCount === totalScheduled;

    return {
      habit,
      log,
      allCompletedToday,
      dailyCompletionRate,
    };
  }

  // Save contextual journaling metadata (energy level, mood tag, optional note) onto a habit log
  static saveLogContext(
    userId: string,
    habitId: string,
    context: {
      energyLevel?: EnergyLevel;
      moodTag?: MoodTag;
      journalEntry?: string;
    },
    timezone?: string,
    targetDate?: string
  ): HabitLog | null {
    const logDate = targetDate || getTodayDateString(timezone);
    const allLogs = this.getLogs(userId);
    const idx = allLogs.findIndex((l) => l.habitId === habitId && l.logDate === logDate);
    if (idx === -1) return null;

    const updated: HabitLog = {
      ...allLogs[idx],
      energyLevel: context.energyLevel ?? allLogs[idx].energyLevel,
      moodTag: context.moodTag ?? allLogs[idx].moodTag,
      journalEntry:
        context.journalEntry !== undefined
          ? context.journalEntry.trim() || undefined
          : allLogs[idx].journalEntry,
      updatedAt: new Date().toISOString(),
    };
    allLogs[idx] = updated;
    this.saveLogs(allLogs);
    return updated;
  }

  // Create habit
  static createHabit(
    userId: string,
    habitData: Omit<Habit, 'id' | 'userId' | 'currentStreak' | 'bestStreak' | 'createdAt' | 'updatedAt'>
  ): Habit {
    const allHabits = this.getAllHabits();
    const userHabits = this.getHabits(userId);
    const maxSortOrder = userHabits.reduce(
      (max, h, idx) => Math.max(max, h.sortOrder ?? idx),
      -1
    );
    const now = new Date().toISOString();
    const newHabit: Habit = {
      ...habitData,
      id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      currentStreak: 0,
      bestStreak: 0,
      sortOrder: habitData.sortOrder ?? maxSortOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    allHabits.push(newHabit);
    this.saveHabits(allHabits);
    return newHabit;
  }

  // Persist user's custom sequence for daily routines
  static reorderHabits(userId: string, orderedVisibleIds: string[]): Habit[] {
    const allHabits = this.getAllHabits();
    const currentUserHabits = this.getHabits(userId);
    if (currentUserHabits.length === 0 || orderedVisibleIds.length === 0) {
      return currentUserHabits;
    }

    const habitById = new Map(currentUserHabits.map((h) => [h.id, h]));
    const visibleSet = new Set(orderedVisibleIds.filter((id) => habitById.has(id)));
    const reorderedVisible = orderedVisibleIds
      .map((id) => habitById.get(id))
      .filter((h): h is Habit => Boolean(h));

    // Place reordered visible habits into the exact slots they occupied
    let visibleCursor = 0;
    const mergedUserSequence = currentUserHabits.map((habit) => {
      if (visibleSet.has(habit.id) && visibleCursor < reorderedVisible.length) {
        const nextHabit = reorderedVisible[visibleCursor];
        visibleCursor += 1;
        return nextHabit;
      }
      return habit;
    });

    const now = new Date().toISOString();
    const updatedOrderById = new Map<string, number>();
    mergedUserSequence.forEach((h, index) => {
      updatedOrderById.set(h.id, index);
    });

    const nextAllHabits = allHabits.map((h) => {
      if (h.userId === userId && updatedOrderById.has(h.id)) {
        return {
          ...h,
          sortOrder: updatedOrderById.get(h.id),
          updatedAt: now,
        };
      }
      return h;
    });

    this.saveHabits(nextAllHabits);
    return this.getHabits(userId);
  }

  // Update habit
  static updateHabit(userId: string, habitId: string, updates: Partial<Habit>): Habit {
    const allHabits = this.getAllHabits();
    const index = allHabits.findIndex((h) => h.id === habitId && h.userId === userId);
    if (index === -1) throw new Error('Hábito no encontrado');

    const updated: Habit = {
      ...allHabits[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    allHabits[index] = updated;
    this.saveHabits(allHabits);
    return updated;
  }

  // Soft delete habit
  static deleteHabit(userId: string, habitId: string): void {
    const allHabits = this.getAllHabits();
    const index = allHabits.findIndex((h) => h.id === habitId && h.userId === userId);
    if (index !== -1) {
      allHabits[index].isActive = false;
      allHabits[index].deletedAt = new Date().toISOString();
      this.saveHabits(allHabits);
    }
  }

  // Add template habit
  static addTemplateToUser(userId: string, templateId: string): Habit {
    const templates = this.getTemplates();
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) throw new Error('Plantilla no encontrada');

    return this.createHabit(userId, {
      categoryId: tpl.categoryId,
      title: tpl.title,
      targetValue: tpl.targetValue,
      unitLabel: tpl.unitLabel,
      scheduledDays: tpl.scheduledDays,
      isActive: true,
      notes: tpl.description,
    });
  }

  // Daily Focus Intent Methods
  static getAllDailyFocuses(userId: string): DailyFocus[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_FOCUS);
      if (data) {
        const focuses: DailyFocus[] = JSON.parse(data);
        return focuses.filter((f) => f.userId === userId);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  static getDailyFocus(userId: string, timezone?: string): DailyFocus | null {
    const todayStr = getTodayDateString(timezone);
    const focuses = this.getAllDailyFocuses(userId);
    return focuses.find((f) => f.date === todayStr) || null;
  }

  static saveDailyFocus(userId: string, intent: string, timezone?: string): DailyFocus {
    const todayStr = getTodayDateString(timezone);
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_FOCUS);
    const all: DailyFocus[] = raw ? JSON.parse(raw) : [];
    const now = new Date().toISOString();

    const idx = all.findIndex((f) => f.userId === userId && f.date === todayStr);
    let record: DailyFocus;

    if (idx !== -1) {
      record = {
        ...all[idx],
        intent: intent.trim(),
        updatedAt: now,
      };
      all[idx] = record;
    } else {
      record = {
        id: `focus-${userId}-${todayStr}`,
        userId,
        date: todayStr,
        intent: intent.trim(),
        isCompleted: false,
        updatedAt: now,
      };
      all.push(record);
    }

    localStorage.setItem(STORAGE_KEYS.DAILY_FOCUS, JSON.stringify(all));
    return record;
  }

  static toggleDailyFocusCompleted(userId: string, timezone?: string): DailyFocus | null {
    const todayStr = getTodayDateString(timezone);
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_FOCUS);
    const all: DailyFocus[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((f) => f.userId === userId && f.date === todayStr);
    if (idx === -1) return null;

    const updated: DailyFocus = {
      ...all[idx],
      isCompleted: !all[idx].isCompleted,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.DAILY_FOCUS, JSON.stringify(all));
    return updated;
  }

  static clearDailyFocus(userId: string, timezone?: string): void {
    const todayStr = getTodayDateString(timezone);
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_FOCUS);
    if (!raw) return;
    const all: DailyFocus[] = JSON.parse(raw);
    const filtered = all.filter((f) => !(f.userId === userId && f.date === todayStr));
    localStorage.setItem(STORAGE_KEYS.DAILY_FOCUS, JSON.stringify(filtered));
  }

  // Sunday Weekly Reflection & Weekly Focus Intent Methods
  static hasSeenWeeklyReflection(userId: string, weekKey: string): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.WEEKLY_REFLECTION_SEEN);
      if (!raw) return false;
      const map: Record<string, string[]> = JSON.parse(raw);
      return (map[userId] || []).includes(weekKey);
    } catch {
      return false;
    }
  }

  static markWeeklyReflectionSeen(userId: string, weekKey: string): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.WEEKLY_REFLECTION_SEEN);
      const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
      const current = map[userId] || [];
      if (!current.includes(weekKey)) {
        map[userId] = [...current, weekKey];
        localStorage.setItem(STORAGE_KEYS.WEEKLY_REFLECTION_SEEN, JSON.stringify(map));
      }
    } catch (e) {
      console.error(e);
    }
  }

  static getWeeklyFocus(userId: string, timezone?: string): WeeklyFocus | null {
    try {
      const weekKey = getSundayWeekKey(timezone);
      const raw = localStorage.getItem(STORAGE_KEYS.WEEKLY_FOCUS);
      if (!raw) return null;
      const all: WeeklyFocus[] = JSON.parse(raw);
      return all.find((f) => f.userId === userId && f.weekKey === weekKey) || null;
    } catch {
      return null;
    }
  }

  static saveWeeklyFocus(
    userId: string,
    intent: string,
    reflectionNote?: string,
    timezone?: string
  ): WeeklyFocus {
    const weekKey = getSundayWeekKey(timezone);
    const raw = localStorage.getItem(STORAGE_KEYS.WEEKLY_FOCUS);
    const all: WeeklyFocus[] = raw ? JSON.parse(raw) : [];
    const now = new Date().toISOString();
    const idx = all.findIndex((f) => f.userId === userId && f.weekKey === weekKey);

    let record: WeeklyFocus;
    if (idx !== -1) {
      record = {
        ...all[idx],
        intent: intent.trim(),
        reflectionNote: reflectionNote?.trim() || undefined,
        updatedAt: now,
      };
      all[idx] = record;
    } else {
      record = {
        id: `wfocus-${userId}-${weekKey}`,
        userId,
        weekKey,
        intent: intent.trim(),
        reflectionNote: reflectionNote?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      all.push(record);
    }

    localStorage.setItem(STORAGE_KEYS.WEEKLY_FOCUS, JSON.stringify(all));
    this.markWeeklyReflectionSeen(userId, weekKey);
    return record;
  }

  static clearWeeklyFocus(userId: string, timezone?: string): void {
    const weekKey = getSundayWeekKey(timezone);
    const raw = localStorage.getItem(STORAGE_KEYS.WEEKLY_FOCUS);
    if (!raw) return;
    const all: WeeklyFocus[] = JSON.parse(raw);
    const filtered = all.filter((f) => !(f.userId === userId && f.weekKey === weekKey));
    localStorage.setItem(STORAGE_KEYS.WEEKLY_FOCUS, JSON.stringify(filtered));
  }

  // Challenges & Milestones Methods
  static getDefaultChallenges(): Challenge[] {
    const now = new Date();
    const monthNameRaw = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(now);
    const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1);
    const year = now.getFullYear();
    const lastDayOfMonth = new Date(year, now.getMonth() + 1, 0);
    const endDateStr = formatDate(lastDayOfMonth);

    return [
      // Monthly Community Goals
      {
        id: 'ch-comm-1',
        kind: 'community',
        title: `Inercia Colectiva de ${monthName}: 60 Check-ins`,
        description:
          'Meta mensual comunitaria: acumula 60 registros completados entre todos tus hábitos durante este mes para impulsar la meta global.',
        targetCount: 60,
        unitLabel: 'check-ins',
        monthLabel: `${monthName} ${year}`,
        participantsCount: 1428,
        communityTotalTarget: 100000,
        communityCurrentTotal: 78420,
        metricRule: 'monthly_total_checkins',
        rewardLabel: 'Insignia Impulso Mensual',
        endDate: endDateStr,
      },
      {
        id: 'ch-comm-2',
        kind: 'community',
        title: `Desafío ${monthName}: 21 Días de Hidratación`,
        description:
          'Únete a cientos de miembros completando tu hábito de hidratación durante al menos 21 días este mes.',
        categoryId: 1,
        targetCount: 21,
        unitLabel: 'días',
        monthLabel: `${monthName} ${year}`,
        participantsCount: 964,
        communityTotalTarget: 25000,
        communityCurrentTotal: 19310,
        metricRule: 'monthly_category_checkins',
        rewardLabel: 'Insignia Flujo Vital',
        endDate: endDateStr,
      },
      {
        id: 'ch-comm-3',
        kind: 'community',
        title: `Club Mente & Foco: 15 Sesiones de Calma`,
        description:
          'Cultiva claridad mental completando 15 sesiones de meditación, respiración o enfoque este mes junto a la comunidad.',
        categoryId: 3,
        targetCount: 15,
        unitLabel: 'sesiones',
        monthLabel: `${monthName} ${year}`,
        participantsCount: 712,
        communityTotalTarget: 12000,
        communityCurrentTotal: 9650,
        metricRule: 'monthly_category_checkins',
        rewardLabel: 'Insignia Mente Serena',
        endDate: endDateStr,
      },
      {
        id: 'ch-comm-4',
        kind: 'community',
        title: `Movimiento Activo: 16 Días de Entrenamiento`,
        description:
          'Meta mensual de ejercicio físico y caminata consciente para mantener la vitalidad constante.',
        categoryId: 2,
        targetCount: 16,
        unitLabel: 'sesiones',
        monthLabel: `${monthName} ${year}`,
        participantsCount: 1185,
        communityTotalTarget: 20000,
        communityCurrentTotal: 15890,
        metricRule: 'monthly_category_checkins',
        rewardLabel: 'Insignia Vitalidad Activa',
        endDate: endDateStr,
      },
      // Personal Milestones
      {
        id: 'ch-mile-1',
        kind: 'milestone',
        title: 'Primer Impulso: 7 Días de Racha',
        description:
          'Alcanza una racha ininterrumpida de 7 días consecutivos en cualquiera de tus hábitos activos.',
        targetCount: 7,
        unitLabel: 'días seguidos',
        metricRule: 'max_streak',
        rewardLabel: 'Hito Bronce · 7d',
      },
      {
        id: 'ch-mile-2',
        kind: 'milestone',
        title: 'Forjador de Hábitos: 21 Días de Racha',
        description:
          'Consolida un ritual a largo plazo logrando una racha máxima histórica de 21 días.',
        targetCount: 21,
        unitLabel: 'días seguidos',
        metricRule: 'max_streak',
        rewardLabel: 'Hito Oro · 21d',
      },
      {
        id: 'ch-mile-3',
        kind: 'milestone',
        title: 'Centurión Impulso Diario: 100 Check-ins',
        description:
          'Acumula 100 registros completados en tu historial total. Cada pequeño paso suma.',
        targetCount: 100,
        unitLabel: 'check-ins',
        metricRule: 'total_checkins',
        rewardLabel: 'Hito Platino · 100',
      },
      {
        id: 'ch-mile-4',
        kind: 'milestone',
        title: 'Jornadas Perfectas: 5 Días al 100%',
        description:
          'Completa el 100% de tus hábitos programados del día en al menos 5 fechas distintas.',
        targetCount: 5,
        unitLabel: 'días al 100%',
        metricRule: 'perfect_days',
        rewardLabel: 'Hito Disciplina Total',
      },
      {
        id: 'ch-mile-5',
        kind: 'milestone',
        title: 'Mente Anclada: 5 Enfoques del Día',
        description:
          'Define y cumple tu intención principal ("Enfoque del Día") en 5 jornadas diferentes.',
        targetCount: 5,
        unitLabel: 'enfoques',
        metricRule: 'daily_focus_completed',
        rewardLabel: 'Hito Claridad Diaria',
      },
    ];
  }

  static getJoinedChallengeIds(userId: string): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.JOINED_CHALLENGES);
      if (raw) {
        const parsed: Record<string, string[]> = JSON.parse(raw);
        return parsed[userId] || ['ch-comm-1', 'ch-comm-2'];
      }
    } catch (e) {
      console.error(e);
    }
    return ['ch-comm-1', 'ch-comm-2'];
  }

  static toggleJoinChallenge(userId: string, challengeId: string): string[] {
    let allMap: Record<string, string[]> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.JOINED_CHALLENGES);
      if (raw) allMap = JSON.parse(raw);
    } catch {
      allMap = {};
    }

    const current = allMap[userId] || ['ch-comm-1', 'ch-comm-2'];
    const exists = current.includes(challengeId);
    const updated = exists
      ? current.filter((id) => id !== challengeId)
      : [...current, challengeId];

    allMap[userId] = updated;
    localStorage.setItem(STORAGE_KEYS.JOINED_CHALLENGES, JSON.stringify(allMap));
    return updated;
  }

  static getCustomChallenges(userId: string): Challenge[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CHALLENGES);
      if (raw) {
        const parsed: Record<string, Challenge[]> = JSON.parse(raw);
        return parsed[userId] || [];
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  static createCustomChallenge(
    userId: string,
    data: {
      title: string;
      description: string;
      targetCount: number;
      unitLabel: string;
      categoryId?: number;
      endDate?: string;
    }
  ): Challenge {
    let allMap: Record<string, Challenge[]> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CHALLENGES);
      if (raw) allMap = JSON.parse(raw);
    } catch {
      allMap = {};
    }

    const newChallenge: Challenge = {
      id: `ch-custom-${Date.now()}`,
      kind: 'custom',
      title: data.title.trim(),
      description: data.description.trim() || 'Meta personal de constancia.',
      categoryId: data.categoryId,
      targetCount: Math.max(1, data.targetCount),
      unitLabel: data.unitLabel.trim() || 'días',
      metricRule: 'manual',
      manualProgress: 0,
      rewardLabel: 'Hito Personal',
      endDate: data.endDate,
    };

    const userList = allMap[userId] || [];
    allMap[userId] = [newChallenge, ...userList];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CHALLENGES, JSON.stringify(allMap));
    return newChallenge;
  }

  static stepCustomChallengeProgress(userId: string, challengeId: string, delta: number): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CHALLENGES);
      if (!raw) return;
      const allMap: Record<string, Challenge[]> = JSON.parse(raw);
      const userList = allMap[userId] || [];
      allMap[userId] = userList.map((ch) => {
        if (ch.id !== challengeId) return ch;
        const nextVal = Math.max(0, Math.min(ch.targetCount, (ch.manualProgress || 0) + delta));
        return { ...ch, manualProgress: nextVal };
      });
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CHALLENGES, JSON.stringify(allMap));
    } catch (e) {
      console.error(e);
    }
  }

  static deleteCustomChallenge(userId: string, challengeId: string): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CHALLENGES);
      if (!raw) return;
      const allMap: Record<string, Challenge[]> = JSON.parse(raw);
      allMap[userId] = (allMap[userId] || []).filter((ch) => ch.id !== challengeId);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CHALLENGES, JSON.stringify(allMap));
    } catch (e) {
      console.error(e);
    }
  }

  static computeChallengeProgress(
    challenge: Challenge,
    habits: Habit[],
    logs: HabitLog[],
    dailyFocuses: DailyFocus[],
    timezone?: string
  ): { current: number; target: number; percentage: number; isCompleted: boolean } {
    const todayStr = getTodayDateString(timezone);
    const currentMonthPrefix = todayStr.slice(0, 7); // YYYY-MM

    let current = 0;

    switch (challenge.metricRule) {
      case 'monthly_total_checkins': {
        current = logs.filter(
          (l) => l.isCompleted && l.logDate.startsWith(currentMonthPrefix)
        ).length;
        break;
      }
      case 'monthly_category_checkins': {
        const catHabitIds = new Set(
          habits.filter((h) => h.categoryId === challenge.categoryId).map((h) => h.id)
        );
        current = logs.filter(
          (l) =>
            l.isCompleted &&
            l.logDate.startsWith(currentMonthPrefix) &&
            catHabitIds.has(l.habitId)
        ).length;
        break;
      }
      case 'max_streak': {
        current = habits.reduce(
          (max, h) => Math.max(max, h.bestStreak, h.currentStreak),
          0
        );
        break;
      }
      case 'total_checkins': {
        current = logs.filter((l) => l.isCompleted).length;
        break;
      }
      case 'perfect_days': {
        // Count dates in logs where all scheduled active habits on that weekday were completed
        const logsByDate = new Map<string, Set<string>>();
        logs.forEach((l) => {
          if (!l.isCompleted) return;
          if (!logsByDate.has(l.logDate)) logsByDate.set(l.logDate, new Set());
          logsByDate.get(l.logDate)!.add(l.habitId);
        });

        let perfectCount = 0;
        logsByDate.forEach((completedSet, dateStr) => {
          const [y, m, d] = dateStr.split('-').map(Number);
          const dt = new Date(y, m - 1, d);
          const dayNum = getDayOfWeek(dt);
          const scheduledHabits = habits.filter(
            (h) => h.isActive && h.scheduledDays.includes(dayNum)
          );
          if (
            scheduledHabits.length > 0 &&
            scheduledHabits.every((h) => completedSet.has(h.id))
          ) {
            perfectCount++;
          }
        });
        current = perfectCount;
        break;
      }
      case 'daily_focus_completed': {
        current = dailyFocuses.filter((f) => f.isCompleted).length;
        break;
      }
      case 'manual': {
        current = challenge.manualProgress || 0;
        break;
      }
    }

    const target = Math.max(1, challenge.targetCount);
    const clamped = Math.min(target, current);
    const percentage = Math.min(100, Math.round((clamped / target) * 100));
    return {
      current,
      target,
      percentage,
      isCompleted: current >= target,
    };
  }

  // Reset all user data to seed
  static resetUserData(userId: string): void {
    localStorage.removeItem(STORAGE_KEYS.DAILY_FOCUS);
    localStorage.removeItem(STORAGE_KEYS.WEEKLY_FOCUS);
    localStorage.removeItem(STORAGE_KEYS.WEEKLY_REFLECTION_SEEN);
    localStorage.removeItem(STORAGE_KEYS.JOINED_CHALLENGES);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_CHALLENGES);
    localStorage.removeItem('lm_unlocked_badges');
    this.initializeSeedData(userId, true);
  }
}
