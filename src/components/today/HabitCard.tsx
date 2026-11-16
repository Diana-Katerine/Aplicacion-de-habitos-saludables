import React from 'react';
import { motion, AnimatePresence, type DragControls } from 'motion/react';
import {
  Check,
  Flame,
  Plus,
  Minus,
  MoreVertical,
  Edit2,
  Pause,
  Trash2,
  GripVertical,
  FileText,
  ChevronDown,
  ChevronUp,
  Headphones,
  Sparkles,
  Trophy,
  Zap,
  Award,
  Crown,
  X,
  BatteryCharging,
} from 'lucide-react';
import { HabitWithTodayLog } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';
import { RitualNotesMarkdown } from '../habits/RitualNotesEditor';
import { isDeepWorkHabit } from './AmbientFocusOverlay';
import { getCategoryBioluminescentTheme } from '../../services/bioluminescentTheme';
import { getMoodMeta } from '../../services/journaling';
import {
  formatMilestoneCelebrationCopy,
  getExactTodayStreakMilestone,
  MilestoneAccent,
  StreakMilestone,
} from '../../services/streakMilestones';
import { ActionHint } from '../common/ActionHint';

interface Props {
  habit: HabitWithTodayLog;
  onCheckIn: (habitId: string, completedValueChange?: number, forceCompleted?: boolean) => void;
  onEdit?: (habit: HabitWithTodayLog) => void;
  onTogglePause?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
  canReorder?: boolean;
  dragControls?: DragControls;
  onKeyboardMove?: (habitId: string, direction: 'up' | 'down') => void;
  onOpenAmbientFocus?: (habit: HabitWithTodayLog) => void;
  activeMilestone?: StreakMilestone | null;
  onDismissMilestone?: (habitId: string, milestoneDays: number) => void;
  onReplayMilestone?: (habitId: string, milestone: StreakMilestone) => void;
}

const MILESTONE_STYLES: Record<
  MilestoneAccent,
  {
    surface: string;
    border: string;
    glow: string;
    medallionBg: string;
    eyebrow: string;
    headline: string;
    body: string;
    ctaBg: string;
    particle: string;
    chip: string;
  }
