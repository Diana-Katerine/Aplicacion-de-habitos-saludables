import React, { useState, useEffect } from 'react';
import { X, AlertCircle, BatteryCharging, Check } from 'lucide-react';
import {
  Category,
  DayOfWeek,
  EnergyLevel,
  Habit,
  HabitLog,
  MoodTag,
} from '../../types';
import { ENERGY_OPTIONS, MOOD_OPTIONS } from '../../services/journaling';
import { CategoryIcon } from '../common/CategoryIcon';
import { RitualNotesEditor } from './RitualNotesEditor';
import { ActionHint } from '../common/ActionHint';

export interface JournalSavePayload {
  energyLevel?: EnergyLevel;
  moodTag?: MoodTag;
  journalEntry?: string;
  appendToRitualNotes?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  habitToEdit?: Habit | null;
  mode?: 'habit' | 'journal';
  journalHabit?: Habit | null;
  journalLog?: HabitLog | null;
  onSaveJournal?: (habitId: string, payload: JournalSavePayload) => void;
  onSave: (habitData: {
    title: string;
    categoryId: number;
    targetValue: number;
    unitLabel: string;
    scheduledDays: DayOfWeek[];
    reminderTime?: string;
    notes?: string;
    isActive: boolean;
    contextualJournalingEnabled: boolean;
    todayContext?: JournalSavePayload;
  }) => void;
}

const DAYS_META: { day: DayOfWeek; label: string; full: string }[] = [
  { day: 1, label: 'L', full: 'Lunes' },
  { day: 2, label: 'M', full: 'Martes' },
  { day: 3, label: 'X', full: 'Miércoles' },
  { day: 4, label: 'J', full: 'Jueves' },
  { day: 5, label: 'V', full: 'Viernes' },
  { day: 6, label: 'S', full: 'Sábado' },
  { day: 7, label: 'D', full: 'Domingo' },
];

