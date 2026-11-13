import React, { useState } from 'react';
import {
  Plus,
  Check,
  Clock,
  Sun,
  Sunset,
  Moon,
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
        return <Sun className="w-3.5 h-3.5 text-[#5d2a1a]" />;
      case 'afternoon':
        return <Sunset className="w-3.5 h-3.5 text-[#5d2a1a]" />;
      case 'evening':
        return <Moon className="w-3.5 h-3.5 text-[#17191c]" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-[#777b86]" />;
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#ececec]">
        <div>
          <span className="text-[14px] text-[#979799] block">Rutinas curadas</span>
          <h1 className="font-signifier font-normal text-[36px] md:text-[44px] leading-[1.2] tracking-[-0.015em] text-[#17191c] mt-1">
            Catálogo de <em className="italic font-normal">hábitos</em>
          </h1>
          <p className="text-[16px] text-[#777b86] mt-1">
            Selecciona rutinas comprobadas y añádelas a tu día con un solo clic.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateCustom}
          className="px-5 py-2.5 rounded-full bg-transparent hover:bg-[#fafafb] border border-[#17191c]/25 hover:border-[#17191c] text-[14px] text-[#17191c] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Crear hábito desde cero</span>
        </button>
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-colors border cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#17191c] text-white border-[#17191c]'
              : 'bg-white text-[#777b86] border-[#ececec] hover:text-[#17191c] hover:border-[#17191c]/30'
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
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-colors border cursor-pointer ${
                isSelected
                  ? 'bg-[#17191c] text-white border-[#17191c]'
                  : 'bg-white text-[#777b86] border-[#ececec] hover:text-[#17191c] hover:border-[#17191c]/30'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: isSelected ? '#ffffff' : cat.colorHex }}
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

          const isAlreadyInHabits = existingHabitTitles.some(
            (t) => t.toLowerCase() === tpl.title.toLowerCase()
          );
          const isAddedThisSession = addedIds.has(tpl.id);
          const isAdded = isAlreadyInHabits || isAddedThisSession;

          return (
            <div
              key={tpl.id}
              className={`rounded-[24px] p-6 flex flex-col justify-between transition-colors ${
                isAdded ? 'bg-white border border-[#17191c]/20' : 'steep-card-mist'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-[14px] bg-white border border-[#ececec] text-[#17191c] flex items-center justify-center shrink-0">
                    <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                  </div>

                  <div className="flex items-center gap-1.5 text-[12px] text-[#777b86]">
                    {getTimeIcon(tpl.recommendedTimeOfDay)}
                    <span>{getTimeLabel(tpl.recommendedTimeOfDay)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-[13px] text-[#979799] block">
                    {cat.name}
                  </span>
                  <h3 className="text-[18px] font-medium text-[#17191c] tracking-[-0.01em] mt-1">
                    {tpl.title}
                  </h3>
                  <p className="text-[14px] text-[#777b86] mt-1.5 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#ececec] flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-[#979799] block">
                    Meta recomendada
                  </span>
                  <span className="text-[14px] font-medium text-[#17191c] tabular-nums">
                    {tpl.targetValue} {tpl.unitLabel} / día
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isAdded}
                  onClick={() => handleAdd(tpl.id)}
                  className={`px-4 py-2 rounded-full text-[13px] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isAdded
                      ? 'bg-[#f2f2f3] text-[#777b86] cursor-default'
                      : 'bg-[#17191c] hover:bg-[#2a2d32] text-white cursor-pointer'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>En tu rutina</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
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
