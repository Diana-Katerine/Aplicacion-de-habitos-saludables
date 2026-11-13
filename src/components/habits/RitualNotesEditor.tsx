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
        <strong key={`b-${keyIdx++}`} className="font-medium text-[#17191c]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={`i-${keyIdx++}`} className="italic text-[#17191c]">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={`c-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded bg-[#f2f2f3] text-[#17191c] font-mono text-[12px]"
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
          ? 'space-y-1 text-[13px] text-[#777b86] leading-relaxed'
          : 'space-y-1.5 text-[14px] text-[#777b86] leading-relaxed'
      }
    >
      {lines.map((rawLine, idx) => {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
          return <div key={`sp-${idx}`} className="h-1" />;
        }

        const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
        if (headingMatch) {
          return (
            <p key={`h-${idx}`} className="font-medium text-[#17191c] text-[13px] pt-0.5">
              {renderInlineMarkdown(headingMatch[2])}
            </p>
          );
        }

        const quoteMatch = /^>\s*(.+)$/.exec(line);
        if (quoteMatch) {
          return (
            <p
              key={`q-${idx}`}
              className="pl-3 py-1 text-[#5d2a1a] italic bg-[#fbe1d1]/65 rounded-[10px]"
            >
              “{renderInlineMarkdown(quoteMatch[1])}”
            </p>
          );
        }

        const taskMatch = /^-\s+\[([ xX])\]\s+(.+)$/.exec(line);
        if (taskMatch) {
          const checked = taskMatch[1].toLowerCase() === 'x';
          return (
            <div key={`t-${idx}`} className="flex items-start gap-2">
              <button
                type="button"
                disabled={!onToggleCheckbox}
                onClick={() => onToggleCheckbox?.(idx)}
                className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                  checked
                    ? 'bg-[#17191c] border-[#17191c] text-white'
                    : 'bg-white border-[#17191c]/30 text-transparent hover:border-[#17191c]'
                } ${onToggleCheckbox ? 'cursor-pointer' : 'cursor-default'}`}
                aria-label={checked ? 'Tarea completada' : 'Tarea pendiente'}
              >
                <Check className="w-2.5 h-2.5 stroke-[2.5]" />
              </button>
              <span className={checked ? 'line-through text-[#a3a6af]' : 'text-[#17191c]'}>
                {renderInlineMarkdown(taskMatch[2])}
              </span>
            </div>
          );
        }

        const listMatch = /^[-*+]\s+(.+)$/.exec(line);
        if (listMatch) {
          return (
            <div key={`l-${idx}`} className="flex items-start gap-2 pl-0.5">
              <span className="text-[#5d2a1a] font-medium select-none leading-5">•</span>
              <span className="text-[#17191c]">{renderInlineMarkdown(listMatch[1])}</span>
            </div>
          );
        }

        return (
          <p key={`p-${idx}`} className="text-[#17191c]">
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
    <div className="rounded-[16px] border border-[#ececec] bg-white overflow-hidden focus-within:border-[#17191c] transition-colors">
      {/* Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#ececec] bg-[#fafafb]">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => {
              setMode('edit');
              applyWrapFormat('**', '**', 'destacado');
            }}
            title="Negrita (Ctrl+B)"
            className="p-1.5 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('edit');
              applyWrapFormat('*', '*', 'nota');
            }}
            title="Cursiva (Ctrl+I)"
            className="p-1.5 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('edit');
              applyLinePrefix('- ', 'Paso del ritual');
            }}
            title="Lista con viñetas"
            className="p-1.5 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('edit');
              applyLinePrefix('- [ ] ', 'Micro-paso');
            }}
            title="Lista de verificación"
            className="p-1.5 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors cursor-pointer"
          >
            <ListChecks className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('edit');
              applyLinePrefix('> ', 'Aprendizaje clave al completar');
            }}
            title="Cita o reflexión"
            className="p-1.5 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <span aria-hidden="true" className="mx-1.5 h-4 w-px bg-[#ececec]" />

          <button
            type="button"
            onClick={insertTodayInsightBlock}
            title="Añadir aprendizaje con la fecha de hoy"
            className="px-2.5 py-1 rounded-full text-[12px] text-[#17191c] hover:bg-[#f2f2f3] inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CalendarPlus className="w-3.5 h-3.5 shrink-0" />
            <span>+ Insight de hoy</span>
          </button>
        </div>

        {/* Edit / Preview Segmented Control */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-[#f2f2f3] shrink-0">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`px-2.5 py-1 rounded-full text-[11px] inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'edit' ? 'bg-white text-[#17191c] font-medium shadow-xs' : 'text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Editar</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`px-2.5 py-1 rounded-full text-[11px] inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'preview' ? 'bg-white text-[#17191c] font-medium shadow-xs' : 'text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            <Eye className="w-3 h-3" />
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
          className="w-full px-4 py-3 bg-white text-[#17191c] placeholder-[#a3a6af] text-[14px] leading-relaxed focus:outline-none resize-y min-h-[120px]"
        />
      ) : (
        <div className="px-4 py-3 min-h-[120px] max-h-56 overflow-y-auto bg-white">
          {value.trim() ? (
            <RitualNotesMarkdown
              content={value}
              onToggleCheckbox={handleToggleCheckboxInPreview}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-[#979799] text-[13px]">
              <FileText className="w-4 h-4 mb-1.5 text-[#a3a6af]" />
              <span>Sin notas del ritual todavía. Cambia a Editar para registrar un aprendizaje.</span>
            </div>
          )}
        </div>
      )}

      {/* Footer Meta */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[#ececec] bg-[#fafafb] text-[11px] text-[#979799]">
        <span>Soporta Markdown: **negrita**, *cursiva*, - listas, - [ ] pasos, &gt; cita</span>
        <span className="tabular-nums shrink-0">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};
