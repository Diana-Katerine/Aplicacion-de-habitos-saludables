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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17191c]/35 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto steep-modal p-6 sm:p-8 my-4">
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#ececec]">
            <div>
              <div className="flex items-center gap-2 text-[13px] text-[#979799]">
                <BatteryCharging className="w-4 h-4 text-[#17191c] shrink-0" />
                <span>Diario contextual al completar</span>
                {habitCategory && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span style={{ color: habitCategory.colorHex }}>{habitCategory.name}</span>
                  </>
                )}
              </div>
              <h2 className="font-signifier font-normal text-[28px] leading-[1.2] text-[#17191c] mt-1">
                {journalHabit.title}
              </h2>
              <p className="text-[14px] text-[#777b86] mt-0.5">
                Registra tu energía y ánimo para descubrir correlaciones en Estadísticas.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleJournalSubmit} className="mt-5 space-y-5">
            {/* Energy Level 1-5 */}
            <div>
              <label className="block text-[13px] text-[#777b86] mb-2">
                Nivel de energía (1–5)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ENERGY_OPTIONS.map((opt) => {
                  const selected = energyLevel === opt.level;
                  return (
                    <button
                      key={opt.level}
                      type="button"
                      onClick={() => {
                        setEnergyLevel(opt.level);
                        setErrors({});
                      }}
                      className={`py-2.5 px-1.5 rounded-[16px] border text-center transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#17191c] border-[#17191c] text-white'
                          : 'bg-white border-[#ececec] text-[#17191c] hover:bg-[#fafafb]'
                      }`}
                    >
                      <span className="text-[17px] font-medium tabular-nums block">
                        {opt.level}
                      </span>
                      <span
                        className={`text-[11px] block mt-0.5 ${
                          selected ? 'text-white/75' : 'text-[#777b86]'
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
              <label className="block text-[13px] text-[#777b86] mb-2">
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
                      className={`px-3.5 py-2.5 rounded-full border text-left transition-colors cursor-pointer flex items-center gap-2 ${
                        selected
                          ? 'bg-[#17191c] text-white border-[#17191c]'
                          : 'bg-white border-[#ececec] text-[#17191c] hover:bg-[#fafafb]'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: selected ? '#ffffff' : opt.colorHex }}
                      />
                      <span className="text-[13px] truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Note */}
            <div>
              <label className="block text-[13px] text-[#777b86] mb-1.5">
                Nota o aprendizaje breve (opcional)
              </label>
              <textarea
                rows={2}
                maxLength={240}
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="Ej: Completarlo antes del mediodía mantuvo mi enfoque alto."
                className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] placeholder-[#a3a6af] text-[14px] focus:outline-none focus:border-[#17191c] resize-none"
              />
              {journalEntry.trim().length > 0 && (
                <label className="mt-2.5 inline-flex items-center gap-2 text-[13px] text-[#777b86] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appendToRitualNotes}
                    onChange={(e) => setAppendToRitualNotes(e.target.checked)}
                    className="rounded border-[#d4d4d8] accent-[#17191c]"
                  />
                  <span>Guardar también en las Notas del Ritual Diario de este hábito</span>
                </label>
              )}
            </div>

            {errors.journal && (
              <p className="text-[13px] text-[#5d2a1a] bg-[#fbe1d1] px-3.5 py-2 rounded-[12px] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.journal}</span>
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ececec]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-transparent hover:bg-[#fafafb] border border-[#17191c]/25 text-[14px] text-[#17191c] transition-colors cursor-pointer"
              >
                Omitir
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[14px] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17191c]/35 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto steep-modal p-6 sm:p-8 my-4">
        <div className="flex items-center justify-between pb-4 border-b border-[#ececec]">
          <h2 className="font-signifier font-normal text-[28px] leading-[1.2] text-[#17191c]">
            {habitToEdit ? 'Editar hábito' : 'Crear nuevo hábito'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[13px] text-[#777b86] mb-1.5">
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
              className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] placeholder-[#a3a6af] text-[15px] focus:outline-none focus:border-[#17191c] transition-colors"
            />
            <div className="flex items-center justify-between mt-1.5 text-[12px]">
              {errors.title ? (
                <span className="text-[#b91c1c] flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.title}
                </span>
              ) : (
                <span className="text-[#979799]">Sé específico y conciso.</span>
              )}
              <span className="text-[#979799] tabular-nums">{title.length}/60</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[13px] text-[#777b86] mb-1.5">
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-[14px] border text-left text-[13px] transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#17191c] border-[#17191c] text-white'
                        : 'bg-white border-[#ececec] text-[#17191c] hover:bg-[#fafafb]'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.14)' : `${cat.colorHex}18`,
                        color: isSelected ? '#ffffff' : cat.colorHex,
                      }}
                    >
                      <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Value & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] text-[#777b86] mb-1.5">
                Meta diaria *
              </label>
              <input
                type="number"
                min="1"
                max="9999"
                value={targetValue}
                onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] text-[15px] focus:outline-none focus:border-[#17191c] tabular-nums"
              />
              <span className="text-[12px] text-[#979799] mt-1 block">
                1 para hábitos de un solo clic
              </span>
            </div>

            <div>
              <label className="block text-[13px] text-[#777b86] mb-1.5">
                Unidad de medida
              </label>
              <input
                type="text"
                maxLength={20}
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                placeholder="vez, vasos, min, páginas..."
                className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] placeholder-[#a3a6af] text-[15px] focus:outline-none focus:border-[#17191c]"
              />
              <span className="text-[12px] text-[#979799] mt-1 block">Ej: vasos, min, km</span>
            </div>
          </div>

          {/* Frequency Days */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[13px] text-[#777b86]">
                Días programados *
              </label>
              <div className="flex items-center gap-2 text-[12px]">
                <button
                  type="button"
                  onClick={() => setPresetDays('all')}
                  className="text-[#777b86] hover:text-[#17191c] transition-colors cursor-pointer"
                >
                  Todos
                </button>
                <span className="text-[#a3a6af]">·</span>
                <button
                  type="button"
                  onClick={() => setPresetDays('weekdays')}
                  className="text-[#777b86] hover:text-[#17191c] transition-colors cursor-pointer"
                >
                  L-V
                </button>
                <span className="text-[#a3a6af]">·</span>
                <button
                  type="button"
                  onClick={() => setPresetDays('weekend')}
                  className="text-[#777b86] hover:text-[#17191c] transition-colors cursor-pointer"
                >
                  S-D
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-1.5">
              {DAYS_META.map(({ day, label, full }) => {
                const active = scheduledDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`flex-1 py-2 rounded-full text-[13px] font-medium border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#17191c] border-[#17191c] text-white'
                        : 'bg-white border-[#ececec] text-[#777b86] hover:text-[#17191c] hover:border-[#17191c]/30'
                    }`}
                    title={full}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {errors.days && (
              <span className="text-[#b91c1c] text-[12px] flex items-center gap-1 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.days}
              </span>
            )}
          </div>

          {/* Reminder Time & Contextual Journaling Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div>
              <label className="block text-[13px] text-[#777b86] mb-1.5">
                Hora de recordatorio (opcional)
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] text-[14px] focus:outline-none focus:border-[#17191c]"
              />
            </div>

            <div>
              <label className="block text-[13px] text-[#777b86] mb-1.5">
                Diario contextual
              </label>
              <button
                type="button"
                onClick={() => setContextualJournalingEnabled((prev) => !prev)}
                className={`w-full px-4 py-2.5 rounded-[16px] border text-left text-[13px] flex items-center justify-between transition-colors cursor-pointer ${
                  contextualJournalingEnabled
                    ? 'bg-[#f2f2f3] border-[#17191c] text-[#17191c]'
                    : 'bg-white border-[#ececec] text-[#777b86] hover:text-[#17191c]'
                }`}
              >
                <span>Energía y ánimo al completar</span>
                <span className="font-medium">
                  {contextualJournalingEnabled ? 'Activo' : 'Inactivo'}
                </span>
              </button>
            </div>
          </div>

          {/* Inline Today Context when editing an already completed habit */}
          {habitToEdit && journalLog?.isCompleted && (
            <div className="pt-4 border-t border-[#ececec] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#777b86]">
                  Registro contextual de hoy
                </span>
                <span className="text-[12px] text-[#17191c] font-medium">Completado hoy</span>
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
                          ? 'bg-[#17191c] border-[#17191c] text-white'
                          : 'bg-white border-[#ececec] text-[#777b86] hover:text-[#17191c]'
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
                          ? 'bg-[#17191c] text-white border-[#17191c]'
                          : 'bg-white border-[#ececec] text-[#777b86] hover:text-[#17191c]'
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] text-[#777b86]">
                Notas del ritual diario
              </label>
              <span className="text-[12px] text-[#979799]">
                Aprendizajes y contexto tras cada sesión
              </span>
            </div>
            <RitualNotesEditor value={notes} onChange={setNotes} maxLength={2000} />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ececec]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-transparent hover:bg-[#fafafb] border border-[#17191c]/25 text-[14px] text-[#17191c] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[14px] transition-colors cursor-pointer"
            >
              {habitToEdit ? 'Guardar cambios' : 'Crear hábito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
