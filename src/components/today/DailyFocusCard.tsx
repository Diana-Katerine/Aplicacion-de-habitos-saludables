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
            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
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
                className={`min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                  focus.isCompleted
                    ? 'bg-emerald-600 text-white border border-emerald-700'
                    : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-300 dark:border-slate-600 hover:border-emerald-600'
                }`}
              >
                <Check className={`w-5 h-5 stroke-[2.5] ${focus.isCompleted ? 'text-white' : 'opacity-0 hover:opacity-100'}`} />
              </motion.button>
            </ActionHint>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-400 font-semibold mb-1">
                <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Objetivo prioritario del día</span>
                {focus.isCompleted && (
                  <>
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-100/80 dark:bg-emerald-900/50 px-2 py-0.5 rounded text-xs">Cumplido</span>
                  </>
                )}
              </div>

              <p
                className={`text-lg sm:text-xl font-bold tracking-tight break-words transition-colors ${
                  focus.isCompleted
                    ? 'text-emerald-800 dark:text-emerald-300'
                    : 'text-slate-900 dark:text-white'
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
                className="min-h-[44px] px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-800 dark:text-slate-100 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
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
                className="min-h-[44px] min-w-[44px] rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-300 dark:border-slate-600 hover:border-rose-300 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
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
      className="rounded-xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {isEditing ? 'Actualizar objetivo del día' : 'Objetivo principal para hoy'}
          </h2>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
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
          className="flex-1 min-w-0 w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-colors"
        />

        <button
          type="submit"
          disabled={!draft.trim()}
          className="min-h-[44px] px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 shadow-sm disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
        >
          {isEditing ? 'Guardar objetivo' : 'Fijar objetivo'}
        </button>
      </form>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Sugerencias rápidas:</span>
        {FOCUS_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors whitespace-normal sm:whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            {preset}
          </button>
        ))}
      </div>
    </motion.section>
  );
};
