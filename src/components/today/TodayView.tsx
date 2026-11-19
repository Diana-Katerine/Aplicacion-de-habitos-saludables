import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import {
  Flame,
  CheckCircle,
  Plus,
  Coffee,
  Compass,
  Check,
} from 'lucide-react';
import { AiEncouragementMessage, DailyFocus, HabitWithTodayLog, User, WeeklyFocus } from '../../types';
import { AdaptiveReminderSuggestion } from '../../services/reminders';
import { StreakMilestone } from '../../services/streakMilestones';
import {
  formatLocalizedDate,
  getGreetingFirstName,
  getSpanishGreeting,
} from '../../services/greeting';
import { HabitCard } from './HabitCard';
import { DailyFocusCard } from './DailyFocusCard';
import { AdaptiveReminderPanel } from './AdaptiveReminderPanel';
import { AmbientFocusOverlay } from './AmbientFocusOverlay';
import { AiEncouragementCard } from './AiEncouragementCard';

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
  aiEncouragement?: AiEncouragementMessage | null;
  isEncouragementLoading?: boolean;
  encouragementError?: string | null;
  onRefreshEncouragement?: () => void;
  celebratingMilestones?: Record<string, StreakMilestone>;
  onDismissMilestone?: (habitId: string, milestoneDays: number) => void;
  onReplayMilestone?: (habitId: string, milestone: StreakMilestone) => void;
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
  activeMilestone?: StreakMilestone | null;
  onDismissMilestone?: (habitId: string, milestoneDays: number) => void;
  onReplayMilestone?: (habitId: string, milestone: StreakMilestone) => void;
  onApplyReminderTime?: (habitId: string, newReminderTime: string) => void;
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
  activeMilestone = null,
  onDismissMilestone,
  onReplayMilestone,
  onApplyReminderTime,
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
        activeMilestone={activeMilestone}
        onDismissMilestone={onDismissMilestone}
        onReplayMilestone={onReplayMilestone}
        onApplyReminderTime={onApplyReminderTime}
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
  aiEncouragement = null,
  isEncouragementLoading = false,
  encouragementError = null,
  onRefreshEncouragement,
  celebratingMilestones = {},
  onDismissMilestone,
  onReplayMilestone,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [orderedHabits, setOrderedHabits] = useState<HabitWithTodayLog[]>(habits);
  const [orderSavedFlash, setOrderSavedFlash] = useState(false);
  const [ambientHabitId, setAmbientHabitId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const latestOrderIdsRef = useRef<string[]>(habits.map((h) => h.id));
  const savedTimerRef = useRef<number | null>(null);
  const activeAmbientHabit = habits.find((h) => h.id === ambientHabitId) || null;

  useEffect(() => {
    const syncClock = () => setNowTick(Date.now());
    const intervalId = window.setInterval(syncClock, 30_000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncClock();
    };
    window.addEventListener('focus', syncClock);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', syncClock);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

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
  const past7Totals = habits.reduce(
    (acc, h) => {
      h.past7Days.forEach((d) => {
        if (d.isScheduled) {
          acc.scheduled += 1;
          if (d.isCompleted) acc.completed += 1;
        }
      });
      return acc;
    },
    { scheduled: 0, completed: 0 }
  );
  const realWeeklyRate =
    past7Totals.scheduled > 0 ? Math.round((past7Totals.completed / past7Totals.scheduled) * 100) : 0;

  const [hasCelebrated, setHasCelebrated] = useState(false);
  React.useEffect(() => {
    if (isAllCompleted && !hasCelebrated) {
      setHasCelebrated(true);
      try {
        confetti({
          particleCount: 80,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#059669', '#10b981', '#f59e0b', '#0284c7', '#fbe1d1'],
        });
      } catch (e) {
        console.error(e);
      }
    } else if (!isAllCompleted) {
      setHasCelebrated(false);
    }
  }, [isAllCompleted, hasCelebrated]);

  const referenceDate = new Date(nowTick);
  const capitalizedDate = formatLocalizedDate(user.timezone, referenceDate);
  const greeting = getSpanishGreeting(user.timezone, referenceDate);
  const firstName = getGreetingFirstName(user.fullName, user.email);

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
    <div className="space-y-6 sm:space-y-8">
      {/* Editorial Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1">{capitalizedDate}</span>
          <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl leading-tight tracking-tight text-slate-900 dark:text-white break-words">
            {greeting}, <span className="text-indigo-600 dark:text-indigo-400">{firstName}</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenWeeklyReflection}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Reflexión semanal</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo hábito</span>
          </button>
        </div>
      </div>

      {/* Daily Grounding Focus Intent */}
      <div className="space-y-4">
        <DailyFocusCard
          focus={dailyFocus}
          onSaveFocus={onSaveFocus}
          onToggleComplete={onToggleFocusComplete}
          onClearFocus={onClearFocus}
        />

        {weeklyFocus && (
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-4 gap-y-2 text-sm shadow-xs">
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 sm:mt-0" />
              <span className="text-indigo-700 dark:text-indigo-300 font-semibold shrink-0">Meta Semanal:</span>
              <span className="text-slate-800 dark:text-slate-200 break-words sm:truncate">{weeklyFocus.intent}</span>
            </div>
            <button
              type="button"
              onClick={onOpenWeeklyReflection}
              className="min-h-[36px] px-3 py-1 rounded-md text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ml-auto"
            >
              Revisar →
            </button>
          </div>
        )}
      </div>

      {/* Unified Single-Row Hairline Summary Bar */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          <div className="p-6 min-w-0">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Progreso de hoy</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                {completedCount}/{totalScheduled}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight tabular-nums">
                {completionPercentage}%
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {completionPercentage === 100
                  ? 'Todo completado'
                  : `${totalScheduled - completedCount} pendientes`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-3 overflow-hidden border border-slate-200 dark:border-slate-700">
              <motion.div
                className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="p-6 flex flex-col justify-center min-w-0">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Racha activa</span>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-bold text-amber-700 dark:text-amber-400 tracking-tight tabular-nums inline-flex items-center gap-2">
                <Flame className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
                {maxStreak}
              </span>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">días consecutivos</span>
            </div>
          </div>

          <div className="p-6 flex flex-col justify-center min-w-0">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Constancia 7 días</span>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-bold text-indigo-700 dark:text-indigo-400 tracking-tight tabular-nums">
                {realWeeklyRate}%
              </span>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                {past7Totals.completed}/{past7Totals.scheduled} metas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Personalized Encouragement */}
      {onRefreshEncouragement && (
        <AiEncouragementCard
          userId={user.id}
          encouragement={aiEncouragement}
          isLoading={isEncouragementLoading}
          error={encouragementError}
          onRefresh={onRefreshEncouragement}
        />
      )}

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
          <div className="rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-sm">
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="min-w-0 space-y-1">
                <h4 className="font-bold text-xl sm:text-2xl text-emerald-950 dark:text-emerald-100 tracking-tight">
                  Día completado al 100%
                </h4>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 max-w-prose text-left">
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
                  colors: ['#059669', '#10b981', '#f59e0b', '#0284c7', '#fbe1d1'],
                });
              }}
              className="min-h-[44px] px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 shadow-sm flex items-center justify-center"
            >
              Celebrar
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* Segmented Filter Bar & Habit List */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div role="tablist" aria-label="Filtrar hábitos" className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start max-w-full overflow-x-auto">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              onClick={() => setFilter('all')}
              className={`min-h-[44px] px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs border border-slate-200 dark:border-slate-600'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({totalScheduled})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'pending'}
              onClick={() => setFilter('pending')}
              className={`min-h-[44px] px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                filter === 'pending'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs border border-slate-200 dark:border-slate-600'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pendientes ({pendingHabits.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'completed'}
              onClick={() => setFilter('completed')}
              className={`min-h-[44px] px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                filter === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs border border-slate-200 dark:border-slate-600'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Completados ({completedCount})
            </button>
          </div>

          {orderSavedFlash && (
            <span className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              <Check className="w-4 h-4 shrink-0" />
              Secuencia guardada
            </span>
          )}
        </div>

        {/* Empty State */}
        {totalScheduled === 0 && (
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-14 h-14 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
              <Coffee className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-xl sm:text-2xl text-slate-900 dark:text-white">
              Día libre de hábitos programados
            </h3>
            <p className="text-base font-normal text-slate-700 dark:text-slate-300 max-w-prose mt-2 mb-6">
              Hoy no tienes hábitos activos asignados para este día de la semana. Descansa o añade un nuevo ritual a tu rutina.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenTemplates}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Explorar plantillas
              </button>
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                + Crear hábito personalizado
              </button>
            </div>
          </div>
        )}

        {totalScheduled > 0 && displayHabits.length === 0 && (
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center shadow-xs">
            <p className="text-base font-medium text-slate-600 dark:text-slate-400">
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
                activeMilestone={celebratingMilestones[habit.id] || null}
                onDismissMilestone={onDismissMilestone}
                onReplayMilestone={onReplayMilestone}
                onApplyReminderTime={onApplyReminderTime}
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
