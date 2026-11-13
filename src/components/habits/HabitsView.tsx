import React, { useState } from 'react';
import {
  Plus,
  Search,
  Flame,
  CheckCircle,
  Pause,
  Play,
  Edit2,
  Trash2,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Category, Habit, DayOfWeek } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';

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

  // Filter habits
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Gestión de Hábitos
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Configura tus rituales, metas numéricas, horarios y frecuencias semanales.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenTemplates}
            className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-[#27354A] border border-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Plantillas</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#003824] text-xs font-bold transition-all shadow-[0_0_16px_rgba(16,185,129,0.35)] flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Crear Hábito</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0F172A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
          />
        </div>

        {/* Status segmented tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0F172A] border border-white/[0.08] self-start md:self-auto">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-[#1E293B] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Activos ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('paused')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'paused'
                ? 'bg-[#1E293B] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            En Pausa ({pausedCount})
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#1E293B] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({habits.length})
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#10B981] text-[#003824] border-[#34D399] font-bold'
              : 'bg-[#0F172A] text-slate-400 border-white/10 hover:text-white hover:border-white/20'
          }`}
        >
          Todas las categorías
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-[#1E293B] text-white border-white/25 ring-1 ring-white/10'
                  : 'bg-[#0F172A] text-slate-400 border-white/10 hover:text-white hover:border-white/20'
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

      {/* Habit Grid */}
      {filteredHabits.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] p-10 text-center bg-[#0F172A]">
          <p className="text-sm text-slate-400 mb-4">
            No se encontraron hábitos con los filtros seleccionados.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#27354A] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHabits.map((habit) => {
            const cat = categoryMap.get(habit.categoryId) || {
              id: habit.categoryId,
              name: 'General',
              iconName: 'Activity',
              colorHex: '#10B981',
            };

            return (
              <div
                key={habit.id}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                  habit.isActive
                    ? 'bg-[#0F172A] border-white/[0.08] hover:border-white/15'
                    : 'bg-[#0F172A]/50 border-white/[0.04] opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${cat.colorHex}20`,
                          color: cat.colorHex,
                        }}
                      >
                        <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                      </div>
                      <div>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider block"
                          style={{ color: cat.colorHex }}
                        >
                          {cat.name}
                        </span>
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {habit.title}
                        </h3>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        habit.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-700/30 text-slate-400 border border-white/10'
                      }`}
                    >
                      {habit.isActive ? 'Activo' : 'Pausado'}
                    </span>
                  </div>

                  {/* Goal and notes */}
                  <div className="mt-3 text-xs text-slate-300">
                    <p>
                      Meta diaria:{' '}
                      <span className="font-bold text-white tabular-nums">
                        {habit.targetValue} {habit.unitLabel}
                      </span>
                      {habit.reminderTime && (
                        <span className="text-slate-500"> · Recordatorio a las {habit.reminderTime}</span>
                      )}
                    </p>
                    {habit.notes && (
                      <p className="text-slate-400 mt-1 italic text-[11px]">"{habit.notes}"</p>
                    )}
                  </div>

                  {/* Scheduled Days */}
                  <div className="mt-3.5 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Frecuencia:</span>
                    <div className="flex items-center gap-1">
                      {DAY_LABELS.map((label, idx) => {
                        const dayNum = (idx + 1) as DayOfWeek;
                        const isScheduled = habit.scheduledDays.includes(dayNum);
                        return (
                          <span
                            key={idx}
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isScheduled
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-[#1E293B]/40 text-slate-600'
                            }`}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Metrics & Actions */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 tabular-nums">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{habit.currentStreak} días</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Récord: <span className="tabular-nums font-semibold text-slate-400">{habit.bestStreak} d</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onTogglePause(habit.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      title={habit.isActive ? 'Pausar hábito' : 'Reanudar hábito'}
                    >
                      {habit.isActive ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>
                    <button
                      onClick={() => onEditHabit(habit)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      title="Editar hábito"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(habit.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#111827] border border-white/10 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white">¿Eliminar este hábito?</h3>
            <p className="text-xs text-slate-400 mt-2">
              El hábito será desactivado de tus rutinas diarias. Los registros y estadísticas históricas se preservarán de forma segura.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#27354A] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (deleteTargetId) {
                    onDeleteHabit(deleteTargetId);
                    setDeleteTargetId(null);
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer"
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
