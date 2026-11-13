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
} from 'lucide-react';
import { Category, Habit, DayOfWeek } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';
import { RitualNotesMarkdown } from './RitualNotesEditor';
import { getCategoryBioluminescentTheme } from '../../services/bioluminescentTheme';

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#ececec]">
        <div>
          <span className="text-[14px] text-[#979799] block">Biblioteca personal</span>
          <h1 className="font-signifier font-normal text-[36px] md:text-[44px] leading-[1.2] tracking-[-0.015em] text-[#17191c] mt-1">
            Gestión de <em className="italic font-normal">hábitos</em>
          </h1>
          <p className="text-[16px] text-[#777b86] mt-1">
            Configura tus rituales, metas numéricas, horarios y frecuencias semanales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenTemplates}
            className="px-4 py-2.5 rounded-full bg-transparent hover:bg-[#fafafb] border border-[#17191c]/25 hover:border-[#17191c] text-[14px] text-[#17191c] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Plantillas</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-5 py-2.5 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[14px] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear hábito</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#979799] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] placeholder-[#a3a6af] text-[14px] focus:outline-none focus:border-[#17191c] transition-colors"
          />
        </div>

        {/* Status segmented tabs */}
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-1.5 rounded-full text-[13px] transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-white text-[#17191c] font-medium shadow-xs'
                : 'text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            Activos ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paused')}
            className={`px-4 py-1.5 rounded-full text-[13px] transition-all cursor-pointer ${
              statusFilter === 'paused'
                ? 'bg-white text-[#17191c] font-medium shadow-xs'
                : 'text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            En pausa ({pausedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 rounded-full text-[13px] transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-[#17191c] font-medium shadow-xs'
                : 'text-[#777b86] hover:text-[#17191c]'
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
              ? 'bg-[#17191c] text-white border-[#17191c]'
              : 'bg-white text-[#777b86] border-[#ececec] hover:text-[#17191c] hover:border-[#17191c]/30'
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

      {/* Habit Grid */}
      {filteredHabits.length === 0 ? (
        <div className="steep-card-mist p-12 text-center">
          <p className="text-[15px] text-[#777b86] mb-5">
            No se encontraron hábitos con los filtros seleccionados.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="px-5 py-2 rounded-full bg-white hover:bg-[#fafafb] border border-[#17191c]/25 text-[13px] text-[#17191c] transition-colors cursor-pointer"
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
                className={`rounded-[24px] p-6 flex flex-col justify-between bioluminescent-card ${
                  habit.isActive ? '' : 'opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `rgba(${bioTheme.rgb}, 0.1)`,
                          borderColor: `rgba(${bioTheme.rgb}, 0.25)`,
                          color: bioTheme.glowHex,
                        }}
                      >
                        <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                      </div>
                      <div>
                        <span
                          className="text-[12px] block"
                          style={{ color: bioTheme.glowHex }}
                        >
                          {cat.name}
                        </span>
                        <h3 className="text-[17px] font-medium text-[#17191c] tracking-[-0.01em]">
                          {habit.title}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`text-[12px] whitespace-nowrap shrink-0 ${
                        habit.isActive ? 'text-[#17191c] font-medium' : 'text-[#979799]'
                      }`}
                    >
                      {habit.isActive ? 'Activo' : 'Pausado'}
                    </span>
                  </div>

                  {/* Goal and notes */}
                  <div className="mt-4 text-[13px] text-[#777b86]">
                    <p>
                      Meta diaria:{' '}
                      <span className="font-medium text-[#17191c] tabular-nums">
                        {habit.targetValue} {habit.unitLabel}
                      </span>
                      {habit.reminderTime && (
                        <span className="text-[#979799]"> · Recordatorio {habit.reminderTime}</span>
                      )}
                    </p>
                    {habit.notes && (
                      <div className="mt-3 pt-3 border-t border-[#ececec] max-h-28 overflow-y-auto pr-1">
                        <RitualNotesMarkdown content={habit.notes} compact />
                      </div>
                    )}
                  </div>

                  {/* Scheduled Days */}
                  <div className="mt-4 pt-3.5 border-t border-[#ececec] flex items-center justify-between">
                    <span className="text-[12px] text-[#979799]">Frecuencia:</span>
                    <div className="flex items-center gap-1">
                      {DAY_LABELS.map((label, idx) => {
                        const dayNum = (idx + 1) as DayOfWeek;
                        const isScheduled = habit.scheduledDays.includes(dayNum);
                        return (
                          <span
                            key={idx}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium ${
                              isScheduled
                                ? 'border'
                                : 'bg-[#f2f2f3] text-[#a3a6af]'
                            }`}
                            style={
                              isScheduled
                                ? {
                                    backgroundColor: `rgba(${bioTheme.rgb}, 0.1)`,
                                    borderColor: `rgba(${bioTheme.rgb}, 0.3)`,
                                    color: bioTheme.glowHex,
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
                <div className="mt-4 pt-3.5 border-t border-[#ececec] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[13px] font-medium text-[#17191c] tabular-nums">
                      <Flame className="w-3.5 h-3.5 text-[#5d2a1a]" />
                      <span>{habit.currentStreak} días</span>
                    </div>
                    <span className="text-[12px] text-[#979799]">
                      Récord: <span className="tabular-nums text-[#777b86]">{habit.bestStreak} d</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onTogglePause(habit.id)}
                      className="p-2 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors cursor-pointer"
                      title={habit.isActive ? 'Pausar hábito' : 'Reanudar hábito'}
                    >
                      {habit.isActive ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 text-[#17191c]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditHabit(habit)}
                      className="p-2 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors cursor-pointer"
                      title="Editar hábito"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(habit.id)}
                      className="p-2 rounded-full text-[#777b86] hover:text-[#b91c1c] hover:bg-[#fbe1d1]/50 transition-colors cursor-pointer"
                      title="Eliminar hábito"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17191c]/35 backdrop-blur-sm">
          <div className="w-full max-w-sm steep-modal p-6">
            <h3 className="font-signifier font-normal text-[24px] text-[#17191c]">
              ¿Eliminar este hábito?
            </h3>
            <p className="text-[14px] text-[#777b86] mt-2 leading-relaxed">
              El hábito será desactivado de tus rutinas diarias. Tus registros y estadísticas históricas se preservarán de forma segura.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-full bg-transparent hover:bg-[#fafafb] border border-[#17191c]/25 text-[13px] text-[#17191c] transition-colors cursor-pointer"
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
                className="px-5 py-2 rounded-full bg-[#b91c1c] hover:bg-[#991b1b] text-white text-[13px] transition-colors cursor-pointer"
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
