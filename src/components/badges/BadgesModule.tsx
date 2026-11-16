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
    cardTint: string;
  }
> = {
  bronze: {
    label: 'Bronce',
    medallionUnlocked:
      'bg-[#FFF7ED] border-[#FDBA74] text-[#C2410C] dark:bg-[#EA580C]/18 dark:border-[#FB923C]/35 dark:text-[#fb923c]',
    tierLabelColor: 'text-[#C2410C] dark:text-[#fb923c]',
    cardTint:
      'bg-[#FFF7ED]/30 border-[#FDBA74]/45 dark:bg-[#EA580C]/10 dark:border-[#FB923C]/30',
  },
  silver: {
    label: 'Plata',
    medallionUnlocked:
      'bg-[#E0F2FE] border-[#7DD3FC] text-[#0369A1] dark:bg-[#0284C7]/18 dark:border-[#38BDF8]/35 dark:text-[#38bdf8]',
    tierLabelColor: 'text-[#0369A1] dark:text-[#38bdf8]',
    cardTint:
      'bg-[#E0F2FE]/30 border-[#7DD3FC]/45 dark:bg-[#0284C7]/10 dark:border-[#38BDF8]/30',
  },
  gold: {
    label: 'Oro',
    medallionUnlocked:
      'bg-[#FEF3C7] border-[#FCD34D] text-[#B45309] dark:bg-[#D97706]/18 dark:border-[#FBBF24]/35 dark:text-[#fbbf24]',
    tierLabelColor: 'text-[#B45309] dark:text-[#fbbf24]',
    cardTint:
      'bg-[#FEF3C7]/35 border-[#FCD34D]/50 dark:bg-[#D97706]/10 dark:border-[#FBBF24]/30',
  },
  platinum: {
    label: 'Platino',
    medallionUnlocked:
      'bg-[#EEF2FF] border-[#A5B4FC] text-[#4338CA] dark:bg-[#4F46E5]/18 dark:border-[#818CF8]/35 dark:text-[#a5b4fc]',
    tierLabelColor: 'text-[#4338CA] dark:text-[#a5b4fc]',
    cardTint:
      'bg-[#EEF2FF]/40 border-[#A5B4FC]/50 dark:bg-[#4F46E5]/12 dark:border-[#818CF8]/30',
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
  subtitle,
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
      className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a] space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D97706] dark:text-[#fbbf24] shrink-0" />
            <h2 className="text-[18px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-[14px] text-[#777b86] dark:text-[#9aa4b2] mt-1">{subtitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-1.5">
            <span>
              <strong className="font-medium text-[#059669] dark:text-[#34d399] tabular-nums">{unlockedCount}</strong> de{' '}
              <strong className="font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums">{badges.length}</strong> insignias desbloqueadas
            </span>
            {nextClosest && (
              <>
                <span aria-hidden="true" className="text-[#a3a6af] dark:text-[#6f7a8a]">·</span>
                <span>
                  Próximo hito:{' '}
                  <strong className="font-medium text-[#B45309] dark:text-[#fbbf24]">{nextClosest.definition.name}</strong>{' '}
                  <span className="tabular-nums text-[#777b86] dark:text-[#9aa4b2]">
                    ({nextClosest.currentValue}/{nextClosest.targetValue})
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] self-start lg:self-auto max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
            }`}
          >
            Todas ({badges.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unlocked')}
            className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'unlocked'
                ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
            }`}
          >
            Desbloqueadas ({unlockedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('locked')}
            className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              filter === 'locked'
                ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
            }`}
          >
            En progreso ({badges.length - unlockedCount})
          </button>
        </div>
      </div>

      {/* Badges Grid */}
      {visibleBadges.length === 0 ? (
        <div className="steep-card-mist p-10 text-center">
          <p className="text-[14px] text-[#777b86] dark:text-[#9aa4b2]">
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
                className={`rounded-[20px] p-4 sm:p-5 flex flex-col justify-between transition-colors border ${
                  isUnlocked
                    ? tierStyle.cardTint
                    : 'bg-[#f2f2f3] dark:bg-[#1b222b] border-transparent dark:border-[#252e3a]/60'
                }`}
              >
                <div>
                  {/* Top Row: Medallion + Explicit State */}
                  <div className="flex items-start justify-between gap-2 mb-3.5">
                    <div
                      className={`w-12 h-12 rounded-[14px] border flex items-center justify-center shrink-0 transition-colors ${
                        isUnlocked
                          ? tierStyle.medallionUnlocked
                          : 'bg-white/75 border-[#ececec] text-[#a3a6af] dark:bg-[#141920] dark:border-[#252e3a] dark:text-[#6f7a8a]'
                      }`}
                    >
                      {renderBadgeIcon(definition.iconName, 'w-6 h-6')}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-medium">
                      {isUnlocked ? (
                        <span className="text-[#059669] dark:text-[#34d399] inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Obtenida</span>
                        </span>
                      ) : (
                        <span className="text-[#979799] dark:text-[#6f7a8a] inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Pendiente</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quiet Metadata Line */}
                  <div className="flex items-center gap-1.5 text-[12px] text-[#979799] dark:text-[#6f7a8a]">
                    <span
                      className={
                        isUnlocked
                          ? `${tierStyle.tierLabelColor} font-medium`
                          : 'text-[#979799] dark:text-[#6f7a8a]'
                      }
                    >
                      {tierStyle.label}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{definition.subtitle}</span>
                  </div>

                  <h3
                    className={`text-[16px] font-medium tracking-[-0.01em] mt-1 ${
                      isUnlocked
                        ? 'text-[#17191c] dark:text-[#f1f5f9]'
                        : 'text-[#777b86] dark:text-[#9aa4b2]'
                    }`}
                  >
                    {definition.name}
                  </h3>

                  <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-1 leading-relaxed">
                    {definition.description}
                  </p>
                </div>

                {/* Footer Progress or Qualifying Habit */}
                <div className="mt-4 pt-3.5 border-t border-[#ececec] dark:border-[#252e3a]">
                  {isUnlocked ? (
                    <div className="text-[12px] text-[#777b86] dark:text-[#9aa4b2] space-y-0.5">
                      {qualifyingHabitTitle && (
                        <p className="truncate">
                          Hábito:{' '}
                          <span className="text-[#17191c] dark:text-[#f1f5f9] font-medium">
                            {qualifyingHabitTitle}
                          </span>
                        </p>
                      )}
                      {unlockedDateLabel && (
                        <p className="text-[#979799] dark:text-[#6f7a8a] tabular-nums">
                          Asignada el {unlockedDateLabel}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-[#777b86] dark:text-[#9aa4b2] tabular-nums font-medium">
                          {currentValue} / {targetValue}
                        </span>
                        <span className="text-[#059669] dark:text-[#34d399] font-medium tabular-nums">
                          {percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white dark:bg-[#141920] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#059669] transition-all duration-300"
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
