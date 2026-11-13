import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Flame,
  CheckCircle,
  Plus,
  BookOpen,
  Calendar,
  Coffee,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { DailyFocus, HabitWithTodayLog, User } from '../../types';
import { HabitCard } from './HabitCard';
import { DailyFocusCard } from './DailyFocusCard';

interface Props {
  user: User;
  habits: HabitWithTodayLog[];
  dailyFocus: DailyFocus | null;
  onSaveFocus: (intent: string) => void;
  onToggleFocusComplete: () => void;
  onClearFocus: () => void;
  onCheckIn: (habitId: string, completedValueChange?: number, forceCompleted?: boolean) => void;
  onOpenCreateModal: () => void;
  onOpenTemplates: () => void;
  onEditHabit: (habit: HabitWithTodayLog) => void;
  onTogglePause: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const TodayView: React.FC<Props> = ({
  user,
  habits,
  dailyFocus,
  onSaveFocus,
  onToggleFocusComplete,
  onClearFocus,
  onCheckIn,
  onOpenCreateModal,
  onOpenTemplates,
  onEditHabit,
  onTogglePause,
  onDeleteHabit,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const totalScheduled = habits.length;
  const completedHabits = habits.filter((h) => h.todayLog?.isCompleted);
  const pendingHabits = habits.filter((h) => !h.todayLog?.isCompleted);
  const completedCount = completedHabits.length;
  const completionPercentage = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;
  const isAllCompleted = totalScheduled > 0 && completedCount === totalScheduled;

  // Max current streak
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);

  // Trigger confetti when 100% reached
  const [hasCelebrated, setHasCelebrated] = useState(false);
  React.useEffect(() => {
    if (isAllCompleted && !hasCelebrated) {
      setHasCelebrated(true);
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#F59E0B', '#60A5FA'],
        });
      } catch (e) {
        console.error(e);
      }
    } else if (!isAllCompleted) {
      setHasCelebrated(false);
    }
  }, [isAllCompleted, hasCelebrated]);

  // Formatted date string
  const todayFormatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  // Filtered list
  const displayHabits = habits.filter((h) => {
    if (filter === 'pending') return !h.todayLog?.isCompleted;
    if (filter === 'completed') return h.todayLog?.isCompleted;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Hero Banner / Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            <Calendar className="w-3.5 h-3.5" />
            <span>{capitalizedDate}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono text-[11px]">{user.timezone}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">
            Buenos días, {user.fullName.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Mantén tu inercia viva. Un micro-paso a la vez construye maestría.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenTemplates}
            className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-[#27354A] border border-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Plantillas sugeridas</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#003824] text-xs font-bold transition-all shadow-[0_0_16px_rgba(16,185,129,0.35)] flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo hábito</span>
          </button>
        </div>
      </div>

      {/* Daily Grounding Focus Intent */}
      <DailyFocusCard
        focus={dailyFocus}
        onSaveFocus={onSaveFocus}
        onToggleComplete={onToggleFocusComplete}
        onClearFocus={onClearFocus}
      />

      {/* Progress & Streak KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Daily Progress Card */}
        <div className="rounded-xl p-4 md:p-5 bg-[#0F172A] border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cumplimiento de Hoy
            </span>
            <span className="text-xs font-bold text-emerald-400 tabular-nums">
              {completedCount} / {totalScheduled} hábitos
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight tabular-nums">
              {completionPercentage}%
            </span>
            <span className="text-xs text-slate-400">
              {completionPercentage === 100
                ? '¡Jornada completada!'
                : `${totalScheduled - completedCount} por completar`}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#1E293B] mt-3 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#10B981] glow-emerald"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Momentum / Active Streak */}
        <div className="rounded-xl p-4 md:p-5 bg-[#0F172A] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Racha Activa
            </span>
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight tabular-nums">
              {maxStreak}
            </span>
            <span className="text-xs text-amber-400 font-semibold">días consecutivos</span>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Tu racha más prolongada actual. Mantén el fuego encendido hoy.
          </p>
        </div>

        {/* Daily Habit Cadence status */}
        <div className="rounded-xl p-4 md:p-5 bg-[#0F172A] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Inercia Semanal
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight tabular-nums">
              88%
            </span>
            <span className="text-xs text-emerald-400 font-semibold">+6% vs. semana ant.</span>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Alta consistencia en hábitos matutinos e hidratación.
          </p>
        </div>
      </div>

      {/* Celebration Banner when 100% completed */}
      <AnimatePresence>
        {isAllCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="p-4 md:p-5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-[#0F172A] to-emerald-950/60 border border-emerald-500/40 glow-emerald flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#10B981] text-[#003824] flex items-center justify-center shrink-0 glow-emerald-node">
                <CheckCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                  ¡Día completado al 100%! <Sparkles className="w-4 h-4 text-amber-400 inline" />
                </h4>
                <p className="text-xs md:text-sm text-emerald-300/90 mt-0.5">
                  Has completado todos tus rituales programados para hoy. Tu disciplina alimenta tu libertad.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.5 },
                  colors: ['#10B981', '#F59E0B'],
                });
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Celebrar</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Segmented Filter Bar & Habit List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0F172A] border border-white/[0.08]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#1E293B] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({totalScheduled})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filter === 'pending'
                  ? 'bg-[#1E293B] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pendientes ({pendingHabits.length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filter === 'completed'
                  ? 'bg-[#1E293B] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Completados ({completedCount})
            </button>
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">
            Presiona el nodo o <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-300 font-mono">+</kbd> para registrar
          </span>
        </div>

        {/* Empty State: No habits scheduled today */}
        {totalScheduled === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 p-10 text-center bg-[#0F172A]/40 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
              <Coffee className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">¡Día libre de hábitos programados!</h3>
            <p className="text-sm text-slate-400 max-w-md mt-1 mb-5">
              Hoy no tienes hábitos activos asignados para este día de la semana. Aprovecha para descansar o crea uno nuevo para tu rutina.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenTemplates}
                className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-[#27354A] border border-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Ver catálogo de hábitos
              </button>
              <button
                onClick={onOpenCreateModal}
                className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#003824] text-xs font-bold transition-all cursor-pointer"
              >
                + Crear hábito personalizado
              </button>
            </div>
          </div>
        )}

        {/* List of Habits */}
        {totalScheduled > 0 && displayHabits.length === 0 && (
          <div className="rounded-xl border border-white/[0.06] p-8 text-center bg-[#0F172A]">
            <p className="text-sm text-slate-400">
              No hay hábitos en el filtro seleccionado ({filter === 'pending' ? 'pendientes' : 'completados'}).
            </p>
          </div>
        )}

        {displayHabits.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {displayHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onCheckIn={onCheckIn}
                onEdit={onEditHabit}
                onTogglePause={onTogglePause}
                onDelete={onDeleteHabit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
