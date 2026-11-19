import { AiHabitSuggestion, Category, Challenge, DailyFocus, EnergyLevel, Habit, HabitLog, HabitTemplate, HabitWithTodayLog, MoodTag, User, DayOfWeek, WeeklyFocus } from '../types';
import { isGenericPlaceholderName, resolveDisplayName } from './greeting';

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
  KNOWN_ACCOUNTS: 'lm_known_accounts',
  DEMO_SEED_VERSION: 'lm_demo_seed_version',
  AI_ENCOURAGEMENT_HISTORY: 'impulso_diario_ai_history',
  PASSWORD_RESETS: 'impulso_diario_password_resets',
};

export const DEMO_USER_ID = 'user-demo-1';
const DEMO_SEED_VERSION = '2026-11-alex-full-v3';

export interface KnownAccountProfile {
  id: string;
  email: string;
  fullName: string;
  timezone?: string;
  updatedAt: string;
}

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

interface GeneratedSeedBundle {
  habits: Habit[];
  logs: HabitLog[];
  dailyFocuses: DailyFocus[];
  weeklyFocus: WeeklyFocus;
  joinedChallengeIds: string[];
  customChallenges: Challenge[];
}

const DEMO_JOURNAL_SNIPPETS: Record<string, string[]> = {
  'h-1': [
    'Botella siempre a la vista en el escritorio; cero fatiga después de almorzar.',
    'Completé los 8 vasos antes de las 19:30, mejoró muchísimo mi concentración.',
    'Empecé la mañana con agua y limón antes del café; gran diferencia en energía.',
  ],
  'h-2': [
    'Diez minutos de respiración 4-7-8 al despertar. Mente serena y enfocada.',
    'Sesión guiada de atención plena; logré soltar la tensión de la semana.',
    'Silencio total antes de abrir notificaciones. El mejor ancla del día.',
  ],
  'h-3': [
    'Caminata rápida recibiendo luz natural matutina; despejó por completo la cabeza.',
    '25 minutos al aire libre sin mirar el móvil, ritmo constante y buen ánimo.',
    'Salí justo después de comer para reactivar la energía de la tarde.',
  ],
  'h-4': [
    'Leí un capítulo completo subrayando ideas prácticas sobre diseño de rutinas.',
    'Quince páginas antes de dormir; excelente transición para desconectar.',
    'Sinteticé tres aprendizajes clave en mi cuaderno personal.',
  ],
  'h-5': [
    'Circuito de fuerza con buena técnica en sentadilla y remo; sensación de progreso.',
    'Entrenamiento intenso de 45 min, subí repeticiones manteniendo control.',
    'Movilidad articular + trabajo de core; espalda mucho más ligera.',
  ],
  'h-6': [
    'Definí las 3 prioridades críticas antes de las 08:30; mañana súper productiva.',
    'Bloque profundo completado sin interrupciones gracias a la lista clara.',
    'Cerré los tres entregables clave antes de las 17:00.',
  ],
  'h-7': [
    'Teléfono fuera del dormitorio desde las 22:00; descanso profundo continuo.',
    'Cambié pantallas por música instrumental tranquila antes de dormir.',
    'Modo avión activado a tiempo; desperté con mucha más claridad.',
  ],
  'h-8': [
    'Ensalada completa con aguacate, hojas verdes y buena proteína al mediodía.',
    'Dos porciones frescas preparadas con antelación; digestión ligera toda la tarde.',
    'Cero ultraprocesados en la cena, bowl equilibrado y saciante.',
  ],
};

function computeHistoricalBestStreak(
  habit: Habit,
  logs: HabitLog[],
  anchorToday: Date,
  lookbackDays: number
): number {
  const completedMap = new Map<string, boolean>();
  logs.forEach((l) => {
    if (l.habitId === habit.id && l.isCompleted) {
      completedMap.set(l.logDate, true);
    }
  });

  let best = 0;
  let running = 0;
  for (let i = lookbackDays; i >= 0; i--) {
    const d = new Date(anchorToday);
    d.setDate(anchorToday.getDate() - i);
    const dayNum = getDayOfWeek(d);
    if (!habit.scheduledDays.includes(dayNum)) continue;
    const dateStr = formatDate(d);
    if (completedMap.get(dateStr)) {
      running += 1;
      if (running > best) best = running;
    } else if (i > 0) {
      running = 0;
    }
  }
  return best;
}

