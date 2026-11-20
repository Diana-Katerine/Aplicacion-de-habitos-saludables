import React from 'react';
import { X, Sparkles, Trash2, Calendar, MessageSquareQuote } from 'lucide-react';
import { AiEncouragementMessage } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: AiEncouragementMessage[];
  onDeleteMessage: (messageId: string) => void;
}

export const AiEncouragementHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  history,
  onDeleteMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-5 bg-[#17191c]/40 dark:bg-[#050709]/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-8 my-auto max-h-[calc(100dvh-2rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Historial de Consejos de IA
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consulta los consejos y reflexiones recibidos a lo largo de tu trayectoria.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {history.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">
                Aún no tienes consejos guardados en tu historial.
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Genera tu primer consejo pulsando &quot;Nueva sugerencia&quot; en la tarjeta de Hoy.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id || item.generatedAt}
                className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {item.tone || 'motivación'}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.generatedAt).toLocaleString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {item.id && (
                    <button
                      type="button"
                      onClick={() => onDeleteMessage(item.id!)}
                      aria-label="Eliminar consejo"
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                      title="Eliminar de mi historial"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-2">
                  {item.headline}
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  {item.message}
                </p>

                {item.microAction && (
                  <div className="mt-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <strong className="text-indigo-600 dark:text-indigo-400">Paso sugerido:</strong>{' '}
                    {item.microAction}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
