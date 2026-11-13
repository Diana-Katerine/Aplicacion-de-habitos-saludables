import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Users,
  Target,
  Plus,
  Check,
  Flame,
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
          colors: ['#17191c', '#5d2a1a', '#fbe1d1'],
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#ececec]">
        <div>
          <span className="text-[14px] text-[#979799] block">Metas &amp; comunidad</span>
          <h1 className="font-signifier font-normal text-[36px] md:text-[44px] leading-[1.2] tracking-[-0.015em] text-[#17191c] mt-1">
            Retos &amp; <em className="italic font-normal">hitos</em>
          </h1>
          <p className="text-[16px] text-[#777b86] mt-1">
            Únete a metas mensuales comunitarias o conquista hitos personales impulsados por tus hábitos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[14px] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear reto personal</span>
        </button>
      </div>

      {/* KPI Strip — Steep Mist Gray 24px cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="steep-card-mist p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#979799]">Retos activos</span>
            <Users className="w-4 h-4 text-[#17191c]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[30px] leading-none font-medium text-[#17191c] tabular-nums">
              {activeCommunityCount + activeCustomCount}
            </span>
            <span className="text-[13px] text-[#777b86]">
              {activeCommunityCount} comunitarios · {activeCustomCount} propios
            </span>
          </div>
        </div>

        <div className="steep-card-mist p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#979799]">Hitos alcanzados</span>
            <Trophy className="w-4 h-4 text-[#5d2a1a]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[30px] leading-none font-medium text-[#17191c] tabular-nums">
              {completedMilestonesCount}
            </span>
            <span className="text-[13px] text-[#777b86] tabular-nums">
              de {allChallenges.length} disponibles
            </span>
          </div>
        </div>

        <div className="steep-card-mist p-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#979799]">Aporte mensual</span>
            <Flame className="w-4 h-4 text-[#5d2a1a]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[30px] leading-none font-medium text-[#17191c] tabular-nums">
              {monthlyCheckins}
            </span>
            <span className="text-[13px] text-[#777b86] tabular-nums">
              check-ins · quedan {daysRemaining} días
            </span>
          </div>
        </div>
      </div>

      {/* Filter Segmented Control */}
      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'all'
              ? 'bg-white text-[#17191c] font-medium shadow-xs'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          Todos ({allChallenges.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('community')}
          className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'community'
              ? 'bg-white text-[#17191c] font-medium shadow-xs'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          Metas mensuales
        </button>
        <button
          type="button"
          onClick={() => setFilter('milestone')}
          className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'milestone'
              ? 'bg-white text-[#17191c] font-medium shadow-xs'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          Hitos personales
        </button>
        <button
          type="button"
          onClick={() => setFilter('badges')}
          className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'badges'
              ? 'bg-white text-[#17191c] font-medium shadow-xs'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          Insignias ({badges.filter((b) => b.isUnlocked).length}/{badges.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('joined')}
          className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'joined'
              ? 'bg-white text-[#17191c] font-medium shadow-xs'
              : 'text-[#777b86] hover:text-[#17191c]'
          }`}
        >
          Mis retos activos
        </button>
      </div>

      {/* Monthly Community Goals Section */}
      {communityItems.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-[18px] font-medium text-[#17191c] tracking-[-0.01em] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#5d2a1a]" />
              <span>Metas mensuales de la comunidad</span>
            </h2>
            <p className="text-[14px] text-[#777b86] mt-0.5">
              Tu progreso se sincroniza automáticamente con tus check-ins diarios del mes en curso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {communityItems.map(({ challenge, progress, isJoined }) => {
              const cat = challenge.categoryId ? categoryMap.get(challenge.categoryId) : undefined;
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
                  className={`rounded-[24px] p-6 bg-white border flex flex-col justify-between transition-colors ${
                    progress.isCompleted
                      ? 'border-[#5d2a1a]/35'
                      : isJoined
                      ? 'border-[#17191c]/20'
                      : 'border-[#ececec]'
                  }`}
                >
                  <div>
                    {/* Quiet unboxed metadata line */}
                    <div className="flex items-center justify-between gap-2 text-[12px] text-[#979799] mb-3">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-medium text-[#5d2a1a]">
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
                      <div className="w-10 h-10 rounded-[14px] bg-[#f2f2f3] text-[#17191c] flex items-center justify-center shrink-0">
                        {cat ? (
                          <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                        ) : (
                          <Calendar className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[17px] font-medium text-[#17191c] tracking-[-0.01em]">
                          {challenge.title}
                        </h3>
                        <p className="text-[13px] text-[#777b86] mt-1 leading-relaxed">
                          {challenge.description}
                        </p>
                      </div>
                    </div>

                    {/* Personal Progress */}
                    <div className="mt-5 pt-4 border-t border-[#ececec] space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[13px] mb-1.5">
                          <span className="text-[#777b86]">
                            {isJoined ? 'Tu avance este mes' : 'Tu avance potencial'}
                          </span>
                          <span className="font-medium text-[#17191c] tabular-nums">
                            {progress.current} / {progress.target} {challenge.unitLabel}{' '}
                            <span className="text-[#5d2a1a] ml-1">({progress.percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#f2f2f3] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${progress.percentage}%`,
                              backgroundColor: progress.isCompleted ? '#5d2a1a' : '#17191c',
                            }}
                          />
                        </div>
                      </div>

                      {/* Community collective progress */}
                      {challenge.communityTotalTarget && (
                        <div>
                          <div className="flex items-center justify-between text-[12px] text-[#979799] mb-1">
                            <span>Objetivo colectivo global</span>
                            <span className="tabular-nums font-medium text-[#777b86]">
                              {(
                                (challenge.communityCurrentTotal || 0) + progress.current
                              ).toLocaleString('es-ES')}{' '}
                              / {challenge.communityTotalTarget.toLocaleString('es-ES')} ({communityPct}%)
                            </span>
                          </div>
                          <div className="w-full h-1 rounded-full bg-[#f2f2f3] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#5d2a1a]/75 transition-all duration-300"
                              style={{ width: `${communityPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 pt-3.5 border-t border-[#ececec] flex items-center justify-between gap-3">
                    <span className="text-[12px] font-medium text-[#777b86] flex items-center gap-1.5 min-w-0">
                      <Award className="w-3.5 h-3.5 text-[#5d2a1a] shrink-0" />
                      <span className="truncate">{challenge.rewardLabel}</span>
                    </span>

                    {progress.isCompleted ? (
                      <span className="px-3.5 py-1.5 rounded-full bg-[#fbe1d1] text-[#5d2a1a] text-[12px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Meta cumplida</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleJoinClick(challenge.id, isJoined)}
                        className={`px-4 py-1.5 rounded-full text-[13px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isJoined
                            ? 'bg-transparent hover:bg-[#fafafb] border border-[#17191c]/25 text-[#17191c]'
                            : 'bg-[#17191c] hover:bg-[#2a2d32] text-white'
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
          <div>
            <h2 className="text-[18px] font-medium text-[#17191c] tracking-[-0.01em] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#5d2a1a]" />
              <span>Hitos personales &amp; metas propias</span>
            </h2>
            <p className="text-[14px] text-[#777b86] mt-0.5">
              Logros calculados en tiempo real desde tus rachas, jornadas al 100% y metas personalizadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestoneItems.map(({ challenge, progress }) => {
              const isCustom = challenge.kind === 'custom';
              const cat = challenge.categoryId ? categoryMap.get(challenge.categoryId) : undefined;

              return (
                <div
                  key={challenge.id}
                  className={`rounded-[24px] p-6 flex flex-col justify-between transition-colors ${
                    progress.isCompleted
                      ? 'bg-white border border-[#17191c]/20'
                      : 'steep-card-mist'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3.5">
                      <div
                        className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 ${
                          progress.isCompleted
                            ? 'bg-[#17191c] text-white'
                            : 'bg-white text-[#5d2a1a] border border-[#ececec]'
                        }`}
                      >
                        {progress.isCompleted ? (
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        ) : cat ? (
                          <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                        ) : (
                          <Target className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#979799]">
                          {isCustom ? 'Reto propio' : challenge.rewardLabel}
                        </span>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => onDeleteCustomChallenge(challenge.id)}
                            aria-label="Eliminar reto personal"
                            className="p-1.5 rounded-full text-[#979799] hover:text-[#b91c1c] hover:bg-white transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-[17px] font-medium text-[#17191c] tracking-[-0.01em]">
                      {challenge.title}
                    </h3>
                    <p className="text-[13px] text-[#777b86] mt-1 leading-relaxed">
                      {challenge.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#ececec] space-y-2.5">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium text-[#17191c] tabular-nums">
                        {progress.current} / {progress.target} {challenge.unitLabel}
                      </span>
                      <span
                        className={`font-medium tabular-nums ${
                          progress.isCompleted ? 'text-[#17191c]' : 'text-[#5d2a1a]'
                        }`}
                      >
                        {progress.isCompleted ? 'Desbloqueado' : `${progress.percentage}%`}
                      </span>
                    </div>

                    <div
                      className={`w-full h-1.5 rounded-full overflow-hidden ${
                        progress.isCompleted ? 'bg-[#f2f2f3]' : 'bg-white'
                      }`}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${progress.percentage}%`,
                          backgroundColor: progress.isCompleted ? '#17191c' : '#5d2a1a',
                        }}
                      />
                    </div>

                    {isCustom && (
                      <div className="pt-1.5 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onStepCustomChallenge(challenge.id, -1)}
                          disabled={progress.current <= 0}
                          className="w-8 h-8 rounded-full bg-white hover:bg-[#fafafb] disabled:opacity-35 text-[#17191c] flex items-center justify-center border border-[#ececec] cursor-pointer"
                          title="Restar 1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onStepCustomChallenge(challenge.id, 1)}
                          disabled={progress.isCompleted}
                          className="px-3.5 h-8 rounded-full bg-[#17191c] hover:bg-[#2a2d32] disabled:opacity-35 text-white text-[12px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17191c]/35 backdrop-blur-sm">
          <div className="w-full max-w-md steep-modal p-6 md:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-[#ececec]">
              <div>
                <span className="text-[12px] text-[#979799] block">Meta personalizada</span>
                <h2 className="font-signifier font-normal text-[26px] text-[#17191c] leading-tight">
                  Nuevo reto personal
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Cerrar modal"
                className="p-2 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-[14px] bg-[#fbe1d1] text-[13px] text-[#5d2a1a]">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[13px] font-medium text-[#17191c] mb-1.5">
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
                  className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] placeholder-[#a3a6af] text-[14px] focus:outline-none focus:border-[#17191c]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#17191c] mb-1.5">
                  Descripción
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Mejorar claridad mental y descanso nocturno"
                  className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] placeholder-[#a3a6af] text-[14px] focus:outline-none focus:border-[#17191c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#17191c] mb-1.5">
                    Meta numérica *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={targetCount}
                    onChange={(e) => setTargetCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] text-[14px] focus:outline-none focus:border-[#17191c] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#17191c] mb-1.5">
                    Unidad
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                    placeholder="días, sesiones, km"
                    className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] text-[14px] focus:outline-none focus:border-[#17191c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#17191c] mb-1.5">
                  Categoría
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] text-[14px] focus:outline-none focus:border-[#17191c] cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#ececec]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-full bg-transparent hover:bg-[#fafafb] border border-[#17191c]/25 text-[13px] text-[#17191c] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[13px] transition-colors cursor-pointer"
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