// Generate rich 95-day realistic history for Alex demo & initial seed
function generateSeedData(userId: string, timezone?: string): GeneratedSeedBundle {
  const today = getLocalAnchorDate(timezone);
  const todayStr = formatDate(today);
  const todayDayOfWeek = getDayOfWeek(today);
  const nowIso = new Date().toISOString();
  const isoDaysAgo = (days: number, hour = 10, minute = 0) => {
    const d = new Date(today);
    d.setDate(today.getDate() - days);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  const habits: Habit[] = [
    {
      id: 'h-1',
      userId,
      categoryId: 1,
      title: 'Tomar 8 vasos de agua',
      targetValue: 8,
      unitLabel: 'vasos',
      scheduledDays: [1, 2, 3, 4, 5, 6, 7],
      currentStreak: 14,
      bestStreak: 24,
      isActive: true,
      sortOrder: 0,
      contextualJournalingEnabled: true,
      createdAt: isoDaysAgo(96, 8, 0),
      updatedAt: nowIso,
      reminderTime: '08:30',
      notes:
        '- [x] Primer vaso al despertar antes del café\n- [x] Botella de 750 ml en el escritorio\n- [ ] Último vaso antes de las 20:00\n> Mantener hidratación constante sostiene la claridad mental.',
    },
    {
      id: 'h-2',
      userId,
      categoryId: 3,
      title: 'Meditación consciente matutina',
      targetValue: 1,
      unitLabel: 'sesión',
      scheduledDays: [1, 2, 3, 4, 5, 6, 7],
      currentStreak: 30,
      bestStreak: 30,
      isActive: true,
      sortOrder: 1,
      contextualJournalingEnabled: true,
      createdAt: isoDaysAgo(96, 7, 15),
      updatedAt: nowIso,
      reminderTime: '07:15',
      notes:
        '- **Protocolo:** Respiración 4-7-8 + escaneo corporal (10–12 min)\n- [x] Modo silencio antes de iniciar\n> "La calma de los primeros 10 minutos marca el ritmo de todo el día."',
    },
    {
      id: 'h-3',
      userId,
      categoryId: 2,
      title: 'Caminar 20 minutos al sol',
      targetValue: 20,
      unitLabel: 'minutos',
      scheduledDays: [1, 2, 3, 4, 5, 6, 7],
      currentStreak: 15,
      bestStreak: 22,
      isActive: true,
      sortOrder: 2,
      contextualJournalingEnabled: true,
      createdAt: isoDaysAgo(95, 9, 0),
      updatedAt: nowIso,
      reminderTime: '09:00',
      notes:
        '- [x] Exposición a luz natural dentro de los primeros 90 min\n- [ ] Paso firme sin revisar mensajes durante la vuelta',
    },
    {
      id: 'h-4',
      userId,
      categoryId: 6,
      title: 'Lectura de no ficción y síntesis',
      targetValue: 15,
      unitLabel: 'páginas',
      scheduledDays: [1, 2, 3, 4, 5, 6, 7],
      currentStreak: 7,
      bestStreak: 19,
      isActive: true,
      sortOrder: 3,
      contextualJournalingEnabled: true,
      createdAt: isoDaysAgo(94, 21, 0),
      updatedAt: nowIso,
      reminderTime: '21:15',
      notes:
        '- **Lectura actual:** *Hábitos Atómicos* (Cap. 14)\n- [x] Subrayar 1 idea accionable diaria\n- [ ] Pasar aprendizajes al cuaderno semanal',
    },
    {
      id: 'h-5',
      userId,
      categoryId: 2,
      title: 'Entrenamiento de fuerza funcional',
      targetValue: 45,
      unitLabel: 'minutos',
      scheduledDays: [1, 2, 4, 5, 6],
      currentStreak: 11,
      bestStreak: 16,
      isActive: true,
      sortOrder: 4,
      contextualJournalingEnabled: true,
      createdAt: isoDaysAgo(95, 18, 0),
      updatedAt: nowIso,
      reminderTime: '18:00',
      notes:
        '- **Bloque A:** Sentadilla búlgara + Remo con mancuernas (4×10)\n- **Bloque B:** Press militar + Core anti-rotación (3×12)\n> Priorizar técnica limpia sobre peso máximo.',
    },
    {
      id: 'h-6',
      userId,
      categoryId: 7,
      title: 'Planificar top 3 prioridades del día',
      targetValue: 1,
      unitLabel: 'vez',
      scheduledDays: [1, 2, 3, 4, 5],
      currentStreak: 18,
      bestStreak: 25,
      isActive: true,
      sortOrder: 5,
      contextualJournalingEnabled: true,
      createdAt: isoDaysAgo(96, 8, 0),
      updatedAt: nowIso,
      reminderTime: '08:00',
      notes:
        '1. Bloque de foco profundo de 90 min (sin correo)\n2. Entregable principal del sprint\n3. Revisión ordenada antes de cerrar el día',
    },
    {
      id: 'h-7',
      userId,
      categoryId: 5,
      title: 'Desconexión digital nocturna',
      targetValue: 1,
      unitLabel: 'vez',
      scheduledDays: [1, 2, 3, 4, 5, 6, 7],
      currentStreak: 9,
      bestStreak: 16,
      isActive: true,
      sortOrder: 6,
      contextualJournalingEnabled: true,
      createdAt: isoDaysAgo(90, 22, 15),
      updatedAt: nowIso,
      reminderTime: '22:15',
      notes:
        '- [x] Dejar el teléfono cargando fuera del dormitorio\n- [x] Luz cálida 45 min antes de dormir',
    },
    {
      id: 'h-8',
      userId,
      categoryId: 4,
      title: 'Plato balanceado con vegetales frescos',
      targetValue: 2,
      unitLabel: 'porciones',
      scheduledDays: [1, 2, 3, 4, 5, 6, 7],
      currentStreak: 8,
      bestStreak: 14,
      isActive: true,
      sortOrder: 7,
      contextualJournalingEnabled: true,
      createdAt: isoDaysAgo(92, 13, 30),
      updatedAt: nowIso,
      reminderTime: '13:30',
      notes:
        '- **Almuerzo:** Base verde + proteína magra + grasas saludables\n- [x] Preparar vegetales lavados los domingos',
    },
    {
      id: 'h-9',
      userId,
      categoryId: 5,
      title: 'Diario de gratitud nocturno',
      targetValue: 1,
      unitLabel: 'entrada',
      scheduledDays: [1, 2, 3, 4, 5, 6, 7],
      currentStreak: 0,
      bestStreak: 12,
      isActive: false,
      sortOrder: 8,
      contextualJournalingEnabled: true,
      createdAt: isoDaysAgo(70, 22, 0),
      updatedAt: isoDaysAgo(35, 22, 15),
      reminderTime: '22:00',
      notes:
        '- Anotar 3 cosas positivas del día antes de dormir\n> En pausa temporal mientras consolido lectura nocturna.',
    },
  ];

  const logs: HabitLog[] = [];
  const moodCycle: MoodTag[] = ['focused', 'motivated', 'calm', 'focused', 'calm', 'motivated', 'tired', 'stressed'];

  // Track consecutive scheduled steps backwards from yesterday (step = 1 is most recent scheduled day before today)
  const scheduledStepsByHabit = new Map<string, number>();
  const LOOKBACK_DAYS = 95;

  for (let daysBack = 1; daysBack <= LOOKBACK_DAYS; daysBack++) {
    const d = new Date(today);
    d.setDate(today.getDate() - daysBack);
    const dateStr = formatDate(d);
    const dayOfWeek = getDayOfWeek(d);
    const dayEnergyBase = dayOfWeek <= 4 ? 4 : dayOfWeek === 5 ? 4 : 3;

    habits.forEach((habit, hIdx) => {
      if (!habit.scheduledDays.includes(dayOfWeek)) return;
      if (habit.id === 'h-9' && (daysBack < 36 || daysBack > 68)) return;

      const step = (scheduledStepsByHabit.get(habit.id) || 0) + 1;
      scheduledStepsByHabit.set(habit.id, step);

      const pseudo = (d.getDate() * 19 + (hIdx + 1) * 13 + daysBack * 7) % 100;
      const isRecentMonth = daysBack <= 28;
      const baseRate = isRecentMonth ? 86 : 76;

      let isCompleted = pseudo < baseRate;

      // Guarantee exact deterministic trailing & historical streak patterns
      if (habit.id === 'h-1') {
        if (step <= 14) isCompleted = true;
        else if (step === 15) isCompleted = false;
        else if (step >= 68 && step <= 91) isCompleted = true; // 24d historical record
      } else if (habit.id === 'h-2') {
        if (step <= 29) isCompleted = true; // + today = 30d streak!
        else if (step === 30) isCompleted = false;
      } else if (habit.id === 'h-3') {
        if (step <= 14) isCompleted = true; // + today = 15d streak!
        else if (step === 15) isCompleted = false;
        else if (step >= 42 && step <= 63) isCompleted = true; // 22d historical record
      } else if (habit.id === 'h-4') {
        if (step <= 7) isCompleted = true; // 7d active streak
        else if (step === 8) isCompleted = false;
        else if (step >= 50 && step <= 68) isCompleted = true; // 19d historical record
      } else if (habit.id === 'h-5') {
        const targetPrev = habit.scheduledDays.includes(todayDayOfWeek) ? 10 : 11;
        if (step <= targetPrev) isCompleted = true;
        else if (step === targetPrev + 1) isCompleted = false;
        else if (step >= 26 && step <= 41) isCompleted = true; // 16d historical record
      } else if (habit.id === 'h-6') {
        const targetPrev = habit.scheduledDays.includes(todayDayOfWeek) ? 17 : 18;
        if (step <= targetPrev) isCompleted = true;
        else if (step === targetPrev + 1) isCompleted = false;
        else if (step >= 28 && step <= 52) isCompleted = true; // 25d historical record
      } else if (habit.id === 'h-7') {
        if (step <= 8) isCompleted = true; // + today = 9d streak
        else if (step === 9) isCompleted = false;
        else if (step >= 40 && step <= 55) isCompleted = true; // 16d historical record
      } else if (habit.id === 'h-8') {
        if (step <= 7) isCompleted = true; // + today = 8d streak
        else if (step === 8) isCompleted = false;
        else if (step >= 35 && step <= 48) isCompleted = true; // 14d historical record
      } else if (habit.id === 'h-9') {
        isCompleted = daysBack >= 40 && daysBack <= 51; // 12d historical streak before pause
      }

      const completedValue = isCompleted
        ? habit.targetValue
        : Math.max(0, Math.floor((habit.targetValue * ((pseudo % 65) + 10)) / 100));

      const energyOffset = (pseudo % 3) - 1;
      const energyLevel = isCompleted
        ? (Math.max(2, Math.min(5, dayEnergyBase + energyOffset)) as EnergyLevel)
        : undefined;
      const moodTag = isCompleted
        ? moodCycle[(d.getDate() + habit.categoryId + daysBack) % moodCycle.length]
        : undefined;

      // Include authentic Spanish journal entries on recent completed logs
      const snippets = DEMO_JOURNAL_SNIPPETS[habit.id];
      const includeJournal = isCompleted && snippets && daysBack <= 35 && (daysBack + hIdx) % 4 === 0;
      const journalEntry = includeJournal
        ? snippets[(daysBack + hIdx) % snippets.length]
        : undefined;

      const timestamp = isoDaysAgo(daysBack, 9 + (hIdx % 11), (hIdx * 13) % 60);

      logs.push({
        id: `log-${habit.id}-${dateStr}`,
        habitId: habit.id,
        userId,
        logDate: dateStr,
        completedValue,
        isCompleted,
        energyLevel,
        moodTag,
        journalEntry,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });
  }

  // Today's rich mix: finished routines with reflections + 2 interactive in-progress habits
  const todayTimestamps = (hour: number, minute: number) => {
    const d = new Date(today);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  // h-1: water at 6/8 (interactive, finishing reaches 15d milestone!)
  logs.push({
    id: `log-h-1-${todayStr}`,
    habitId: 'h-1',
    userId,
    logDate: todayStr,
    completedValue: 6,
    isCompleted: false,
    createdAt: todayTimestamps(8, 35),
    updatedAt: todayTimestamps(11, 20),
  });

  // h-2: meditation completed (hits exact 30-day milestone celebration!)
  logs.push({
    id: `log-h-2-${todayStr}`,
    habitId: 'h-2',
    userId,
    logDate: todayStr,
    completedValue: 1,
    isCompleted: true,
    energyLevel: 5,
    moodTag: 'calm',
    journalEntry: 'Respiración 4-7-8 durante 12 minutos antes de revisar mensajes. Mente completamente despejada.',
    createdAt: todayTimestamps(7, 20),
    updatedAt: todayTimestamps(7, 32),
  });

  // h-3: morning walk completed (15-day streak!)
  logs.push({
    id: `log-h-3-${todayStr}`,
    habitId: 'h-3',
    userId,
    logDate: todayStr,
    completedValue: 20,
    isCompleted: true,
    energyLevel: 4,
    moodTag: 'motivated',
    journalEntry: 'Vuelta por el parque con sol matutino; activó la energía sin necesidad de segundo café.',
    createdAt: todayTimestamps(9, 5),
    updatedAt: todayTimestamps(9, 28),
  });

  // h-4: reading in progress (10/15 pages)
  logs.push({
    id: `log-h-4-${todayStr}`,
    habitId: 'h-4',
    userId,
    logDate: todayStr,
    completedValue: 10,
    isCompleted: false,
    createdAt: todayTimestamps(12, 10),
    updatedAt: todayTimestamps(12, 30),
  });

  // h-5: strength training completed if scheduled today
  if (habits[4].scheduledDays.includes(todayDayOfWeek)) {
    logs.push({
      id: `log-h-5-${todayStr}`,
      habitId: 'h-5',
      userId,
      logDate: todayStr,
      completedValue: 45,
      isCompleted: true,
      energyLevel: 5,
      moodTag: 'motivated',
      journalEntry: 'Sesión de fuerza y core completada con progresión limpia en press y remo.',
      createdAt: todayTimestamps(10, 45),
      updatedAt: todayTimestamps(11, 35),
    });
  }

  // h-6: plan top 3 completed if scheduled today
  if (habits[5].scheduledDays.includes(todayDayOfWeek)) {
    logs.push({
      id: `log-h-6-${todayStr}`,
      habitId: 'h-6',
      userId,
      logDate: todayStr,
      completedValue: 1,
      isCompleted: true,
      energyLevel: 4,
      moodTag: 'focused',
      journalEntry: 'Tres prioridades cerradas antes de las 08:30; mañana enfocada sin multitarea.',
      createdAt: todayTimestamps(8, 5),
      updatedAt: todayTimestamps(8, 15),
    });
  }

  // h-7: digital disconnect completed
  logs.push({
    id: `log-h-7-${todayStr}`,
    habitId: 'h-7',
    userId,
    logDate: todayStr,
    completedValue: 1,
    isCompleted: true,
    energyLevel: 3,
    moodTag: 'calm',
    journalEntry: 'Recordatorio nocturno preparado y cargador fuera del dormitorio para descansar sin pantallas.',
    createdAt: todayTimestamps(9, 40),
    updatedAt: todayTimestamps(9, 42),
  });

  // h-8: balanced vegetables completed
  logs.push({
    id: `log-h-8-${todayStr}`,
    habitId: 'h-8',
    userId,
    logDate: todayStr,
    completedValue: 2,
    isCompleted: true,
    energyLevel: 4,
    moodTag: 'focused',
    journalEntry: 'Bowl fresco con espinaca, aguacate y proteína ligera; tarde productiva sin pesadez.',
    createdAt: todayTimestamps(12, 15),
    updatedAt: todayTimestamps(12, 40),
  });

  // Synchronize exact currentStreak and bestStreak from actual generated logs
  habits.forEach((habit) => {
    const computed = StorageService.calculateStreak(habit, logs, timezone);
    const historicalBest = computeHistoricalBestStreak(habit, logs, today, LOOKBACK_DAYS);
    habit.currentStreak = habit.isActive ? computed.currentStreak : 0;
    habit.bestStreak = Math.max(habit.currentStreak, historicalBest);
  });

  // Seed Daily Focus history (6 completed past focuses + active focus for today)
  const pastFocusTemplates = [
    { daysBack: 14, intent: 'Cerrar la propuesta de producto sin revisar correo hasta las 11:00' },
    { daysBack: 11, intent: 'Completar bloque creativo de 90 min y caminata sin notificaciones' },
    { daysBack: 8, intent: 'Organizar el menú semanal saludable y entrenar fuerza en la tarde' },
    { daysBack: 5, intent: 'Responder pendientes clave antes del mediodía para liberar la tarde' },
    { daysBack: 3, intent: 'Terminar síntesis de lectura y desconectar pantallas a las 22:00' },
    { daysBack: 1, intent: 'Consolidar racha matutina completa y preparar prioridades del lunes' },
  ];

  const dailyFocuses: DailyFocus[] = pastFocusTemplates.map((item) => {
    const d = new Date(today);
    d.setDate(today.getDate() - item.daysBack);
    const dStr = formatDate(d);
    return {
      id: `focus-${userId}-${dStr}`,
      userId,
      date: dStr,
      intent: item.intent,
      isCompleted: true,
      updatedAt: isoDaysAgo(item.daysBack, 19, 30),
    };
  });

  dailyFocuses.push({
    id: `focus-${userId}-${todayStr}`,
    userId,
    date: todayStr,
    intent: 'Proteger mi bloque matutino de foco profundo y cerrar los 8 vasos de agua',
    isCompleted: false,
    updatedAt: todayTimestamps(8, 10),
  });

  // Seed Weekly Focus for current week
  const weekKey = getSundayWeekKey(timezone);
  const weeklyFocus: WeeklyFocus = {
    id: `wfocus-${userId}-${weekKey}`,
    userId,
    weekKey,
    intent: 'Sostener mis 30 días de meditación y mantener energía estable con hidratación temprana',
    reflectionNote:
      'La semana pasada subí mi adherencia al 89%; dejar el teléfono fuera del cuarto marcó la mayor diferencia en las mañanas.',
    createdAt: isoDaysAgo(2, 19, 0),
    updatedAt: isoDaysAgo(1, 20, 15),
  };

  const joinedChallengeIds = ['ch-comm-1', 'ch-comm-2', 'ch-comm-3', 'ch-comm-4'];

  const endDateObj = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const customChallenges: Challenge[] = [
    {
      id: `ch-custom-${userId}-1`,
      kind: 'custom',
      title: '21 días sin azúcar añadida en el café',
      description:
        'Mantener energía constante evitando picos de glucosa durante tres semanas seguidas.',
      categoryId: 4,
      targetCount: 21,
      unitLabel: 'días',
      metricRule: 'manual',
      manualProgress: 18,
      rewardLabel: 'Hito Personal',
      endDate: formatDate(endDateObj),
    },
    {
      id: `ch-custom-${userId}-2`,
      kind: 'custom',
      title: '12 noches seguidas de lectura analógica',
      description:
        'Leer al menos 15 páginas en papel antes de dormir en lugar de usar el teléfono.',
      categoryId: 6,
      targetCount: 12,
      unitLabel: 'noches',
      metricRule: 'manual',
      manualProgress: 12,
      rewardLabel: 'Hito Personal',
      endDate: formatDate(endDateObj),
    },
  ];

  return {
    habits,
    logs,
    dailyFocuses,
    weeklyFocus,
    joinedChallengeIds,
    customChallenges,
  };
}

// Storage Manager Service
export class StorageService {
  static getKnownAccounts(): Record<string, KnownAccountProfile> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.KNOWN_ACCOUNTS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return {};
  }

  static getSavedAccountProfile(email: string): KnownAccountProfile | null {
    const key = email.trim().toLowerCase();
    if (!key) return null;
    const map = this.getKnownAccounts();
    const match = map[key];
    if (!match) return null;
    return match;
  }

  static getSavedAccountName(email: string): string | null {
    const profile = this.getSavedAccountProfile(email);
    if (!profile || isGenericPlaceholderName(profile.fullName)) return null;
    return profile.fullName;
  }

  static saveAccountProfile(
    email: string,
    fullName: string,
    timezone?: string,
    userId?: string
  ): void {
    const key = email.trim().toLowerCase();
    const cleanedName = resolveDisplayName(fullName, email);
    if (!key || !cleanedName || isGenericPlaceholderName(cleanedName)) return;
    try {
      const map = this.getKnownAccounts();
      const existing = map[key];
      map[key] = {
        id: userId || existing?.id || `usr-${Date.now()}`,
        email: email.trim(),
        fullName: cleanedName,
        timezone: timezone || existing?.timezone,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.KNOWN_ACCOUNTS, JSON.stringify(map));
    } catch (e) {
      console.error(e);
    }
  }

  static getUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (data) {
        const parsed: User = JSON.parse(data);
        if (isGenericPlaceholderName(parsed.fullName)) {
          const savedName = this.getSavedAccountName(parsed.email);
          const resolved = savedName || resolveDisplayName(parsed.fullName, parsed.email);
          if (resolved && !isGenericPlaceholderName(resolved)) {
            const repaired: User = { ...parsed, fullName: resolved };
            this.setUser(repaired);
            return repaired;
          }
        }
        return parsed;
      }
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
      if (!isGenericPlaceholderName(user.fullName)) {
        this.saveAccountProfile(user.email, user.fullName, user.timezone, user.id);
      }
    }
  }

  static ensureDemoUserSeeded(user: User): void {
    if (user.id !== DEMO_USER_ID) return;
    const seedVersion = localStorage.getItem(STORAGE_KEYS.DEMO_SEED_VERSION);
    const existingDemoHabits = this.getHabits(DEMO_USER_ID);
    if (existingDemoHabits.length === 0 || seedVersion !== DEMO_SEED_VERSION) {
      this.seedUserRichDataset(user.id, user.timezone);
      localStorage.setItem(STORAGE_KEYS.DEMO_SEED_VERSION, DEMO_SEED_VERSION);
    }
  }

  static getOrCreateDemoUser(): User {
    const current = this.getUser();
    const detectedTz = detectBrowserTimezone();
    const activeTheme: 'DARK' | 'LIGHT' =
      typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
        ? 'DARK'
        : 'LIGHT';

    let demoUser: User;
    if (current && current.id === DEMO_USER_ID) {
      demoUser = current;
    } else {
      demoUser = {
        id: DEMO_USER_ID,
        email: 'alex.momentum@example.com',
        fullName: 'Alex Vance',
        timezone: detectedTz,
        themePreference: activeTheme,
        role: 'USER',
        createdAt: new Date(Date.now() - 96 * 86400000).toISOString(),
        reminderEnabled: true,
        reminderMorningTime: '08:00',
        reminderEveningTime: '21:00',
      };
      this.setUser(demoUser);
    }

    this.ensureDemoUserSeeded(demoUser);
    return demoUser;
  }

  static seedUserRichDataset(userId: string, timezone?: string): void {
    const seed = generateSeedData(userId, timezone);

    // Ensure categories include all default category IDs (1..7) while keeping custom categories
    const existingCategories = this.getCategories();
    const existingCatIds = new Set(existingCategories.map((c) => c.id));
    const mergedCategories = [
      ...existingCategories,
      ...DEFAULT_CATEGORIES.filter((dc) => !existingCatIds.has(dc.id)),
    ];
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(mergedCategories));

    if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
    }

    // Merge user's habits without wiping other accounts
    const allHabits = this.getAllHabits().filter((h) => h.userId !== userId);
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify([...allHabits, ...seed.habits]));

    // Merge user's logs without wiping other accounts
    let otherLogs: HabitLog[] = [];
    try {
      const rawLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (rawLogs) {
        otherLogs = (JSON.parse(rawLogs) as HabitLog[]).filter((l) => l.userId !== userId);
      }
    } catch {
      otherLogs = [];
    }
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([...otherLogs, ...seed.logs]));

    // Merge Daily Focus history
    let otherFocuses: DailyFocus[] = [];
    try {
      const rawFocus = localStorage.getItem(STORAGE_KEYS.DAILY_FOCUS);
      if (rawFocus) {
        otherFocuses = (JSON.parse(rawFocus) as DailyFocus[]).filter((f) => f.userId !== userId);
      }
    } catch {
      otherFocuses = [];
    }
    localStorage.setItem(
      STORAGE_KEYS.DAILY_FOCUS,
      JSON.stringify([...otherFocuses, ...seed.dailyFocuses])
    );

    // Merge Weekly Focus
    let otherWeeklyFocuses: WeeklyFocus[] = [];
    try {
      const rawWFocus = localStorage.getItem(STORAGE_KEYS.WEEKLY_FOCUS);
      if (rawWFocus) {
        otherWeeklyFocuses = (JSON.parse(rawWFocus) as WeeklyFocus[]).filter(
          (f) => f.userId !== userId
        );
      }
    } catch {
      otherWeeklyFocuses = [];
    }
    localStorage.setItem(
      STORAGE_KEYS.WEEKLY_FOCUS,
      JSON.stringify([...otherWeeklyFocuses, seed.weeklyFocus])
    );
    this.markWeeklyReflectionSeen(userId, seed.weeklyFocus.weekKey);

    // Merge Joined Challenges
    let joinedMap: Record<string, string[]> = {};
    try {
      const rawJoined = localStorage.getItem(STORAGE_KEYS.JOINED_CHALLENGES);
      if (rawJoined) joinedMap = JSON.parse(rawJoined);
    } catch {
      joinedMap = {};
    }
    joinedMap[userId] = seed.joinedChallengeIds;
    localStorage.setItem(STORAGE_KEYS.JOINED_CHALLENGES, JSON.stringify(joinedMap));

    // Merge Custom Challenges
    let customMap: Record<string, Challenge[]> = {};
    try {
      const rawCustom = localStorage.getItem(STORAGE_KEYS.CUSTOM_CHALLENGES);
      if (rawCustom) customMap = JSON.parse(rawCustom);
    } catch {
      customMap = {};
    }
    customMap[userId] = seed.customChallenges;
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CHALLENGES, JSON.stringify(customMap));
  }

  static initializeSeedData(userId: string, force = false, timezone?: string): void {
    const hasUserHabits = this.getHabits(userId).length > 0;
    const existingHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (force || (!existingHabits && !hasUserHabits)) {
      this.seedUserRichDataset(userId, timezone);
      if (userId === DEMO_USER_ID) {
        localStorage.setItem(STORAGE_KEYS.DEMO_SEED_VERSION, DEMO_SEED_VERSION);
      }
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

    // Walk backwards from today or yesterday using user's local anchor date
    let currentStreak = 0;
    const testDate = getLocalAnchorDate(timezone);

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
      const prevDate = new Date(testDate);
      prevDate.setDate(testDate.getDate() - daysBack);
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
    const todayDate = getLocalAnchorDate(timezone);
    const todayStr = formatDate(todayDate);
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
        const d = new Date(todayDate);
        d.setDate(todayDate.getDate() - i);
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

  // Add AI-suggested habit directly to user's active routine
  static addSuggestedHabit(userId: string, suggestion: AiHabitSuggestion): Habit {
    const notesParts = [suggestion.description?.trim(), suggestion.whyItFits?.trim() ? `> ${suggestion.whyItFits.trim()}` : ''].filter(Boolean);
    return this.createHabit(userId, {
      categoryId: suggestion.categoryId,
      title: suggestion.title,
      targetValue: suggestion.targetValue,
      unitLabel: suggestion.unitLabel,
      scheduledDays: suggestion.scheduledDays?.length ? suggestion.scheduledDays : [1, 2, 3, 4, 5, 6, 7],
      reminderTime: suggestion.reminderTime,
      isActive: true,
      contextualJournalingEnabled: true,
      notes: notesParts.join('\n'),
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

  // Reset all user data to rich demo seed
  static resetUserData(userId: string): void {
    const currentUser = this.getUser();
    const timezone = currentUser?.id === userId ? currentUser.timezone : undefined;
    try {
      const rawBadges = localStorage.getItem('lm_unlocked_badges');
      if (rawBadges) {
        const parsed = JSON.parse(rawBadges) as Record<string, unknown>;
        delete parsed[userId];
        localStorage.setItem('lm_unlocked_badges', JSON.stringify(parsed));
      }
    } catch {
      localStorage.removeItem('lm_unlocked_badges');
    }
    this.initializeSeedData(userId, true, timezone);
  }

  // --- Password Reset Simulation (HU #7) ---
  static createPasswordResetToken(email: string): { code: string; expiresAt: number } {
    const key = email.trim().toLowerCase();
    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PASSWORD_RESETS);
      const resets = raw ? JSON.parse(raw) : {};
      resets[key] = { code, expiresAt };
      localStorage.setItem(STORAGE_KEYS.PASSWORD_RESETS, JSON.stringify(resets));
    } catch (e) {
      console.error('Error saving password reset request:', e);
    }
    return { code, expiresAt };
  }

  static validateAndResetPassword(
    email: string,
    code: string,
    newPassword: string
  ): { success: boolean; error?: string } {
    const key = email.trim().toLowerCase();
    if (!key) return { success: false, error: 'Correo inválido.' };
    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PASSWORD_RESETS);
      const resets = raw ? JSON.parse(raw) : {};
      const record = resets[key];

      if (!record) {
        return { success: false, error: 'No se encontró una solicitud activa de recuperación para este correo.' };
      }

      if (Date.now() > record.expiresAt) {
        delete resets[key];
        localStorage.setItem(STORAGE_KEYS.PASSWORD_RESETS, JSON.stringify(resets));
        return { success: false, error: 'El código de verificación ha expirado. Solicita uno nuevo.' };
      }

      if (record.code !== code.trim()) {
        return { success: false, error: 'El código de verificación es incorrecto.' };
      }

      // Successful verification: consume token and update known account profile
      delete resets[key];
      localStorage.setItem(STORAGE_KEYS.PASSWORD_RESETS, JSON.stringify(resets));

      const accounts = this.getKnownAccounts();
      if (accounts[key]) {
        accounts[key].updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.KNOWN_ACCOUNTS, JSON.stringify(accounts));
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Error al procesar el cambio de contraseña.' };
    }
  }

  // --- AI Encouragement Advice History (HU #14) ---
  static getAiEncouragementHistory(userId: string): import('../types').AiEncouragementMessage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AI_ENCOURAGEMENT_HISTORY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Record<string, import('../types').AiEncouragementMessage[]>;
      return parsed[userId] || [];
    } catch {
      return [];
    }
  }

  static saveAiEncouragementToHistory(
    userId: string,
    message: import('../types').AiEncouragementMessage
  ): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AI_ENCOURAGEMENT_HISTORY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, import('../types').AiEncouragementMessage[]>) : {};
      const userList = parsed[userId] || [];

      const withId: import('../types').AiEncouragementMessage = {
        ...message,
        id: message.id || `ai-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };

      // Avoid duplicates with the exact same headline and timestamp
      const isDuplicate = userList.some(
        (m) => m.headline === withId.headline && m.generatedAt === withId.generatedAt
      );
      if (!isDuplicate) {
        userList.unshift(withId); // Most recent first
        // Limit history to 50 items to keep storage lean
        if (userList.length > 50) {
          userList.length = 50;
        }
        parsed[userId] = userList;
        localStorage.setItem(STORAGE_KEYS.AI_ENCOURAGEMENT_HISTORY, JSON.stringify(parsed));
      }
    } catch (e) {
      console.error('Error saving AI encouragement history:', e);
    }
  }

  static deleteAiEncouragementFromHistory(userId: string, messageId: string): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AI_ENCOURAGEMENT_HISTORY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, import('../types').AiEncouragementMessage[]>;
      if (!parsed[userId]) return;
      parsed[userId] = parsed[userId].filter((m) => m.id !== messageId);
      localStorage.setItem(STORAGE_KEYS.AI_ENCOURAGEMENT_HISTORY, JSON.stringify(parsed));
    } catch (e) {
      console.error('Error deleting AI encouragement from history:', e);
    }
  }
}
