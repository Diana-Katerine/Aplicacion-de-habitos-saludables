import React, { useMemo, useState } from 'react';
import { BellRing, Clock, Check, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { HabitWithTodayLog, User } from '../../types';
import {
  AdaptiveReminderSuggestion,
  buildAdaptiveReminders,
} from '../../services/reminders';
import { CategoryIcon } from '../common/CategoryIcon';

interface Props {
  user: User;
  habits: HabitWithTodayLog[];
  onApplyReminderTime: (habitId: string, newReminderTime: string) => void;
  onCompleteHabit: (habitId: string) => void;
  onTriggerPushAlert: (suggestion: AdaptiveReminderSuggestion) => void;
}

export const AdaptiveReminderPanel: React.FC<Props> = ({
  user,
  habits,
  onApplyReminderTime,
  onCompleteHabit,
  onTriggerPushAlert,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const { timeInfo, suggestions } = useMemo(
    () =>
      buildAdaptiveReminders({
        habits,
        timezone: user.timezone,
        eveningCutoffTime: user.reminderEveningTime,
      }),
    [habits, user.timezone, user.reminderEveningTime]
  );

  const pendingCount = habits.filter((h) => !h.todayLog?.isCompleted).length;

  if (pendingCount === 0) return null;

  if (suggestions.length === 0 && !timeInfo.isLateAfternoon) {
    return null;
  }

  const displayed = suggestions.slice(0, 4);
  const topSuggestion = displayed[0] || null;

  return (
    <section
      aria-label="Recordatorios adaptativos"
      className="rounded-[24px] p-4 sm:p-5 md:p-6 bg-[#FFFBEB]/75 dark:bg-[#D97706]/10 border border-[#D97706]/20 dark:border-[#FBBF24]/25"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-[12px] bg-[#FEF3C7] dark:bg-[#D97706]/25 text-[#D97706] dark:text-[#fbbf24] flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h2 className="text-[15px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-tight">
              Recordatorios adaptativos
            </h2>
            <span className="text-[12px] text-[#777b86] dark:text-[#9aa4b2] font-mono tabular-nums">
              · {timeInfo.hhmm}
            </span>
            <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] tabular-nums">
              · {suggestions.length} {suggestions.length === 1 ? 'pendiente' : 'pendientes'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {topSuggestion && (
            <button
              type="button"
              onClick={() => onTriggerPushAlert(topSuggestion)}
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#141920] hover:bg-[#f2f2f3] dark:hover:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[12px] text-[#17191c] dark:text-[#f1f5f9] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5 shrink-0" />
              <span>Alerta rápida</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-label={isExpanded ? 'Contraer recordatorios' : 'Expandir recordatorios'}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#141920] hover:bg-[#f2f2f3] dark:hover:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] transition-colors shrink-0 cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && displayed.length > 0 && (
        <div className="mt-4 pt-2 border-t border-[#ececec] dark:border-[#252e3a] divide-y divide-[#ececec] dark:divide-[#252e3a]">
          {displayed.map((item) => {
            const { habit, currentReminderTime, suggestedTime, reason } = item;
            const alreadyAtSuggested = currentReminderTime === suggestedTime;

            return (
              <div
                key={habit.id}
                className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${habit.category.colorHex}22`,
                      color: habit.category.colorHex,
                    }}
                  >
                    <CategoryIcon name={habit.category.iconName} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[14px] font-medium text-[#17191c] dark:text-[#f1f5f9] break-words line-clamp-2 sm:truncate">
                        {habit.title}
                      </span>
                      {habit.currentStreak >= 3 && (
                        <span className="text-[12px] text-[#B45309] dark:text-[#fbbf24] font-medium inline-flex items-center gap-1 tabular-nums shrink-0">
                          <Flame className="w-3 h-3 text-[#D97706] dark:text-[#fbbf24]" />
                          {habit.currentStreak}d
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-0.5 break-words">{reason}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 w-full md:w-auto md:self-center">
                  {!alreadyAtSuggested && (
                    <button
                      type="button"
                      onClick={() => onApplyReminderTime(habit.id, suggestedTime)}
                      className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#141920] hover:bg-[#FEF3C7]/60 dark:hover:bg-[#D97706]/20 border border-[#ececec] dark:border-[#252e3a] text-[12px] text-[#17191c] dark:text-[#f1f5f9] inline-flex items-center gap-1.5 transition-colors tabular-nums whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-[#D97706] dark:text-[#fbbf24] shrink-0" />
                      <span>Ajustar a {suggestedTime}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onCompleteHabit(habit.id)}
                    className="px-4 py-1.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>Completar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
