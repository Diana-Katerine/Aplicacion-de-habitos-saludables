import React from 'react';
import {
  Droplets,
  Dumbbell,
  Brain,
  Apple,
  Moon,
  BookOpen,
  CheckSquare,
  Flame,
  Sparkles,
  Heart,
  Clock,
  Compass,
  Target,
  Zap,
  Coffee,
  Sun,
  Activity,
  Music,
  Briefcase,
  Leaf,
  Laptop,
  Home,
  Star,
  Shield,
  LucideProps,
} from 'lucide-react';

export interface CategoryIconOption {
  name: string;
  label: string;
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { name: 'Droplets', label: 'Agua' },
  { name: 'Dumbbell', label: 'Ejercicio' },
  { name: 'Brain', label: 'Mente' },
  { name: 'Apple', label: 'Nutrición' },
  { name: 'Moon', label: 'Sueño' },
  { name: 'BookOpen', label: 'Lectura' },
  { name: 'CheckSquare', label: 'Tareas' },
  { name: 'Flame', label: 'Energía' },
  { name: 'Heart', label: 'Salud' },
  { name: 'Target', label: 'Metas' },
  { name: 'Zap', label: 'Impulso' },
  { name: 'Sun', label: 'Mañana' },
  { name: 'Clock', label: 'Tiempo' },
  { name: 'Compass', label: 'Rumbo' },
  { name: 'Coffee', label: 'Rutina' },
  { name: 'Sparkles', label: 'Bienestar' },
  { name: 'Activity', label: 'Pulso' },
  { name: 'Leaf', label: 'Naturaleza' },
  { name: 'Briefcase', label: 'Trabajo' },
  { name: 'Laptop', label: 'Enfoque' },
  { name: 'Music', label: 'Arte' },
  { name: 'Home', label: 'Hogar' },
  { name: 'Star', label: 'Destacado' },
  { name: 'Shield', label: 'Disciplina' },
];

export const CATEGORY_COLOR_PRESETS: { hex: string; label: string }[] = [
  { hex: '#10B981', label: 'Esmeralda' },
  { hex: '#0EA5E9', label: 'Cielo' },
  { hex: '#8B5CF6', label: 'Violeta' },
  { hex: '#F59E0B', label: 'Ámbar' },
  { hex: '#6366F1', label: 'Índigo' },
  { hex: '#EC4899', label: 'Rosa' },
  { hex: '#14B8A6', label: 'Turquesa' },
  { hex: '#F43F5E', label: 'Coral' },
  { hex: '#84CC16', label: 'Lima' },
  { hex: '#FB923C', label: 'Naranja' },
  { hex: '#38BDF8', label: 'Azul Claro' },
  { hex: '#A855F7', label: 'Púrpura' },
];

interface Props extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<Props> = ({ name, ...props }) => {
  switch (name.toLowerCase()) {
    case 'droplets':
    case 'agua':
    case 'hidratacion':
      return <Droplets {...props} />;
    case 'dumbbell':
    case 'ejercicio':
    case 'pesas':
      return <Dumbbell {...props} />;
    case 'brain':
    case 'mente':
    case 'foco':
    case 'meditacion':
      return <Brain {...props} />;
    case 'apple':
    case 'nutricion':
    case 'alimentacion':
      return <Apple {...props} />;
    case 'moon':
    case 'sueño':
    case 'descanso':
      return <Moon {...props} />;
    case 'bookopen':
    case 'lectura':
    case 'aprendizaje':
      return <BookOpen {...props} />;
    case 'checksquare':
    case 'productividad':
      return <CheckSquare {...props} />;
    case 'flame':
    case 'fuego':
      return <Flame {...props} />;
    case 'sparkles':
      return <Sparkles {...props} />;
    case 'heart':
      return <Heart {...props} />;
    case 'clock':
      return <Clock {...props} />;
    case 'compass':
      return <Compass {...props} />;
    case 'target':
      return <Target {...props} />;
    case 'zap':
      return <Zap {...props} />;
    case 'coffee':
      return <Coffee {...props} />;
    case 'sun':
      return <Sun {...props} />;
    case 'music':
      return <Music {...props} />;
    case 'briefcase':
      return <Briefcase {...props} />;
    case 'leaf':
      return <Leaf {...props} />;
    case 'laptop':
      return <Laptop {...props} />;
    case 'home':
      return <Home {...props} />;
    case 'star':
      return <Star {...props} />;
    case 'shield':
      return <Shield {...props} />;
    default:
      return <Activity {...props} />;
  }
};
