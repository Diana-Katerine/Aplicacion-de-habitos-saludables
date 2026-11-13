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
import { Category, Challenge, DailyFocus, Habit, HabitLog } from '../../types';
import { StorageService } from '../../services/storage';
import { CategoryIcon } from '../common/CategoryIcon';

interface Props {
  userId: string;
  timezone?: string;
  habits: Habit[];
  logs: HabitLog[];
  dailyFocuses: DailyFocus[];
  categories: Category[];
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
  joinedChallengeIds,
  customChallenges,
  onToggleJoin,
  onCreateCustomChallenge,
  onStepCustomChallenge,
  onDeleteCustomChallenge,
}) => {
  const [filter, setFilter] = useState<'all' | 'community' | 'milestone' | 'joined'>('all');
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
          particleCount: 45,
          spread: 55,
          origin: { y: 0.7 },
          colors: ['#10B981', '#34D399', '#F59E0B'],
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Retos & Hitos
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Únete a metas mensuales comunitarias o conquista hitos personales impulsados por tus hábitos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#003824] text-xs font-bold transition-all shadow-[0_0_16px_rgba(16,185,129,0.35)] flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Crear reto personal</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 md:p-5 bg-[#0F172A] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Retos Activos
            </span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tabular-nums">
              {activeCommunityCount + activeCustomCount}
            </span>
            <span className="text-xs text-slate-400">
              {activeCommunityCount} comunitarios · {activeCustomCount} propios
            </span>
          </div>
        </div>

        <div className="rounded-xl p-4 md:p-5 bg-[#0F172A] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hitos Alcanzados
            </span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tabular-nums">
              {completedMilestonesCount}
            </span>
            <span className="text-xs text-amber-400 font-semibold tabular-nums">
              de {allChallenges.length} disponibles
            </span>
          </div>
        </div>

        <div className="rounded-xl p-4 md:p-5 bg-[#0F172A] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Aporte Mensual
            </span>
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tabular-nums">
              {monthlyCheckins}
            </span>
            <span className="text-xs text-emerald-400 font-semibold tabular-nums">
              check-ins · quedan {daysRemaining} días
            </span>
          </div>
        </div>
      </div>

      {/* Filter Segmented Control */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0F172A] border border-white/[0.08] w-fit max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'all' ? 'bg-[#1E293B] text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Todos ({allChallenges.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('community')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'community' ? 'bg-[#1E293B] text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Metas Mensuales
        </button>
        <button
          type="button"
          onClick={() => setFilter('milestone')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'milestone' ? 'bg-[#1E293B] text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Hitos Personales
        </button>
        <button
          type="button"
          onClick={() => setFilter('joined')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'joined' ? 'bg-[#1E293B] text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Mis Retos Activos
        </button>
      </div>

      {/* Monthly Community Goals Section */}
      {communityItems.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Metas Mensuales de la Comunidad</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tu progreso se sincroniza automáticamente con tus check-ins diarios del mes en curso.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className={`rounded-xl p-5 bg-[#0F172A] border flex flex-col justify-between transition-all ${
                    progress.isCompleted
                      ? 'border-emerald-500/40 ring-1 ring-[#10B981]/25'
                      : isJoined
                      ? 'border-white/15'
                      : 'border-white/[0.08]'
                  }`}
                >
                  <div>
                    {/* Quiet unboxed metadata line */}
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-semibold text-emerald-400">
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

                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
                        style={{
                          backgroundColor: cat ? `${cat.colorHex}20` : 'rgba(16, 185, 129, 0.15)',
                          color: cat ? cat.colorHex : '#10B981',
                        }}
                      >
                        {cat ? (
                          <CategoryIcon name={cat.iconName} className="w-5 h-5" />
                        ) : (
                          <Calendar className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {challenge.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {challenge.description}
                        </p>
                      </div>
                    </div>

                    {/* Personal Progress */}
                    <div className="mt-4 pt-3.5 border-t border-white/[0.06] space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-300 font-medium">
                            {isJoined ? 'Tu avance este mes' : 'Tu avance potencial'}
                          </span>
                          <span className="font-bold text-white tabular-nums">
                            {progress.current} / {progress.target} {challenge.unitLabel}{' '}
                            <span className="text-emerald-400 ml-1">({progress.percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#1E293B] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              progress.isCompleted ? 'bg-[#34D399] glow-emerald' : 'bg-[#10B981]'
                            }`}
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Community collective progress */}
                      {challenge.communityTotalTarget && (
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span>Objetivo colectivo global</span>
                            <span className="tabular-nums font-medium text-slate-300">
                              {(
                                (challenge.communityCurrentTotal || 0) + progress.current
                              ).toLocaleString('es-ES')}{' '}
                              / {challenge.communityTotalTarget.toLocaleString('es-ES')} ({communityPct}%)
                            </span>
                          </div>
                          <div className="w-full h-1 rounded-full bg-[#1E293B] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-400/80 transition-all duration-300"
                              style={{ width: `${communityPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 shrink-0" />
                      <span>{challenge.rewardLabel}</span>
                    </span>

                    {progress.isCompleted ? (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Meta cumplida</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleJoinClick(challenge.id, isJoined)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                          isJoined
                            ? 'bg-[#1E293B] hover:bg-[#27354A] border border-white/15 text-slate-200'
                            : 'bg-[#10B981] hover:bg-[#34D399] text-[#003824] shadow-[0_0_12px_rgba(16,185,129,0.3)]'
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Hitos Personales & Metas Propias</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Logros calculados en tiempo real desde tus rachas, jornadas al 100% y metas personalizadas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestoneItems.map(({ challenge, progress }) => {
              const isCustom = challenge.kind === 'custom';
              const cat = challenge.categoryId ? categoryMap.get(challenge.categoryId) : undefined;

              return (
                <div
                  key={challenge.id}
                  className={`rounded-xl p-5 bg-[#0F172A] border flex flex-col justify-between transition-all ${
                    progress.isCompleted
                      ? 'border-emerald-500/40 ring-1 ring-[#10B981]/25'
                      : 'border-white/[0.08]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          progress.isCompleted
                            ? 'bg-[#10B981] text-[#003824] glow-emerald-node'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {progress.isCompleted ? (
                          <Check className="w-5 h-5 stroke-[3]" />
                        ) : cat ? (
                          <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                        ) : (
                          <Target className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-400">
                          {isCustom ? 'Reto propio' : challenge.rewardLabel}
                        </span>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => onDeleteCustomChallenge(challenge.id)}
                            aria-label="Eliminar reto personal"
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight">
                      {challenge.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {challenge.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-white/[0.06] space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white tabular-nums">
                        {progress.current} / {progress.target} {challenge.unitLabel}
                      </span>
                      <span
                        className={`font-bold tabular-nums ${
                          progress.isCompleted ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {progress.isCompleted ? 'Desbloqueado' : `${progress.percentage}%`}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-[#1E293B] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progress.isCompleted ? 'bg-[#10B981] glow-emerald' : 'bg-amber-400'
                        }`}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>

                    {isCustom && (
                      <div className="pt-1 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onStepCustomChallenge(challenge.id, -1)}
                          disabled={progress.current <= 0}
                          className="w-7 h-7 rounded-md bg-[#1E293B] hover:bg-[#27354A] disabled:opacity-35 text-slate-300 flex items-center justify-center border border-white/10 cursor-pointer"
                          title="Restar 1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onStepCustomChallenge(challenge.id, 1)}
                          disabled={progress.isCompleted}
                          className="px-2.5 h-7 rounded-md bg-[#10B981]/20 hover:bg-[#10B981] hover:text-[#003824] disabled:opacity-35 text-[#10B981] text-xs font-bold border border-[#10B981]/30 flex items-center gap-1 transition-colors cursor-pointer"
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

      {/* Create Custom Challenge Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#111827] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-lg font-bold text-white">Nuevo Reto Personal</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-500/30 text-xs text-red-300">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
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
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Descripción
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Mejorar claridad mental y descanso nocturno"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Meta numérica *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={targetCount}
                    onChange={(e) => setTargetCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#10B981] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Unidad
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                    placeholder="días, sesiones, km"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Categoría
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#10B981] cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-[#27354A] text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#003824] text-xs font-bold shadow-[0_0_14px_rgba(16,185,129,0.35)] cursor-pointer"
                >
                  Crear Reto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
