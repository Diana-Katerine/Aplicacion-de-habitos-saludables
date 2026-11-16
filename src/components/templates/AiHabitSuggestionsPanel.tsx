import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Plus,
  Check,
  Sun,
  Sunset,
  Moon,
  Clock,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  AiHabitSuggestion,
  AiHabitSuggestionsResponse,
  Category,
  Habit,
  HabitLog,
  User,
} from '../../types';
import {
  buildCategoryInterestProfiles,
  requestAiHabitSuggestions,
} from '../../services/aiHabitSuggestions';
import { getCategoryBioluminescentTheme } from '../../services/bioluminescentTheme';
import { CategoryIcon } from '../common/CategoryIcon';

interface Props {
  user: User;
  categories: Category[];
  habits: Habit[];
  logs: HabitLog[];
  existingHabitTitles: string[];
  onAddSuggestion: (suggestion: AiHabitSuggestion) => void;
}

const QUICK_INTEREST_PROMPTS = [
  'Micro-hábitos de 5–10 min',
  'Más energía en la tarde',
  'Enfoque sin distracciones',
  'Descanso y recuperación',
];

function formatScheduledDaysShort(days: number[]): string {
  if (days.length === 7) return 'Todos los días';
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'Lun – Vie';
  if (days.length === 2 && days.includes(6) && days.includes(7)) return 'Fines de semana';
  const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  return days.map((d) => labels[d - 1] || '').filter(Boolean).join(' · ');
}

