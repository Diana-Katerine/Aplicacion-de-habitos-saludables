import type React from 'react';
import { BioluminescentThemeId, Category } from '../types';

export interface BioluminescentTheme {
  id: Exclude<BioluminescentThemeId, 'auto'>;
  label: string;
  shortLabel: string;
  glowHex: string;
  secondaryHex: string;
  rgb: string;
  cssVars: React.CSSProperties;
}

export const BIOLUMINESCENT_PRESETS: Record<
  Exclude<BioluminescentThemeId, 'auto' | 'custom'>,
  Omit<BioluminescentTheme, 'cssVars'>
> = {
  'cool-blue': {
    id: 'cool-blue',
    label: 'Brillo Azul Frío',
    shortLabel: 'Azul Frío',
    glowHex: '#0284C7',
    secondaryHex: '#38BDF8',
    rgb: '2, 132, 199',
  },
  'warm-amber': {
    id: 'warm-amber',
    label: 'Brillo Ámbar Cálido',
    shortLabel: 'Ámbar Cálido',
    glowHex: '#B45309',
    secondaryHex: '#D97706',
    rgb: '180, 83, 9',
  },
  emerald: {
    id: 'emerald',
    label: 'Brillo Esmeralda',
    shortLabel: 'Esmeralda',
    glowHex: '#047857',
    secondaryHex: '#10B981',
    rgb: '4, 120, 87',
  },
  indigo: {
    id: 'indigo',
    label: 'Brillo Índigo',
    shortLabel: 'Índigo',
    glowHex: '#4F46E5',
    secondaryHex: '#6366F1',
    rgb: '79, 70, 229',
  },
  magenta: {
    id: 'magenta',
    label: 'Brillo Magenta',
    shortLabel: 'Magenta',
    glowHex: '#BE185D',
    secondaryHex: '#EC4899',
    rgb: '190, 24, 93',
  },
};

export const BIOLUMINESCENT_SELECTOR_OPTIONS: {
  id: BioluminescentThemeId;
  label: string;
  previewHex?: string;
}[] = [
  { id: 'auto', label: 'Automático (por categoría)' },
  { id: 'cool-blue', label: 'Azul Frío (Enfoque)', previewHex: '#0284C7' },
  { id: 'warm-amber', label: 'Ámbar Cálido (Vitalidad)', previewHex: '#B45309' },
  { id: 'emerald', label: 'Esmeralda', previewHex: '#047857' },
  { id: 'indigo', label: 'Índigo Nocturno', previewHex: '#4F46E5' },
  { id: 'magenta', label: 'Magenta Creativo', previewHex: '#BE185D' },
  { id: 'custom', label: 'Usar color exacto' },
];

const DEFAULT_CATEGORY_HEX_BY_ID: Record<number, string> = {
  1: '#0EA5E9',
  2: '#10B981',
  3: '#8B5CF6',
  4: '#F59E0B',
  5: '#6366F1',
  6: '#EC4899',
  7: '#14B8A6',
};

export function hexToRgbString(hex: string): string {
  const clean = hex.replace('#', '').trim();
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '93, 42, 26';
}

function withCssVars(
  base: Omit<BioluminescentTheme, 'cssVars'>
): BioluminescentTheme {
  return {
    ...base,
    cssVars: {
      '--bio-rgb': base.rgb,
      '--bio-hex': base.glowHex,
    } as React.CSSProperties,
  };
}

function buildCustomTheme(colorHex: string): BioluminescentTheme {
  const safeHex = /^#[0-9A-Fa-f]{6}$/.test(colorHex) ? colorHex.toUpperCase() : '#5D2A1A';
  const rgb = hexToRgbString(safeHex);
  return withCssVars({
    id: 'custom',
    label: 'Brillo Personalizado',
    shortLabel: 'Personalizado',
    glowHex: safeHex,
    secondaryHex: safeHex,
    rgb,
  });
}

export function getCategoryBioluminescentTheme(
  category: Pick<Category, 'id' | 'name' | 'colorHex' | 'bioluminescentTheme'>
): BioluminescentTheme {
  const explicit = category.bioluminescentTheme;
  if (explicit && explicit !== 'auto') {
    if (explicit === 'custom') {
      return buildCustomTheme(category.colorHex);
    }
    return withCssVars(BIOLUMINESCENT_PRESETS[explicit]);
  }

  const normalizedName = category.name.toLowerCase();
  const normalizedHex = (category.colorHex || '#10B981').toUpperCase();
  const defaultHex = DEFAULT_CATEGORY_HEX_BY_ID[category.id];
  const userCustomizedHex = Boolean(defaultHex && defaultHex !== normalizedHex);

  if (userCustomizedHex) {
    return buildCustomTheme(normalizedHex);
  }

  if (
    /foco|focus|mente|concentr|deep|profund|hidrat|agua|cognitiv|estudi/.test(
      normalizedName
    )
  ) {
    return withCssVars(BIOLUMINESCENT_PRESETS['cool-blue']);
  }

  if (
    /vital|nutri|energ|cuerpo|salud|aliment|fuerza|sol/.test(normalizedName)
  ) {
    return withCssVars(BIOLUMINESCENT_PRESETS['warm-amber']);
  }

  if (/ejerc|deport|movim|cardio|productiv|entren/.test(normalizedName)) {
    return withCssVars(BIOLUMINESCENT_PRESETS.emerald);
  }

  if (/sueñ|calma|descans|medit|noche|relax/.test(normalizedName)) {
    return withCssVars(BIOLUMINESCENT_PRESETS.indigo);
  }

  if (/aprend|creativ|lectur|arte|idioma|músic/.test(normalizedName)) {
    return withCssVars(BIOLUMINESCENT_PRESETS.magenta);
  }

  if (normalizedHex === '#0EA5E9' || normalizedHex === '#3B82F6' || normalizedHex === '#06B6D4') {
    return withCssVars(BIOLUMINESCENT_PRESETS['cool-blue']);
  }
  if (normalizedHex === '#F59E0B' || normalizedHex === '#F97316') {
    return withCssVars(BIOLUMINESCENT_PRESETS['warm-amber']);
  }
  if (normalizedHex === '#10B981' || normalizedHex === '#14B8A6') {
    return withCssVars(BIOLUMINESCENT_PRESETS.emerald);
  }
  if (normalizedHex === '#6366F1' || normalizedHex === '#8B5CF6') {
    return withCssVars(BIOLUMINESCENT_PRESETS.indigo);
  }
  if (normalizedHex === '#EC4899' || normalizedHex === '#F43F5E') {
    return withCssVars(BIOLUMINESCENT_PRESETS.magenta);
  }

  return buildCustomTheme(normalizedHex);
}
