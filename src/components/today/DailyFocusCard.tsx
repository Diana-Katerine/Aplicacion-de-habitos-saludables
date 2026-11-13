import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Compass, Check, Edit2, X } from 'lucide-react';
import { DailyFocus } from '../../types';

interface Props {
  focus: DailyFocus | null;
  onSaveFocus: (intent: string) => void;
  onToggleComplete: () => void;
  onClearFocus: () => void;
}

const FOCUS_PRESETS = [
  'Trabajo profundo sin distracciones',
  'Presencia y calma en cada tarea',
  'Priorizar mi energía y descanso',
];

export const DailyFocusCard: React.FC<Props> = ({
  focus,
  onSaveFocus,
  onToggleComplete,
  onClearFocus,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setDraft(focus?.intent || '');
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSaveFocus(draft.trim());
    setIsEditing(false);
    setDraft('');
  };

  const handlePresetClick = (preset: string) => {
    onSaveFocus(preset);
    setIsEditing(false);
    setDraft('');
  };

  // Display mode when focus exists and not currently editing
  if (focus && !isEditing) {
    return (
      <motion.section
        aria-label="Enfoque del día"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`rounded-xl p-4 md:p-5 bg-[#0F172A] border transition-all ${
          focus.isCompleted
            ? 'border-emerald-500/35 ring-1 ring-[#10B981]/20'
            : 'border-white/[0.08]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.05 }}
              onClick={onToggleComplete}
              aria-label={focus.isCompleted ? 'Marcar enfoque como pendiente' : 'Marcar enfoque como logrado'}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer ${
                focus.isCompleted
                  ? 'bg-[#10B981] text-[#003824] border border-[#34D399] glow-emerald-node'
                  : 'bg-[#1E293B] text-transparent hover:text-slate-400 border border-white/15 hover:border-emerald-500/40'
              }`}
              title={focus.isCompleted ? 'Marcar como pendiente' : 'Marcar enfoque como logrado'}
            >
              <Check className={`w-4 h-4 stroke-[3] ${focus.isCompleted ? 'text-[#003824]' : ''}`} />
            </motion.button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span>Enfoque del Día</span>
                {focus.isCompleted && (
                  <>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="text-emerald-400">Logrado hoy</span>
                  </>
                )}
              </div>

              <p
                className={`text-base md:text-lg font-bold tracking-tight mt-0.5 break-words transition-colors ${
                  focus.isCompleted
                    ? 'text-slate-300 line-through decoration-emerald-500/50'
                    : 'text-white'
                }`}
              >
                {focus.intent}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleStartEdit}
              className="px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#27354A] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={onClearFocus}
              aria-label="Quitar enfoque del día"
              title="Quitar enfoque del día"
              className="p-1.5 rounded-lg bg-[#1E293B] hover:bg-red-950/50 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-300 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.section>
    );
  }

  // Input / Creation / Edit mode
  return (
    <motion.section
      aria-label="Definir enfoque del día"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl p-4 md:p-5 bg-[#0F172A] border border-white/[0.08]"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400 shrink-0" />
          <h2 className="text-sm font-bold text-white tracking-tight">
            {isEditing ? 'Actualizar Enfoque del Día' : 'Intención & Enfoque de Hoy'}
          </h2>
          <span className="hidden sm:inline text-xs text-slate-400">
            · Define tu ancla principal para mantenerte centrado
          </span>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Cancelar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <input
          ref={inputRef}
          type="text"
          maxLength={120}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="¿Qué es lo único que hará que hoy valga la pena?"
          className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all"
        />

        <button
          type="submit"
          disabled={!draft.trim()}
          className="px-4 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#34D399] disabled:opacity-45 disabled:pointer-events-none text-[#003824] text-xs font-bold transition-all shadow-[0_0_14px_rgba(16,185,129,0.28)] whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isEditing ? 'Guardar enfoque' : 'Fijar enfoque'}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-slate-500">Sugerencias:</span>
        {FOCUS_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className="px-2.5 py-1 rounded-md bg-[#1E293B] hover:bg-[#27354A] border border-white/[0.08] text-[11px] font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {preset}
          </button>
        ))}
      </div>
    </motion.section>
  );
};
