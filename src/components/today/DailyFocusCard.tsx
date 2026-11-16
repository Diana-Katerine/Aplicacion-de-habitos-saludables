import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Compass, Check, Edit2, X } from 'lucide-react';
import { DailyFocus } from '../../types';
import { ActionHint } from '../common/ActionHint';

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
        className={`rounded-[24px] p-4 sm:p-5 md:p-6 border transition-colors ${
          focus.isCompleted
            ? 'bg-gradient-to-r from-[#ECFDF5] via-[#F0FDFA] to-[#E0F2FE] dark:from-[#059669]/22 dark:via-[#0D9488]/14 dark:to-[#0284C7]/14 border-[#059669]/35 dark:border-[#34d399]/40'
            : 'bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#ECFEFF] dark:from-[#4F46E5]/20 dark:via-[#7C3AED]/14 dark:to-[#06B6D4]/16 border-[#4F46E5]/25 dark:border-[#818CF8]/30'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
            <ActionHint
              message={
                focus.isCompleted
                  ? 'Desmarcará el enfoque del día como pendiente'
                  : 'Marcará el enfoque del día como logrado'
              }
              tone="accent"
              position="top"
              align="left"
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={onToggleComplete}
                aria-label={focus.isCompleted ? 'Marcar enfoque como pendiente' : 'Marcar enfoque como logrado'}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  focus.isCompleted
                    ? 'bg-[#059669] text-white border border-[#059669]'
                    : 'bg-white dark:bg-[#1b222b] text-transparent hover:text-[#059669] dark:hover:text-[#34d399] border border-[#059669]/35 dark:border-[#34d399]/40 hover:border-[#059669]'
                }`}
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
              </motion.button>
            </ActionHint>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[13px] text-[#4338CA] dark:text-[#a5b4fc]">
                <Compass className="w-4 h-4 text-[#4F46E5] dark:text-[#818cf8] shrink-0" />
                <span className="font-medium">Enfoque del día</span>
                {focus.isCompleted && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#059669] dark:text-[#34d399] font-medium">Logrado hoy</span>
                  </>
                )}
              </div>

              <p
                className={`text-[18px] font-medium tracking-[-0.01em] mt-0.5 break-words transition-colors ${
                  focus.isCompleted
                    ? 'text-[#777b86] dark:text-[#6f7a8a] line-through'
                    : 'text-[#17191c] dark:text-[#f1f5f9]'
                }`}
              >
                {focus.intent}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <ActionHint
              message="Abrirá el campo para editar el enfoque de hoy"
              tone="neutral"
              position="top"
              align="center"
            >
              <button
                type="button"
                onClick={handleStartEdit}
                className="px-3.5 py-2 rounded-full bg-white dark:bg-[#1b222b] hover:bg-[#f2f2f3] dark:hover:bg-[#252e3a] border border-[#ececec] dark:border-[#252e3a] text-[13px] text-[#17191c] dark:text-[#f1f5f9] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
                <span>Editar</span>
              </button>
            </ActionHint>

            <ActionHint
              message="Eliminará el enfoque del día actual"
              tone="danger"
              position="top"
              align="right"
            >
              <button
                type="button"
                onClick={onClearFocus}
                aria-label="Quitar enfoque del día"
                className="w-11 h-11 rounded-full bg-white dark:bg-[#1b222b] hover:bg-[#fee2e2]/70 dark:hover:bg-[#7f1d1d]/35 border border-[#ececec] dark:border-[#252e3a] hover:border-[#ef4444]/45 text-[#5c616d] dark:text-[#9aa4b2] hover:text-[#b91c1c] dark:hover:text-[#fca5a5] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </ActionHint>
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
      className="rounded-[24px] p-4 sm:p-5 md:p-6 bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#ECFEFF] dark:from-[#4F46E5]/20 dark:via-[#7C3AED]/14 dark:to-[#06B6D4]/16 border border-[#4F46E5]/25 dark:border-[#818CF8]/30"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white shadow-xs shadow-[#4F46E5]/30 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <h2 className="text-[15px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-tight">
            {isEditing ? 'Actualizar enfoque del día' : 'Enfoque de hoy'}
          </h2>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
          className="flex-1 min-w-0 w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[15px] focus:outline-none focus:border-[#4F46E5] dark:focus:border-[#818cf8] transition-colors"
        />

        <button
          type="submit"
          disabled={!draft.trim()}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] shadow-sm shadow-[#4F46E5]/30 disabled:opacity-40 disabled:pointer-events-none text-white text-[14px] font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isEditing ? 'Guardar enfoque' : 'Fijar enfoque'}
        </button>
      </form>

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-[#5c616d] dark:text-[#9aa4b2]">Sugerencias:</span>
        {FOCUS_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className="px-3 py-1.5 sm:py-1 rounded-[14px] sm:rounded-full bg-white dark:bg-[#1b222b] hover:bg-[#EEF2FF] dark:hover:bg-[#4F46E5]/20 border border-[#ececec] dark:border-[#252e3a] hover:border-[#4F46E5]/30 dark:hover:border-[#818cf8]/40 text-[12px] text-left text-[#5c616d] dark:text-[#cbd5e1] hover:text-[#4338CA] dark:hover:text-[#a5b4fc] transition-colors whitespace-normal sm:whitespace-nowrap cursor-pointer"
          >
            {preset}
          </button>
        ))}
      </div>
    </motion.section>
  );
};
