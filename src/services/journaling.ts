import { EnergyLevel, MoodTag } from '../types';

export interface MoodOption {
  id: MoodTag;
  label: string;
  colorHex: string;
  description: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'focused',
    label: 'Enfocado',
    colorHex: '#0284c7',
    description: 'Claridad mental y atención sostenida',
  },
  {
    id: 'motivated',
    label: 'Motivado',
    colorHex: '#059669',
    description: 'Alta iniciativa e impulso positivo',
  },
  {
    id: 'calm',
    label: 'Sereno',
    colorHex: '#4f46e5',
    description: 'Ritmo estable y sin fricción',
  },
  {
    id: 'tired',
    label: 'Cansado',
    colorHex: '#d97706',
    description: 'Baja reserva física o fatiga',
  },
  {
    id: 'stressed',
    label: 'Estresado',
    colorHex: '#e11d48',
    description: 'Tensión o sobrecarga externa',
  },
];

export const ENERGY_OPTIONS: { level: EnergyLevel; label: string; shortLabel: string }[] = [
  { level: 1, label: 'Muy baja', shortLabel: 'Agotado' },
  { level: 2, label: 'Baja', shortLabel: 'Baja' },
  { level: 3, label: 'Media', shortLabel: 'Estable' },
  { level: 4, label: 'Alta', shortLabel: 'Alta' },
  { level: 5, label: 'Máxima', shortLabel: 'Plena' },
];

export function getMoodMeta(tag?: MoodTag): MoodOption | undefined {
  return MOOD_OPTIONS.find((m) => m.id === tag);
}
