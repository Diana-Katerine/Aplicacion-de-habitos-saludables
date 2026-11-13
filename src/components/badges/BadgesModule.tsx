import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  Shield,
  Zap,
  Award,
  Crown,
  Compass,
  Star,
  Trophy,
  Check,
  Lock,
} from 'lucide-react';
import { BadgeDefinition, BadgeTier, EvaluatedBadge } from '../../types';

interface Props {
  badges: EvaluatedBadge[];
  title?: string;
  subtitle?: string;
}

const TIER_STYLES: Record<
  BadgeTier,
  {
    label: string;
    medallionUnlocked: string;
    tierLabelColor: string;
  }
> = {
  bronze: {
    label: 'Bronce',
    medallionUnlocked: 'bg-[#f2f2f3] border-[#ececec] text-[#5d2a1a]',
    tierLabelColor: 'text-[#777b86]',
  },
  silver: {
    label: 'Plata',
    medallionUnlocked: 'bg-[#f2f2f3] border-[#d4d4d8] text-[#17191c]',
    tierLabelColor: 'text-[#17191c]',
  },
  gold: {
    label: 'Oro',
    medallionUnlocked: 'bg-[#fbe1d1] border-[#e5b89e] text-[#5d2a1a]',
    tierLabelColor: 'text-[#5d2a1a]',
  },
  platinum: {
    label: 'Platino',
    medallionUnlocked: 'bg-[#17191c] border-[#17191c] text-white',
    tierLabelColor: 'text-[#17191c]',
  },
};

function renderBadgeIcon(iconName: BadgeDefinition['iconName'], className: string) {
  switch (iconName) {
    case 'Flame':
      return <Flame className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'Crown':
      return <Crown className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Star':
      return <Star className={className} />;
    case 'Trophy':
      return <Trophy className={className} />;
  }
}

export const BadgesModule: React.FC<Props> = ({
  badges,
  title = 'Insignias de racha',
  subtitle = 'Hitos asignados automáticamente según tus rachas consecutivas y disciplina acumulada.',
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;
  const nextClosest = badges
    .filter((b) => !b.isUnlocked)
    .sort((a, b) => b.percentage - a.percentage)[0];

  const visibleBadges = badges.filter((b) => {
    if (filter === 'unlocked') return b.isUnlocked;
    if (filter === 'locked') return !b.isUnlocked;
    return true;
  });

  return (
    <section
      aria-label="Módulo de Insignias"
      className="rounded-[24px] p-6 bg-white border border-[#ececec] space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#5d2a1a] shrink-0" />
            <h2 className="text-[18px] font-medium text-[#17191c] tracking-[-0.01em]">
              {title}
            </h2>
          </div>
          <p className="text-[14px] text-[#777b86] mt-1">{subtitle}</p>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#777b86] mt-2">
            <span>
              <strong className="font-medium text-[#17191c] tabular-nums">{unlockedCount}</strong> de{' '}
              <strong className="font-medium text-[#17191c] tabular-nums">{badges.length}</strong> insignias desbloqueadas
            </span>
            {nextClosest && (
              <>
                <span aria-hidden="true" className="text-[#a3a6af]">·</span>
                <span>
                  Próximo hito:{' '}
                  <strong className="font-medium text-[#5d2a1a]">{nextClosest.definition.name}</strong>{' '}
                  <span className="tabular-nums text-[#777b86]">
                    ({nextClosest.currentValue}/{nextClosest.targetValue})
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-[#17191c] font-medium shadow-xs'
                : 'text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            Todas ({badges.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unlocked')}
            className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'unlocked'
                ? 'bg-white text-[#17191c] font-medium shadow-xs'
                : 'text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            Desbloqueadas ({unlockedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('locked')}
            className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'locked'
                ? 'bg-white text-[#17191c] font-medium shadow-xs'
                : 'text-[#777b86] hover:text-[#17191c]'
            }`}
          >
            En progreso ({badges.length - unlockedCount})
          </button>
        </div>
      </div>

      {/* Badges Grid */}
      {visibleBadges.length === 0 ? (
        <div className="steep-card-mist p-10 text-center">
          <p className="text-[14px] text-[#777b86]">
            No hay insignias en esta vista todavía. Sigue sumando días consecutivos para desbloquear nuevos hitos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleBadges.map((badge) => {
            const {
              definition,
              isUnlocked,
              unlockedAt,
              qualifyingHabitTitle,
              currentValue,
              targetValue,
              percentage,
            } = badge;
            const tierStyle = TIER_STYLES[definition.tier];

            const unlockedDateLabel = unlockedAt
              ? new Intl.DateTimeFormat('es-ES', {
                  day: 'numeric',
                  month: 'short',
                }).format(new Date(unlockedAt))
              : null;

            return (
              <motion.div
                key={definition.id}
                layout
                className={`rounded-[20px] p-5 flex flex-col justify-between transition-colors ${
                  isUnlocked
                    ? 'bg-white border border-[#17191c]/15'
                    : 'bg-[#f2f2f3] border border-transparent'
                }`}
              >
                <div>
                  {/* Top Row: Medallion + Explicit State */}
                  <div className="flex items-start justify-between gap-2 mb-3.5">
                    <div
                      className={`w-11 h-11 rounded-[14px] border flex items-center justify-center shrink-0 transition-colors ${
                        isUnlocked
                          ? tierStyle.medallionUnlocked
                          : 'bg-white/75 border-[#ececec] text-[#a3a6af]'
                      }`}
                    >
                      {renderBadgeIcon(definition.iconName, 'w-5 h-5')}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-medium">
                      {isUnlocked ? (
                        <span className="text-[#17191c] inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Obtenida</span>
                        </span>
                      ) : (
                        <span className="text-[#979799] inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Pendiente</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quiet Metadata Line */}
                  <div className="flex items-center gap-1.5 text-[12px] text-[#979799]">
                    <span className={isUnlocked ? `${tierStyle.tierLabelColor} font-medium` : 'text-[#979799]'}>
                      Nivel {tierStyle.label}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{definition.subtitle}</span>
                  </div>

                  <h3
                    className={`text-[16px] font-medium tracking-[-0.01em] mt-1 ${
                      isUnlocked ? 'text-[#17191c]' : 'text-[#777b86]'
                    }`}
                  >
                    {definition.name}
                  </h3>

                  <p className="text-[13px] text-[#777b86] mt-1 leading-relaxed">
                    {definition.description}
                  </p>
                </div>

                {/* Footer Progress or Qualifying Habit */}
                <div className="mt-4 pt-3.5 border-t border-[#ececec]">
                  {isUnlocked ? (
                    <div className="text-[12px] text-[#777b86] space-y-0.5">
                      {qualifyingHabitTitle && (
                        <p className="truncate">
                          Hábito: <span className="text-[#17191c] font-medium">{qualifyingHabitTitle}</span>
                        </p>
                      )}
                      {unlockedDateLabel && (
                        <p className="text-[#979799] tabular-nums">
                          Asignada el {unlockedDateLabel}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-[#777b86] tabular-nums font-medium">
                          {currentValue} / {targetValue}
                        </span>
                        <span className="text-[#5d2a1a] font-medium tabular-nums">
                          {percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#5d2a1a] transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};
