import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Check,
  Clock,
  Sun,
  Sunset,
  Moon,
  Compass,
} from 'lucide-react';
import { Category, HabitTemplate } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';

interface Props {
  templates: HabitTemplate[];
  categories: Category[];
  existingHabitTitles: string[];
  onAddTemplate: (templateId: string) => void;
  onOpenCreateCustom: () => void;
}

export const TemplatesView: React.FC<Props> = ({
  templates,
  categories,
  existingHabitTitles,
  onAddTemplate,
  onOpenCreateCustom,
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
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'afternoon':
        return <Sunset className="w-3.5 h-3.5 text-orange-400" />;
      case 'evening':
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-emerald-400" />;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Catálogo de Hábitos Sugeridos
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Selecciona rutinas comprobadas y añádelas a tu día con un solo clic.
          </p>
        </div>

        <button
          onClick={onOpenCreateCustom}
          className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-[#27354A] border border-white/10 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Crear hábito desde cero</span>
        </button>
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#10B981] text-[#003824] border-[#34D399] font-bold'
              : 'bg-[#0F172A] text-slate-400 border-white/10 hover:text-white'
          }`}
        >
          Todas
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-[#1E293B] text-white border-white/25'
                  : 'bg-[#0F172A] text-slate-400 border-white/10 hover:text-white'
              }`}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => {
          const cat = categoryMap.get(tpl.categoryId) || {
            id: tpl.categoryId,
            name: 'General',
            iconName: 'Activity',
            colorHex: '#10B981',
          };

          const isAlreadyInHabits = existingHabitTitles.some(
            (t) => t.toLowerCase() === tpl.title.toLowerCase()
          );
          const isAddedThisSession = addedIds.has(tpl.id);
          const isAdded = isAlreadyInHabits || isAddedThisSession;

          return (
            <div
              key={tpl.id}
              className="rounded-xl border border-white/[0.08] p-5 bg-[#0F172A] flex flex-col justify-between hover:border-white/15 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${cat.colorHex}20`,
                      color: cat.colorHex,
                    }}
                  >
                    <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                  </div>

                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1E293B] border border-white/10 text-[10px] text-slate-300 font-medium">
                    {getTimeIcon(tpl.recommendedTimeOfDay)}
                    <span>{getTimeLabel(tpl.recommendedTimeOfDay)}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider block"
                    style={{ color: cat.colorHex }}
                  >
                    {cat.name}
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                    Meta recomendada
                  </span>
                  <span className="text-xs font-bold text-slate-200 tabular-nums">
                    {tpl.targetValue} {tpl.unitLabel} / día
                  </span>
                </div>

                <button
                  disabled={isAdded}
                  onClick={() => handleAdd(tpl.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                      : 'bg-[#10B981] hover:bg-[#34D399] text-[#003824] shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>En tu rutina</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
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
