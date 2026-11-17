import React, { useEffect, useMemo, useState } from 'react';
import {
  HeartPulse,
  Zap,
  Smile,
  Moon,
  Plus,
  Minus,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { DayOfWeek, EnergyLevel, Habit, HabitLog, MoodTag } from '../../types';
import { formatDate, getDayOfWeek, getTodayDateString } from '../../services/storage';
import { ENERGY_OPTIONS, getMoodMeta, MOOD_OPTIONS } from '../../services/journaling';
import {
  DailyHealthEntry,
  HealthWidgetsService,
  SleepQuality,
} from '../../services/healthWidgets';

interface Props {
  userId: string;
  habits: Habit[];
  logs: HabitLog[];
  timezone?: string;
}

const DAY_INITIALS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const SLEEP_QUALITY_OPTIONS: { id: SleepQuality; label: string }[] = [
  { id: 'restful', label: 'Reparador' },
  { id: 'fair', label: 'Normal' },
  { id: 'poor', label: 'Ligero' },
];

function parseIsoAnchor(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

function getEnergyBadgeLabel(val: number): { label: string; colorClass: string } {
  if (val >= 4.25) {
    return {
      label: 'Energía plena',
      colorClass: 'bg-[#D1FAE5] dark:bg-[#059669]/20 text-[#047857] dark:text-[#34d399]',
    };
  }
  if (val >= 3.25) {
    return {
      label: 'Energía alta',
      colorClass: 'bg-[#E0F2FE] dark:bg-[#0284C7]/20 text-[#0369A1] dark:text-[#38bdf8]',
    };
  }
  if (val >= 2.25) {
    return {
      label: 'Energía estable',
      colorClass: 'bg-[#FEF3C7] dark:bg-[#D97706]/20 text-[#B45309] dark:text-[#fbbf24]',
    };
  }
  return {
    label: 'Recarga recomendada',
    colorClass: 'bg-[#FFE4E6] dark:bg-[#E11D48]/20 text-[#BE123C] dark:text-[#fda4af]',
  };
}

export const HealthWidgetsSection: React.FC<Props> = ({
  userId,
  habits,
  logs,
  timezone,
}) => {
  const todayStr = useMemo(() => getTodayDateString(timezone), [timezone]);
  const [healthState, setHealthState] = useState(() =>
    HealthWidgetsService.getHealthState(userId, timezone)
  );

  useEffect(() => {
    setHealthState(HealthWidgetsService.getHealthState(userId, timezone));
  }, [userId, timezone]);

  const entryByDate = useMemo(() => {
    const map = new Map<string, DailyHealthEntry>();
    healthState.entries.forEach((e) => map.set(e.date, e));
    return map;
  }, [healthState.entries]);

  const todayEntry = entryByDate.get(todayStr);

  // Aggregate last 7 days combining real HabitLogs + HealthWidgets overrides
  const {
    weekDays,
    todayEnergyValue,
    avg7dEnergy,
    todayMood,
    moodDistribution,
    todaySleepHours,
    todaySleepQuality,
    avg7dSleep,
    todayHabitsCompleted,
    todayHabitsScheduled,
    sleepAdherenceInsight,
  } = useMemo(() => {
    const anchor = parseIsoAnchor(todayStr);
    const activeHabits = habits.filter((h) => h.isActive && !h.deletedAt);

    // Build logs by date
    const logsByDate = new Map<string, HabitLog[]>();
    logs.forEach((l) => {
      const list = logsByDate.get(l.logDate) || [];
      list.push(l);
      logsByDate.set(l.logDate, list);
    });

    const days: {
      date: string;
      dayLabel: string;
      energy: number | null;
      mood: MoodTag | null;
      sleepHours: number | null;
      sleepQuality: SleepQuality | null;
      completedCount: number;
      scheduledCount: number;
      isToday: boolean;
    }[] = [];

    const moodCounts = new Map<MoodTag, number>();
    let totalMoodSamples = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() - i);
      const dateStr = formatDate(d);
      const dayNum = getDayOfWeek(d) as DayOfWeek;
      const dayLogs = logsByDate.get(dateStr) || [];
      const healthEntry = entryByDate.get(dateStr);

      const energyLogs = dayLogs
        .map((l) => l.energyLevel)
        .filter((e): e is EnergyLevel => typeof e === 'number');
      const avgLogEnergy =
        energyLogs.length > 0
          ? energyLogs.reduce((sum, e) => sum + e, 0) / energyLogs.length
          : null;
      const dayEnergy = healthEntry?.energyOverride ?? avgLogEnergy;

      // Latest mood from logs on that day or manual override
      const logWithMood = [...dayLogs]
        .reverse()
        .find((l) => Boolean(l.moodTag));
      const dayMood: MoodTag | null = healthEntry?.moodOverride ?? logWithMood?.moodTag ?? null;

      dayLogs.forEach((l) => {
        if (l.moodTag) {
          moodCounts.set(l.moodTag, (moodCounts.get(l.moodTag) || 0) + 1);
          totalMoodSamples += 1;
        }
      });
      if (healthEntry?.moodOverride) {
        moodCounts.set(
          healthEntry.moodOverride,
          (moodCounts.get(healthEntry.moodOverride) || 0) + 1
        );
        totalMoodSamples += 1;
      }

      const scheduledCount = activeHabits.filter((h) => h.scheduledDays.includes(dayNum)).length;
      const completedSet = new Set(dayLogs.filter((l) => l.isCompleted).map((l) => l.habitId));
      const completedCount = activeHabits.filter(
        (h) => h.scheduledDays.includes(dayNum) && completedSet.has(h.id)
      ).length;

      days.push({
        date: dateStr,
        dayLabel: DAY_INITIALS_ES[dayNum - 1],
        energy: dayEnergy !== null ? Math.round(dayEnergy * 10) / 10 : null,
        mood: dayMood,
        sleepHours: healthEntry?.sleepHours ?? null,
        sleepQuality: healthEntry?.sleepQuality ?? null,
        completedCount,
        scheduledCount,
        isToday: dateStr === todayStr,
      });
    }

    const energyDays = days.filter((d): d is typeof d & { energy: number } => d.energy !== null);
    const avgEnergy =
      energyDays.length > 0
        ? Math.round((energyDays.reduce((s, d) => s + d.energy, 0) / energyDays.length) * 10) / 10
        : null;

    const sleepDays = days.filter(
      (d): d is typeof d & { sleepHours: number } => d.sleepHours !== null
    );
    const avgSleep =
      sleepDays.length > 0
        ? Math.round((sleepDays.reduce((s, d) => s + d.sleepHours, 0) / sleepDays.length) * 10) / 10
        : null;

    const todayItem = days[days.length - 1];

    const dist = MOOD_OPTIONS.map((opt) => {
      const count = moodCounts.get(opt.id) || 0;
      const pct = totalMoodSamples > 0 ? Math.round((count / totalMoodSamples) * 100) : 0;
      return { ...opt, count, pct };
    })
      .filter((m) => m.count > 0)
      .sort((a, b) => b.count - a.count);

    // Compute habit adherence correlation with sleep over all recorded sleep days
    let goodSleepCompleted = 0;
    let goodSleepScheduled = 0;
    let shortSleepCompleted = 0;
    let shortSleepScheduled = 0;
    const goodThreshold = Math.max(6.5, healthState.sleepTargetHours - 0.5);

    healthState.entries.forEach((entry) => {
      if (typeof entry.sleepHours !== 'number') return;
      const d = parseIsoAnchor(entry.date);
      const dayNum = getDayOfWeek(d) as DayOfWeek;
      const sched = activeHabits.filter((h) => h.scheduledDays.includes(dayNum)).length;
      if (sched === 0) return;
      const dayLogs = logsByDate.get(entry.date) || [];
      const compSet = new Set(dayLogs.filter((l) => l.isCompleted).map((l) => l.habitId));
      const comp = activeHabits.filter(
        (h) => h.scheduledDays.includes(dayNum) && compSet.has(h.id)
      ).length;

      if (entry.sleepHours >= goodThreshold) {
        goodSleepCompleted += comp;
        goodSleepScheduled += sched;
      } else {
        shortSleepCompleted += comp;
        shortSleepScheduled += sched;
      }
    });

    let insightText = 'Registra tu energía, ánimo o descanso hoy para descubrir cómo impulsan tus hábitos.';
    if (goodSleepScheduled > 0 && shortSleepScheduled > 0) {
      const goodRate = Math.round((goodSleepCompleted / goodSleepScheduled) * 100);
      const shortRate = Math.round((shortSleepCompleted / shortSleepScheduled) * 100);
      if (goodRate > shortRate) {
        insightText = `Cuando duermes ${goodThreshold}h o más, tu cumplimiento de hábitos sube al ${goodRate}% (vs. ${shortRate}% en noches cortas).`;
      } else {
        insightText = `Con ${goodThreshold}h+ de descanso sostienes un ${goodRate}% de adherencia diaria en tus hábitos activos.`;
      }
    } else if (goodSleepScheduled > 0) {
      const goodRate = Math.round((goodSleepCompleted / goodSleepScheduled) * 100);
      insightText = `En jornadas con descanso adecuado logras un ${goodRate}% de cumplimiento en tus hábitos programados.`;
    } else if (avgEnergy !== null) {
      insightText = `Tu energía promedio de los últimos 7 días es de ${avgEnergy}/5, impulsando tu ritmo diario.`;
    }

    return {
      weekDays: days,
      todayEnergyValue: todayItem?.energy ?? null,
      avg7dEnergy: avgEnergy,
      todayMood: todayItem?.mood ?? null,
      moodDistribution: dist,
      todaySleepHours: todayItem?.sleepHours ?? null,
      todaySleepQuality: todayItem?.sleepQuality ?? null,
      avg7dSleep: avgSleep,
      todayHabitsCompleted: todayItem?.completedCount ?? 0,
      todayHabitsScheduled: todayItem?.scheduledCount ?? 0,
      sleepAdherenceInsight: insightText,
    };
  }, [todayStr, habits, logs, entryByDate, healthState.entries, healthState.sleepTargetHours]);

  const handleSetEnergy = (level: EnergyLevel) => {
    const next = HealthWidgetsService.upsertDayEntry(
      userId,
      { energyOverride: level },
      timezone,
      todayStr
    );
    setHealthState(next);
  };

  const handleSetMood = (mood: MoodTag) => {
    const next = HealthWidgetsService.upsertDayEntry(
      userId,
      { moodOverride: mood },
      timezone,
      todayStr
    );
    setHealthState(next);
  };

  const handleStepSleep = (delta: number) => {
    const base = todaySleepHours ?? healthState.sleepTargetHours - 0.5;
    const clamped = Math.max(3, Math.min(12, Math.round((base + delta) * 2) / 2));
    const next = HealthWidgetsService.upsertDayEntry(
      userId,
      {
        sleepHours: clamped,
        sleepQuality:
          todaySleepQuality ??
          (clamped >= healthState.sleepTargetHours - 0.5
            ? 'restful'
            : clamped >= 6.5
            ? 'fair'
            : 'poor'),
      },
      timezone,
      todayStr
    );
    setHealthState(next);
  };

  const handleSetSleepQuality = (quality: SleepQuality) => {
    const next = HealthWidgetsService.upsertDayEntry(
      userId,
      {
        sleepHours: todaySleepHours ?? healthState.sleepTargetHours,
        sleepQuality: quality,
      },
      timezone,
      todayStr
    );
    setHealthState(next);
  };

  const handleSelectTarget = (target: number) => {
    const next = HealthWidgetsService.updateSleepTarget(userId, target, timezone);
    setHealthState(next);
  };

  const displayEnergy = todayEnergyValue ?? avg7dEnergy ?? 3;
  const energyBadge = getEnergyBadgeLabel(displayEnergy);
  const activeMoodMeta = getMoodMeta(todayMood || moodDistribution[0]?.id);

  // SVG Ring progress for sleep
  const effectiveSleepForRing = todaySleepHours ?? avg7dSleep ?? 0;
  const sleepPct = Math.min(
    100,
    Math.round((effectiveSleepForRing / Math.max(1, healthState.sleepTargetHours)) * 100)
  );
  const ringRadius = 28;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - sleepPct / 100);

  return (
    <section
      aria-label="Widgets de Salud"
      className="rounded-[24px] bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a] overflow-hidden"
    >
      <div className="h-1 w-full chromatic-accent-bar" />

      <div className="p-4 sm:p-6 space-y-5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-[#059669] dark:text-[#34d399] shrink-0" />
              <h2 className="text-[19px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
                Widgets de Salud
              </h2>
            </div>
            <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-1">
              Energía, estado de ánimo y horas de sueño integrados con tu ritmo diario de hábitos.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ECFDF5] dark:bg-[#059669]/15 border border-[#059669]/25 dark:border-[#34d399]/25 text-[12px] font-medium text-[#047857] dark:text-[#34d399] tabular-nums self-start sm:self-auto whitespace-nowrap shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>
              Hoy: {todayHabitsCompleted}/{todayHabitsScheduled} hábitos
            </span>
          </div>
        </div>

        {/* 3 Health Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* WIDGET 1: ENERGÍA */}
          <article className="rounded-[20px] p-4 sm:p-5 bg-[#FFFBEB]/55 dark:bg-[#191c22] border border-[#F59E0B]/25 dark:border-[#fbbf24]/25 flex flex-col justify-between gap-4 min-w-0">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-[12px] bg-[#FEF3C7] dark:bg-[#D97706]/20 text-[#D97706] dark:text-[#fbbf24] flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-medium text-[#17191c] dark:text-[#f1f5f9]">
                      Energía
                    </h3>
                    <span className="text-[11.5px] text-[#777b86] dark:text-[#9aa4b2] tabular-nums">
                      {avg7dEnergy !== null ? `Media 7d: ${avg7dEnergy}/5` : 'Sin registros aún'}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 ${energyBadge.colorClass}`}
                >
                  {todayEnergyValue !== null ? `${todayEnergyValue}/5` : 'Sin registro'}
                </span>
              </div>

              {/* 7-day energy bars */}
              <div className="pt-1">
                <div className="grid grid-cols-7 gap-1.5 items-end h-16 px-1">
                  {weekDays.map((day) => {
                    const hPct = day.energy !== null ? Math.max(18, (day.energy / 5) * 100) : 14;
                    return (
                      <div key={day.date} className="flex flex-col items-center gap-1 h-full justify-end">
                        <div className="w-full flex items-end justify-center h-11">
                          <div
                            title={`${day.date}: ${day.energy !== null ? `${day.energy}/5` : 'Sin registro'}`}
                            className={`w-full max-w-[16px] rounded-t-md transition-all ${
                              day.energy === null
                                ? 'bg-[#ececec] dark:bg-[#252e3a]'
                                : day.isToday
                                ? 'bg-gradient-to-t from-[#D97706] to-[#FBBF24]'
                                : 'bg-[#F59E0B]/65 dark:bg-[#fbbf24]/55'
                            }`}
                            style={{ height: `${hPct}%` }}
                          />
                        </div>
                        <span
                          className={`text-[10px] tabular-nums ${
                            day.isToday
                              ? 'font-semibold text-[#D97706] dark:text-[#fbbf24]'
                              : 'text-[#979799] dark:text-[#6f7a8a]'
                          }`}
                        >
                          {day.dayLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick energy level check-in */}
            <div className="pt-3 border-t border-[#F59E0B]/15 dark:border-[#252e3a] space-y-2">
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="text-[#777b86] dark:text-[#9aa4b2]">Energía de hoy:</span>
                <span className="font-medium text-[#B45309] dark:text-[#fbbf24]">
                  {todayEnergyValue !== null ? energyBadge.label : 'Registrar'}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {ENERGY_OPTIONS.map((opt) => {
                  const isActive =
                    todayEntry?.energyOverride === opt.level ||
                    (todayEntry?.energyOverride === undefined &&
                      todayEnergyValue !== null &&
                      Math.round(todayEnergyValue) === opt.level);
                  return (
                    <button
                      key={opt.level}
                      type="button"
                      onClick={() => handleSetEnergy(opt.level)}
                      title={opt.label}
                      className={`py-1.5 rounded-[10px] text-[11.5px] font-medium tabular-nums transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-[#D97706] dark:bg-[#fbbf24] text-white dark:text-[#0c0f12] border-transparent shadow-xs'
                          : 'bg-white/80 dark:bg-[#141920] border-[#ececec] dark:border-[#252e3a] text-[#5c616d] dark:text-[#9aa4b2] hover:border-[#D97706]/50'
                      }`}
                    >
                      {opt.level}
                    </button>
                  );
                })}
              </div>
            </div>
          </article>

          {/* WIDGET 2: ESTADO DE ÁNIMO */}
          <article className="rounded-[20px] p-4 sm:p-5 bg-[#EEF2FF]/55 dark:bg-[#171a24] border border-[#6366F1]/25 dark:border-[#818cf8]/25 flex flex-col justify-between gap-4 min-w-0">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-[12px] bg-[#E0E7FF] dark:bg-[#4F46E5]/20 text-[#4F46E5] dark:text-[#a5b4fc] flex items-center justify-center shrink-0">
                    <Smile className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-medium text-[#17191c] dark:text-[#f1f5f9]">
                      Estado de ánimo
                    </h3>
                    <span className="text-[11.5px] text-[#777b86] dark:text-[#9aa4b2] block truncate">
                      {activeMoodMeta ? activeMoodMeta.description : 'Sin etiquetas esta semana'}
                    </span>
                  </div>
                </div>

                {activeMoodMeta && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0"
                    style={{
                      backgroundColor: `${activeMoodMeta.colorHex}1F`,
                      color: activeMoodMeta.colorHex,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: activeMoodMeta.colorHex }}
                    />
                    {activeMoodMeta.label}
                  </span>
                )}
              </div>

              {/* 7-day Mood Distribution Stacked Bar */}
              <div className="space-y-2 pt-1">
                {moodDistribution.length === 0 ? (
                  <div className="h-14 flex items-center justify-center rounded-[12px] bg-white/60 dark:bg-[#141920]/70 border border-dashed border-[#6366F1]/25 text-[12px] text-[#777b86] dark:text-[#9aa4b2] text-center px-3">
                    Elige cómo te sientes hoy para iniciar tu mapa emocional.
                  </div>
                ) : (
                  <>
                    <div className="w-full h-3 rounded-full bg-[#e5e7eb] dark:bg-[#252e3a] overflow-hidden flex">
                      {moodDistribution.map((m) => (
                        <div
                          key={m.id}
                          title={`${m.label}: ${m.pct}%`}
                          style={{
                            width: `${m.pct}%`,
                            backgroundColor: m.colorHex,
                          }}
                          className="h-full transition-all"
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#5c616d] dark:text-[#9aa4b2] tabular-nums">
                      {moodDistribution.slice(0, 3).map((m) => (
                        <span key={m.id} className="inline-flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: m.colorHex }}
                          />
                          <span>
                            {m.label} {m.pct}%
                          </span>
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick mood check-in */}
            <div className="pt-3 border-t border-[#6366F1]/15 dark:border-[#252e3a] space-y-2">
              <span className="text-[11.5px] text-[#777b86] dark:text-[#9aa4b2] block">
                ¿Cómo te sientes hoy?
              </span>
              <div className="flex flex-wrap gap-1.5">
                {MOOD_OPTIONS.map((opt) => {
                  const isActive = todayMood === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSetMood(opt.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border inline-flex items-center gap-1 ${
                        isActive
                          ? 'text-white border-transparent shadow-xs'
                          : 'bg-white/80 dark:bg-[#141920] border-[#ececec] dark:border-[#252e3a] text-[#5c616d] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
                      }`}
                      style={
                        isActive
                          ? { backgroundColor: opt.colorHex }
                          : undefined
                      }
                    >
                      {!isActive && (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: opt.colorHex }}
                        />
                      )}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </article>

          {/* WIDGET 3: HORAS DE SUEÑO */}
          <article className="rounded-[20px] p-4 sm:p-5 bg-[#E0F2FE]/50 dark:bg-[#141b24] border border-[#0284C7]/25 dark:border-[#38bdf8]/25 flex flex-col justify-between gap-4 min-w-0">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-[12px] bg-[#E0F2FE] dark:bg-[#0284C7]/20 text-[#0284C7] dark:text-[#38bdf8] flex items-center justify-center shrink-0">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-medium text-[#17191c] dark:text-[#f1f5f9]">
                      Horas de sueño
                    </h3>
                    <span className="text-[11.5px] text-[#777b86] dark:text-[#9aa4b2] tabular-nums">
                      {avg7dSleep !== null
                        ? `Media 7d: ${avg7dSleep} h`
                        : `Meta: ${healthState.sleepTargetHours} h / noche`}
                    </span>
                  </div>
                </div>

                {/* Sleep Goal Ring */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 68 68" aria-hidden="true">
                    <circle
                      cx="34"
                      cy="34"
                      r={ringRadius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="5.5"
                      className="text-[#e0f2fe] dark:text-[#1e293b]"
                    />
                    <circle
                      cx="34"
                      cy="34"
                      r={ringRadius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      className="text-[#0284C7] dark:text-[#38bdf8] transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center tabular-nums">
                    <span className="text-[13px] font-semibold text-[#17191c] dark:text-[#f1f5f9] leading-none">
                      {todaySleepHours !== null ? `${todaySleepHours}h` : '—'}
                    </span>
                    <span className="text-[9.5px] text-[#777b86] dark:text-[#9aa4b2] mt-0.5">
                      /{healthState.sleepTargetHours}h
                    </span>
                  </div>
                </div>
              </div>

              {/* 7-day Sleep Bars */}
              <div className="grid grid-cols-7 gap-1.5 items-end h-14 px-1">
                {weekDays.map((day) => {
                  const hours = day.sleepHours;
                  const pct =
                    hours !== null
                      ? Math.min(100, Math.max(18, (hours / Math.max(9, healthState.sleepTargetHours + 1)) * 100))
                      : 14;
                  const metGoal = hours !== null && hours >= healthState.sleepTargetHours - 0.5;
                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1 h-full justify-end">
                      <div className="w-full flex items-end justify-center h-9">
                        <div
                          title={`${day.date}: ${hours !== null ? `${hours}h` : 'Sin registro'}`}
                          className={`w-full max-w-[16px] rounded-t-md transition-all ${
                            hours === null
                              ? 'bg-[#ececec] dark:bg-[#252e3a]'
                              : metGoal
                              ? 'bg-gradient-to-t from-[#0284C7] to-[#38BDF8]'
                              : 'bg-[#94A3B8] dark:bg-[#64748b]'
                          }`}
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span
                        className={`text-[10px] tabular-nums ${
                          day.isToday
                            ? 'font-semibold text-[#0284C7] dark:text-[#38bdf8]'
                            : 'text-[#979799] dark:text-[#6f7a8a]'
                        }`}
                      >
                        {day.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Sleep Stepper + Quality + Target */}
            <div className="pt-3 border-t border-[#0284C7]/15 dark:border-[#252e3a] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] text-[#777b86] dark:text-[#9aa4b2]">
                  Anoche dormí:
                </span>
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStepSleep(-0.5)}
                    aria-label="Restar media hora de sueño"
                    className="w-7 h-7 rounded-full bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] flex items-center justify-center hover:border-[#0284C7] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="min-w-[44px] text-center text-[13px] font-semibold text-[#0369A1] dark:text-[#38bdf8] tabular-nums">
                    {todaySleepHours !== null ? `${todaySleepHours} h` : '—'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStepSleep(0.5)}
                    aria-label="Sumar media hora de sueño"
                    className="w-7 h-7 rounded-full bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] flex items-center justify-center hover:border-[#0284C7] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  {SLEEP_QUALITY_OPTIONS.map((q) => {
                    const active = todaySleepQuality === q.id;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => handleSetSleepQuality(q.id)}
                        className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium transition-colors cursor-pointer border ${
                          active
                            ? 'bg-[#0284C7] text-white border-transparent'
                            : 'bg-white/80 dark:bg-[#141920] border-[#ececec] dark:border-[#252e3a] text-[#5c616d] dark:text-[#9aa4b2]'
                        }`}
                      >
                        {q.label}
                      </button>
                    );
                  })}
                </div>

                <label className="inline-flex items-center gap-1 text-[10.5px] text-[#777b86] dark:text-[#9aa4b2]">
                  <span>Meta</span>
                  <select
                    aria-label="Meta de horas de sueño"
                    value={healthState.sleepTargetHours}
                    onChange={(e) => handleSelectTarget(Number(e.target.value))}
                    className="px-1.5 py-0.5 rounded-md bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] text-[10.5px] tabular-nums cursor-pointer"
                  >
                    {[6.5, 7, 7.5, 8, 8.5, 9].map((h) => (
                      <option key={h} value={h}>
                        {h}h
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </article>
        </div>

        {/* Correlation Insight Connecting Health Widgets & Habit Tracking */}
        <div className="rounded-[16px] px-4 py-3 bg-[#fafafb] dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] flex items-start sm:items-center gap-2.5 text-[13px] text-[#5c616d] dark:text-[#cbd5e1]">
          <Sparkles className="w-4 h-4 text-[#059669] dark:text-[#34d399] shrink-0 mt-0.5 sm:mt-0" />
          <span>{sleepAdherenceInsight}</span>
        </div>
      </div>
    </section>
  );
};