> = {
  emerald: {
    surface:
      'bg-gradient-to-r from-[#ECFDF5]/96 via-white/96 to-[#D1FAE5]/95 dark:from-[#06291e]/96 dark:via-[#111921]/96 dark:to-[#0a2d24]/96',
    border: 'border-[#10B981]/50 dark:border-[#34D399]/45',
    glow: '0 14px 36px -12px rgba(16, 185, 129, 0.38)',
    medallionBg: 'bg-gradient-to-br from-[#059669] to-[#0D9488] text-white',
    eyebrow: 'text-[#047857] dark:text-[#34D399]',
    headline: 'text-[#064E3B] dark:text-[#ECFDF5]',
    body: 'text-[#065F46]/90 dark:text-[#A7F3D0]/85',
    ctaBg: 'bg-[#059669] hover:bg-[#047857] text-white',
    particle: 'bg-[#10B981] dark:bg-[#34D399]',
    chip: 'bg-[#ECFDF5] dark:bg-[#059669]/20 text-[#047857] dark:text-[#34D399] border-[#10B981]/35 dark:border-[#34D399]/35',
  },
  violet: {
    surface:
      'bg-gradient-to-r from-[#F5F3FF]/96 via-white/96 to-[#EDE9FE]/95 dark:from-[#1e1538]/96 dark:via-[#141724]/96 dark:to-[#241645]/96',
    border: 'border-[#8B5CF6]/50 dark:border-[#A78BFA]/45',
    glow: '0 14px 36px -12px rgba(139, 92, 246, 0.38)',
    medallionBg: 'bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] text-white',
    eyebrow: 'text-[#6D28D9] dark:text-[#C4B5FD]',
    headline: 'text-[#3B0764] dark:text-[#F5F3FF]',
    body: 'text-[#4C1D95]/90 dark:text-[#DDD6FE]/85',
    ctaBg: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white',
    particle: 'bg-[#8B5CF6] dark:bg-[#C4B5FD]',
    chip: 'bg-[#F5F3FF] dark:bg-[#7C3AED]/20 text-[#6D28D9] dark:text-[#C4B5FD] border-[#8B5CF6]/35 dark:border-[#A78BFA]/35',
  },
  amber: {
    surface:
      'bg-gradient-to-r from-[#FFFBEB]/96 via-white/96 to-[#FEF3C7]/95 dark:from-[#2c1b07]/96 dark:via-[#171614]/96 dark:to-[#321f08]/96',
    border: 'border-[#F59E0B]/55 dark:border-[#FBBF24]/45',
    glow: '0 14px 36px -12px rgba(245, 158, 11, 0.4)',
    medallionBg: 'bg-gradient-to-br from-[#D97706] to-[#EA580C] text-white',
    eyebrow: 'text-[#B45309] dark:text-[#FCD34D]',
    headline: 'text-[#78350F] dark:text-[#FEF3C7]',
    body: 'text-[#92400E]/90 dark:text-[#FDE68A]/85',
    ctaBg: 'bg-[#D97706] hover:bg-[#B45309] text-white',
    particle: 'bg-[#F59E0B] dark:bg-[#FCD34D]',
    chip: 'bg-[#FFFBEB] dark:bg-[#D97706]/20 text-[#B45309] dark:text-[#FCD34D] border-[#F59E0B]/40 dark:border-[#FBBF24]/35',
  },
  cyan: {
    surface:
      'bg-gradient-to-r from-[#ECFEFF]/96 via-white/96 to-[#CFFAFE]/95 dark:from-[#092533]/96 dark:via-[#111922]/96 dark:to-[#0c2d3d]/96',
    border: 'border-[#06B6D4]/50 dark:border-[#22D3EE]/45',
    glow: '0 14px 36px -12px rgba(6, 182, 212, 0.38)',
    medallionBg: 'bg-gradient-to-br from-[#0284C7] to-[#0891B2] text-white',
    eyebrow: 'text-[#0E7490] dark:text-[#67E8F9]',
    headline: 'text-[#164E63] dark:text-[#ECFEFF]',
    body: 'text-[#155E75]/90 dark:text-[#A5F3FC]/85',
    ctaBg: 'bg-[#0891B2] hover:bg-[#0E7490] text-white',
    particle: 'bg-[#06B6D4] dark:bg-[#67E8F9]',
    chip: 'bg-[#ECFEFF] dark:bg-[#0891B2]/20 text-[#0E7490] dark:text-[#67E8F9] border-[#06B6D4]/35 dark:border-[#22D3EE]/35',
  },
  rose: {
    surface:
      'bg-gradient-to-r from-[#FFF1F2]/96 via-white/96 to-[#FFE4E6]/95 dark:from-[#32101a]/96 dark:via-[#19141a]/96 dark:to-[#3b1220]/96',
    border: 'border-[#F43F5E]/50 dark:border-[#FB7185]/45',
    glow: '0 14px 36px -12px rgba(244, 63, 94, 0.38)',
    medallionBg: 'bg-gradient-to-br from-[#E11D48] to-[#DB2777] text-white',
    eyebrow: 'text-[#BE123C] dark:text-[#FDA4AF]',
    headline: 'text-[#881337] dark:text-[#FFF1F2]',
    body: 'text-[#9F1239]/90 dark:text-[#FECDD3]/85',
    ctaBg: 'bg-[#E11D48] hover:bg-[#BE123C] text-white',
    particle: 'bg-[#F43F5E] dark:bg-[#FDA4AF]',
    chip: 'bg-[#FFF1F2] dark:bg-[#E11D48]/20 text-[#BE123C] dark:text-[#FDA4AF] border-[#F43F5E]/35 dark:border-[#FB7185]/35',
  },
};

const renderMilestoneIcon = (days: number) => {
  if (days >= 100) return <Crown className="w-6 h-6" />;
  if (days >= 60) return <Award className="w-6 h-6" />;
  if (days >= 30) return <Trophy className="w-6 h-6" />;
  if (days >= 15) return <Zap className="w-6 h-6" />;
  return <Sparkles className="w-6 h-6" />;
};

const CELEBRATION_SPARKLES = [
  { left: '12%', top: '20%', delay: 0 },
  { left: '28%', top: '78%', delay: 0.25 },
  { left: '48%', top: '14%', delay: 0.45 },
  { left: '66%', top: '80%', delay: 0.15 },
  { left: '84%', top: '22%', delay: 0.35 },
];

