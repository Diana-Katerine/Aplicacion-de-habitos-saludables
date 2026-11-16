import {
  AiHabitSuggestionsResponse,
  Category,
  Habit,
  HabitLog,
  User,
} from '../types';
import { getGreetingFirstName } from './greeting';

const SUGGESTIONS_CACHE_PREFIX = 'impulso_diario_ai_habit_suggestions_v1';

export interface CategoryInterestProfile {
  id: number;
  name: string;
  habitCount: number;
  activeStreaksSum: number;
  recentCompletions: number;
  existingTitles: string[];
  interestScore: number;
}

export interface FetchHabitSuggestionsParams {
  user: User;
  categories: Category[];
  habits: Habit[];
  logs: HabitLog[];
  selectedCategoryIds?: number[];
  interestNote?: string;
  forceRefresh?: boolean;
}

export function buildCategoryInterestProfiles(
  categories: Category[],
  habits: Habit[],
  logs: HabitLog[]
): CategoryInterestProfile[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  const cutoffIso = cutoffDate.toISOString().slice(0, 10);

  const habitCategoryMap = new Map(habits.map((h) => [h.id, h.categoryId]));
  const completionsByCategory = new Map<number, number>();
  logs.forEach((l) => {
    if (!l.isCompleted || l.logDate < cutoffIso) return;
    const catId = habitCategoryMap.get(l.habitId);
    if (catId !== undefined) {
      completionsByCategory.set(catId, (completionsByCategory.get(catId) || 0) + 1);
    }
  });

  return categories
    .map((cat) => {
      const catHabits = habits.filter((h) => h.categoryId === cat.id && !h.deletedAt);
      const activeStreaksSum = catHabits.reduce((sum, h) => sum + (h.currentStreak || 0), 0);
      const recentCompletions = completionsByCategory.get(cat.id) || 0;
      const interestScore =
        catHabits.length * 10 + activeStreaksSum * 2 + recentCompletions;

      return {
        id: cat.id,
        name: cat.name,
        habitCount: catHabits.length,
        activeStreaksSum,
        recentCompletions,
        existingTitles: catHabits.map((h) => h.title),
        interestScore,
      };
    })
    .sort((a, b) => b.interestScore - a.interestScore || a.id - b.id);
}

function buildCacheSignature(params: {
  categories: Category[];
  habits: Habit[];
  selectedCategoryIds?: number[];
  interestNote?: string;
}): string {
  const catKey = params.categories
    .map((c) => `${c.id}:${c.name}`)
    .sort()
    .join('|');
  const habitsKey = params.habits
    .filter((h) => !h.deletedAt)
    .map((h) => h.id)
    .sort()
    .join(',');
  const selKey = (params.selectedCategoryIds || []).slice().sort((a, b) => a - b).join(',');
  const noteKey = (params.interestNote || '').trim().toLowerCase();
  return `${catKey}::${habitsKey}::${selKey}::${noteKey}`;
}

export function getCachedHabitSuggestions(
  userId: string,
  expectedSignature: string
): AiHabitSuggestionsResponse | null {
  try {
    const raw = localStorage.getItem(`${SUGGESTIONS_CACHE_PREFIX}::${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      signature: string;
      data: AiHabitSuggestionsResponse;
    };
    if (!parsed?.data?.suggestions?.length) return null;
    if (parsed.signature !== expectedSignature) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function setCachedHabitSuggestions(
  userId: string,
  signature: string,
  data: AiHabitSuggestionsResponse
): void {
  try {
    localStorage.setItem(
      `${SUGGESTIONS_CACHE_PREFIX}::${userId}`,
      JSON.stringify({ signature, data })
    );
  } catch {
    // ignore storage quota errors
  }
}

export async function requestAiHabitSuggestions(
  params: FetchHabitSuggestionsParams
): Promise<AiHabitSuggestionsResponse> {
  const {
    user,
    categories,
    habits,
    logs,
    selectedCategoryIds,
    interestNote,
    forceRefresh = false,
  } = params;

  const signature = buildCacheSignature({
    categories,
    habits,
    selectedCategoryIds,
    interestNote,
  });

  if (!forceRefresh) {
    const cached = getCachedHabitSuggestions(user.id, signature);
    if (cached) return cached;
  }

  const profiles = buildCategoryInterestProfiles(categories, habits, logs);
  const existingHabitTitles = habits
    .filter((h) => !h.deletedAt)
    .map((h) => h.title);

  const res = await fetch('/api/habits/suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: getGreetingFirstName(user.fullName, user.email),
      categories: profiles.map((p) => ({
        id: p.id,
        name: p.name,
        habitCount: p.habitCount,
        activeStreaksSum: p.activeStreaksSum,
        recentCompletions: p.recentCompletions,
        existingTitles: p.existingTitles,
      })),
      selectedCategoryIds,
      existingHabitTitles,
      interestNote: interestNote?.trim() || undefined,
      requestSeed: Date.now(),
    }),
  });

  const body = (await res.json()) as Partial<AiHabitSuggestionsResponse> & { error?: string };
  if (!res.ok) {
    throw new Error(
      body.error || 'No se pudieron generar recomendaciones de hábitos en este momento.'
    );
  }

  const result: AiHabitSuggestionsResponse = {
    interestSummary:
      body.interestSummary ||
      'Sugerencias populares adaptadas a tus categorías existentes e intereses.',
    suggestions: Array.isArray(body.suggestions) ? body.suggestions : [],
    generatedAt: body.generatedAt || new Date().toISOString(),
  };

  setCachedHabitSuggestions(user.id, signature, result);
  return result;
}
