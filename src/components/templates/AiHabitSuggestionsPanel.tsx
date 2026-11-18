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
      className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div className="p-6 sm:p-8 space-y-6">
        {/* ZONA 1: CONTEXTO Y TEMA */}
        <header className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-md">
                <Sparkles className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span>Asistente IA · Rutinas y Estudio</span>
              </div>
              <h2 className="font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                Hábitos y Técnicas de Estudio Recomendadas
              </h2>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 max-w-prose text-left">
                {topInterestCategories.length > 0 ? (
                  <>
                    Adaptado a tus categorías prioritarias ({' '}
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      {topInterestCategories.map((c) => c.name).join(', ')}
                    </strong>
                    ) para fortalecer tu concentración y consistencia sin duplicar temas.
                  </>
                ) : (
                  'Estructura hábitos y pausas de estudio adaptadas a tu ritmo de aprendizaje.'
                )}
              </p>
            </div>

            <button
              type="button"
              disabled={isLoading || categories.length === 0}
              onClick={() => void loadSuggestions(true)}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed self-start lg:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Analizando tu consulta...' : 'Generar nuevas ideas'}</span>
            </button>
          </div>
        </header>

        {/* ZONA 2: ENTRADA / PREGUNTA DE INTERACCIÓN */}
        <div className="space-y-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
            <button
              type="button"
              onClick={() => setSelectedCatFilter('all')}
              className={`min-h-[44px] px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all border cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                selectedCatFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent font-semibold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Todas las materias ({categories.length})
            </button>
            {interestProfiles.map((profile) => {
              const cat = categoryMap.get(profile.id);
              const isSelected = selectedCatFilter === profile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedCatFilter(profile.id)}
                  className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all border cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat?.colorHex || '#4F46E5' }}
                  />
                  <span>{profile.name}</span>
                  {profile.habitCount > 0 && (
                    <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                      ({profile.habitCount})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={handleSubmitInterest}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <label htmlFor="ai-interest-note-input" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                ¿Qué meta o reto de estudio deseas abordar?
              </label>
              <input
                id="ai-interest-note-input"
                type="text"
                value={interestNote}
                onChange={(e) => setInterestNote(e.target.value)}
                maxLength={140}
                placeholder="Ej: Técnicas de estudio Pomodoro, lectura analítica de 20 min..."
                className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-[44px] sm:self-end px-5 py-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-300 dark:border-indigo-700 text-sm font-semibold text-indigo-700 dark:text-indigo-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
            >
              Consultar IA
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Sugerencias de sesión:
            </span>
            {QUICK_INTEREST_PROMPTS.map((prompt) => {
              const active = interestNote === prompt;
              return (
                <button
                  key={prompt}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickPrompt(prompt)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-700 font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-slate-100'
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
          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-rose-800 dark:text-rose-200 font-medium">
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-700 dark:text-rose-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadSuggestions(true)}
              className="min-h-[44px] px-4 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 text-sm font-semibold hover:bg-rose-100/50 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Indicador de estado de la IA sin saltos bruscos (CLS) */}
        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="min-h-[220px] rounded-xl p-8 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-3 text-center"
          >
            <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              Analizando tu consulta y estructurando recomendaciones...
            </p>
            <p className="text-sm font-normal text-slate-600 dark:text-slate-400 max-w-prose">
              Organizando el contenido en bloques digeribles para optimizar tu tiempo de estudio.
            </p>
          </div>
        )}

        {/* ZONA 3: CONTENIDO GENERADO POR IA (CHUNKED EN TARJETAS DIGERIBLES) */}
        {!isLoading && result && result.suggestions.length > 0 && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-sm font-medium text-indigo-900 dark:text-indigo-200 flex items-start sm:items-center gap-3">
              <TrendingUp className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0 text-indigo-700 dark:text-indigo-400" />
              <span>{result.interestSummary}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.suggestions.map((sug) => {
                const cat = categoryMap.get(sug.categoryId) || {
                  id: sug.categoryId,
                  name: sug.categoryName,
                  iconName: 'Sparkles',
                  colorHex: '#4F46E5',
                };
                const isAlreadyInRoutine = existingHabitTitles.some(
                  (t) => t.trim().toLowerCase() === sug.title.trim().toLowerCase()
                );
                const isAdded = isAlreadyInRoutine || addedIds.has(sug.id);

                return (
                  <article
                    key={sug.id}
                    className={`rounded-xl p-6 flex flex-col justify-between bg-white dark:bg-slate-800 border transition-colors shadow-sm ${
                      isAdded
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="space-y-4 min-w-0">
                      {/* Cabecera de la tarjeta */}
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0"
                        >
                          <CategoryIcon name={cat.iconName} className="w-6 h-6" />
                        </div>

                        <div className="flex flex-col items-end gap-1.5 min-w-0">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 max-w-full truncate">
                            {sug.popularityTag}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                            {getTimeIcon(sug.recommendedTimeOfDay)}
                            <span>
                              {getTimeLabel(sug.recommendedTimeOfDay)}
                              {sug.reminderTime ? ` · ${sug.reminderTime}` : ''}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Bloque 1: Definición y concepto clave */}
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 block truncate">
                          {cat.name}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-1 break-words">
                          {sug.title}
                        </h3>
                        <p className="text-sm font-normal text-slate-700 dark:text-slate-300 mt-2 leading-relaxed text-left">
                          {sug.description}
                        </p>
                      </div>

                      {/* Bloque 2: Aplicación práctica / Por qué encaja */}
                      <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                          <strong className="font-semibold text-indigo-700 dark:text-indigo-400">Objetivo pedagógico:</strong> {sug.whyItFits}
                        </p>
                      </div>
                    </div>

                    {/* Bloque 3: Zona de interacción (44px min-h) */}
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm tabular-nums min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {sug.targetValue} {sug.unitLabel} / día
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {formatScheduledDaysShort(sug.scheduledDays)}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isAdded}
                        onClick={() => handleAdd(sug)}
                        className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                          isAdded
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>En tu plan</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 stroke-[2.25]" />
                            <span>Añadir al plan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
