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
  const [simulateLateAfternoon, setSimulateLateAfternoon] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const { timeInfo, suggestions } = useMemo(
    () =>
      buildAdaptiveReminders({
        habits,
        timezone: user.timezone,
        eveningCutoffTime: user.reminderEveningTime,
        simulatedLateAfternoonMinutes: simulateLateAfternoon ? 17 * 60 + 15 : undefined,
      }),
    [habits, user.timezone, user.reminderEveningTime, simulateLateAfternoon]
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
      className="rounded-[24px] p-5 md:p-6 bg-[#fafafb] border border-[#ececec]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#f2f2f3] text-[#17191c] flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h2 className="text-[15px] font-medium text-[#17191c] tracking-tight">
                {timeInfo.isLateAfternoon
                  ? 'Recordatorios adaptativos de tarde'
                  : 'Sugerencias de recordatorio adaptativo'}
              </h2>
              <span className="text-[12px] text-[#777b86] font-mono tabular-nums">
                · {timeInfo.hhmm}
              </span>
              <span className="text-[12px] text-[#979799] tabular-nums">
                · {suggestions.length} {suggestions.length === 1 ? 'hábito pendiente' : 'hábitos pendientes'}
              </span>
            </div>
            <p className="text-[13px] text-[#777b86] mt-0.5">
              {timeInfo.isLateAfternoon
                ? 'Ajusta tus alertas de la tarde o completa tus hábitos pendientes antes del corte de medianoche.'
                : 'Hábitos cuya hora de recordatorio ya pasó hoy; reprograma para la tarde o prueba la alerta push.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
          {!getRealLateAfternoonCheck(user.timezone) && (
            <button
              type="button"
              onClick={() => setSimulateLateAfternoon((prev) => !prev)}
              className={`px-3.5 py-1.5 rounded-full border text-[12px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                simulateLateAfternoon
                  ? 'bg-[#17191c] border-[#17191c] text-white'
                  : 'bg-white hover:bg-[#f2f2f3] border-[#ececec] text-[#17191c]'
              }`}
            >
              {simulateLateAfternoon ? 'Vista tarde (17:15) activa' : 'Simular tarde (17:15)'}
            </button>
          )}

          {topSuggestion && (
            <button
              type="button"
              onClick={() => onTriggerPushAlert(topSuggestion)}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#f2f2f3] border border-[#17191c]/25 text-[12px] text-[#17191c] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5 shrink-0" />
              <span>Enviar alerta push</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-label={isExpanded ? 'Contraer recordatorios' : 'Expandir recordatorios'}
            className="p-2 rounded-full bg-white hover:bg-[#f2f2f3] border border-[#ececec] text-[#777b86] hover:text-[#17191c] transition-colors shrink-0 cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && displayed.length > 0 && (
        <div className="mt-4 pt-2 border-t border-[#ececec] divide-y divide-[#ececec]">
          {displayed.map((item) => {
            const { habit, currentReminderTime, suggestedTime, reason } = item;
            const alreadyAtSuggested = currentReminderTime === suggestedTime;

            return (
              <div
                key={habit.id}
                className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-[12px] bg-[#f2f2f3] text-[#17191c] flex items-center justify-center shrink-0">
                    <CategoryIcon name={habit.category.iconName} className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[14px] font-medium text-[#17191c] truncate">
                        {habit.title}
                      </span>
                      {habit.currentStreak >= 3 && (
                        <span className="text-[12px] text-[#5d2a1a] inline-flex items-center gap-1 tabular-nums shrink-0">
                          <Flame className="w-3 h-3" />
                          {habit.currentStreak}d
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#777b86] mt-0.5">{reason}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                  {!alreadyAtSuggested && (
                    <button
                      type="button"
                      onClick={() => onApplyReminderTime(habit.id, suggestedTime)}
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#f2f2f3] border border-[#ececec] text-[12px] text-[#17191c] inline-flex items-center gap-1.5 transition-colors tabular-nums whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-[#777b86] shrink-0" />
                      <span>Ajustar a {suggestedTime}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onCompleteHabit(habit.id)}
                    className="px-4 py-1.5 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[12px] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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

function getRealLateAfternoonCheck(timezone?: string): boolean {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || undefined,
      hour: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const h = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10) % 24;
    return h >= 16;
  } catch {
    return new Date().getHours() >= 16;
  }
}
