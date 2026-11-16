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
    <div className="space-y-8">
      {/* Editorial Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#ececec] dark:border-[#252e3a]">
        <div className="min-w-0">
          <span className="text-[14px] text-[#979799] dark:text-[#6f7a8a] block">{capitalizedDate}</span>
          <h1 className="font-signifier font-normal text-[28px] sm:text-[36px] md:text-[42px] leading-[1.15] tracking-[-0.015em] text-[#17191c] dark:text-[#f1f5f9] mt-0.5 break-words">
            {greeting}, <em className="italic font-normal chromatic-gradient-text">{firstName}</em>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenWeeklyReflection}
            className="px-4 py-2.5 rounded-full bg-[#EEF2FF]/75 dark:bg-[#4F46E5]/15 hover:bg-[#E0E7FF] dark:hover:bg-[#4F46E5]/25 border border-[#4F46E5]/25 dark:border-[#818CF8]/30 text-[13px] font-medium text-[#4338CA] dark:text-[#a5b4fc] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Reflexión semanal</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="btn-chromatic px-5 py-2.5 rounded-full text-white text-[13px] font-medium transition-all inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo hábito</span>
          </button>
        </div>
      </div>

      {/* Daily Grounding Focus Intent */}
      <div className="space-y-2.5">
        <DailyFocusCard
          focus={dailyFocus}
          onSaveFocus={onSaveFocus}
          onToggleComplete={onToggleFocusComplete}
          onClearFocus={onClearFocus}
        />

        {weeklyFocus && (
          <div className="px-4 sm:px-5 py-2.5 rounded-[18px] sm:rounded-full bg-[#EEF2FF]/50 dark:bg-[#4F46E5]/10 border border-[#4F46E5]/15 dark:border-[#818CF8]/20 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-3 gap-y-1.5 text-[13px]">
            <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
              <Compass className="w-3.5 h-3.5 text-[#4F46E5] dark:text-[#a5b4fc] shrink-0 mt-0.5 sm:mt-0" />
              <span className="text-[#4338CA] dark:text-[#a5b4fc] font-medium shrink-0">Semana:</span>
              <span className="text-[#17191c] dark:text-[#f1f5f9] break-words sm:truncate">{weeklyFocus.intent}</span>
            </div>
            <button
              type="button"
              onClick={onOpenWeeklyReflection}
              className="text-[#4338CA] dark:text-[#a5b4fc] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer font-medium ml-auto"
            >
              Revisar →
            </button>
          </div>
        )}
      </div>

      {/* Unified Single-Row Hairline Summary Bar */}
      <div className="rounded-[24px] bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a] overflow-hidden">
        <div className="h-1 w-full chromatic-accent-bar" />
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#ececec] dark:divide-[#252e3a]">
          <div className="px-4 sm:px-6 py-4 min-w-0">
            <div className="flex items-center justify-between gap-2 text-[13px]">
              <span className="text-[#777b86] dark:text-[#9aa4b2]">Progreso de hoy</span>
              <span className="font-medium text-[#047857] dark:text-[#34d399] tabular-nums shrink-0">
                {completedCount}/{totalScheduled}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-[28px] leading-none font-medium text-[#059669] dark:text-[#34d399] tracking-[-0.02em] tabular-nums">
                {completionPercentage}%
              </span>
              <span className="text-[12px] text-[#777b86] dark:text-[#9aa4b2]">
                {completionPercentage === 100
                  ? 'Todo completado'
                  : `${totalScheduled - completedCount} pendientes`}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] mt-3 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#10B981] via-[#06B6D4] to-[#6366F1]"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 flex flex-col justify-center min-w-0">
            <span className="text-[13px] text-[#777b86] dark:text-[#9aa4b2]">Racha activa</span>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-[28px] leading-none font-medium text-[#EA580C] dark:text-[#fb923c] tracking-[-0.02em] tabular-nums inline-flex items-center gap-1.5">
                <Flame className="w-5 h-5 text-[#EA580C] dark:text-[#fb923c] shrink-0" />
                {maxStreak}
              </span>
              <span className="text-[13px] text-[#777b86] dark:text-[#9aa4b2]">días consecutivos</span>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 flex flex-col justify-center min-w-0">
            <span className="text-[13px] text-[#777b86] dark:text-[#9aa4b2]">Adherencia 7 días</span>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-[28px] leading-none font-medium text-[#0284C7] dark:text-[#38bdf8] tracking-[-0.02em] tabular-nums">
                {realWeeklyRate}%
              </span>
              <span className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] tabular-nums">
                {past7Totals.completed}/{past7Totals.scheduled} programados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Personalized Encouragement */}
      {onRefreshEncouragement && (
        <AiEncouragementCard
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
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="steep-card-peach p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#f2ceb8] dark:border-[#4a2d20]"
          >
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#059669] text-white flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-signifier font-normal text-[20px] sm:text-[22px] leading-snug text-[#5d2a1a] dark:text-[#fbdac7]">
                  Día completado al <em className="italic font-normal">100%</em>
                </h4>
                <p className="text-[13px] sm:text-[14px] text-[#5d2a1a]/85 dark:text-[#fbdac7]/80 mt-0.5">
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
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-full border border-[#5d2a1a] dark:border-[#fbdac7]/60 text-[#5d2a1a] dark:text-[#fbdac7] hover:bg-[#5d2a1a] hover:text-white dark:hover:bg-[#fbdac7] dark:hover:text-[#241814] text-[13px] font-medium transition-colors cursor-pointer shrink-0"
            >
              Celebrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Segmented Filter Bar & Habit List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] self-start max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                filter === 'all'
                  ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                  : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
              }`}
            >
              Todos ({totalScheduled})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                filter === 'pending'
                  ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                  : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
              }`}
            >
              Pendientes ({pendingHabits.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                filter === 'completed'
                  ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                  : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
              }`}
            >
              Completados ({completedCount})
            </button>
          </div>

          {orderSavedFlash && (
            <span className="text-[13px] text-[#059669] dark:text-[#34d399] font-medium inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              Secuencia guardada
            </span>
          )}
        </div>

        {/* Empty State */}
        {totalScheduled === 0 && (
          <div className="rounded-[24px] bg-[#ECFDF5]/60 dark:bg-[#059669]/10 border border-[#059669]/18 dark:border-[#10b981]/25 p-6 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#D1FAE5] dark:bg-[#059669]/25 flex items-center justify-center text-[#047857] dark:text-[#34d399] mb-4">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="font-signifier font-normal text-[22px] sm:text-[26px] text-[#17191c] dark:text-[#f1f5f9]">
              Día libre de hábitos programados
            </h3>
            <p className="text-[15px] text-[#5c616d] dark:text-[#9aa4b2] max-w-md mt-2 mb-6">
              Hoy no tienes hábitos activos asignados para este día de la semana. Descansa o añade un nuevo ritual a tu rutina.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenTemplates}
                className="px-5 py-2.5 rounded-full bg-white dark:bg-[#141920] hover:bg-[#E0F2FE] dark:hover:bg-[#0284C7]/15 border border-[#0284C7]/30 dark:border-[#38BDF8]/35 text-[14px] text-[#0369A1] dark:text-[#38bdf8] transition-colors cursor-pointer"
              >
                Explorar plantillas
              </button>
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="btn-chromatic px-5 py-2.5 rounded-full text-white text-[14px] font-medium transition-all cursor-pointer"
              >
                + Crear hábito personalizado
              </button>
            </div>
          </div>
        )}

        {totalScheduled > 0 && displayHabits.length === 0 && (
          <div className="steep-card-mist p-10 text-center">
            <p className="text-[15px] text-[#777b86] dark:text-[#9aa4b2]">
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
