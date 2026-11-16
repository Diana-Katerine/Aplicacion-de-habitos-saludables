import React, { useState } from 'react';
import {
  Plus,
  Search,
  Flame,
  Pause,
  Play,
  Edit2,
  Trash2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { Category, Habit, DayOfWeek } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';
import { summarizeMarkdownInline } from './RitualNotesEditor';
import { getCategoryBioluminescentTheme } from '../../services/bioluminescentTheme';
import { ActionHint } from '../common/ActionHint';

interface Props {
  habits: Habit[];
  categories: Category[];
  onOpenCreateModal: () => void;
  onOpenTemplates: () => void;
  onEditHabit: (habit: Habit) => void;
  onTogglePause: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const HabitsView: React.FC<Props> = ({
  habits,
  categories,
  onOpenCreateModal,
  onOpenTemplates,
  onEditHabit,
  onTogglePause,
  onDeleteHabit,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const filteredHabits = habits.filter((habit) => {
    if (selectedCategory !== 'all' && habit.categoryId !== selectedCategory) return false;
    if (statusFilter === 'active' && !habit.isActive) return false;
    if (statusFilter === 'paused' && habit.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = habit.title.toLowerCase().includes(q);
      const cat = categoryMap.get(habit.categoryId)?.name.toLowerCase() || '';
      if (!matchTitle && !cat.includes(q)) return false;
    }
    return true;
  });

  const activeCount = habits.filter((h) => h.isActive).length;
  const pausedCount = habits.filter((h) => !h.isActive).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#ececec] dark:border-[#252e3a]">
        <h1 className="font-signifier font-normal text-[36px] md:text-[42px] leading-[1.15] tracking-[-0.015em] text-[#17191c] dark:text-[#f1f5f9]">
          Gestión de <em className="italic font-normal text-[#059669] dark:text-[#34d399]">hábitos</em>
        </h1>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenTemplates}
            className="px-4 py-2.5 rounded-full bg-[#EEF2FF]/70 dark:bg-[#4F46E5]/15 hover:bg-[#E0E7FF] dark:hover:bg-[#4F46E5]/25 border border-[#4F46E5]/30 dark:border-[#818CF8]/35 text-[14px] text-[#4338CA] dark:text-[#c7d2fe] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sugerencias IA</span>
          </button>

          <button
            type="button"
            onClick={onOpenTemplates}
            className="px-4 py-2.5 rounded-full bg-transparent hover:bg-[#E0F2FE]/60 dark:hover:bg-[#0284C7]/15 border border-[#0284C7]/35 dark:border-[#38BDF8]/35 hover:border-[#0284C7] dark:hover:border-[#38BDF8] text-[14px] text-[#0369A1] dark:text-[#38bdf8] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Plantillas</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-5 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[14px] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Crear hábito</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#979799] dark:text-[#6f7a8a] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-[16px] bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[14px] focus:outline-none focus:border-[#059669] dark:focus:border-[#34d399] transition-colors"
          />
        </div>

        {/* Status segmented tabs */}
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] self-start md:self-auto max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
            }`}
          >
            Activos ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paused')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === 'paused'
                ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
            }`}
          >
            En pausa ({pausedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
            }`}
          >
            Todos ({habits.length})
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-colors border cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#059669] text-white border-[#059669] font-medium'
              : 'bg-white dark:bg-[#141920] text-[#777b86] dark:text-[#9aa4b2] border-[#ececec] dark:border-[#252e3a] hover:text-[#17191c] dark:hover:text-[#f1f5f9] hover:border-[#059669]/40'
          }`}
        >
          Todas las categorías
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
                  ? 'text-[#17191c] dark:text-[#f1f5f9] font-medium'
                  : 'bg-white dark:bg-[#141920] text-[#777b86] dark:text-[#9aa4b2] border-[#ececec] dark:border-[#252e3a] hover:text-[#17191c] dark:hover:text-[#f1f5f9] hover:border-[#17191c]/30 dark:hover:border-[#3b4758]'
              }`}
              style={
                isSelected
                  ? {
                      backgroundColor: `${cat.colorHex}18`,
                      borderColor: cat.colorHex,
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

      {/* Habit Grid */}
      {filteredHabits.length === 0 ? (
        <div className="steep-card-mist p-12 text-center">
          <p className="text-[15px] text-[#777b86] dark:text-[#9aa4b2] mb-5">
            No se encontraron hábitos con los filtros seleccionados.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="px-5 py-2 rounded-full bg-white dark:bg-[#1b222b] hover:bg-[#fafafb] dark:hover:bg-[#252e3a] border border-[#17191c]/25 dark:border-[#3b4758] text-[13px] text-[#17191c] dark:text-[#f1f5f9] transition-colors cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredHabits.map((habit) => {
            const cat = categoryMap.get(habit.categoryId) || {
              id: habit.categoryId,
              name: 'General',
              iconName: 'Activity',
              colorHex: '#17191c',
            };
            const bioTheme = getCategoryBioluminescentTheme(cat);

            return (
              <div
                key={habit.id}
                style={bioTheme.cssVars}
                data-completed={habit.isActive ? 'true' : 'false'}
                className={`rounded-[24px] p-4 sm:p-6 flex flex-col justify-between bioluminescent-card ${
                  habit.isActive ? '' : 'opacity-70'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `rgba(${bioTheme.rgb}, 0.12)`,
                          borderColor: `rgba(${bioTheme.rgb}, 0.28)`,
                          color: 'var(--bio-text)',
                        }}
                      >
                        <CategoryIcon name={cat.iconName} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className="text-[12px] block truncate"
                          style={{ color: 'var(--bio-text)' }}
                        >
                          {cat.name}
                        </span>
                        <h3 className="text-[17px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em] break-words">
                          {habit.title}
                        </h3>
                      </div>
                    </div>

                    {!habit.isActive && (
                      <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] whitespace-nowrap shrink-0">
                        Pausado
                      </span>
                    )}
                  </div>

                  {/* Goal and notes */}
                  <div className="mt-4 text-[13px] text-[#777b86] dark:text-[#9aa4b2] space-y-1">
                    <p>
                      <span className="font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums">
                        {habit.targetValue} {habit.unitLabel} / día
                      </span>
                      {habit.reminderTime && (
                        <span className="text-[#979799] dark:text-[#6f7a8a] tabular-nums"> · {habit.reminderTime}</span>
                      )}
                    </p>
                    {habit.notes && (
                      <p className="text-[12px] text-[#979799] dark:text-[#6f7a8a] truncate">
                        {summarizeMarkdownInline(habit.notes)}
                      </p>
                    )}
                  </div>

                  {/* Scheduled Days */}
                  <div className="mt-4 pt-3.5 border-t border-[#ececec] dark:border-[#252e3a] flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a]">Frecuencia:</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {DAY_LABELS.map((label, idx) => {
                        const dayNum = (idx + 1) as DayOfWeek;
                        const isScheduled = habit.scheduledDays.includes(dayNum);
                        return (
                          <span
                            key={idx}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium ${
                              isScheduled
                                ? 'border'
                                : 'bg-[#f2f2f3] dark:bg-[#1b222b] text-[#a3a6af] dark:text-[#6f7a8a]'
                            }`}
                            style={
                              isScheduled
                                ? {
                                    backgroundColor: `rgba(${bioTheme.rgb}, 0.12)`,
                                    borderColor: `rgba(${bioTheme.rgb}, 0.34)`,
                                    color: 'var(--bio-text)',
                                  }
                                : undefined
                            }
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Metrics & Actions */}
                <div className="mt-4 pt-3.5 border-t border-[#ececec] dark:border-[#252e3a] flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] tabular-nums">
                    <span className="inline-flex items-center gap-1 font-medium text-[#17191c] dark:text-[#f1f5f9]">
                      <Flame className="w-3.5 h-3.5 text-[#D97706] dark:text-[#fbbf24]" />
                      {habit.currentStreak} d
                    </span>
                    <span className="text-[#979799] dark:text-[#6f7a8a]">· récord {habit.bestStreak} d</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <ActionHint
                      message={
                        habit.isActive
                          ? 'Pausará este hábito temporalmente sin perder su historial'
                          : 'Reanudará este hábito en tu rutina diaria'
                      }
                      tone="accent"
                      position="top"
                      align="center"
                    >
                      <button
                        type="button"
                        onClick={() => onTogglePause(habit.id)}
                        aria-label={habit.isActive ? 'Pausar hábito' : 'Reanudar hábito'}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] hover:bg-[#f2f2f3] dark:hover:bg-[#1b222b] transition-colors cursor-pointer"
                      >
                        {habit.isActive ? (
                          <Pause className="w-[18px] h-[18px]" />
                        ) : (
                          <Play className="w-[18px] h-[18px] text-[#17191c] dark:text-[#f1f5f9]" />
                        )}
                      </button>
                    </ActionHint>
                    <ActionHint
                      message="Abrirá el editor para modificar este hábito"
                      tone="neutral"
                      position="top"
                      align="center"
                    >
                      <button
                        type="button"
                        onClick={() => onEditHabit(habit)}
                        aria-label="Editar hábito"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] hover:bg-[#f2f2f3] dark:hover:bg-[#1b222b] transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-[18px] h-[18px]" />
                      </button>
                    </ActionHint>
                    <ActionHint
                      message="Eliminará este hábito de tu lista activa"
                      tone="danger"
                      position="top"
                      align="right"
                    >
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(habit.id)}
                        aria-label="Eliminar hábito"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[#777b86] dark:text-[#9aa4b2] hover:text-[#b91c1c] dark:hover:text-[#fca5a5] hover:bg-[#fbe1d1]/50 dark:hover:bg-[#7f1d1d]/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-[18px] h-[18px]" />
                      </button>
                    </ActionHint>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-5 bg-[#17191c]/35 dark:bg-[#050709]/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-sm steep-modal p-5 sm:p-6 my-auto max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain">
            <h3 className="font-signifier font-normal text-[22px] sm:text-[24px] text-[#17191c] dark:text-[#f1f5f9]">
              ¿Eliminar este hábito?
            </h3>
            <p className="text-[14px] text-[#777b86] dark:text-[#9aa4b2] mt-2 leading-relaxed">
              El hábito será desactivado de tus rutinas diarias. Tus registros y estadísticas históricas se preservarán de forma segura.
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-transparent hover:bg-[#fafafb] dark:hover:bg-[#1b222b] border border-[#17191c]/25 dark:border-[#3b4758] text-[13px] text-center text-[#17191c] dark:text-[#f1f5f9] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteTargetId) {
                    onDeleteHabit(deleteTargetId);
                    setDeleteTargetId(null);
                  }
                }}
                className="w-full sm:w-auto px-5 py-2 rounded-full bg-[#b91c1c] hover:bg-[#991b1b] text-white text-[13px] text-center transition-colors cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
