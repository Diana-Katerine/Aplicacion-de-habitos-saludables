import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { BioluminescentThemeId, Category, Habit } from '../../types';
import {
  CategoryIcon,
  CATEGORY_COLOR_PRESETS,
  CATEGORY_ICON_OPTIONS,
} from '../common/CategoryIcon';
import {
  BIOLUMINESCENT_SELECTOR_OPTIONS,
  getCategoryBioluminescentTheme,
} from '../../services/bioluminescentTheme';
import { ActionHint } from '../common/ActionHint';

interface Props {
  categories: Category[];
  habits: Habit[];
  onCreateCategory: (data: {
    name: string;
    iconName: string;
    colorHex: string;
    bioluminescentTheme?: BioluminescentThemeId;
  }) => void;
  onUpdateCategory: (
    categoryId: number,
    updates: {
      name: string;
      iconName: string;
      colorHex: string;
      bioluminescentTheme?: BioluminescentThemeId;
    }
  ) => void;
  onDeleteCategory: (categoryId: number) => void;
}

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const CategoryManager: React.FC<Props> = ({
  categories,
  habits,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('Sparkles');
  const [colorHex, setColorHex] = useState('#5D2A1A');
  const [hexInput, setHexInput] = useState('#5D2A1A');
  const [glowTheme, setGlowTheme] = useState<BioluminescentThemeId>('auto');
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const activeHabits = habits.filter((h) => !h.deletedAt);

  const openCreate = () => {
    setEditorMode('create');
    setEditingId(null);
    setName('');
    setIconName('Sparkles');
    setColorHex('#5D2A1A');
    setHexInput('#5D2A1A');
    setGlowTheme('auto');
    setError(null);
    setConfirmDeleteId(null);
  };

  const openEdit = (cat: Category) => {
    setEditorMode('edit');
    setEditingId(cat.id);
    setName(cat.name);
    setIconName(cat.iconName);
    const normalizedHex = HEX_COLOR_REGEX.test(cat.colorHex) ? cat.colorHex.toUpperCase() : '#5D2A1A';
    setColorHex(normalizedHex);
    setHexInput(normalizedHex);
    setGlowTheme(cat.bioluminescentTheme || 'auto');
    setError(null);
    setConfirmDeleteId(null);
  };

  const closeEditor = () => {
    setEditorMode(null);
    setEditingId(null);
    setError(null);
  };

  const handleSelectColor = (hex: string) => {
    const upper = hex.toUpperCase();
    setColorHex(upper);
    setHexInput(upper);
    if (error) setError(null);
  };

  const handleHexTextChange = (value: string) => {
    const formatted = value.startsWith('#') ? value : `#${value}`;
    setHexInput(formatted.slice(0, 7));
    if (HEX_COLOR_REGEX.test(formatted)) {
      setColorHex(formatted.toUpperCase());
    }
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Ingresa un nombre para la categoría.');
      return;
    }

    const duplicate = categories.some(
      (c) =>
        c.name.toLowerCase() === trimmedName.toLowerCase() &&
        (editorMode === 'create' || c.id !== editingId)
    );
    if (duplicate) {
      setError('Ya existe una categoría con ese nombre.');
      return;
    }

    if (!HEX_COLOR_REGEX.test(hexInput)) {
      setError('Ingresa un color hexadecimal válido (ej: #5D2A1A).');
      return;
    }

    const payload = {
      name: trimmedName,
      iconName,
      colorHex: hexInput.toUpperCase(),
      bioluminescentTheme: glowTheme,
    };

    if (editorMode === 'edit' && editingId !== null) {
      onUpdateCategory(editingId, payload);
    } else {
      onCreateCategory(payload);
    }
    closeEditor();
  };

  const handleConfirmDelete = (categoryId: number) => {
    onDeleteCategory(categoryId);
    setConfirmDeleteId(null);
    if (editingId === categoryId) {
      closeEditor();
    }
  };

  const previewTheme = getCategoryBioluminescentTheme({
    id: editingId ?? -1,
    name: name.trim() || 'Categoría',
    colorHex,
    bioluminescentTheme: glowTheme,
  });

  return (
    <section
      aria-label="Gestor de Categorías"
      className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-[14px] bg-[#EEF2FF] dark:bg-[#4F46E5]/20 text-[#4F46E5] dark:text-[#a5b4fc] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
              <h3 className="text-[18px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
                Gestor de categorías
              </h3>
              <span className="text-[13px] text-[#979799] dark:text-[#6f7a8a] tabular-nums">
                · {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
              </span>
            </div>
            <p className="text-[14px] text-[#777b86] dark:text-[#9aa4b2] mt-0.5">
              Personaliza colores, iconos y temas de luz para tus hábitos.
            </p>
          </div>
        </div>

        {editorMode === null && (
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[13px] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva categoría</span>
          </button>
        )}
      </div>

      {/* Inline Create / Edit Editor */}
      {editorMode !== null && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 pt-6 border-t border-[#ececec] dark:border-[#252e3a] space-y-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-[16px] font-medium text-[#17191c] dark:text-[#f1f5f9]">
              {editorMode === 'edit' ? 'Editar categoría' : 'Crear nueva categoría'}
            </h4>
            <ActionHint
              message="Cerrará el editor de categorías sin guardar"
              tone="neutral"
              position="bottom"
              align="right"
            >
              <button
                type="button"
                onClick={closeEditor}
                aria-label="Cerrar editor de categoría"
                className="w-11 h-11 rounded-full border border-[#ececec] dark:border-[#252e3a] bg-[#fafafb] dark:bg-[#1b222b] text-[#5c616d] dark:text-[#9aa4b2] hover:text-[#b91c1c] dark:hover:text-[#fca5a5] hover:bg-[#fee2e2]/60 dark:hover:bg-[#7f1d1d]/30 hover:border-[#ef4444]/40 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </ActionHint>
          </div>

          {/* Live Preview & Name Input */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-7">
              <label
                htmlFor="category-name-input"
                className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1.5"
              >
                Nombre de la categoría
              </label>
              <input
                id="category-name-input"
                type="text"
                maxLength={28}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ej: Finanzas, Creatividad, Idiomas..."
                className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[14px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399]"
              />
            </div>

            <div className="sm:col-span-5">
              <span className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1.5">
                Vista previa en tarjeta
              </span>
              <div
                style={previewTheme.cssVars}
                data-completed="true"
                className="flex items-center gap-3 px-4 py-2.5 rounded-[16px] border transition-all duration-200 bioluminescent-card"
              >
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 border transition-colors"
                  style={{
                    backgroundColor: `rgba(${previewTheme.rgb}, 0.14)`,
                    borderColor: `rgba(${previewTheme.rgb}, 0.28)`,
                    color: 'var(--bio-text)',
                  }}
                >
                  <CategoryIcon name={iconName} className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] truncate">
                    {name.trim() || 'Nombre de categoría'}
                  </p>
                  <p
                    className="text-[11px] font-medium truncate"
                    style={{ color: 'var(--bio-text)' }}
                  >
                    {previewTheme.label}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <span className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-2">
              Color distintivo
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {CATEGORY_COLOR_PRESETS.map((preset) => {
                const isSelected = colorHex.toUpperCase() === preset.hex.toUpperCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => handleSelectColor(preset.hex)}
                    title={`${preset.label} (${preset.hex})`}
                    aria-label={`Color ${preset.label}`}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-[#17191c] dark:ring-[#f1f5f9] ring-offset-2 ring-offset-white dark:ring-offset-[#141920]'
                        : 'border border-[#ececec] dark:border-[#252e3a]'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                );
              })}

              {/* Custom Color Picker + Hex Text Input */}
              <div className="flex flex-wrap items-center gap-2 ml-0 sm:ml-2 pl-0 sm:pl-3 sm:border-l border-[#ececec] dark:border-[#252e3a]">
                <label className="relative w-8 h-8 rounded-full overflow-hidden border border-[#ececec] dark:border-[#252e3a] cursor-pointer shrink-0" title="Selector de color personalizado">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => handleSelectColor(e.target.value)}
                    aria-label="Selector de color personalizado"
                    className="absolute -inset-2 w-12 h-12 cursor-pointer border-0 bg-transparent"
                  />
                </label>
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => handleHexTextChange(e.target.value)}
                  maxLength={7}
                  aria-label="Código hexadecimal de color"
                  className="w-24 px-3 py-1.5 rounded-[14px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-mono text-[12px] uppercase tabular-nums focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399]"
                />
              </div>
            </div>
          </div>

          {/* Bioluminescent Glow Theme Selector */}
          <div>
            <span className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-2">
              Tema bioluminiscente
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {BIOLUMINESCENT_SELECTOR_OPTIONS.map((opt) => {
                const isSelected = glowTheme === opt.id;
                const dotColor =
                  opt.previewHex || (opt.id === 'custom' ? colorHex : previewTheme.secondaryHex);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGlowTheme(opt.id)}
                    aria-pressed={isSelected}
                    className={`px-3.5 py-1.5 rounded-full border text-[12px] inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#ECFDF5] border-[#059669] text-[#17191c] font-medium dark:bg-[#059669]/18 dark:border-[#34d399] dark:text-[#f1f5f9]'
                        : 'bg-white border-[#ececec] text-[#777b86] hover:text-[#17191c] hover:border-[#17191c]/30 dark:bg-[#1b222b] dark:border-[#252e3a] dark:text-[#9aa4b2] dark:hover:text-[#f1f5f9] dark:hover:border-[#34d399]/50'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: dotColor,
                      }}
                    />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <span className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-2">
              Icono de agrupación
            </span>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-12 gap-2">
              {CATEGORY_ICON_OPTIONS.map((opt) => {
                const isSelected = opt.name.toLowerCase() === iconName.toLowerCase();
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setIconName(opt.name)}
                    title={opt.label}
                    aria-label={`Icono ${opt.label}`}
                    aria-pressed={isSelected}
                    className={`h-11 rounded-[14px] border flex items-center justify-center transition-colors cursor-pointer ${
                      isSelected
                        ? ''
                        : 'bg-white dark:bg-[#1b222b] border-[#ececec] dark:border-[#252e3a] text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] hover:border-[#17191c]/30 dark:hover:border-[#34d399]/50'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${colorHex}22`,
                            borderColor: colorHex,
                            color: colorHex,
                          }
                        : undefined
                    }
                  >
                    <CategoryIcon name={opt.name} className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[13px] text-[#b91c1c] dark:text-[#f87171] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Editor Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={closeEditor}
              className="w-full sm:w-auto px-4 py-2 rounded-full bg-transparent hover:bg-[#fafafb] dark:hover:bg-[#1b222b] border border-[#17191c]/25 dark:border-[#252e3a] text-[13px] text-[#17191c] dark:text-[#f1f5f9] transition-colors whitespace-nowrap shrink-0 cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[13px] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editorMode === 'edit' ? 'Guardar categoría' : 'Crear categoría'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Existing Categories List */}
      <div className="mt-6 pt-2 border-t border-[#ececec] dark:border-[#252e3a] divide-y divide-[#ececec] dark:divide-[#252e3a]">
        {categories.map((cat) => {
          const habitCount = activeHabits.filter((h) => h.categoryId === cat.id).length;
          const isEditingThis = editorMode === 'edit' && editingId === cat.id;
          const isConfirmingDelete = confirmDeleteId === cat.id;
          const canDelete = categories.length > 1;
          const catBioTheme = getCategoryBioluminescentTheme(cat);

          return (
            <div
              key={cat.id}
              style={catBioTheme.cssVars}
              className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-opacity bio-accent ${
                isEditingThis ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: `rgba(${catBioTheme.rgb}, 0.14)`,
                    borderColor: `rgba(${catBioTheme.rgb}, 0.28)`,
                    color: 'var(--bio-text)',
                  }}
                >
                  <CategoryIcon name={cat.iconName} className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#17191c] dark:text-[#f1f5f9] truncate">{cat.name}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[#777b86] dark:text-[#9aa4b2] mt-0.5">
                    <span className="tabular-nums">
                      {habitCount} {habitCount === 1 ? 'hábito' : 'hábitos'}
                    </span>
                    <span aria-hidden="true" className="text-[#a3a6af] dark:text-[#6f7a8a]">
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tabular-nums">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-[#ececec] dark:border-[#252e3a]"
                        style={{ backgroundColor: cat.colorHex }}
                      />
                      {cat.colorHex}
                    </span>
                    <span aria-hidden="true" className="text-[#a3a6af] dark:text-[#6f7a8a]">
                      ·
                    </span>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--bio-text)' }}>
                      {catBioTheme.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto shrink-0 sm:self-center">
                {isConfirmingDelete ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12px] text-[#5d2a1a] dark:text-[#fbdac7]">
                      {habitCount > 0
                        ? `¿Reasignar ${habitCount} hábito(s) y eliminar?`
                        : '¿Eliminar categoría?'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleConfirmDelete(cat.id)}
                      className="px-3.5 py-1.5 rounded-full bg-[#b91c1c] hover:bg-[#991b1b] text-white text-[12px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3.5 py-1.5 rounded-full bg-transparent hover:bg-[#fafafb] dark:hover:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[12px] text-[#17191c] dark:text-[#f1f5f9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1b222b] hover:bg-[#fafafb] dark:hover:bg-[#252e3a] border border-[#ececec] dark:border-[#252e3a] text-[12px] text-[#17191c] dark:text-[#f1f5f9] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3 text-[#777b86] dark:text-[#9aa4b2]" />
                      <span>Editar</span>
                    </button>
                    <ActionHint
                      message={
                        !canDelete
                          ? 'Debes mantener al menos una categoría activa'
                          : habitCount > 0
                          ? `Eliminará esta categoría y reasignará ${habitCount} hábito(s)`
                          : 'Eliminará esta categoría de tu perfil'
                      }
                      tone="danger"
                      position="top"
                      align="right"
                    >
                      <button
                        type="button"
                        disabled={!canDelete}
                        onClick={() => setConfirmDeleteId(cat.id)}
                        className={`px-3.5 py-1.5 rounded-full border text-[12px] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                          canDelete
                            ? 'bg-white hover:bg-[#fbe1d1]/40 border-[#ececec] hover:border-[#b91c1c]/40 text-[#b91c1c] dark:bg-[#1b222b] dark:hover:bg-[#7f1d1d]/25 dark:border-[#252e3a] dark:hover:border-[#f87171]/45 dark:text-[#fca5a5] cursor-pointer'
                            : 'bg-[#f2f2f3] dark:bg-[#1b222b]/50 border-transparent text-[#a3a6af] dark:text-[#4b5563] cursor-not-allowed'
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Eliminar</span>
                      </button>
                    </ActionHint>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
