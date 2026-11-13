import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import { Category, DayOfWeek, Habit } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  habitToEdit?: Habit | null;
  onSave: (habitData: {
    title: string;
    categoryId: number;
    targetValue: number;
    unitLabel: string;
    scheduledDays: DayOfWeek[];
    reminderTime?: string;
    notes?: string;
    isActive: boolean;
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
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [targetValue, setTargetValue] = useState(1);
  const [unitLabel, setUnitLabel] = useState('vez');
  const [scheduledDays, setScheduledDays] = useState<DayOfWeek[]>([1, 2, 3, 4, 5, 6, 7]);
  const [reminderTime, setReminderTime] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (habitToEdit) {
      setTitle(habitToEdit.title);
      setCategoryId(habitToEdit.categoryId);
      setTargetValue(habitToEdit.targetValue);
      setUnitLabel(habitToEdit.unitLabel);
      setScheduledDays(habitToEdit.scheduledDays);
      setReminderTime(habitToEdit.reminderTime || '');
      setNotes(habitToEdit.notes || '');
    } else {
      setTitle('');
      setCategoryId(categories[0]?.id || 1);
      setTargetValue(1);
      setUnitLabel('vez');
      setScheduledDays([1, 2, 3, 4, 5, 6, 7]);
      setReminderTime('');
      setNotes('');
    }
    setErrors({});
  }, [habitToEdit, isOpen, categories]);

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
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#111827] border border-white/10 shadow-2xl p-6 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <h2 className="text-lg font-bold text-white">
            {habitToEdit ? 'Editar Hábito' : 'Crear Nuevo Hábito'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Título del Hábito *
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
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all"
            />
            <div className="flex items-center justify-between mt-1 text-[11px]">
              {errors.title ? (
                <span className="text-red-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {errors.title}
                </span>
              ) : (
                <span className="text-slate-500">Sé específico y conciso.</span>
              )}
              <span className="text-slate-500 tabular-nums">{title.length}/60</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
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
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1E293B] border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30'
                        : 'bg-[#090D16] border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.colorHex}25`, color: cat.colorHex }}
                    >
                      <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate font-medium">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Value & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Meta diaria *
              </label>
              <input
                type="number"
                min="1"
                max="9999"
                value={targetValue}
                onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 tabular-nums"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                1 para hábitos de un solo clic
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Unidad de medida
              </label>
              <input
                type="text"
                maxLength={20}
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                placeholder="vez, vasos, min, páginas..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Ej: vasos, min, km</span>
            </div>
          </div>

          {/* Frequency Days */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Días programados *
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPresetDays('all')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Todos
                </button>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={() => setPresetDays('weekdays')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  L-V
                </button>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={() => setPresetDays('weekend')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
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
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      active
                        ? 'bg-[#10B981] border-[#34D399] text-[#003824] shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-[#090D16] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                    title={full}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {errors.days && (
              <span className="text-red-400 text-[11px] flex items-center gap-1 font-medium mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.days}
              </span>
            )}
          </div>

          {/* Reminder Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Hora de recordatorio (Opcional)
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Notas / Propósito
              </label>
              <input
                type="text"
                maxLength={80}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Para mantener energía en la tarde"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-[#27354A] border border-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#003824] text-xs font-bold transition-all shadow-[0_0_16px_rgba(16,185,129,0.35)] cursor-pointer"
            >
              {habitToEdit ? 'Guardar Cambios' : 'Crear Hábito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