export const AiHabitSuggestionsPanel: React.FC<Props> = ({
  user,
  categories,
  habits,
  logs,
  existingHabitTitles,
  onAddSuggestion,
}) => {
  const [selectedCatFilter, setSelectedCatFilter] = useState<number | 'all'>('all');
  const [interestNote, setInterestNote] = useState('');
  const [result, setResult] = useState<AiHabitSuggestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const interestProfiles = useMemo(
    () => buildCategoryInterestProfiles(categories, habits, logs),
    [categories, habits, logs]
  );

  const topInterestCategories = useMemo(
    () => interestProfiles.filter((p) => p.interestScore > 0).slice(0, 3),
    [interestProfiles]
  );

  const loadSuggestions = async (forceRefresh = false, customNote?: string) => {
    if (categories.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const selectedCategoryIds =
        selectedCatFilter === 'all' ? undefined : [selectedCatFilter];
      const data = await requestAiHabitSuggestions({
        user,
        categories,
        habits,
        logs,
        selectedCategoryIds,
        interestNote: customNote !== undefined ? customNote : interestNote,
        forceRefresh,
      });
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron generar sugerencias de hábitos.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSuggestions(false);
  }, [user.id, selectedCatFilter, categories.length]);

  const handleSubmitInterest = (e: React.FormEvent) => {
    e.preventDefault();
    void loadSuggestions(true);
  };

  const handleQuickPrompt = (prompt: string) => {
    const next = interestNote === prompt ? '' : prompt;
    setInterestNote(next);
    void loadSuggestions(true, next);
  };

  const handleAdd = (suggestion: AiHabitSuggestion) => {
    onAddSuggestion(suggestion);
    setAddedIds((prev) => new Set([...prev, suggestion.id]));
  };

  const getTimeIcon = (time?: string) => {
    switch (time) {
      case 'morning':
        return <Sun className="w-3.5 h-3.5 text-[#D97706] dark:text-[#fbbf24]" />;
      case 'afternoon':
        return <Sunset className="w-3.5 h-3.5 text-[#EA580C] dark:text-[#fb923c]" />;
      case 'evening':
        return <Moon className="w-3.5 h-3.5 text-[#4F46E5] dark:text-[#a5b4fc]" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38bdf8]" />;
    }
  };

  const getTimeLabel = (time?: string) => {
    switch (time) {
      case 'morning':
        return 'Mañana';
      case 'afternoon':
        return 'Tarde';
      case 'evening':
        return 'Noche';
      default:
        return 'Todo el día';
    }
  };

  return (
    <section
      aria-label="Sugerencias populares de hábitos adaptadas con IA"
      className="rounded-[24px] bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a] overflow-hidden"
    >
      <div className="h-1 w-full chromatic-accent-bar" />

      <div className="p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#4F46E5] dark:text-[#a5b4fc]">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Generador IA · Adaptado a tus intereses</span>
            </div>
            <h2 className="font-signifier font-normal text-[22px] sm:text-[26px] leading-[1.2] tracking-[-0.015em] text-[#17191c] dark:text-[#f1f5f9]">
              Hábitos populares recomendados para ti
            </h2>
            <p className="text-[13px] sm:text-[14px] text-[#777b86] dark:text-[#9aa4b2]">
              {topInterestCategories.length > 0 ? (
                <>
                  Basado en tus categorías activas ({' '}
                  <span className="font-medium text-[#17191c] dark:text-[#f1f5f9]">
                    {topInterestCategories.map((c) => c.name).join(', ')}
                  </span>
                  ) y sin duplicar tus rutinas actuales.
                </>
              ) : (
                'Analiza tus categorías existentes para sugerir hábitos populares fáciles de sostener.'
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={isLoading || categories.length === 0}
            onClick={() => void loadSuggestions(true)}
            className="btn-chromatic px-4 py-2.5 rounded-full text-white text-[13px] font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 self-start lg:self-auto"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Generando lista...' : 'Generar nuevas ideas'}</span>
          </button>
        </div>

        {/* Category Focus & Interest Input */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
            <button
              type="button"
              onClick={() => setSelectedCatFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-[12px] whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                selectedCatFilter === 'all'
                  ? 'bg-[#17191c] dark:bg-[#f1f5f9] text-white dark:text-[#17191c] border-transparent font-medium'
                  : 'bg-[#fafafb] dark:bg-[#1b222b] text-[#777b86] dark:text-[#9aa4b2] border-[#ececec] dark:border-[#252e3a] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
              }`}
            >
              Todas mis categorías ({categories.length})
            </button>
            {interestProfiles.map((profile) => {
              const cat = categoryMap.get(profile.id);
              const isSelected = selectedCatFilter === profile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedCatFilter(profile.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                    isSelected
                      ? 'text-[#17191c] dark:text-[#f1f5f9] font-medium'
                      : 'bg-[#fafafb] dark:bg-[#1b222b] text-[#777b86] dark:text-[#9aa4b2] border-[#ececec] dark:border-[#252e3a] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
                  }`}
                  style={
                    isSelected && cat
                      ? {
                          backgroundColor: `${cat.colorHex}20`,
                          borderColor: cat.colorHex,
                        }
                      : undefined
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat?.colorHex || '#10B981' }}
                  />
                  <span>{profile.name}</span>
                  {profile.habitCount > 0 && (
                    <span className="text-[11px] opacity-70 tabular-nums">
                      ({profile.habitCount})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={handleSubmitInterest}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <input
              type="text"
              value={interestNote}
              onChange={(e) => setInterestNote(e.target.value)}
              maxLength={140}
              placeholder="¿Algún interés o meta actual? Ej: mejorar descanso, micro-hábitos de 10 min..."
              aria-label="Interés o enfoque actual para adaptar sugerencias"
              className="flex-1 min-w-0 px-4 py-2.5 rounded-[16px] bg-[#fafafb] dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[13px] focus:outline-none focus:border-[#4F46E5] dark:focus:border-[#818CF8]"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 rounded-full bg-[#EEF2FF] dark:bg-[#4F46E5]/20 hover:bg-[#E0E7FF] dark:hover:bg-[#4F46E5]/30 border border-[#4F46E5]/25 dark:border-[#818CF8]/30 text-[13px] font-medium text-[#4338CA] dark:text-[#a5b4fc] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              Adaptar lista
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-[#979799] dark:text-[#6f7a8a] mr-1">
              Intereses rápidos:
            </span>
            {QUICK_INTEREST_PROMPTS.map((prompt) => {
              const active = interestNote === prompt;
              return (
                <button
                  key={prompt}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickPrompt(prompt)}
                  className={`px-2.5 py-1 rounded-full text-[11px] transition-colors border cursor-pointer ${
                    active
                      ? 'bg-[#EEF2FF] dark:bg-[#4F46E5]/25 border-[#4F46E5]/40 text-[#4338CA] dark:text-[#c7d2fe] font-medium'
                      : 'bg-transparent border-[#ececec] dark:border-[#252e3a] text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
                  }`}
                >
                  {prompt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-4 rounded-[16px] bg-[#fbe1d1]/70 dark:bg-[#241814] border border-[#f2ceb8] dark:border-[#4a2d20] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px] text-[#5d2a1a] dark:text-[#fbdac7]">
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadSuggestions(true)}
              className="px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#1b222b] border border-[#5d2a1a]/25 dark:border-[#fbdac7]/30 text-[12px] font-medium whitespace-nowrap shrink-0 cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && !result && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="rounded-[20px] p-5 bg-[#fafafb] dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-[12px] bg-[#ececec] dark:bg-[#252e3a]" />
                  <div className="w-24 h-4 rounded-full bg-[#ececec] dark:bg-[#252e3a]" />
                </div>
                <div className="w-3/4 h-5 rounded bg-[#ececec] dark:bg-[#252e3a]" />
                <div className="w-full h-4 rounded bg-[#ececec] dark:bg-[#252e3a]" />
                <div className="w-2/3 h-4 rounded bg-[#ececec] dark:bg-[#252e3a]" />
              </div>
            ))}
          </div>
        )}

        {/* AI Result Summary + Grid */}
        {result && result.suggestions.length > 0 && (
          <div className={`space-y-4 transition-opacity ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
            <div className="px-4 py-2.5 rounded-[16px] bg-[#EEF2FF]/55 dark:bg-[#4F46E5]/10 border border-[#4F46E5]/15 dark:border-[#818CF8]/20 text-[13px] text-[#3730A3] dark:text-[#c7d2fe] flex items-start sm:items-center gap-2">
              <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0 text-[#4F46E5] dark:text-[#a5b4fc]" />
              <span>{result.interestSummary}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.suggestions.map((sug) => {
                const cat = categoryMap.get(sug.categoryId) || {
                  id: sug.categoryId,
                  name: sug.categoryName,
                  iconName: 'Sparkles',
                  colorHex: '#4F46E5',
                };
                const bioTheme = getCategoryBioluminescentTheme(cat);
                const isAlreadyInRoutine = existingHabitTitles.some(
                  (t) => t.trim().toLowerCase() === sug.title.trim().toLowerCase()
                );
                const isAdded = isAlreadyInRoutine || addedIds.has(sug.id);

                return (
                  <div
                    key={sug.id}
                    style={bioTheme.cssVars}
                    data-completed={isAdded ? 'true' : 'false'}
                    className={`rounded-[22px] p-4 sm:p-5 flex flex-col justify-between transition-colors bioluminescent-card ${
                      isAdded
                        ? 'border-[#059669]/35 dark:border-[#34d399]/40 bg-[#ECFDF5]/40 dark:bg-[#059669]/10'
                        : ''
                    }`}
                  >
                    <div className="space-y-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="w-10 h-10 rounded-[12px] border flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `rgba(${bioTheme.rgb}, 0.14)`,
                            borderColor: `rgba(${bioTheme.rgb}, 0.3)`,
                            color: 'var(--bio-text)',
                          }}
                        >
                          <CategoryIcon name={cat.iconName} className="w-5 h-5" />
                        </div>

                        <div className="flex flex-col items-end gap-1 min-w-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EEF2FF] dark:bg-[#4F46E5]/20 text-[#4338CA] dark:text-[#c7d2fe] max-w-full truncate">
                            {sug.popularityTag}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#777b86] dark:text-[#9aa4b2] tabular-nums">
                            {getTimeIcon(sug.recommendedTimeOfDay)}
                            <span>
                              {getTimeLabel(sug.recommendedTimeOfDay)}
                              {sug.reminderTime ? ` · ${sug.reminderTime}` : ''}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <span
                          className="text-[12px] font-medium block truncate"
                          style={{ color: 'var(--bio-text)' }}
                        >
                          {cat.name}
                        </span>
                        <h3 className="text-[17px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em] mt-0.5 break-words">
                          {sug.title}
                        </h3>
                        <p className="text-[13px] text-[#5c616d] dark:text-[#9aa4b2] mt-1.5 leading-relaxed">
                          {sug.description}
                        </p>
                      </div>

                      <p className="text-[12px] text-[#4338CA] dark:text-[#a5b4fc] bg-[#EEF2FF]/45 dark:bg-[#4F46E5]/10 rounded-[12px] px-3 py-2 leading-snug">
                        <strong className="font-medium">Por qué encaja:</strong> {sug.whyItFits}
                      </p>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-[#ececec] dark:border-[#252e3a] flex flex-wrap items-center justify-between gap-2.5">
                      <div className="text-[12.5px] tabular-nums min-w-0">
                        <span className="font-medium text-[#17191c] dark:text-[#f1f5f9] block">
                          {sug.targetValue} {sug.unitLabel} / día
                        </span>
                        <span className="text-[11px] text-[#979799] dark:text-[#6f7a8a]">
                          {formatScheduledDaysShort(sug.scheduledDays)}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isAdded}
                        onClick={() => handleAdd(sug)}
                        className={`px-3.5 py-2 rounded-full text-[12.5px] font-medium transition-all inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                          isAdded
                            ? 'bg-[#D1FAE5] dark:bg-[#059669]/20 text-[#047857] dark:text-[#34d399] cursor-default'
                            : 'btn-chromatic text-white cursor-pointer'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>En tu rutina</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 stroke-[2.25]" />
                            <span>Añadir</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
