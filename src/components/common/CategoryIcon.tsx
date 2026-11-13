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
  LucideProps,
} from 'lucide-react';

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
    default:
      return <Activity {...props} />;
  }
};
