import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Users,
  Target,
  Plus,
  Check,
  Calendar,
  Trash2,
  Minus,
  X,
  Award,
} from 'lucide-react';
import { Category, Challenge, DailyFocus, EvaluatedBadge, Habit, HabitLog } from '../../types';
import { StorageService } from '../../services/storage';
import { CategoryIcon } from '../common/CategoryIcon';
import { BadgesModule } from '../badges/BadgesModule';
import { getCategoryBioluminescentTheme } from '../../services/bioluminescentTheme';
import { ActionHint } from '../common/ActionHint';

interface Props {
  userId: string;
  timezone?: string;
  habits: Habit[];
  logs: HabitLog[];
  dailyFocuses: DailyFocus[];
  categories: Category[];
  badges: EvaluatedBadge[];
  joinedChallengeIds: string[];
  customChallenges: Challenge[];
  onToggleJoin: (challengeId: string) => void;
  onCreateCustomChallenge: (data: {
    title: string;
    description: string;
    targetCount: number;
    unitLabel: string;
    categoryId?: number;
    endDate?: string;
  }) => void;
  onStepCustomChallenge: (challengeId: string, delta: number) => void;
  onDeleteCustomChallenge: (challengeId: string) => void;
}

export const ChallengesView: React.FC<Props> = ({
  timezone,
  habits,
  logs,
  dailyFocuses,
  categories,
  badges,
  joinedChallengeIds,
  customChallenges,
  onToggleJoin,
  onCreateCustomChallenge,
  onStepCustomChallenge,
  onDeleteCustomChallenge,
}) => {
  const [filter, setFilter] = useState<'all' | 'community' | 'milestone' | 'badges' | 'joined'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state for custom challenge
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetCount, setTargetCount] = useState(14);
  const [unitLabel, setUnitLabel] = useState('días');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultChallenges = StorageService.getDefaultChallenges();
  const allChallenges: Challenge[] = [...customChallenges, ...defaultChallenges];
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Compute progress for all challenges
  const enrichedChallenges = allChallenges.map((ch) => {
    const progress = StorageService.computeChallengeProgress(
      ch,
      habits,
      logs,
      dailyFocuses,
      timezone
    );
    const isJoined = ch.kind === 'community' ? joinedChallengeIds.includes(ch.id) : true;
    return { challenge: ch, progress, isJoined };
  });

  // Summary KPIs
  const activeCommunityCount = enrichedChallenges.filter(
    (item) => item.challenge.kind === 'community' && item.isJoined
  ).length;
  const activeCustomCount = customChallenges.length;
  const completedMilestonesCount = enrichedChallenges.filter(
    (item) => item.progress.isCompleted
  ).length;

  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const monthlyCheckins = logs.filter(
    (l) => l.isCompleted && l.logDate.startsWith(currentMonthPrefix)
  ).length;

  // Days remaining in current month
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(0, lastDay - now.getDate());

  // Filter lists
  const visibleItems = enrichedChallenges.filter((item) => {
    if (filter === 'badges') return false;
    if (filter === 'community') return item.challenge.kind === 'community';
    if (filter === 'milestone')
      return item.challenge.kind === 'milestone' || item.challenge.kind === 'custom';
    if (filter === 'joined') return item.isJoined;
    return true;
  });

  const communityItems = visibleItems.filter((i) => i.challenge.kind === 'community');
  const milestoneItems = visibleItems.filter(
    (i) => i.challenge.kind === 'milestone' || i.challenge.kind === 'custom'
  );

  const handleJoinClick = (challengeId: string, wasJoined: boolean) => {
    onToggleJoin(challengeId);
    if (!wasJoined) {
      try {
        confetti({
          particleCount: 42,
          spread: 55,
          origin: { y: 0.7 },
          colors: ['#059669', '#10b981', '#f59e0b', '#0284c7', '#6366f1'],
        });
      } catch {
        // ignore
      }
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Escribe un título para tu reto personal.');
      return;
    }
    if (targetCount < 1) {
      setFormError('La meta debe ser al menos 1.');
      return;
    }

    onCreateCustomChallenge({
      title: title.trim(),
      description: description.trim(),
      targetCount,
      unitLabel: unitLabel.trim() || 'días',
      categoryId,
    });

    setTitle('');
    setDescription('');
    setTargetCount(14);
    setUnitLabel('días');
    setFormError(null);
    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#ececec] dark:border-[#252e3a]">
        <div>
          <h1 className="font-signifier font-normal text-[36px] md:text-[44px] leading-[1.15] tracking-[-0.015em] text-[#17191c] dark:text-[#f1f5f9]">
            Retos &amp; <em className="italic font-normal chromatic-gradient-text">hitos</em>
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="btn-chromatic px-5 py-2.5 rounded-full text-white text-[14px] font-medium transition-all inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear reto personal</span>
        </button>
      </div>

      {/* Unified 1-Row Hairline Metric Strip */}
      <div className="rounded-[20px] bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a] overflow-hidden">
        <div className="h-1 w-full chromatic-accent-bar" />
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#ececec] dark:divide-[#252e3a]">
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 min-w-0">
            <span className="text-[13px] text-[#777b86] dark:text-[#9aa4b2]">Retos activos</span>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-[24px] leading-none font-medium text-[#4F46E5] dark:text-[#a5b4fc] tabular-nums">
                {activeCommunityCount + activeCustomCount}
              </span>
              <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] tabular-nums">
                {activeCommunityCount} com. · {activeCustomCount} propios
              </span>
            </div>
          </div>

          <div className="px-4 sm:px-5 py-3.5 sm:py-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 min-w-0">
            <span className="text-[13px] text-[#777b86] dark:text-[#9aa4b2]">Hitos alcanzados</span>
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] leading-none font-medium text-[#EA580C] dark:text-[#fb923c] tabular-nums">
                {completedMilestonesCount}
              </span>
              <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] tabular-nums">
                / {allChallenges.length}
              </span>
            </div>
          </div>

          <div className="px-4 sm:px-5 py-3.5 sm:py-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 min-w-0">
            <span className="text-[13px] text-[#777b86] dark:text-[#9aa4b2]">Aporte mensual</span>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-[24px] leading-none font-medium text-[#059669] dark:text-[#34d399] tabular-nums">
                {monthlyCheckins}
              </span>
              <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a] tabular-nums">
                check-ins · {daysRemaining} d restantes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Segmented Control */}
      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'all'
              ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
              : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
          }`}
        >
          Todos ({allChallenges.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('community')}
          className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'community'
              ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
              : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
          }`}
        >
          Metas mensuales
        </button>
        <button
          type="button"
          onClick={() => setFilter('milestone')}
          className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'milestone'
              ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
              : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
          }`}
        >
          Hitos personales
        </button>
        <button
          type="button"
          onClick={() => setFilter('badges')}
          className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'badges'
              ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
              : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
          }`}
        >
          Insignias ({badges.filter((b) => b.isUnlocked).length}/{badges.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('joined')}
          className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'joined'
              ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
              : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
          }`}
        >
          Mis retos activos
        </button>
      </div>

      {/* Monthly Community Goals Section */}
      {communityItems.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[18px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#4F46E5] dark:text-[#818cf8]" />
            <span>Metas mensuales de la comunidad</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {communityItems.map(({ challenge, progress, isJoined }) => {
              const cat = challenge.categoryId ? categoryMap.get(challenge.categoryId) : undefined;
              const bioTheme = cat ? getCategoryBioluminescentTheme(cat) : null;
              const communityPct =
                challenge.communityTotalTarget && challenge.communityCurrentTotal
                  ? Math.min(
                      100,
                      Math.round(
                        ((challenge.communityCurrentTotal + progress.current) /
                          challenge.communityTotalTarget) *
                          100
                      )
                    )
                  : 0;

              return (
                <motion.div
                  key={challenge.id}
                  layout
                  style={bioTheme?.cssVars}
                  className={`rounded-[24px] p-4 sm:p-6 border flex flex-col justify-between transition-colors bio-accent ${
                    progress.isCompleted
                      ? 'bg-[#ECFDF5]/40 border-[#059669]/35 dark:bg-[#059669]/12 dark:border-[#34d399]/35'
                      : isJoined
                      ? 'bg-white border-[#0284C7]/35 dark:bg-[#141920] dark:border-[#38bdf8]/35'
                      : 'bg-white border-[#ececec] dark:bg-[#141920] dark:border-[#252e3a]'
                  }`}
                >
                  <div>
                    {/* Quiet unboxed metadata line */}
                    <div className="flex items-center justify-between gap-2 text-[12px] text-[#979799] dark:text-[#6f7a8a] mb-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-medium text-[#0369A1] dark:text-[#38bdf8]">
                          {challenge.monthLabel || 'Meta Mensual'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {((challenge.participantsCount || 0) + (isJoined ? 1 : 0)).toLocaleString('es-ES')} participantes
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{daysRemaining} d restantes</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 border ${
                          bioTheme
                            ? ''
                            : 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0284C7] dark:bg-[#0284C7]/15 dark:border-[#38BDF8]/30 dark:text-[#38bdf8]'
                        }`}
                        style={
                          bioTheme
                            ? {
                                backgroundColor: `rgba(${bioTheme.rgb}, 0.14)`,
                                borderColor: `rgba(${bioTheme.rgb}, 0.28)`,
                                color: 'var(--bio-text)',
                              }
                            : undefined
                        }
                      >
                        {cat ? (
                          <CategoryIcon name={cat.iconName} className="w-6 h-6" />
                        ) : (
                          <Calendar className="w-6 h-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[17px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
                          {challenge.title}
                        </h3>
                        <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-1 leading-relaxed">
                          {challenge.description}
                        </p>
                      </div>
                    </div>

                    {/* Personal Progress */}
                    <div className="mt-5 pt-4 border-t border-[#ececec] dark:border-[#252e3a] space-y-3">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[13px] mb-1.5">
                          <span className="text-[#777b86] dark:text-[#9aa4b2]">
                            {isJoined ? 'Tu avance este mes' : 'Tu avance potencial'}
                          </span>
                          <span className="font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums">
                            {progress.current} / {progress.target} {challenge.unitLabel}{' '}
                            <span className="text-[#059669] dark:text-[#34d399] ml-1">({progress.percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${progress.percentage}%`,
                              backgroundColor: progress.isCompleted ? '#059669' : '#0284C7',
                            }}
                          />
                        </div>
                      </div>

                      {/* Community collective progress */}
                      {challenge.communityTotalTarget && (
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[12px] text-[#979799] dark:text-[#6f7a8a] mb-1">
                            <span>Objetivo colectivo global</span>
                            <span className="tabular-nums font-medium text-[#777b86] dark:text-[#9aa4b2]">
                              {(
                                (challenge.communityCurrentTotal || 0) + progress.current
                              ).toLocaleString('es-ES')}{' '}
                              / {challenge.communityTotalTarget.toLocaleString('es-ES')} ({communityPct}%)
                            </span>
                          </div>
                          <div className="w-full h-1 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#4F46E5]/80 dark:bg-[#818cf8]/80 transition-all duration-300"
                              style={{ width: `${communityPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 pt-3.5 border-t border-[#ececec] dark:border-[#252e3a] flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[12px] font-medium text-[#777b86] dark:text-[#9aa4b2] flex items-center gap-1.5 min-w-0">
                      <Award className="w-3.5 h-3.5 text-[#D97706] dark:text-[#fbbf24] shrink-0" />
                      <span className="truncate">{challenge.rewardLabel}</span>
                    </span>

                    {progress.isCompleted ? (
                      <span className="text-[#047857] dark:text-[#6ee7b7] text-[13px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Meta cumplida</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleJoinClick(challenge.id, isJoined)}
                        className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                          isJoined
                            ? 'bg-transparent hover:bg-[#E0F2FE]/50 dark:hover:bg-[#0284C7]/15 border border-[#0284C7]/35 dark:border-[#38bdf8]/40 text-[#0369A1] dark:text-[#38bdf8]'
                            : 'btn-chromatic text-white'
                        }`}
                      >
                        {isJoined ? 'Participando · Salir' : 'Unirse al reto'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Personal Milestones & Custom Challenges Section */}
      {milestoneItems.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[18px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#D97706] dark:text-[#fbbf24]" />
            <span>Hitos personales &amp; metas propias</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestoneItems.map(({ challenge, progress }) => {
              const isCustom = challenge.kind === 'custom';
              const cat = challenge.categoryId ? categoryMap.get(challenge.categoryId) : undefined;
              const bioTheme = cat ? getCategoryBioluminescentTheme(cat) : null;

              return (
                <div
                  key={challenge.id}
                  style={bioTheme?.cssVars}
                  className={`rounded-[24px] p-4 sm:p-6 flex flex-col justify-between transition-colors bio-accent ${
                    progress.isCompleted
                      ? 'bg-[#ECFDF5]/45 border border-[#059669]/30 dark:bg-[#059669]/12 dark:border-[#34d399]/30'
                      : 'steep-card-mist'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3.5">
                      <div
                        className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 border ${
                          progress.isCompleted
                            ? 'bg-[#059669] border-[#059669] text-white'
                            : bioTheme
                            ? 'bg-white dark:bg-[#1b222b] border-[#ececec] dark:border-[#252e3a]'
                            : 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706] dark:bg-[#D97706]/15 dark:border-[#FBBF24]/30 dark:text-[#fbbf24]'
                        }`}
                        style={
                          !progress.isCompleted && bioTheme
                            ? {
                                backgroundColor: `rgba(${bioTheme.rgb}, 0.14)`,
                                borderColor: `rgba(${bioTheme.rgb}, 0.28)`,
                                color: 'var(--bio-text)',
                              }
                            : undefined
                        }
                      >
                        {progress.isCompleted ? (
                          <Check className="w-6 h-6 stroke-[2.5]" />
                        ) : cat ? (
                          <CategoryIcon name={cat.iconName} className="w-6 h-6" />
                        ) : (
                          <Target className="w-6 h-6" />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a]">
                          {isCustom ? 'Reto propio' : challenge.rewardLabel}
                        </span>
                        {isCustom && (
                          <ActionHint
                            message="Eliminará permanentemente este reto personal"
                            tone="danger"
                            position="top"
                            align="right"
                          >
                            <button
                              type="button"
                              onClick={() => onDeleteCustomChallenge(challenge.id)}
                              aria-label="Eliminar reto personal"
                              className="w-10 h-10 rounded-full flex items-center justify-center text-[#979799] dark:text-[#6f7a8a] hover:text-[#b91c1c] dark:hover:text-[#f87171] hover:bg-[#fee2e2]/60 dark:hover:bg-[#7f1d1d]/30 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-[18px] h-[18px]" />
                            </button>
                          </ActionHint>
                        )}
                      </div>
                    </div>

                    <h3 className="text-[17px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
                      {challenge.title}
                    </h3>
                    <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-1 leading-relaxed">
                      {challenge.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#ececec] dark:border-[#252e3a] space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                      <span className="font-medium text-[#17191c] dark:text-[#f1f5f9] tabular-nums">
                        {progress.current} / {progress.target} {challenge.unitLabel}
                      </span>
                      <span
                        className={`font-medium tabular-nums ${
                          progress.isCompleted
                            ? 'text-[#047857] dark:text-[#6ee7b7]'
                            : 'text-[#0284C7] dark:text-[#38bdf8]'
                        }`}
                      >
                        {progress.isCompleted ? 'Desbloqueado' : `${progress.percentage}%`}
                      </span>
                    </div>

                    <div
                      className={`w-full h-1.5 rounded-full overflow-hidden ${
                        progress.isCompleted
                          ? 'bg-[#D1FAE5] dark:bg-[#059669]/25'
                          : 'bg-white dark:bg-[#1b222b]'
                      }`}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${progress.percentage}%`,
                          backgroundColor: progress.isCompleted
                            ? '#059669'
                            : bioTheme
                            ? bioTheme.secondaryHex
                            : '#D97706',
                        }}
                      />
                    </div>

                    {isCustom && (
                      <div className="pt-1.5 flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onStepCustomChallenge(challenge.id, -1)}
                          disabled={progress.current <= 0}
                          className="w-9 h-9 rounded-full bg-white dark:bg-[#1b222b] hover:bg-[#fafafb] dark:hover:bg-[#252e3a] disabled:opacity-35 text-[#17191c] dark:text-[#f1f5f9] flex items-center justify-center border border-[#ececec] dark:border-[#252e3a] cursor-pointer"
                          title="Restar 1"
                        >
                          <Minus className="w-4 h-4 stroke-[2.25]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onStepCustomChallenge(challenge.id, 1)}
                          disabled={progress.isCompleted}
                          className="px-3.5 h-9 rounded-full bg-[#059669] hover:bg-[#047857] disabled:opacity-35 text-white text-[12px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[2.25]" />
                          <span>Registrar avance</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Streak Badges Showcase */}
      {(filter === 'all' || filter === 'badges') && (
        <BadgesModule badges={badges} />
      )}

      {/* Create Custom Challenge Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-5 bg-[#17191c]/35 dark:bg-[#050709]/75 backdrop-blur-sm">
          <div className="w-full max-w-md my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] overflow-y-auto overscroll-contain steep-modal p-5 sm:p-6 md:p-7">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#ececec] dark:border-[#252e3a]">
              <h2 className="font-signifier font-normal text-[22px] sm:text-[26px] text-[#17191c] dark:text-[#f1f5f9] leading-tight">
                Nuevo reto personal
              </h2>
              <ActionHint
                message="Cerrará esta ventana sin crear el reto"
                tone="neutral"
                position="bottom"
                align="right"
              >
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  aria-label="Cerrar modal"
                  className="w-11 h-11 rounded-full border border-[#ececec] dark:border-[#252e3a] bg-[#fafafb] dark:bg-[#1b222b] text-[#5c616d] dark:text-[#9aa4b2] hover:text-[#b91c1c] dark:hover:text-[#fca5a5] hover:bg-[#fee2e2]/60 dark:hover:bg-[#7f1d1d]/30 hover:border-[#ef4444]/40 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-6 h-6 stroke-[2.5]" />
                </button>
              </ActionHint>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-[14px] bg-[#fbe1d1] text-[13px] text-[#5d2a1a] dark:bg-[#241814] dark:text-[#fbdac7] dark:border dark:border-[#4a2d20]">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1.5">
                  Título del reto *
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="Ej: 14 días sin azúcar añadida"
                  className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[14px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1.5">
                  Descripción
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Mejorar claridad mental y descanso nocturno"
                  className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[14px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1.5">
                    Meta numérica *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={targetCount}
                    onChange={(e) => setTargetCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] text-[14px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1.5">
                    Unidad
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                    placeholder="días, sesiones, km"
                    className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[14px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1.5">
                  Categoría
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] text-[14px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399] cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 pt-4 border-t border-[#ececec] dark:border-[#252e3a]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 rounded-full bg-transparent hover:bg-[#fafafb] dark:hover:bg-[#1b222b] border border-[#17191c]/25 dark:border-[#252e3a] text-[13px] text-[#17191c] dark:text-[#f1f5f9] transition-colors cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto btn-chromatic px-5 py-2 rounded-full text-white text-[13px] font-medium transition-all cursor-pointer text-center"
                >
                  Crear reto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