export const HabitModal: React.FC<Props> = ({
  isOpen,
  onClose,
  categories,
  habitToEdit,
  mode = 'habit',
  journalHabit,
  journalLog,
  onSaveJournal,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [targetValue, setTargetValue] = useState(1);
  const [unitLabel, setUnitLabel] = useState('vez');
  const [scheduledDays, setScheduledDays] = useState<DayOfWeek[]>([1, 2, 3, 4, 5, 6, 7]);
  const [reminderTime, setReminderTime] = useState('');
  const [notes, setNotes] = useState('');
  const [contextualJournalingEnabled, setContextualJournalingEnabled] = useState(true);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | undefined>(undefined);
  const [moodTag, setMoodTag] = useState<MoodTag | undefined>(undefined);
  const [journalEntry, setJournalEntry] = useState('');
  const [appendToRitualNotes, setAppendToRitualNotes] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === 'journal') {
      setEnergyLevel(journalLog?.energyLevel);
      setMoodTag(journalLog?.moodTag);
      setJournalEntry(journalLog?.journalEntry || '');
      setAppendToRitualNotes(false);
      setErrors({});
      return;
    }

    if (habitToEdit) {
      setTitle(habitToEdit.title);
      setCategoryId(habitToEdit.categoryId);
      setTargetValue(habitToEdit.targetValue);
      setUnitLabel(habitToEdit.unitLabel);
      setScheduledDays(habitToEdit.scheduledDays);
      setReminderTime(habitToEdit.reminderTime || '');
      setNotes(habitToEdit.notes || '');
      setContextualJournalingEnabled(habitToEdit.contextualJournalingEnabled !== false);
      setEnergyLevel(journalLog?.energyLevel);
      setMoodTag(journalLog?.moodTag);
      setJournalEntry(journalLog?.journalEntry || '');
    } else {
      setTitle('');
      setCategoryId(categories[0]?.id || 1);
      setTargetValue(1);
      setUnitLabel('vez');
      setScheduledDays([1, 2, 3, 4, 5, 6, 7]);
      setReminderTime('');
      setNotes('');
      setContextualJournalingEnabled(true);
      setEnergyLevel(undefined);
      setMoodTag(undefined);
      setJournalEntry('');
    }
    setErrors({});
  }, [habitToEdit, journalHabit, journalLog, mode, isOpen, categories]);

  if (!isOpen) return null;

  const toggleDay = (day: DayOfWeek) => {
    if (scheduledDays.includes(day)) {
      if (scheduledDays.length === 1) {
        setErrors((prev) => ({ ...prev, days: 'Debes seleccionar al menos 1 día de la semana.' }));
        return;
      }
      setScheduledDays(scheduledDays.filter((d) => d !== day));
    } else {
      setScheduledDays([...scheduledDays, day].sort());
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.days;
        return copy;
      });
    }
  };

  const setPresetDays = (preset: 'all' | 'weekdays' | 'weekend') => {
    if (preset === 'all') setScheduledDays([1, 2, 3, 4, 5, 6, 7]);
    if (preset === 'weekdays') setScheduledDays([1, 2, 3, 4, 5]);
    if (preset === 'weekend') setScheduledDays([6, 7]);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.days;
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'El título del hábito es obligatorio.';
    } else if (title.trim().length > 60) {
      newErrors.title = 'El título no puede exceder los 60 caracteres.';
    }

    if (targetValue <= 0) {
      newErrors.targetValue = 'La meta debe ser un número mayor a 0.';
    }

    if (scheduledDays.length === 0) {
      newErrors.days = 'Selecciona al menos 1 día de frecuencia.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      title: title.trim(),
      categoryId,
      targetValue,
      unitLabel: unitLabel.trim() || 'vez',
      scheduledDays,
      reminderTime: reminderTime.trim() || undefined,
      notes: notes.trim() || undefined,
      isActive: habitToEdit ? habitToEdit.isActive : true,
      contextualJournalingEnabled,
      todayContext:
        habitToEdit && journalLog?.isCompleted && (energyLevel || moodTag || journalEntry.trim())
          ? {
              energyLevel,
              moodTag,
              journalEntry: journalEntry.trim() || undefined,
            }
          : undefined,
    });
    onClose();
  };

  const handleJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalHabit) return;

    if (!energyLevel && !moodTag && !journalEntry.trim()) {
      setErrors({
        journal: 'Selecciona al menos tu nivel de energía o estado de ánimo (o presiona Omitir).',
      });
      return;
    }

    onSaveJournal?.(journalHabit.id, {
      energyLevel,
      moodTag,
      journalEntry: journalEntry.trim() || undefined,
      appendToRitualNotes,
    });
    onClose();
  };

  if (mode === 'journal' && journalHabit) {
    const habitCategory = categories.find((c) => c.id === journalHabit.categoryId);
    return (
      <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-5 bg-[#17191c]/35 dark:bg-[#050709]/75 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] overflow-y-auto overscroll-contain steep-modal p-5 sm:p-8 my-auto">
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#ececec] dark:border-[#252e3a]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[12px] sm:text-[13px] text-[#979799] dark:text-[#6f7a8a]">
                <BatteryCharging className="w-4 h-4 text-[#17191c] dark:text-[#34d399] shrink-0" />
                <span>Diario contextual al completar</span>
                {habitCategory && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span style={{ color: habitCategory.colorHex }}>{habitCategory.name}</span>
                  </>
                )}
              </div>
              <h2 className="font-signifier font-normal text-[24px] sm:text-[28px] leading-[1.2] text-[#17191c] dark:text-[#f1f5f9] mt-1 break-words">
                {journalHabit.title}
              </h2>
            </div>
            <ActionHint
              message="Cerrará el diario contextual sin guardar"
              tone="neutral"
              position="bottom"
              align="right"
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="w-11 h-11 rounded-full border border-[#ececec] dark:border-[#252e3a] bg-[#fafafb] dark:bg-[#1b222b] text-[#5c616d] dark:text-[#9aa4b2] hover:text-[#b91c1c] dark:hover:text-[#fca5a5] hover:bg-[#fee2e2]/60 dark:hover:bg-[#7f1d1d]/30 hover:border-[#ef4444]/40 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </ActionHint>
          </div>

          <form onSubmit={handleJournalSubmit} className="mt-5 space-y-5">
            {/* Energy Level 1-5 */}
            <div>
              <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-2">
                Nivel de energía (1–5)
              </label>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {ENERGY_OPTIONS.map((opt) => {
                  const selected = energyLevel === opt.level;
                  const energyColor =
                    opt.level >= 4
                      ? 'bg-[#059669] border-[#059669] text-white'
                      : opt.level === 3
                      ? 'bg-[#0369A1] border-[#0369A1] text-white'
                      : 'bg-[#B45309] border-[#B45309] text-white';
                  return (
                    <button
                      key={opt.level}
                      type="button"
                      onClick={() => {
                        setEnergyLevel(opt.level);
                        setErrors({});
                      }}
                      className={`py-2 sm:py-2.5 px-1 min-w-0 rounded-[14px] sm:rounded-[16px] border text-center transition-colors cursor-pointer ${
                        selected
                          ? energyColor
                          : 'bg-white dark:bg-[#1b222b] border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] hover:bg-[#fafafb] dark:hover:bg-[#252e3a]'
                      }`}
                    >
                      <span className="text-[16px] sm:text-[17px] font-medium tabular-nums block">
                        {opt.level}
                      </span>
                      <span
                        className={`text-[10px] sm:text-[11px] block mt-0.5 truncate ${
                          selected ? 'text-white/90' : 'text-[#777b86] dark:text-[#9aa4b2]'
                        }`}
                      >
                        {opt.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mood Tag */}
            <div>
              <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-2">
                Estado de ánimo
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MOOD_OPTIONS.map((opt) => {
                  const selected = moodTag === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setMoodTag(opt.id);
                        setErrors({});
                      }}
                      className={`min-w-0 px-3 py-2 sm:py-2.5 rounded-full border text-left transition-colors cursor-pointer flex items-center gap-2 ${
                        selected
                          ? 'text-[#17191c] dark:text-[#f1f5f9] font-medium'
                          : 'bg-white dark:bg-[#1b222b] border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] hover:bg-[#fafafb] dark:hover:bg-[#252e3a]'
                      }`}
                      style={
                        selected
                          ? { backgroundColor: `${opt.colorHex}1A`, borderColor: opt.colorHex }
                          : undefined
                      }
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: opt.colorHex }}
                      />
                      <span className="text-[13px] truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Note */}
            <div>
              <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-1.5">
                Nota o aprendizaje breve (opcional)
              </label>
              <textarea
                rows={2}
                maxLength={240}
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="Ej: Completarlo antes del mediodía mantuvo mi enfoque alto."
                className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[14px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399] resize-none"
              />
              {journalEntry.trim().length > 0 && (
                <label className="mt-2.5 inline-flex items-center gap-2 text-[13px] text-[#777b86] dark:text-[#9aa4b2] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appendToRitualNotes}
                    onChange={(e) => setAppendToRitualNotes(e.target.checked)}
                    className="rounded border-[#d4d4d8] dark:border-[#3b4758] accent-[#059669]"
                  />
                  <span>Guardar también en las Notas del Ritual Diario de este hábito</span>
                </label>
              )}
            </div>

            {errors.journal && (
              <p className="text-[13px] text-[#5d2a1a] dark:text-[#fbdac7] bg-[#fbe1d1] dark:bg-[#241814] border border-transparent dark:border-[#4a2d20] px-3.5 py-2 rounded-[12px] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.journal}</span>
              </p>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-[#ececec] dark:border-[#252e3a]">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-transparent hover:bg-[#fafafb] dark:hover:bg-[#1b222b] border border-[#17191c]/25 dark:border-[#3b4758] text-[14px] text-center text-[#17191c] dark:text-[#f1f5f9] transition-colors cursor-pointer"
              >
                Omitir
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[14px] font-medium transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar registro</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-5 bg-[#17191c]/35 dark:bg-[#050709]/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] overflow-y-auto overscroll-contain steep-modal p-5 sm:p-8 my-auto">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#ececec] dark:border-[#252e3a]">
          <h2 className="font-signifier font-normal text-[24px] sm:text-[28px] leading-[1.2] text-[#17191c] dark:text-[#f1f5f9] min-w-0">
            {habitToEdit ? 'Editar hábito' : 'Crear nuevo hábito'}
          </h2>
          <ActionHint
            message="Cerrará el formulario sin guardar los cambios"
            tone="neutral"
            position="bottom"
            align="right"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="w-11 h-11 rounded-full border border-[#ececec] dark:border-[#252e3a] bg-[#fafafb] dark:bg-[#1b222b] text-[#5c616d] dark:text-[#9aa4b2] hover:text-[#b91c1c] dark:hover:text-[#fca5a5] hover:bg-[#fee2e2]/60 dark:hover:bg-[#7f1d1d]/30 hover:border-[#ef4444]/40 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>
          </ActionHint>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-1.5">
              Título del hábito *
            </label>
            <input
              type="text"
              value={title}
              maxLength={60}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.title;
                    return copy;
                  });
                }
              }}
              placeholder="Ej: Tomar 8 vasos de agua, Meditar, Correr..."
              className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[15px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399] transition-colors"
            />
            {(errors.title || title.length > 0) && (
              <div className="flex items-center justify-between mt-1.5 text-[12px]">
                {errors.title ? (
                  <span className="text-[#b91c1c] dark:text-[#fca5a5] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.title}
                  </span>
                ) : (
                  <span />
                )}
                <span className="text-[#979799] dark:text-[#6f7a8a] tabular-nums">{title.length}/60</span>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-1.5">
              Categoría
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`min-w-0 flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-[14px] border text-left text-[13px] transition-colors cursor-pointer ${
                      isSelected
                        ? 'text-[#17191c] dark:text-[#f1f5f9] font-medium'
                        : 'bg-white dark:bg-[#1b222b] border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] hover:bg-[#fafafb] dark:hover:bg-[#252e3a]'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${cat.colorHex}18`,
                            borderColor: cat.colorHex,
                            boxShadow: `0 0 0 1px ${cat.colorHex}`,
                          }
                        : undefined
                    }
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat.colorHex}22`,
                        color: cat.colorHex,
                      }}
                    >
                      <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Value & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-1.5">
                Meta diaria *
              </label>
              <input
                type="number"
                min="1"
                max="9999"
                value={targetValue}
                onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] text-[15px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-1.5">
                Unidad
              </label>
              <input
                type="text"
                maxLength={20}
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                placeholder="vez, vasos, min, km..."
                className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[15px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399]"
              />
            </div>
          </div>

          {/* Frequency Days */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
                Días programados *
              </label>
              <div className="flex items-center gap-2 text-[12px]" translate="no">
                <button
                  type="button"
                  translate="no"
                  onClick={() => setPresetDays('all')}
                  className="notranslate text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] transition-colors cursor-pointer"
                >
                  Todos
                </button>
                <span className="text-[#a3a6af] dark:text-[#6f7a8a]" aria-hidden="true">·</span>
                <button
                  type="button"
                  translate="no"
                  onClick={() => setPresetDays('weekdays')}
                  title="Lunes a Viernes"
                  aria-label="Lunes a Viernes"
                  className="notranslate text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] transition-colors cursor-pointer"
                >
                  L-V
                </button>
                <span className="text-[#a3a6af] dark:text-[#6f7a8a]" aria-hidden="true">·</span>
                <button
                  type="button"
                  translate="no"
                  onClick={() => setPresetDays('weekend')}
                  title="Sábado y Domingo"
                  aria-label="Sábado y Domingo"
                  className="notranslate text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] transition-colors cursor-pointer"
                >
                  S-D
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5" translate="no">
              {DAYS_META.map(({ day, label, full }) => {
                const active = scheduledDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    translate="no"
                    onClick={() => toggleDay(day)}
                    className={`notranslate min-w-0 px-0 py-2 rounded-full text-[12px] sm:text-[13px] font-medium border transition-colors cursor-pointer text-center overflow-hidden select-none ${
                      active
                        ? 'bg-[#059669] border-[#059669] text-white'
                        : 'bg-white dark:bg-[#1b222b] border-[#ececec] dark:border-[#252e3a] text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] hover:border-[#059669]/40'
                    }`}
                    title={full}
                    aria-label={full}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {errors.days && (
              <span className="text-[#b91c1c] dark:text-[#fca5a5] text-[12px] flex items-center gap-1 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.days}
              </span>
            )}
          </div>

          {/* Reminder Time & Contextual Journaling Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div className="space-y-1.5">
              <label htmlFor="habit-reminder-time" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Hora de recordatorio (notificación)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="habit-reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg glass-input text-sm font-medium focus:ring-2 focus:ring-[#52796F] focus:outline-none dark:[color-scheme:dark]"
                />
                {reminderTime && (
                  <button
                    type="button"
                    onClick={() => setReminderTime('')}
                    title="Quitar hora de recordatorio"
                    className="min-h-[44px] px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Borrar
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Horas frecuentes:
                <button
                  type="button"
                  onClick={() => setReminderTime('07:30')}
                  className="ml-1 text-[#52796F] dark:text-[#84A98C] hover:underline font-medium"
                >
                  07:30
                </button>
                ,
                <button
                  type="button"
                  onClick={() => setReminderTime('13:00')}
                  className="ml-1 text-[#52796F] dark:text-[#84A98C] hover:underline font-medium"
                >
                  13:00
                </button>
                ,
                <button
                  type="button"
                  onClick={() => setReminderTime('20:00')}
                  className="ml-1 text-[#52796F] dark:text-[#84A98C] hover:underline font-medium"
                >
                  20:00
                </button>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Diario contextual
              </label>
              <button
                type="button"
                onClick={() => setContextualJournalingEnabled((prev) => !prev)}
                className={`w-full min-h-[44px] px-4 py-2.5 rounded-lg border text-left text-sm flex items-center justify-between transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] ${
                  contextualJournalingEnabled
                    ? 'bg-[#D8F3DC] dark:bg-[#22332A] border-[#84A98C] text-[#344E41] dark:text-[#D8F3DC] font-semibold'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Energía y ánimo al completar</span>
                <span className="font-semibold">
                  {contextualJournalingEnabled ? 'Activo' : 'Inactivo'}
                </span>
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Permite registrar sensaciones al marcar el hábito.
              </p>
            </div>
          </div>

          {/* Inline Today Context when editing an already completed habit */}
          {habitToEdit && journalLog?.isCompleted && (
            <div className="pt-4 border-t border-[#ececec] dark:border-[#252e3a] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
                  Registro contextual de hoy
                </span>
                <span className="text-[12px] text-[#52796F] dark:text-[#84A98C] font-medium">Completado hoy</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {ENERGY_OPTIONS.map((opt) => {
                  const selected = energyLevel === opt.level;
                  return (
                    <button
                      key={opt.level}
                      type="button"
                      onClick={() => setEnergyLevel(opt.level)}
                      className={`py-1.5 rounded-full border text-[12px] font-medium tabular-nums transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#52796F] border-[#344E41] text-white font-bold'
                          : 'bg-white dark:bg-[#1b222b] border-[#ececec] dark:border-[#252e3a] text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
                      }`}
                      title={`Energía ${opt.level}/5 (${opt.shortLabel})`}
                    >
                      E:{opt.level}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MOOD_OPTIONS.map((opt) => {
                  const selected = moodTag === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMoodTag(opt.id)}
                      className={`px-3 py-1 rounded-full border text-[12px] transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#52796F] text-white border-[#344E41] font-medium'
                          : 'bg-white dark:bg-[#1b222b] border-[#ececec] dark:border-[#252e3a] text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily Ritual Notes (Markdown Editor) */}
          <div>
            <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-1.5">
              Notas del ritual diario
            </label>
            <RitualNotesEditor value={notes} onChange={setNotes} maxLength={2000} />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-[#ececec] dark:border-[#252e3a]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-transparent hover:bg-[#fafafb] dark:hover:bg-[#1b222b] border border-[#17191c]/25 dark:border-[#3b4758] text-[14px] text-center text-[#17191c] dark:text-[#f1f5f9] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#52796F] hover:bg-[#344E41] text-white text-[14px] font-medium text-center transition-colors cursor-pointer"
            >
              {habitToEdit ? 'Guardar cambios' : 'Crear hábito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
