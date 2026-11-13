import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import {
  Flame,
  CheckCircle,
  Plus,
  BookOpen,
  Coffee,
  TrendingUp,
  Compass,
  Check,
} from 'lucide-react';
import { DailyFocus, HabitWithTodayLog, User, WeeklyFocus } from '../../types';
import { AdaptiveReminderSuggestion } from '../../services/reminders';
import { HabitCard } from './HabitCard';
import { DailyFocusCard } from './DailyFocusCard';
import { AdaptiveReminderPanel } from './AdaptiveReminderPanel';
import { AmbientFocusOverlay } from './AmbientFocusOverlay';

interface Props {
  user: User;
  habits: HabitWithTodayLog[];
  dailyFocus: DailyFocus | null;
  weeklyFocus: WeeklyFocus | null;
  onSaveFocus: (intent: string) => void;
  onToggleFocusComplete: () => void;
  onClearFocus: () => void;
  onOpenWeeklyReflection: () => void;
  onApplyReminderTime: (habitId: string, newReminderTime: string) => void;
  onTriggerPushAlert: (suggestion: AdaptiveReminderSuggestion) => void;
  onCheckIn: (habitId: string, completedValueChange?: number, forceCompleted?: boolean) => void;
  onOpenCreateModal: () => void;
  onOpenTemplates: () => void;
  onEditHabit: (habit: HabitWithTodayLog) => void;
  onTogglePause: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onReorderHabits: (orderedHabitIds: string[]) => void;
}

interface SortableHabitItemProps {
  habit: HabitWithTodayLog;
  canReorder: boolean;
  onDragEnd: () => void;
  onKeyboardMove: (habitId: string, direction: 'up' | 'down') => void;
  onOpenAmbientFocus: (habit: HabitWithTodayLog) => void;
  onCheckIn: (habitId: string, completedValueChange?: number, forceCompleted?: boolean) => void;
  onEdit: (habit: HabitWithTodayLog) => void;
  onTogglePause: (habitId: string) => void;
  onDelete: (habitId: string) => void;
}

const SortableHabitItem: React.FC<SortableHabitItemProps> = ({
  habit,
  canReorder,
  onDragEnd,
  onKeyboardMove,
  onOpenAmbientFocus,
  onCheckIn,
  onEdit,
  onTogglePause,
  onDelete,
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      value={habit}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      whileDrag={{
        scale: 1.01,
        zIndex: 30,
        boxShadow: '0 20px 35px -10px rgba(23, 25, 28, 0.16)',
      }}
      transition={{ duration: 0.16 }}
    >
      <HabitCard
        habit={habit}
        canReorder={canReorder}
        dragControls={dragControls}
        onKeyboardMove={onKeyboardMove}
        onOpenAmbientFocus={onOpenAmbientFocus}
        onCheckIn={onCheckIn}
        onEdit={onEdit}
        onTogglePause={onTogglePause}
        onDelete={onDelete}
      />
    </Reorder.Item>
  );
};

