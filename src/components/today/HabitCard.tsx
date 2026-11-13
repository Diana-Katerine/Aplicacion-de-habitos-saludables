import React from 'react';
import { motion, type DragControls } from 'motion/react';
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
} from 'lucide-react';
import { HabitWithTodayLog } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  RitualNotesMarkdown,
  summarizeMarkdownInline,
} from '../habits/RitualNotesEditor';
import { isDeepWorkHabit } from './AmbientFocusOverlay';
import { getCategoryBioluminescentTheme } from '../../services/bioluminescentTheme';

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
}

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

  return (
    <div
      data-completed={isCompleted ? 'true' : 'false'}
      style={bioTheme.cssVars}
      className="group relative rounded-[24px] p-5 md:p-6 bioluminescent-card"
    >
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
              className="w-9 h-9 -ml-1.5 rounded-full flex items-center justify-center text-[#a3a6af] hover:text-[#17191c] hover:bg-[#f2f2f3] cursor-grab active:cursor-grabbing touch-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17191c]/30 transition-colors"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}

          <div
            className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 border transition-colors"
            style={{
              backgroundColor: `rgba(${bioTheme.rgb}, 0.1)`,
              borderColor: `rgba(${bioTheme.rgb}, 0.25)`,
              color: bioTheme.glowHex,
            }}
          >
            <CategoryIcon name={habit.category.iconName} className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="font-normal" style={{ color: bioTheme.glowHex }}>
                {habit.category.name}
              </span>
              {habit.reminderTime && (
                <span className="text-[12px] text-[#979799] font-mono tabular-nums">
                  · {habit.reminderTime}
                </span>
              )}
            </div>

            {deepWork && onOpenAmbientFocus ? (
              <button
                type="button"
                onClick={() => onOpenAmbientFocus(habit)}
                title="Abrir Enfoque Ambiental para este hábito"
                className="group/focus text-left w-full mt-0.5 flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17191c]/30 rounded"
              >
                <h3
                  className={`text-[17px] font-medium tracking-[-0.01em] truncate transition-colors ${
                    isCompleted
                      ? 'text-[#777b86] line-through'
                      : 'text-[#17191c] group-hover/focus:underline underline-offset-4'
                  }`}
                >
                  {habit.title}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[12px] text-[#777b86] group-hover/focus:text-[#17191c] whitespace-nowrap shrink-0">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Enfoque</span>
                </span>
              </button>
            ) : (
              <h3
                className={`text-[17px] font-medium tracking-[-0.01em] mt-0.5 truncate transition-colors ${
                  isCompleted ? 'text-[#777b86] line-through' : 'text-[#17191c]'
                }`}
              >
                {habit.title}
              </h3>
            )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-[#777b86] mt-0.5">
              <span>
                Meta:{' '}
                <span className="text-[#17191c] tabular-nums font-medium">
                  {targetValue} {habit.unitLabel}
                </span>
              </span>
              {habit.notes && (
                <>
                  <span aria-hidden="true" className="text-[#a3a6af]">·</span>
                  <span className="text-[#777b86] truncate max-w-xs">
                    {summarizeMarkdownInline(habit.notes)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNotesExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-[#17191c] hover:underline underline-offset-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{notesExpanded ? 'Ocultar notas' : 'Notas del ritual'}</span>
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

        {/* Center: 7-Day Trailing Mini Matrix */}
        <div className="flex items-center gap-1.5 self-start md:self-center shrink-0 px-3.5 py-2 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
          {habit.past7Days.map((day, idx) => {
            const isToday = idx === habit.past7Days.length - 1;
            return (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <span
                  className={`text-[10px] ${
                    isToday ? 'text-[#17191c] font-medium' : 'text-[#979799]'
                  }`}
                >
                  {day.dayLabel}
                </span>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                    day.isCompleted
                      ? 'bg-[#17191c] text-white'
                      : day.isScheduled
                      ? 'bg-[#f2f2f3] border border-[#d6d6da]'
                      : 'bg-transparent border border-dashed border-[#d6d6da]'
                  }`}
                  title={`${day.date}: ${day.isCompleted ? 'Completado' : day.isScheduled ? 'Pendiente' : 'No programado'}`}
                >
                  {day.isCompleted && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Streak Indicator + Check Node / Stepper */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#ececec]">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f2f3] text-[#17191c] text-[12px] font-medium tabular-nums"
            title={`Racha actual: ${habit.currentStreak} días consecutivos (Récord: ${habit.bestStreak})`}
          >
            <Flame className="w-3.5 h-3.5 text-[#5d2a1a]" />
            <span>{habit.currentStreak} d</span>
          </div>

          {isCumulative ? (
            <div className="flex items-center gap-2">
              <div className="text-right mr-1">
                <span className="text-[13px] font-medium text-[#17191c] tabular-nums">
                  {completedValue}/{targetValue}
                </span>
                <span className="text-[11px] text-[#979799] block -mt-0.5">
                  {habit.unitLabel}
                </span>
              </div>

              <button
                type="button"
                onClick={handleDecrement}
                disabled={completedValue <= 0}
                className="w-8 h-8 rounded-full bg-white hover:bg-[#f2f2f3] disabled:opacity-35 disabled:pointer-events-none text-[#17191c] flex items-center justify-center border border-[#ececec] transition-colors cursor-pointer"
                title="Restar 1"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={handleIncrement}
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                  isCompleted
                    ? 'bg-[#17191c] border-[#17191c] text-white'
                    : 'bg-[#f2f2f3] hover:bg-[#17191c] hover:text-white border-[#ececec] text-[#17191c]'
                }`}
                title="Sumar 1"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.04 }}
              onClick={handleToggleSingle}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isCompleted
                  ? 'bg-[#17191c] text-white border border-[#17191c]'
                  : 'bg-white text-transparent hover:text-[#777b86] border border-[#17191c]/25 hover:border-[#17191c]'
              }`}
              title={isCompleted ? 'Marcar como pendiente' : 'Completar hábito'}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
            </motion.button>
          )}

          {/* Quick options menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Opciones del hábito"
              className="p-2 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-9 z-30 w-48 py-1.5 steep-popover text-[13px]">
                  {onOpenAmbientFocus && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenAmbientFocus(habit);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[#17191c] hover:bg-[#fafafb] cursor-pointer text-left"
                    >
                      <Headphones className="w-3.5 h-3.5 text-[#5d2a1a]" />
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
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[#17191c] hover:bg-[#fafafb] cursor-pointer text-left"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#777b86]" />
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
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[#17191c] hover:bg-[#fafafb] cursor-pointer text-left"
                    >
                      <Pause className="w-3.5 h-3.5 text-[#777b86]" />
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
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[#b91c1c] hover:bg-[#fbe1d1]/40 cursor-pointer text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
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
        <div className="mt-4 pt-3.5 border-t border-[#ececec] flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <RitualNotesMarkdown content={habit.notes} compact />
          </div>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(habit)}
              className="text-[12px] text-[#777b86] hover:text-[#17191c] hover:underline transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Editar notas
            </button>
          )}
        </div>
      )}

      {/* Progress bar for cumulative habits */}
      {isCumulative && (
        <div className="mt-4 pt-3 border-t border-[#ececec]">
          <div className="flex items-center justify-between text-[12px] mb-1.5 text-[#777b86]">
            <span>Progreso diario</span>
            <span className="font-medium text-[#17191c] tabular-nums">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#f2f2f3] overflow-hidden">
            <motion.div
              className="h-full rounded-full transition-all duration-300"
              style={{
                backgroundColor: bioTheme.glowHex,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
