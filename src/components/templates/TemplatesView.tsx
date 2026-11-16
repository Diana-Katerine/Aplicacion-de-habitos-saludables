import React, { useState } from 'react';
import {
  Plus,
  Check,
  Clock,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import { AiHabitSuggestion, Category, Habit, HabitLog, HabitTemplate, User } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';
import { getCategoryBioluminescentTheme } from '../../services/bioluminescentTheme';
import { AiHabitSuggestionsPanel } from './AiHabitSuggestionsPanel';

interface Props {
  templates: HabitTemplate[];
  categories: Category[];
  existingHabitTitles: string[];
  onAddTemplate: (templateId: string) => void;
  onOpenCreateCustom: () => void;
  user?: User | null;
  habits?: Habit[];
  logs?: HabitLog[];
  onAddSuggestedHabit?: (suggestion: AiHabitSuggestion) => void;
}

export const TemplatesView: React.FC<Props> = ({
  templates,
  categories,
  existingHabitTitles,
  onAddTemplate,
  onOpenCreateCustom,
  user,
  habits = [],
  logs = [],
  onAddSuggestedHabit,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const filteredTemplates = templates.filter((tpl) => {
    if (selectedCategory !== 'all' && tpl.categoryId !== selectedCategory) return false;
    return true;
  });

  const handleAdd = (templateId: string) => {
    onAddTemplate(templateId);
    setAddedIds((prev) => new Set([...prev, templateId]));
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#ececec] dark:border-[#252e3a]">
        <h1 className="font-signifier font-normal text-[36px] md:text-[42px] leading-[1.15] tracking-[-0.015em] text-[#17191c] dark:text-[#f1f5f9]">
          Catálogo de <em className="italic font-normal chromatic-gradient-text">hábitos</em>
        </h1>

        <button
          type="button"
          onClick={onOpenCreateCustom}
          className="px-5 py-2.5 rounded-full bg-transparent hover:bg-[#ECFDF5]/70 dark:hover:bg-[#059669]/15 border border-[#059669]/35 dark:border-[#34d399]/35 hover:border-[#059669] dark:hover:border-[#34d399] text-[14px] text-[#047857] dark:text-[#34d399] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Crear hábito desde cero</span>
        </button>
      </div>

      {/* AI-driven habit suggestions adapted to user's categories & interests */}
      {user && onAddSuggestedHabit && (
        <>
          <AiHabitSuggestionsPanel
            user={user}
            categories={categories}
            habits={habits}
            logs={logs}
            existingHabitTitles={existingHabitTitles}
            onAddSuggestion={onAddSuggestedHabit}
          />

          <div className="pt-2 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-signifier font-normal text-[22px] sm:text-[24px] text-[#17191c] dark:text-[#f1f5f9]">
                Catálogo base de plantillas
              </h2>
              <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
                Explora todas las plantillas listas para añadir según cada categoría.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Categories Filter */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-all border cursor-pointer ${
            selectedCategory === 'all'
              ? 'btn-chromatic text-white border-transparent font-medium'
              : 'bg-white dark:bg-[#141920] text-[#777b86] dark:text-[#9aa4b2] border-[#ececec] dark:border-[#252e3a] hover:text-[#17191c] dark:hover:text-[#f1f5f9] hover:border-[#059669]/40'
          }`}
        >
          Todas
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-all border cursor-pointer ${
                isSelected
                  ? 'text-[#17191c] dark:text-[#f1f5f9] font-medium'
                  : 'bg-white dark:bg-[#141920] text-[#777b86] dark:text-[#9aa4b2] border-[#ececec] dark:border-[#252e3a] hover:text-[#17191c] dark:hover:text-[#f1f5f9] hover:border-[#17191c]/30 dark:hover:border-[#3b4758]'
              }`}
              style={
                isSelected
                  ? {
                      backgroundColor: `${cat.colorHex}20`,
                      borderColor: cat.colorHex,
                      boxShadow: `0 4px 12px -3px ${cat.colorHex}45`,
                    }
                  : undefined
              }
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.colorHex }}
              />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((tpl) => {
          const cat = categoryMap.get(tpl.categoryId) || {
            id: tpl.categoryId,
            name: 'General',
            iconName: 'Activity',
            colorHex: '#17191c',
          };
          const bioTheme = getCategoryBioluminescentTheme(cat);

          const isAlreadyInHabits = existingHabitTitles.some(
            (t) => t.toLowerCase() === tpl.title.toLowerCase()
          );
          const isAddedThisSession = addedIds.has(tpl.id);
          const isAdded = isAlreadyInHabits || isAddedThisSession;

          return (
            <div
              key={tpl.id}
              style={bioTheme.cssVars}
              data-completed={isAdded ? 'true' : 'false'}
              className={`rounded-[24px] p-4 sm:p-6 flex flex-col justify-between transition-colors bioluminescent-card ${
                isAdded ? 'border-[#059669]/35 dark:border-[#34d399]/40 bg-[#ECFDF5]/40 dark:bg-[#059669]/10' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="w-12 h-12 rounded-[14px] border flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `rgba(${bioTheme.rgb}, 0.12)`,
                      borderColor: `rgba(${bioTheme.rgb}, 0.28)`,
                      color: 'var(--bio-text)',
                    }}
                  >
                    <CategoryIcon name={cat.iconName} className="w-6 h-6" />
                  </div>

                  <div className="flex items-center gap-1.5 text-[12px] text-[#777b86] dark:text-[#9aa4b2]">
                    {getTimeIcon(tpl.recommendedTimeOfDay)}
                    <span>{getTimeLabel(tpl.recommendedTimeOfDay)}</span>
                  </div>
                </div>

                <div className="mt-4 min-w-0">
                  <span
                    className="text-[13px] font-medium block"
                    style={{ color: 'var(--bio-text)' }}
                  >
                    {cat.name}
                  </span>
                  <h3 className="text-[18px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em] mt-1 break-words">
                    {tpl.title}
                  </h3>
                  <p className="text-[14px] text-[#777b86] dark:text-[#9aa4b2] mt-1.5 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#ececec] dark:border-[#252e3a] flex flex-wrap items-center justify-between gap-3">
                <span className="text-[14px] font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums">
                  {tpl.targetValue} {tpl.unitLabel} / día
                </span>

                <button
                  type="button"
                  disabled={isAdded}
                  onClick={() => handleAdd(tpl.id)}
                  className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isAdded
                      ? 'bg-[#D1FAE5] dark:bg-[#059669]/20 text-[#047857] dark:text-[#34d399] cursor-default'
                      : 'btn-chromatic text-white cursor-pointer'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>En tu rutina</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.25]" />
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
  );
};