export const TodayView: React.FC<Props> = ({
  user,
  habits,
  dailyFocus,
  weeklyFocus,
  onSaveFocus,
  onToggleFocusComplete,
  onClearFocus,
  onOpenWeeklyReflection,
  onApplyReminderTime,
  onTriggerPushAlert,
  onCheckIn,
  onOpenCreateModal,
  onOpenTemplates,
  onEditHabit,
  onTogglePause,
  onDeleteHabit,
  onReorderHabits,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [orderedHabits, setOrderedHabits] = useState<HabitWithTodayLog[]>(habits);
  const [orderSavedFlash, setOrderSavedFlash] = useState(false);
  const [ambientHabitId, setAmbientHabitId] = useState<string | null>(null);
  const latestOrderIdsRef = useRef<string[]>(habits.map((h) => h.id));
  const savedTimerRef = useRef<number | null>(null);
  const activeAmbientHabit = habits.find((h) => h.id === ambientHabitId) || null;

  useEffect(() => {
    setOrderedHabits(habits);
    latestOrderIdsRef.current = habits.map((h) => h.id);
  }, [habits]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current !== null) {
        window.clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const flashOrderSaved = () => {
    setOrderSavedFlash(true);
    if (savedTimerRef.current !== null) {
      window.clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = window.setTimeout(() => {
      setOrderSavedFlash(false);
    }, 2800);
  };

  const totalScheduled = habits.length;
  const completedHabits = habits.filter((h) => h.todayLog?.isCompleted);
  const pendingHabits = habits.filter((h) => !h.todayLog?.isCompleted);
  const completedCount = completedHabits.length;
  const completionPercentage = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;
  const isAllCompleted = totalScheduled > 0 && completedCount === totalScheduled;

  const maxStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);

  const [hasCelebrated, setHasCelebrated] = useState(false);
  React.useEffect(() => {
    if (isAllCompleted && !hasCelebrated) {
      setHasCelebrated(true);
      try {
        confetti({
          particleCount: 80,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#17191c', '#5d2a1a', '#fbe1d1', '#777b86'],
        });
      } catch (e) {
        console.error(e);
      }
    } else if (!isAllCompleted) {
      setHasCelebrated(false);
    }
  }, [isAllCompleted, hasCelebrated]);

  const todayFormatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);
  const firstName = user.fullName.split(' ')[0];

  const displayHabits = orderedHabits.filter((h) => {
    if (filter === 'pending') return !h.todayLog?.isCompleted;
    if (filter === 'completed') return h.todayLog?.isCompleted;
    return true;
  });

  const mergeDisplayOrderIntoFull = (newDisplayOrder: HabitWithTodayLog[]) => {
    const displayIdSet = new Set(newDisplayOrder.map((h) => h.id));
    let cursor = 0;
    return orderedHabits.map((h) => {
      if (displayIdSet.has(h.id) && cursor < newDisplayOrder.length) {
        const next = newDisplayOrder[cursor];
        cursor += 1;
        return next;
      }
      return h;
    });
  };

  const handleLiveReorder = (newDisplayOrder: HabitWithTodayLog[]) => {
    const merged = mergeDisplayOrderIntoFull(newDisplayOrder);
    setOrderedHabits(merged);
    latestOrderIdsRef.current = merged.map((h) => h.id);
  };

  const handleDragEndPersist = () => {
    const currentPropIds = habits.map((h) => h.id);
    const nextIds = latestOrderIdsRef.current;
    const changed =
      nextIds.length === currentPropIds.length &&
      nextIds.some((id, idx) => id !== currentPropIds[idx]);
    if (changed) {
      onReorderHabits(nextIds);
      flashOrderSaved();
    }
  };

  const handleKeyboardMove = (habitId: string, direction: 'up' | 'down') => {
    const currentIndex = displayHabits.findIndex((h) => h.id === habitId);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= displayHabits.length) return;

    const nextDisplay = [...displayHabits];
    const [moved] = nextDisplay.splice(currentIndex, 1);
    nextDisplay.splice(targetIndex, 0, moved);

    const merged = mergeDisplayOrderIntoFull(nextDisplay);
    const nextIds = merged.map((h) => h.id);
    setOrderedHabits(merged);
    latestOrderIdsRef.current = nextIds;
    onReorderHabits(nextIds);
    flashOrderSaved();
  };

  return (
    <div className="space-y-8">
      {/* Editorial Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-[#ececec]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[14px] text-[#979799]">
            <span>{capitalizedDate}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[13px]">{user.timezone}</span>
          </div>
          <h1 className="font-signifier font-normal text-[36px] md:text-[44px] leading-[1.2] tracking-[-0.015em] text-[#17191c] mt-1">
            Buenos días, <em className="italic font-normal">{firstName}</em>
          </h1>
          <p className="text-[16px] text-[#777b86] mt-1">
            Mantén tu inercia viva. Un micro-paso a la vez construye constancia.
          </p>
        </div>

        {/* Pill Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenWeeklyReflection}
            className="px-4 py-2.5 rounded-full bg-transparent hover:bg-[#fafafb] border border-[#17191c]/25 hover:border-[#17191c] text-[14px] font-normal text-[#17191c] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Reflexión semanal</span>
          </button>

          <button
            type="button"
            onClick={onOpenTemplates}
            className="px-4 py-2.5 rounded-full bg-transparent hover:bg-[#fafafb] border border-[#17191c]/25 hover:border-[#17191c] text-[14px] font-normal text-[#17191c] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Plantillas</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-5 py-2.5 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[14px] font-normal transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
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

      {/* Upcoming Week Focus Intent */}
      {weeklyFocus && (
        <div className="rounded-[24px] px-6 py-4 bg-[#fafafb] border border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[14px] min-w-0">
            <span className="text-[#979799] inline-flex items-center gap-1.5 shrink-0">
              <Compass className="w-4 h-4 text-[#17191c]" />
              Enfoque semanal
            </span>
            <span aria-hidden="true" className="text-[#a3a6af]">·</span>
            <span className="font-medium text-[#17191c]">{weeklyFocus.intent}</span>
            {weeklyFocus.reflectionNote && (
              <>
                <span aria-hidden="true" className="text-[#a3a6af] hidden md:inline">·</span>
                <span className="text-[#777b86] hidden md:inline truncate max-w-md">
                  {weeklyFocus.reflectionNote}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onOpenWeeklyReflection}
            className="text-[14px] text-[#17191c] hover:underline underline-offset-4 whitespace-nowrap shrink-0 self-end sm:self-auto cursor-pointer"
          >
            Revisar semana →
          </button>
        </div>
      )}

      {/* Progress & Streak KPI Cards — Steep Mist Gray 24px cards, zero shadows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="steep-card-mist p-6">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#979799]">Cumplimiento de hoy</span>
            <span className="text-[14px] text-[#777b86] tabular-nums">
              {completedCount} / {totalScheduled} hábitos
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-[36px] leading-none font-medium text-[#17191c] tracking-[-0.02em] tabular-nums">
              {completionPercentage}%
            </span>
            <span className="text-[14px] text-[#777b86]">
              {completionPercentage === 100
                ? 'Jornada completada'
                : `${totalScheduled - completedCount} por completar`}
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-[#e3e3e6] mt-4 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#17191c]"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="steep-card-mist p-6">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#979799]">Racha activa</span>
            <Flame className="w-4 h-4 text-[#5d2a1a]" />
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[36px] leading-none font-medium text-[#17191c] tracking-[-0.02em] tabular-nums">
              {maxStreak}
            </span>
            <span className="text-[14px] text-[#777b86]">días consecutivos</span>
          </div>

          <p className="text-[13px] text-[#777b86] mt-3">
            Tu racha más prolongada en curso.
          </p>
        </div>

        <div className="steep-card-mist p-6">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#979799]">Inercia semanal</span>
            <TrendingUp className="w-4 h-4 text-[#17191c]" />
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[36px] leading-none font-medium text-[#17191c] tracking-[-0.02em] tabular-nums">
              88%
            </span>
            <span className="text-[14px] text-[#777b86] tabular-nums">↑ +6% vs. semana ant.</span>
          </div>

          <p className="text-[13px] text-[#777b86] mt-3">
            Mayor constancia en hábitos matutinos e hidratación.
          </p>
        </div>
      </div>

      {/* Adaptive Late-Afternoon Reminders */}
      <AdaptiveReminderPanel
        user={user}
        habits={habits}
        onApplyReminderTime={onApplyReminderTime}
        onCompleteHabit={(habitId) => onCheckIn(habitId, undefined, true)}
        onTriggerPushAlert={onTriggerPushAlert}
      />

      {/* Single Blush Peach Editorial Celebration Banner when 100% completed */}
      <AnimatePresence>
        {isAllCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="steep-card-peach p-6 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#5d2a1a] text-white flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-signifier font-normal text-[22px] leading-snug text-[#5d2a1a]">
                  Día completado al <em className="italic font-normal">100%</em>
                </h4>
                <p className="text-[14px] text-[#5d2a1a]/85 mt-0.5">
                  Has completado todos tus rituales programados para hoy. Tu disciplina alimenta tu libertad.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                confetti({
                  particleCount: 55,
                  spread: 60,
                  origin: { y: 0.5 },
                  colors: ['#17191c', '#5d2a1a', '#fbe1d1'],
                });
              }}
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-full border border-[#5d2a1a] text-[#5d2a1a] hover:bg-[#5d2a1a] hover:text-white text-[13px] font-normal transition-colors cursor-pointer shrink-0"
            >
              Celebrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Segmented Filter Bar & Habit List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] self-start">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-full text-[13px] transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-[#17191c] font-medium shadow-xs'
                  : 'text-[#777b86] hover:text-[#17191c]'
              }`}
            >
              Todos ({totalScheduled})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-4 py-1.5 rounded-full text-[13px] transition-all cursor-pointer ${
                filter === 'pending'
                  ? 'bg-white text-[#17191c] font-medium shadow-xs'
                  : 'text-[#777b86] hover:text-[#17191c]'
              }`}
            >
              Pendientes ({pendingHabits.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-4 py-1.5 rounded-full text-[13px] transition-all cursor-pointer ${
                filter === 'completed'
                  ? 'bg-white text-[#17191c] font-medium shadow-xs'
                  : 'text-[#777b86] hover:text-[#17191c]'
              }`}
            >
              Completados ({completedCount})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[13px] text-[#777b86]">
            {orderSavedFlash ? (
              <span className="text-[#17191c] font-medium inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                Secuencia guardada para próximas rutinas
              </span>
            ) : (
              <span>
                {displayHabits.length > 1
                  ? 'Arrastra ⋮⋮ para ordenar tu rutina · Pulsa el nodo para registrar'
                  : 'Pulsa el nodo o + para registrar'}
              </span>
            )}
          </div>
        </div>

        {orderSavedFlash && (
          <div className="sm:hidden text-[13px] text-[#17191c] font-medium inline-flex items-center gap-1">
            <Check className="w-3.5 h-3.5 shrink-0" />
            Secuencia guardada para próximas rutinas
          </div>
        )}

        {/* Empty State */}
        {totalScheduled === 0 && (
          <div className="steep-card-mist p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#17191c] mb-4">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="font-signifier font-normal text-[26px] text-[#17191c]">
              Día libre de hábitos programados
            </h3>
            <p className="text-[15px] text-[#777b86] max-w-md mt-2 mb-6">
              Hoy no tienes hábitos activos asignados para este día de la semana. Descansa o añade un nuevo ritual a tu rutina.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenTemplates}
                className="px-5 py-2.5 rounded-full bg-transparent hover:bg-white border border-[#17191c] text-[14px] text-[#17191c] transition-colors cursor-pointer"
              >
                Explorar plantillas
              </button>
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="px-5 py-2.5 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[14px] transition-colors cursor-pointer"
              >
                + Crear hábito personalizado
              </button>
            </div>
          </div>
        )}

        {totalScheduled > 0 && displayHabits.length === 0 && (
          <div className="steep-card-mist p-10 text-center">
            <p className="text-[15px] text-[#777b86]">
              No hay hábitos en el filtro seleccionado ({filter === 'pending' ? 'pendientes' : 'completados'}).
            </p>
          </div>
        )}

        {displayHabits.length > 0 && (
          <Reorder.Group
            as="div"
            axis="y"
            values={displayHabits}
            onReorder={handleLiveReorder}
            className="grid grid-cols-1 gap-3.5"
          >
            {displayHabits.map((habit) => (
              <SortableHabitItem
                key={habit.id}
                habit={habit}
                canReorder={displayHabits.length > 1}
                onDragEnd={handleDragEndPersist}
                onKeyboardMove={handleKeyboardMove}
                onOpenAmbientFocus={(h) => setAmbientHabitId(h.id)}
                onCheckIn={onCheckIn}
                onEdit={onEditHabit}
                onTogglePause={onTogglePause}
                onDelete={onDeleteHabit}
              />
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* Ambient Focus Overlay */}
      <AmbientFocusOverlay
        habit={activeAmbientHabit}
        onClose={() => setAmbientHabitId(null)}
        onCheckIn={onCheckIn}
      />
    </div>
  );
};
