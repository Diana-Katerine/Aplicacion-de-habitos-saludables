import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Check,
  Plus,
  Headphones,
  Flame,
} from 'lucide-react';
import { HabitWithTodayLog } from '../../types';
import {
  ambientAudio,
  SOUNDSCAPE_OPTIONS,
  SoundscapePreset,
} from '../../services/ambientAudio';
import { CategoryIcon } from '../common/CategoryIcon';
import { RitualNotesMarkdown } from '../habits/RitualNotesEditor';
import { getCategoryBioluminescentTheme } from '../../services/bioluminescentTheme';

interface Props {
  habit: HabitWithTodayLog | null;
  onClose: () => void;
  onCheckIn: (habitId: string, completedValueChange?: number, forceCompleted?: boolean) => void;
}

const DURATION_PRESETS_MIN = [15, 25, 45];

export function isDeepWorkHabit(habit: HabitWithTodayLog): boolean {
  if (!habit.isActive) return false;
  if ([3, 5, 6, 7].includes(habit.categoryId)) return true;

  const catName = habit.category.name.toLowerCase();
  if (/mente|foco|aprendizaje|productividad|calma|estudio|lectura/.test(catName)) {
    return true;
  }

  const titleAndNotes = `${habit.title} ${habit.notes || ''}`.toLowerCase();
  if (
    /meditac|leer|lectura|estudi|enfoque|focus|deep|profund|planific|escrib|program|diseñ|respir|journal|diario/.test(
      titleAndNotes
    )
  ) {
    return true;
  }

  const unit = habit.unitLabel.toLowerCase();
  return /min|hora|pág|sesión/.test(unit);
}