export const HabitCard: React.FC<Props> = ({
  habit,
  onCheckIn,
  onEdit,
  onTogglePause,
  onDelete,
  canReorder = false,
  dragControls,
  onKeyboardMove,
  onOpenAmbientFocus,
  activeMilestone = null,
  onDismissMilestone,
  onReplayMilestone,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [notesExpanded, setNotesExpanded] = React.useState(false);
  const isCompleted = habit.todayLog?.isCompleted ?? false;
  const completedValue = habit.todayLog?.completedValue ?? 0;
  const targetValue = habit.targetValue;
  const isCumulative = targetValue > 1;
  const deepWork = isDeepWorkHabit(habit);

  const progressPercent = Math.min(100, Math.round((completedValue / targetValue) * 100));

  const handleToggleSingle = () => {
    onCheckIn(habit.id);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCheckIn(habit.id, 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (completedValue > 0) {
      onCheckIn(habit.id, -1);
    }
  };

  const bioTheme = getCategoryBioluminescentTheme(habit.category);
  const exactTodayMilestone = getExactTodayStreakMilestone(habit.currentStreak, isCompleted);
  const milestoneTheme = activeMilestone ? MILESTONE_STYLES[activeMilestone.accent] : null;
  const todayMoodMeta = getMoodMeta(habit.todayLog?.moodTag);
  const hasTodayContext =
    isCompleted &&
    (habit.todayLog?.energyLevel !== undefined ||
      Boolean(todayMoodMeta) ||
      Boolean(habit.todayLog?.journalEntry));

  return (
    <div
      data-completed={isCompleted ? 'true' : 'false'}
      style={bioTheme.cssVars}
      className="group relative rounded-[24px] bioluminescent-card"
    >
      {/* Animated Celebration Overlay when reaching a streak milestone */}
      <AnimatePresence>
        {activeMilestone && milestoneTheme && (
          <motion.div
            key={`milestone-${habit.id}-${activeMilestone.days}`}
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            style={{ boxShadow: milestoneTheme.glow }}
            role="status"
            aria-live="polite"
            className={`relative z-20 rounded-[24px] overflow-hidden border-2 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3.5 px-4 py-4 sm:px-6 sm:py-5 ${milestoneTheme.surface} ${milestoneTheme.border}`}
          >
            {/* Shimmer light beam */}
            <motion.div
              aria-hidden="true"
              initial={{ x: '-120%' }}
              animate={{ x: '220%' }}
              transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.8 }}
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 dark:via-white/10 to-transparent skew-x-[-20deg]"
            />

            {/* Floating celebratory sparkles */}
            {CELEBRATION_SPARKLES.map((spark, idx) => (
              <motion.span
                key={idx}
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.4, y: 6 }}
                animate={{
                  opacity: [0, 0.85, 0],
                  scale: [0.5, 1.15, 0.6],
                  y: [6, -12, -20],
                }}
                transition={{
                  duration: 2.2,
                  delay: spark.delay,
                  repeat: Infinity,
                  repeatDelay: 0.6,
                }}
                style={{ left: spark.left, top: spark.top }}
                className={`pointer-events-none absolute w-2 h-2 rounded-full ${milestoneTheme.particle}`}
              />
            ))}

            {/* Left & Center: Medallion + Celebration Copy */}
            <div className="relative z-10 flex items-center gap-3.5 min-w-0 flex-1">
              <div className="relative shrink-0">
                <motion.div
                  aria-hidden="true"
                  animate={{ scale: [1, 1.24, 1], opacity: [0.55, 0, 0.55] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className={`absolute -inset-1.5 rounded-[18px] ${milestoneTheme.particle} opacity-30`}
                />
                <motion.div
                  initial={{ rotate: -14, scale: 0.7 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.08 }}
                  className={`relative w-12 h-12 rounded-[14px] flex flex-col items-center justify-center shadow-md ${milestoneTheme.medallionBg}`}
                >
                  {renderMilestoneIcon(activeMilestone.days)}
                </motion.div>
                <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-[#17191c] dark:bg-[#f1f5f9] text-white dark:text-[#17191c] text-[10px] font-bold tabular-nums leading-none shadow-sm">
                  {activeMilestone.days}d
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${milestoneTheme.eyebrow}`}>
                    Celebración · {activeMilestone.badgeLabel}
                  </span>
                </div>
                <h4 className={`font-signifier font-normal text-[19px] sm:text-[20px] md:text-[22px] leading-tight break-words mt-0.5 ${milestoneTheme.headline}`}>
                  {activeMilestone.headline}
                </h4>
                <p className={`text-[12.5px] md:text-[13px] leading-snug mt-0.5 break-words ${milestoneTheme.body}`}>
                  {formatMilestoneCelebrationCopy(activeMilestone, habit.title)}
                </p>
              </div>
            </div>

            {/* Right: Dismiss / Continue CTA */}
            <div className="relative z-10 flex items-center justify-end gap-2 shrink-0 flex-wrap">
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onDismissMilestone?.(habit.id, activeMilestone.days)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap shadow-xs ${milestoneTheme.ctaBg}`}
              >
                ¡Seguir así!
              </motion.button>
              <ActionHint
                message="Ocultará esta celebración y volverá a la tarjeta del hábito"
                tone="neutral"
                position="top"
                align="right"
              >
                <button
                  type="button"
                  onClick={() => onDismissMilestone?.(habit.id, activeMilestone.days)}
                  aria-label="Cerrar celebración de hito"
                  className="w-10 h-10 rounded-full border border-[#17191c]/12 dark:border-white/15 bg-white/80 dark:bg-[#141920]/80 text-[#5c616d] dark:text-[#cbd5e1] hover:text-[#17191c] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </ActionHint>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={activeMilestone ? 'hidden' : 'p-4 sm:p-5 md:p-6'}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Drag Handle + Category Icon + Title + Meta */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {canReorder && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                dragControls?.start(e);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  onKeyboardMove?.(habit.id, 'up');
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  onKeyboardMove?.(habit.id, 'down');
                }
              }}
              aria-label={`Reordenar ${habit.title}. Arrastra o usa las flechas arriba y abajo.`}
              title="Arrastra para reordenar (o usa ↑ / ↓)"
              className="w-9 h-9 -ml-1.5 rounded-full flex items-center justify-center text-[#a3a6af] dark:text-[#6f7a8a] hover:text-[#17191c] dark:hover:text-[#f1f5f9] hover:bg-[#f2f2f3] dark:hover:bg-[#1b222b] cursor-grab active:cursor-grabbing touch-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17191c]/30 dark:focus-visible:ring-[#f1f5f9]/30 transition-colors"
            >
              <GripVertical className="w-5 h-5" />
            </button>
          )}

          <div
            className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 border transition-all"
            style={{
              backgroundColor: `rgba(${bioTheme.rgb}, 0.16)`,
              borderColor: `rgba(${bioTheme.rgb}, 0.34)`,
              color: 'var(--bio-text)',
              boxShadow: isCompleted ? `0 4px 14px -4px rgba(${bioTheme.rgb}, 0.38)` : undefined,
            }}
          >
            <CategoryIcon name={habit.category.iconName} className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
              <span className="font-normal" style={{ color: 'var(--bio-text)' }}>
                {habit.category.name}
              </span>
              {habit.reminderTime && (
                <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] font-mono tabular-nums">
                  · {habit.reminderTime}
                </span>
              )}
            </div>

            {deepWork && onOpenAmbientFocus ? (
              <button
                type="button"
                onClick={() => onOpenAmbientFocus(habit)}
                title="Abrir Enfoque Ambiental"
                className="group/focus text-left w-full mt-0.5 flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17191c]/30 dark:focus-visible:ring-[#f1f5f9]/30 rounded"
              >
                <h3
                  className={`text-[16px] sm:text-[17px] font-medium tracking-[-0.01em] line-clamp-2 md:truncate transition-colors ${
                    isCompleted
                      ? 'text-[#777b86] dark:text-[#6f7a8a] line-through'
                      : 'text-[#17191c] dark:text-[#f1f5f9] group-hover/focus:underline underline-offset-4'
                  }`}
                >
                  {habit.title}
                </h3>
                <Headphones className="w-3.5 h-3.5 text-[#4338CA] dark:text-[#a5b4fc] opacity-75 group-hover/focus:opacity-100 shrink-0 transition-opacity" />
              </button>
            ) : (
              <h3
                className={`text-[16px] sm:text-[17px] font-medium tracking-[-0.01em] mt-0.5 line-clamp-2 md:truncate transition-colors ${
                  isCompleted ? 'text-[#777b86] dark:text-[#6f7a8a] line-through' : 'text-[#17191c] dark:text-[#f1f5f9]'
                }`}
              >
                {habit.title}
              </h3>
            )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-0.5">
              <span className="tabular-nums">
                {targetValue} {habit.unitLabel}
              </span>
              {habit.notes && (
                <>
                  <span aria-hidden="true" className="text-[#a3a6af] dark:text-[#6f7a8a]">·</span>
                  <button
                    type="button"
                    onClick={() => setNotesExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{notesExpanded ? 'Ocultar notas' : 'Notas'}</span>
                    {notesExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Clean Unboxed 7-Day Trailing Matrix */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 self-start md:self-center shrink-0">
          {habit.past7Days.map((day, idx) => {
            const isToday = idx === habit.past7Days.length - 1;
            return (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <span
                  className={`text-[10px] ${
                    isToday ? 'text-[#17191c] dark:text-[#f1f5f9] font-semibold' : 'text-[#979799] dark:text-[#6f7a8a]'
                  }`}
                >
                  {day.dayLabel}
                </span>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                    day.isCompleted
                      ? 'text-white'
                      : day.isScheduled
                      ? 'bg-[#f2f2f3] dark:bg-[#1b222b] border border-[#d6d6da] dark:border-[#2f3a49]'
                      : 'bg-transparent border border-dashed border-[#d6d6da] dark:border-[#2f3a49]'
                  }`}
                  style={
                    day.isCompleted
                      ? {
                          backgroundColor: bioTheme.glowHex,
                          boxShadow: `0 2px 6px -1px rgba(${bioTheme.rgb}, 0.45)`,
                        }
                      : undefined
                  }
                  title={`${day.date}: ${day.isCompleted ? 'Completado' : day.isScheduled ? 'Pendiente' : 'No programado'}`}
                >
                  {day.isCompleted && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Streak Indicator + Check Node / Stepper */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#ececec] dark:border-[#252e3a]">
          <div className="flex items-center gap-2">
            {exactTodayMilestone && !activeMilestone && onReplayMilestone && (
              <button
                type="button"
                onClick={() => onReplayMilestone(habit.id, exactTodayMilestone)}
                title={`Ver celebración de hito (${exactTodayMilestone.days} días)`}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-transform hover:scale-105 cursor-pointer ${MILESTONE_STYLES[exactTodayMilestone.accent].chip}`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Hito {exactTodayMilestone.days}d</span>
              </button>
            )}
            <div
              className="flex items-center gap-1 text-[#B45309] dark:text-[#fbbf24] text-[13px] font-medium tabular-nums"
              title={`Racha actual: ${habit.currentStreak} días consecutivos (Récord: ${habit.bestStreak})`}
            >
              <Flame className="w-3.5 h-3.5 text-[#D97706] dark:text-[#fbbf24]" />
              <span>{habit.currentStreak}d</span>
            </div>
          </div>

          {isCumulative ? (
            <div className="flex items-center gap-2">
              <div className="text-right mr-1">
                <span className="text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums">
                  {completedValue}/{targetValue}
                </span>
                <span className="text-[11px] text-[#979799] dark:text-[#6f7a8a] block -mt-0.5">
                  {habit.unitLabel}
                </span>
              </div>

              <ActionHint
                message={`Restará 1 ${habit.unitLabel} del progreso de hoy`}
                tone="neutral"
                position="top"
                align="center"
              >
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={completedValue <= 0}
                  aria-label={`Restar 1 ${habit.unitLabel}`}
                  className="w-9 h-9 rounded-full bg-white dark:bg-[#1b222b] hover:bg-[#f2f2f3] dark:hover:bg-[#252e3a] disabled:opacity-35 disabled:pointer-events-none text-[#17191c] dark:text-[#f1f5f9] flex items-center justify-center border border-[#ececec] dark:border-[#252e3a] transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4 stroke-[2.25]" />
                </button>
              </ActionHint>

              <ActionHint
                message={`Sumará +1 ${habit.unitLabel} al progreso de hoy`}
                tone="accent"
                position="top"
                align="right"
              >
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={handleIncrement}
                  aria-label={`Sumar 1 ${habit.unitLabel}`}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                    isCompleted
                      ? 'text-white'
                      : 'bg-[#ECFDF5] dark:bg-[#059669]/20 hover:bg-[#059669] hover:text-white border-[#059669]/30 dark:border-[#34d399]/35 text-[#047857] dark:text-[#34d399]'
                  }`}
                  style={
                    isCompleted
                      ? {
                          backgroundColor: bioTheme.glowHex,
                          borderColor: bioTheme.glowHex,
                          boxShadow: `0 4px 14px -3px rgba(${bioTheme.rgb}, 0.5)`,
                        }
                      : undefined
                  }
                >
                  <Plus className="w-4 h-4 stroke-[2.25]" />
                </motion.button>
              </ActionHint>
            </div>
          ) : (
            <ActionHint
              message={
                isCompleted
                  ? 'Desmarcará este hábito como pendiente hoy'
                  : 'Marcará este hábito como completado hoy'
              }
              tone="accent"
              position="top"
              align="right"
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.04 }}
                onClick={handleToggleSingle}
                aria-label={isCompleted ? 'Marcar como pendiente' : 'Completar hábito'}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                  isCompleted
                    ? 'text-white'
                    : 'bg-white dark:bg-[#1b222b] text-transparent hover:text-[#059669] dark:hover:text-[#34d399] border-[#059669]/35 dark:border-[#34d399]/40 hover:border-[#059669]'
                }`}
                style={
                  isCompleted
                    ? {
                        backgroundColor: bioTheme.glowHex,
                        borderColor: bioTheme.glowHex,
                        boxShadow: `0 4px 14px -3px rgba(${bioTheme.rgb}, 0.5)`,
                      }
                    : undefined
                }
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
              </motion.button>
            </ActionHint>
          )}

          {/* Quick options menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Opciones del hábito"
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] hover:bg-[#f2f2f3] dark:hover:bg-[#1b222b] transition-colors cursor-pointer"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-11 z-30 w-48 max-w-[calc(100vw-2.5rem)] py-1.5 steep-popover text-[13px]">
                  {onOpenAmbientFocus && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenAmbientFocus(habit);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[#17191c] dark:text-[#f1f5f9] hover:bg-[#fafafb] dark:hover:bg-[#252e3a] cursor-pointer text-left"
                    >
                      <Headphones className="w-3.5 h-3.5 text-[#5d2a1a] dark:text-[#fbdac7]" />
                      Enfoque ambiental
                    </button>
                  )}
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(habit);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[#17191c] dark:text-[#f1f5f9] hover:bg-[#fafafb] dark:hover:bg-[#252e3a] cursor-pointer text-left"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#777b86] dark:text-[#9aa4b2]" />
                      Editar
                    </button>
                  )}
                  {onTogglePause && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onTogglePause(habit.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[#17191c] dark:text-[#f1f5f9] hover:bg-[#fafafb] dark:hover:bg-[#252e3a] cursor-pointer text-left"
                    >
                      <Pause className="w-3.5 h-3.5 text-[#777b86] dark:text-[#9aa4b2]" />
                      Pausar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(habit.id);
                      }}
                      className="w-full flex flex-col items-start gap-0.5 px-3.5 py-2 text-[#b91c1c] dark:text-[#fca5a5] hover:bg-[#fbe1d1]/40 dark:hover:bg-[#b91c1c]/15 cursor-pointer text-left"
                    >
                      <span className="inline-flex items-center gap-2.5 font-medium">
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </span>
                      <span className="text-[11px] text-[#b91c1c]/75 dark:text-[#fca5a5]/75 pl-6">
                        Retirará este hábito de tu lista
                      </span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Daily Ritual Notes */}
      {habit.notes && notesExpanded && (
        <div className="mt-4 pt-3.5 border-t border-[#ececec] dark:border-[#252e3a] flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <RitualNotesMarkdown content={habit.notes} compact />
          </div>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(habit)}
              className="text-[12px] text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] hover:underline transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Editar notas
            </button>
          )}
        </div>
      )}

      {/* Contextual Reflection Strip on completed habits */}
      {hasTodayContext && (
        <div className="mt-3.5 pt-3 border-t border-[#ececec] dark:border-[#252e3a] flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[#5c616d] dark:text-[#9aa4b2]">
          {habit.todayLog?.energyLevel !== undefined && (
            <span className="inline-flex items-center gap-1 font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums shrink-0">
              <BatteryCharging className="w-3.5 h-3.5 text-[#059669] dark:text-[#34d399]" />
              Energía {habit.todayLog.energyLevel}/5
            </span>
          )}
          {todayMoodMeta && (
            <span className="font-medium shrink-0" style={{ color: todayMoodMeta.colorHex }}>
              · {todayMoodMeta.label}
            </span>
          )}
          {habit.todayLog?.journalEntry && (
            <span className="text-[#777b86] dark:text-[#9aa4b2] italic break-words min-w-0">
              “{habit.todayLog.journalEntry}”
            </span>
          )}
        </div>
      )}

      {/* Slim progress bar for cumulative habits */}
      {isCumulative && (
        <div className="mt-3.5 w-full h-1.5 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] overflow-hidden">
          <motion.div
            className="h-full rounded-full transition-all duration-300"
            style={{
              background: `linear-gradient(90deg, ${bioTheme.glowHex}, ${bioTheme.secondaryHex})`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
      </div>
    </div>
  );
};
