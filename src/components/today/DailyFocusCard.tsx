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
        aria-label="Objetivo prioritario del día"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className={`rounded-xl p-6 sm:p-8 border shadow-sm transition-colors ${
          focus.isCompleted
            ? 'bg-[#D8F3DC]/70 dark:bg-[#22332A] border-[#84A98C] dark:border-[#52796F]'
            : 'bg-white dark:bg-[#1A2721] border-[#84A98C]/30 dark:border-[#344E41]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
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
                whileTap={{ scale: 0.95 }}
                onClick={onToggleComplete}
                aria-label={focus.isCompleted ? 'Marcar enfoque como pendiente' : 'Marcar enfoque como logrado'}
                className={`min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2 ${
                  focus.isCompleted
                    ? 'bg-[#84A98C] hover:bg-[#52796F] text-white border border-[#52796F]'
                    : 'bg-white dark:bg-[#22332A] text-slate-400 hover:text-[#52796F] dark:hover:text-[#84A98C] border border-[#84A98C]/40 hover:border-[#52796F]'
                }`}
              >
                <Check className={`w-5 h-5 stroke-[2.5] ${focus.isCompleted ? 'text-white' : 'opacity-0 hover:opacity-100'}`} />
              </motion.button>
            </ActionHint>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-[#52796F] dark:text-[#84A98C] font-semibold mb-1">
                <Compass className="w-4 h-4 text-[#52796F] dark:text-[#84A98C] shrink-0" />
                <span>Objetivo prioritario del día</span>
                {focus.isCompleted && (
                  <>
                    <span aria-hidden="true" className="text-[#84A98C]">·</span>
                    <span className="text-[#344E41] dark:text-[#D8F3DC] font-medium bg-[#D8F3DC] dark:bg-[#22332A] px-2 py-0.5 rounded text-xs border border-[#84A98C]/40">Cumplido</span>
                  </>
                )}
              </div>

              <p
                className={`text-lg sm:text-xl font-bold tracking-tight break-words transition-colors ${
                  focus.isCompleted
                    ? 'text-[#344E41] dark:text-[#D8F3DC]'
                    : 'text-[#344E41] dark:text-[#EAF4F4]'
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
                className="min-h-[44px] px-3.5 py-2 rounded-lg bg-white dark:bg-[#22332A] hover:bg-[#EAF4F4] dark:hover:bg-[#1A2721] border border-[#84A98C]/35 text-sm font-medium text-[#344E41] dark:text-[#EAF4F4] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2"
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
                className="min-h-[44px] min-w-[44px] rounded-lg bg-white dark:bg-[#22332A] hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-[#84A98C]/35 hover:border-rose-300 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2"
              >
                <X className="w-5 h-5 stroke-[2.25]" />
              </button>
            </ActionHint>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      aria-label="Definir objetivo prioritario del día"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-xl p-6 sm:p-8 bg-white dark:bg-[#1A2721] border border-[#84A98C]/30 dark:border-[#344E41] shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#52796F] text-white flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#344E41] dark:text-[#EAF4F4] tracking-tight">
            {isEditing ? 'Actualizar objetivo del día' : 'Objetivo principal para hoy'}
          </h2>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-medium text-[#52796F] dark:text-[#84A98C] hover:text-[#344E41] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2"
          >
            Cancelar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <label htmlFor="daily-focus-input" className="sr-only">
          Objetivo prioritario para hoy
        </label>
        <input
          id="daily-focus-input"
          ref={inputRef}
          type="text"
          maxLength={120}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ej: Completar el módulo 2 de estudio sin interrupciones..."
          className="flex-1 min-w-0 w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#EAF4F4] dark:bg-[#22332A] border border-[#84A98C]/40 text-[#344E41] dark:text-[#EAF4F4] placeholder-[#52796F]/70 dark:placeholder-[#84A98C]/70 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2 transition-colors"
        />

        <button
          type="submit"
          disabled={!draft.trim()}
          className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#52796F] hover:bg-[#344E41] text-white text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2 shadow-sm disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
        >
          {isEditing ? 'Guardar objetivo' : 'Fijar objetivo'}
        </button>
      </form>

      <div className="mt-4 pt-3 border-t border-[#84A98C]/20 dark:border-[#344E41] flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[#52796F] dark:text-[#84A98C]">Sugerencias rápidas:</span>
        {FOCUS_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#EAF4F4] dark:bg-[#22332A] hover:bg-[#D8F3DC] dark:hover:bg-[#344E41] border border-[#84A98C]/30 text-xs font-medium text-[#344E41] dark:text-[#D8F3DC] transition-colors whitespace-normal sm:whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2"
          >
            {preset}
          </button>
        ))}
      </div>
    </motion.section>
  );
};