function getDefaultDurationSeconds(habit: HabitWithTodayLog): number {
  const unit = habit.unitLabel.toLowerCase();
  if (/min/.test(unit) && habit.targetValue >= 5 && habit.targetValue <= 90) {
    return habit.targetValue * 60;
  }
  return 25 * 60;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const AmbientFocusOverlay: React.FC<Props> = ({
  habit,
  onClose,
  onCheckIn,
}) => {
  const [preset, setPreset] = useState<SoundscapePreset>('rain');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [volume, setVolume] = useState(0.35);

  const [durationSeconds, setDurationSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    if (!habit) {
      ambientAudio.stop();
      return;
    }

    const initialDuration = getDefaultDurationSeconds(habit);
    setDurationSeconds(initialDuration);
    setRemainingSeconds(initialDuration);
    setIsTimerRunning(true);
    setIsAudioEnabled(true);
    ambientAudio.start(preset, volume);

    return () => {
      ambientAudio.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit?.id]);

  useEffect(() => {
    if (!habit || !isTimerRunning) return;
    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [habit, isTimerRunning]);

  useEffect(() => {
    if (!habit) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [habit, onClose]);

  const progressRatio = useMemo(() => {
    if (durationSeconds <= 0) return 0;
    return Math.min(100, Math.round(((durationSeconds - remainingSeconds) / durationSeconds) * 100));
  }, [durationSeconds, remainingSeconds]);

  if (!habit) return null;

  const isCompleted = habit.todayLog?.isCompleted ?? false;
  const completedValue = habit.todayLog?.completedValue ?? 0;
  const isCumulative = habit.targetValue > 1;

  const handleSelectPreset = (nextPreset: SoundscapePreset) => {
    setPreset(nextPreset);
    if (isAudioEnabled) {
      ambientAudio.setPreset(nextPreset);
    } else {
      setIsAudioEnabled(true);
      ambientAudio.start(nextPreset, volume);
    }
  };

  const handleToggleAudio = () => {
    if (isAudioEnabled) {
      setIsAudioEnabled(false);
      ambientAudio.stop();
    } else {
      setIsAudioEnabled(true);
      ambientAudio.start(preset, volume);
    }
  };

  const handleVolumeChange = (nextPct: number) => {
    const normalized = Math.max(0, Math.min(1, nextPct / 100));
    setVolume(normalized);
    if (normalized === 0 && isAudioEnabled) {
      setIsAudioEnabled(false);
      ambientAudio.stop();
    } else if (normalized > 0 && !isAudioEnabled) {
      setIsAudioEnabled(true);
      ambientAudio.start(preset, normalized);
    } else {
      ambientAudio.setVolume(normalized);
    }
  };

  const handleSelectDuration = (minutes: number) => {
    const secs = minutes * 60;
    setDurationSeconds(secs);
    setRemainingSeconds(secs);
    setIsTimerRunning(true);
  };

  const handleResetTimer = () => {
    setRemainingSeconds(durationSeconds);
    setIsTimerRunning(false);
  };

  const handleCompleteNow = () => {
    onCheckIn(habit.id, undefined, true);
  };

  const activePresetMeta = SOUNDSCAPE_OPTIONS.find((opt) => opt.id === preset);
  const bioTheme = getCategoryBioluminescentTheme(habit.category);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Enfoque ambiental para ${habit.title}`}
      className="fixed inset-0 z-50 bg-[#17191c]/55 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div
        style={{
          ...bioTheme.cssVars,
          backgroundImage: `radial-gradient(ellipse at top center, rgba(${bioTheme.rgb}, 0.08), transparent 55%)`,
        }}
        className="w-full max-w-xl steep-modal p-6 sm:p-9 my-auto space-y-6"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#ececec]">
          <div className="flex items-center gap-2.5 min-w-0 text-[13px]">
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `rgba(${bioTheme.rgb}, 0.1)`,
                borderColor: `rgba(${bioTheme.rgb}, 0.25)`,
                color: bioTheme.glowHex,
              }}
            >
              <CategoryIcon name={habit.category.iconName} className="w-4 h-4" />
            </div>
            <span className="truncate" style={{ color: bioTheme.glowHex }}>
              {habit.category.name}
            </span>
            <span aria-hidden="true" className="text-[#a3a6af]">·</span>
            <span className="text-[#777b86] whitespace-nowrap shrink-0">
              Enfoque ambiental
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full text-[13px] text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Salir</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Habit Title & Streak Context */}
        <div className="text-center space-y-2">
          <h2 className="font-signifier font-normal text-[30px] sm:text-[36px] leading-[1.2] tracking-[-0.015em] text-[#17191c] text-balance">
            {habit.title}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-[#777b86]">
            <span className="tabular-nums">
              Meta:{' '}
              <strong className="text-[#17191c] font-medium">
                {isCumulative ? `${completedValue}/${habit.targetValue}` : habit.targetValue}{' '}
                {habit.unitLabel}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-[#5d2a1a] tabular-nums">
              <Flame className="w-3.5 h-3.5" />
              Racha de {habit.currentStreak} días
            </span>
          </div>
        </div>

        {/* Focus Timer Block */}
        <div className="py-6 border-y border-[#ececec] flex flex-col items-center space-y-4">
          <div className="text-[52px] sm:text-[64px] leading-none font-mono font-normal text-[#17191c] tracking-tight tabular-nums">
            {formatClock(remainingSeconds)}
          </div>

          <div className="w-full max-w-sm h-1.5 rounded-full bg-[#f2f2f3] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressRatio}%`,
                backgroundColor: bioTheme.glowHex,
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setIsTimerRunning((prev) => !prev)}
              className="px-5 py-2.5 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[13px] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isTimerRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar sesión</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Reanudar sesión</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetTimer}
              title="Reiniciar temporizador"
              className="px-4 py-2.5 rounded-full bg-white hover:bg-[#fafafb] border border-[#17191c]/25 text-[13px] text-[#17191c] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>

            <div className="flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3]">
              {DURATION_PRESETS_MIN.map((mins) => {
                const isSelected = durationSeconds === mins * 60;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSelectDuration(mins)}
                    className={`px-3 py-1 rounded-full text-[12px] tabular-nums transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-white text-[#17191c] font-medium shadow-xs'
                        : 'text-[#777b86] hover:text-[#17191c]'
                    }`}
                  >
                    {mins}m
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Generative Soundscape Controls */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[13px]">
              <Headphones className="w-4 h-4 text-[#17191c] shrink-0" />
              <span className="font-medium text-[#17191c]">Paisaje sonoro generativo</span>
              <span aria-hidden="true" className="text-[#a3a6af]">·</span>
              <span className="text-[#777b86]">
                {isAudioEnabled ? activePresetMeta?.description : 'Audio en pausa'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleAudio}
              className="px-3.5 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e5e7] text-[12px] text-[#17191c] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
            >
              {isAudioEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Silenciar</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[#777b86]" />
                  <span>Activar audio</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] overflow-x-auto">
              {SOUNDSCAPE_OPTIONS.map((opt) => {
                const active = preset === opt.id && isAudioEnabled;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectPreset(opt.id)}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white text-[#17191c] font-medium shadow-xs'
                        : 'text-[#777b86] hover:text-[#17191c]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Volume2 className="w-3.5 h-3.5 text-[#777b86] shrink-0" />
              <input
                type="range"
                min={0}
                max={100}
                value={isAudioEnabled ? Math.round(volume * 100) : 0}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                aria-label="Volumen del paisaje sonoro"
                className="w-24 accent-[#17191c] cursor-pointer"
              />
              <span className="text-[12px] font-mono text-[#777b86] tabular-nums w-8 text-right">
                {isAudioEnabled ? `${Math.round(volume * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Ritual Notes Reference */}
        {habit.notes && (
          <div className="pt-4 border-t border-[#ececec] space-y-1.5 max-h-36 overflow-y-auto">
            <span className="text-[12px] text-[#979799] block">
              Notas del ritual
            </span>
            <RitualNotesMarkdown content={habit.notes} compact />
          </div>
        )}

        {/* Completion Actions */}
        <div className="pt-4 border-t border-[#ececec] flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12px] text-[#979799]">
            Presiona <kbd className="px-1.5 py-0.5 rounded bg-[#f2f2f3] text-[11px] text-[#17191c] font-mono">Esc</kbd> para salir
          </span>

          <div className="flex items-center gap-2.5 ml-auto">
            {isCumulative && !isCompleted && (
              <button
                type="button"
                onClick={() => onCheckIn(habit.id, 1)}
                className="px-4 py-2 rounded-full bg-white hover:bg-[#fafafb] border border-[#17191c]/25 text-[13px] text-[#17191c] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+1 {habit.unitLabel}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCompleteNow}
              disabled={isCompleted}
              className={`px-5 py-2.5 rounded-full text-[13px] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                isCompleted
                  ? 'bg-[#f2f2f3] text-[#777b86] cursor-default'
                  : 'bg-[#17191c] hover:bg-[#2a2d32] text-white cursor-pointer'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isCompleted ? 'Completado hoy' : 'Completar hábito'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
