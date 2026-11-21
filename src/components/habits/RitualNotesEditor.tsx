import React, { useRef, useState } from 'react';
import {
  Bold,
  Italic,
  List,
  ListChecks,
  Quote,
  CalendarPlus,
  Eye,
  Edit3,
  Check,
  FileText,
} from 'lucide-react';

interface EditorProps {
  value: string;
  onChange: (nextValue: string) => void;
  maxLength?: number;
}

interface MarkdownRendererProps {
  content: string;
  compact?: boolean;
  onToggleCheckbox?: (lineIndex: number) => void;
}

export function summarizeMarkdownInline(markdown: string): string {
  const firstNonEmpty =
    markdown
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0) || '';
  return firstNonEmpty
    .replace(/^#{1,6}\s+/, '')
    .replace(/^>\s+/, '')
    .replace(/^- \[[ xX]\]\s+/, '')
    .replace(/^[-*+]\s+/, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .trim();
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={`b-${keyIdx++}`} className="font-semibold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={`i-${keyIdx++}`} className="italic text-slate-800 dark:text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={`c-${keyIdx++}`}
          className="px-2 py-0.5 rounded bg-slate-900 text-slate-50 dark:bg-slate-950 font-mono text-xs border border-slate-700"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens.length > 0 ? tokens : [text];
}

export const RitualNotesMarkdown: React.FC<MarkdownRendererProps> = ({
  content,
  compact = false,
  onToggleCheckbox,
}) => {
  const lines = content.split(/\r?\n/);

  return (
    <div
      className={
        compact
          ? 'space-y-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed'
          : 'space-y-2 text-sm text-slate-800 dark:text-slate-200 leading-relaxed'
      }
    >
      {lines.map((rawLine, idx) => {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
          return <div key={`sp-${idx}`} className="h-1.5" />;
        }

        const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
        if (headingMatch) {
          const level = headingMatch[1].length;
          return (
            <h4
              key={`h-${idx}`}
              className={
                level === 1
                  ? 'font-bold text-slate-900 dark:text-white text-base pt-1'
                  : 'font-semibold text-slate-900 dark:text-white text-sm pt-0.5'
              }
            >
              {renderInlineMarkdown(headingMatch[2])}
            </h4>
          );
        }

        const quoteMatch = /^>\s*(.+)$/.exec(line);
        if (quoteMatch) {
          return (
            <p
              key={`q-${idx}`}
              className="pl-3.5 py-1.5 text-amber-950 dark:text-amber-200 italic bg-amber-50 dark:bg-amber-950/40 border-l-2 border-amber-600 dark:border-amber-400 rounded-r-md text-sm"
            >
              “{renderInlineMarkdown(quoteMatch[1])}”
            </p>
          );
        }

        const taskMatch = /^-\s+\[([ xX])\]\s+(.+)$/.exec(line);
        if (taskMatch) {
          const checked = taskMatch[1].toLowerCase() === 'x';
          return (
            <div key={`t-${idx}`} className="flex items-center gap-2.5 min-h-[36px]">
              <button
                type="button"
                disabled={!onToggleCheckbox}
                onClick={() => onToggleCheckbox?.(idx)}
                className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] ${
                  checked
                    ? 'bg-[#84A98C] border-[#52796F] text-white'
                    : 'bg-white dark:bg-[#1A2721] border-[#84A98C]/40 text-transparent hover:border-[#52796F]'
                } ${onToggleCheckbox ? 'cursor-pointer' : 'cursor-default'}`}
                aria-label={checked ? 'Tarea completada' : 'Tarea pendiente'}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <span className={checked ? 'text-[#52796F] dark:text-[#84A98C] font-medium line-through' : 'text-[#344E41] dark:text-[#EAF4F4] font-medium'}>
                {renderInlineMarkdown(taskMatch[2])}
              </span>
            </div>
          );
        }

        const listMatch = /^[-*+]\s+(.+)$/.exec(line);
        if (listMatch) {
          return (
            <div key={`l-${idx}`} className="flex items-start gap-2 pl-0.5">
              <span className="text-[#52796F] dark:text-[#84A98C] font-bold select-none leading-5">•</span>
              <span className="text-[#344E41] dark:text-[#EAF4F4] font-medium">{renderInlineMarkdown(listMatch[1])}</span>
            </div>
          );
        }

        return (
          <p key={`p-${idx}`} className="text-slate-800 dark:text-slate-200 font-normal">
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
};

export const RitualNotesEditor: React.FC<EditorProps> = ({
  value,
  onChange,
  maxLength = 2000,
}) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const applyWrapFormat = (prefix: string, suffix: string, placeholder: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(`${value}${value ? '\n' : ''}${prefix}${placeholder}${suffix}`.slice(0, maxLength));
      return;
    }

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || placeholder;
    const next =
      value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    onChange(next.slice(0, maxLength));

    window.requestAnimationFrame(() => {
      el.focus();
      const cursorStart = start + prefix.length;
      const cursorEnd = cursorStart + selected.length;
      el.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const applyLinePrefix = (linePrefix: string, placeholder: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(`${value}${value ? '\n' : ''}${linePrefix}${placeholder}`.slice(0, maxLength));
      return;
    }

    const start = el.selectionStart ?? value.length;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const before = value.slice(0, lineStart);
    const after = value.slice(lineStart);
    const needsContent = after.length === 0 || after.startsWith('\n');
    const insertion = needsContent ? `${linePrefix}${placeholder}` : linePrefix;
    const next = `${before}${insertion}${after}`;
    onChange(next.slice(0, maxLength));

    window.requestAnimationFrame(() => {
      el.focus();
      const caret = lineStart + insertion.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const insertTodayInsightBlock = () => {
    const todayLabel = new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
    }).format(new Date());
    const block = `- **${todayLabel}:** `;
    const separator = value.trim().length > 0 ? (value.endsWith('\n') ? '' : '\n') : '';
    const next = `${value}${separator}${block}`.slice(0, maxLength);
    onChange(next);
    setMode('edit');

    window.requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(next.length, next.length);
      }
    });
  };

  const handleToggleCheckboxInPreview = (lineIndex: number) => {
    const lines = value.split(/\r?\n/);
    const target = lines[lineIndex];
    if (!target) return;
    if (/^-\s+\[\s\]\s+/.test(target)) {
      lines[lineIndex] = target.replace(/^-\s+\[\s\]\s+/, '- [x] ');
    } else if (/^-\s+\[[xX]\]\s+/.test(target)) {
      lines[lineIndex] = target.replace(/^-\s+\[[xX]\]\s+/, '- [ ] ');
    }
    onChange(lines.join('\n'));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      applyWrapFormat('**', '**', 'texto');
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      applyWrapFormat('*', '*', 'texto');
      return;
    }
    if (e.key === 'Enter') {
      const el = e.currentTarget;
      const pos = el.selectionStart;
      const lineStart = value.lastIndexOf('\n', pos - 1) + 1;
      const currentLine = value.slice(lineStart, pos);

      const checklistMatch = /^-\s+\[[ xX]\]\s+(.*)$/.exec(currentLine);
      const bulletMatch = /^[-*]\s+(.*)$/.exec(currentLine);

      if (checklistMatch && checklistMatch[1].trim().length > 0) {
        e.preventDefault();
        const next = `${value.slice(0, pos)}\n- [ ] ${value.slice(pos)}`.slice(0, maxLength);
        onChange(next);
        window.requestAnimationFrame(() => {
          el.setSelectionRange(pos + 7, pos + 7);
        });
      } else if (bulletMatch && bulletMatch[1].trim().length > 0) {
        e.preventDefault();
        const next = `${value.slice(0, pos)}\n- ${value.slice(pos)}`.slice(0, maxLength);
        onChange(next);
        window.requestAnimationFrame(() => {
          el.setSelectionRange(pos + 3, pos + 3);
        });
      }
    }
  };

  return (
    <div className="rounded-xl border border-[#84A98C]/30 dark:border-[#344E41] bg-white dark:bg-[#1A2721] overflow-hidden focus-within:ring-2 focus-within:ring-[#52796F] transition-colors shadow-xs">
      {/* Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#84A98C]/20 dark:border-[#344E41] bg-[#EAF4F4] dark:bg-[#22332A]">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('edit');
              applyWrapFormat('**', '**', 'destacado');
            }}
            title="Negrita (Ctrl+B)"
            aria-label="Negrita"
            className="min-h-[44px] min-w-[44px] rounded-lg text-[#344E41] dark:text-[#EAF4F4] hover:text-[#52796F] hover:bg-[#D8F3DC]/60 dark:hover:bg-[#1A2721] transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F]"
          >
            <Bold className="w-4 h-4 stroke-[2.25]" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('edit');
              applyWrapFormat('*', '*', 'nota');
            }}
            title="Cursiva (Ctrl+I)"
            aria-label="Cursiva"
            className="min-h-[44px] min-w-[44px] rounded-lg text-[#344E41] dark:text-[#EAF4F4] hover:text-[#52796F] hover:bg-[#D8F3DC]/60 dark:hover:bg-[#1A2721] transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F]"
          >
            <Italic className="w-4 h-4 stroke-[2.25]" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('edit');
              applyLinePrefix('- ', 'Paso del ritual');
            }}
            title="Lista con viñetas"
            aria-label="Lista con viñetas"
            className="min-h-[44px] min-w-[44px] rounded-lg text-[#344E41] dark:text-[#EAF4F4] hover:text-[#52796F] hover:bg-[#D8F3DC]/60 dark:hover:bg-[#1A2721] transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F]"
          >
            <List className="w-4 h-4 stroke-[2.25]" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('edit');
              applyLinePrefix('- [ ] ', 'Micro-paso');
            }}
            title="Lista de verificación"
            aria-label="Lista de verificación"
            className="min-h-[44px] min-w-[44px] rounded-lg text-[#344E41] dark:text-[#EAF4F4] hover:text-[#52796F] hover:bg-[#D8F3DC]/60 dark:hover:bg-[#1A2721] transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F]"
          >
            <ListChecks className="w-4 h-4 stroke-[2.25]" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('edit');
              applyLinePrefix('> ', 'Aprendizaje clave al completar');
            }}
            title="Cita o reflexión"
            aria-label="Cita o reflexión"
            className="min-h-[44px] min-w-[44px] rounded-lg text-[#344E41] dark:text-[#EAF4F4] hover:text-[#52796F] hover:bg-[#D8F3DC]/60 dark:hover:bg-[#1A2721] transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F]"
          >
            <Quote className="w-4 h-4 stroke-[2.25]" />
          </button>

          <span aria-hidden="true" className="mx-1.5 h-5 w-px bg-[#84A98C]/30 dark:bg-[#344E41]" />

          <button
            type="button"
            onClick={insertTodayInsightBlock}
            title="Añadir aprendizaje con la fecha de hoy"
            className="min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#52796F] dark:text-[#84A98C] hover:bg-[#D8F3DC]/60 dark:hover:bg-[#344E41]/40 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F]"
          >
            <CalendarPlus className="w-4 h-4 shrink-0 text-[#52796F] dark:text-[#84A98C]" />
            <span>+ Insight de hoy</span>
          </button>
        </div>

        {/* Edit / Preview Segmented Control */}
        <div role="tablist" aria-label="Modo de notas" className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#1A2721] border border-[#84A98C]/30 shrink-0">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'edit'}
            onClick={() => setMode('edit')}
            className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] ${
              mode === 'edit'
                ? 'bg-[#52796F] text-white font-bold shadow-xs'
                : 'text-[#344E41] dark:text-[#EAF4F4] hover:text-[#52796F]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'preview'}
            onClick={() => setMode('preview')}
            className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] ${
              mode === 'preview'
                ? 'bg-[#52796F] text-white font-bold shadow-xs'
                : 'text-[#344E41] dark:text-[#EAF4F4] hover:text-[#52796F]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vista previa</span>
          </button>
        </div>
      </div>

      {/* Editor or Preview Surface */}
      {mode === 'edit' ? (
        <textarea
          ref={textareaRef}
          rows={5}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Anota señales, aprendizajes o pasos del ritual en Markdown:\n- [ ] Preparar entorno la noche anterior\n> Me siento con más claridad cuando lo hago antes de las 09:00`}
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm leading-relaxed focus:outline-none resize-y min-h-[120px]"
        />
      ) : (
        <div className="px-4 py-3 min-h-[120px] max-h-56 overflow-y-auto bg-white dark:bg-slate-900">
          {value.trim() ? (
            <RitualNotesMarkdown
              content={value}
              onToggleCheckbox={handleToggleCheckboxInPreview}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 dark:text-slate-400 text-sm">
              <FileText className="w-5 h-5 mb-1.5 text-slate-400 dark:text-slate-500" />
              <span>Sin notas del ritual todavía. Cambia a Editar para registrar un aprendizaje.</span>
            </div>
          )}
        </div>
      )}

      {/* Footer Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-slate-600 dark:text-slate-400 font-medium">
        <span>Soporta Markdown: **negrita**, *cursiva*, - listas, - [ ] pasos, &gt; cita</span>
        <span className="tabular-nums shrink-0 font-semibold text-slate-700 dark:text-slate-300">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};
