import React from 'react';
import { motion } from 'motion/react';
import { Check, Flame, Plus, Minus, MoreVertical, Edit2, Pause, Trash2 } from 'lucide-react';
import { HabitWithTodayLog } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';

interface Props {
  habit: HabitWithTodayLog;
  onCheckIn: (habitId: string, completedValueChange?: number, forceCompleted?: boolean) => void;
  onEdit?: (habit: HabitWithTodayLog) => void;
  onTogglePause?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
}

export const HabitCard: React.FC<Props> = ({
  habit,
  onCheckIn,
  onEdit,
  onTogglePause,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isCompleted = habit.todayLog?.isCompleted ?? false;
  const completedValue = habit.todayLog?.completedValue ?? 0;
  const targetValue = habit.targetValue;
  const isCumulative = targetValue > 1;

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-xl border border-white/[0.08] p-4 md:p-5 transition-all duration-200 ${
        isCompleted
          ? 'bg-[#0F172A]/90 ring-1 ring-[#10B981]/25'
          : 'bg-[#0F172A] hover:border-white/15 hover:bg-[#121c33]'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Category Icon + Title + Meta */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
            style={{
              backgroundColor: `${habit.category.colorHex}18`,
              color: habit.category.colorHex,
            }}
          >
            <CategoryIcon name={habit.category.iconName} className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-semibold tracking-wider uppercase"
                style={{ color: habit.category.colorHex }}
              >
                {habit.category.name}
              </span>
              {habit.reminderTime && (
                <span className="text-[11px] text-slate-500 font-mono">
                  · {habit.reminderTime}
                </span>
              )}
            </div>

            <h3
              className={`text-base font-bold tracking-tight mt-0.5 truncate transition-colors ${
                isCompleted ? 'text-slate-300 line-through decoration-emerald-500/50' : 'text-white'
              }`}
            >
              {habit.title}
            </h3>

            {/* Target info */}
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Meta:{' '}
              <span className="text-slate-200 tabular-nums font-semibold">
                {targetValue} {habit.unitLabel}
              </span>
              {habit.notes && <span className="text-slate-500"> — {habit.notes}</span>}
            </p>
          </div>
        </div>

        {/* Center: 7-Day Trailing Mini Matrix */}
        <div className="flex items-center gap-1.5 self-start md:self-center shrink-0 px-3 py-1.5 rounded-lg bg-[#090D16]/60 border border-white/[0.04]">
          {habit.past7Days.map((day, idx) => {
            const isToday = idx === habit.past7Days.length - 1;
            return (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <span
                  className={`text-[10px] font-semibold ${
                    isToday ? 'text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  {day.dayLabel}
                </span>
                <div
                  className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all ${
                    day.isCompleted
                      ? 'bg-[#10B981] text-[#003824] shadow-[0_0_8px_rgba(16,185,129,0.35)]'
                      : day.isScheduled
                      ? 'bg-[#1E293B] border border-white/10'
                      : 'bg-transparent border border-dashed border-white/10'
                  }`}
                  title={`${day.date}: ${day.isCompleted ? 'Completado' : day.isScheduled ? 'Pendiente' : 'No programado'}`}
                >
                  {day.isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Streak Badge + Check Node / Stepper */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
          {/* Streak Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums tracking-wide glow-amber-flame"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#F59E0B',
            }}
            title={`Racha actual: ${habit.currentStreak} días consecutivos (Récord: ${habit.bestStreak})`}
          >
            <Flame className="w-3.5 h-3.5 fill-[#F59E0B] stroke-[#F59E0B]" />
            <span>{habit.currentStreak} d</span>
          </div>

          {/* Stepper or Single Node */}
          {isCumulative ? (
            <div className="flex items-center gap-2">
              <div className="text-right mr-1">
                <span className="text-xs font-bold text-white tabular-nums">
                  {completedValue}/{targetValue}
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">
                  {habit.unitLabel}
                </span>
              </div>

              <button
                onClick={handleDecrement}
                disabled={completedValue <= 0}
                className="w-8 h-8 rounded-lg bg-[#1E293B] hover:bg-[#27354A] disabled:opacity-40 disabled:pointer-events-none text-slate-300 flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
                title="Restar 1"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleIncrement}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                  isCompleted
                    ? 'bg-[#10B981] border-[#34D399] text-[#003824] glow-emerald'
                    : 'bg-[#10B981]/20 hover:bg-[#10B981] hover:text-[#003824] border-[#10B981]/40 text-[#10B981]'
                }`}
                title="Sumar 1"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.05 }}
              onClick={handleToggleSingle}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                isCompleted
                  ? 'bg-[#10B981] text-white border border-[#34D399] glow-emerald-node'
                  : 'bg-[#1E293B] text-transparent hover:text-slate-400 border border-white/15 hover:border-emerald-500/40'
              }`}
              title={isCompleted ? 'Marcar como pendiente' : 'Completar hábito'}
            >
              <Check className={`w-4 h-4 stroke-[3] ${isCompleted ? 'text-[#003824]' : ''}`} />
            </motion.button>
          )}

          {/* Quick options menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-30 w-36 py-1.5 rounded-lg bg-[#111827] border border-white/10 shadow-2xl text-xs">
                  {onEdit && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(habit);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer text-left"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  )}
                  {onTogglePause && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onTogglePause(habit.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer text-left"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pausar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(habit.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer text-left"
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

      {/* Progress bar for cumulative habits */}
      {isCumulative && (
        <div className="mt-3 pt-2.5 border-t border-white/[0.04]">
          <div className="flex items-center justify-between text-[11px] mb-1 text-slate-400">
            <span>Progreso diario</span>
            <span className="font-semibold text-slate-300 tabular-nums">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1E293B] overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-[#10B981] glow-emerald' : 'bg-emerald-500/70'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};
