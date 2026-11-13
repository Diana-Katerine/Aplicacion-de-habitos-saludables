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

  if (focus && !isEditing) {
    return (
      <motion.section
        aria-label="Enfoque del día"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className={`rounded-[24px] p-5 md:p-6 border transition-colors ${
          focus.isCompleted
            ? 'bg-[#fafafb] border-[#17191c]/25'
            : 'bg-[#fafafb] border-[#ececec]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={onToggleComplete}
              aria-label={focus.isCompleted ? 'Marcar enfoque como pendiente' : 'Marcar enfoque como logrado'}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                focus.isCompleted
                  ? 'bg-[#17191c] text-white border border-[#17191c]'
                  : 'bg-white text-transparent hover:text-[#777b86] border border-[#17191c]/25 hover:border-[#17191c]'
              }`}
              title={focus.isCompleted ? 'Marcar como pendiente' : 'Marcar enfoque como logrado'}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
            </motion.button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[13px] text-[#979799]">
                <Compass className="w-3.5 h-3.5 text-[#17191c] shrink-0" />
                <span>Enfoque del día</span>
                {focus.isCompleted && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#17191c] font-medium">Logrado hoy</span>
                  </>
                )}
              </div>

              <p
                className={`text-[18px] font-medium tracking-[-0.01em] mt-0.5 break-words transition-colors ${
                  focus.isCompleted
                    ? 'text-[#777b86] line-through'
                    : 'text-[#17191c]'
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
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#f2f2f3] border border-[#ececec] text-[13px] text-[#17191c] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={onClearFocus}
              aria-label="Quitar enfoque del día"
              title="Quitar enfoque del día"
              className="p-2 rounded-full bg-white hover:bg-[#fbe1d1] border border-[#ececec] text-[#777b86] hover:text-[#5d2a1a] transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      aria-label="Definir enfoque del día"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-[24px] p-5 md:p-6 bg-[#fafafb] border border-[#ececec]"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#17191c] shrink-0" />
          <h2 className="text-[15px] font-medium text-[#17191c] tracking-tight">
            {isEditing ? 'Actualizar enfoque del día' : 'Intención & enfoque de hoy'}
          </h2>
          <span className="hidden sm:inline text-[14px] text-[#777b86]">
            · Define tu ancla principal para mantenerte centrado
          </span>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-[13px] text-[#777b86] hover:text-[#17191c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
          className="flex-1 px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] placeholder-[#a3a6af] text-[15px] focus:outline-none focus:border-[#17191c] transition-colors"
        />

        <button
          type="submit"
          disabled={!draft.trim()}
          className="px-5 py-2.5 rounded-full bg-[#17191c] hover:bg-[#2a2d32] disabled:opacity-40 disabled:pointer-events-none text-white text-[14px] font-normal transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isEditing ? 'Guardar enfoque' : 'Fijar enfoque'}
        </button>
      </form>

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-[#979799]">Sugerencias:</span>
        {FOCUS_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className="px-3 py-1 rounded-full bg-white hover:bg-[#f2f2f3] border border-[#ececec] text-[12px] text-[#777b86] hover:text-[#17191c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {preset}
          </button>
        ))}
      </div>
    </motion.section>
  );
};
