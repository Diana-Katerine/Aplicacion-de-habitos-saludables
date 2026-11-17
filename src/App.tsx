import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AiEncouragementMessage, AiHabitSuggestion, Challenge, DailyFocus, EnergyLevel, EvaluatedBadge, Habit, HabitLog, HabitWithTodayLog, MoodTag, User, ViewRoute, WeeklyFocus } from './types';
import { StorageService, getSundayWeekKey, getTodayDateString, isTodaySunday } from './services/storage';
import { getGreetingFirstName, getSpanishGreeting, getTimeOfDayPeriod, resolveDisplayName } from './services/greeting';
import {
  calculateReachedStreakMilestone,
  clearDismissedMilestoneToday,
  dismissMilestoneToday,
  getExactTodayStreakMilestone,
  hasDismissedMilestoneToday,
  StreakMilestone,
} from './services/streakMilestones';
import { BadgesService } from './services/badges';
import { HealthWidgetsService } from './services/healthWidgets';
import { requestAiEncouragement } from './services/aiEncouragement';
import {
  AdaptiveReminderSuggestion,
  buildAdaptiveReminders,
  hasSentAdaptivePushToday,
  markAdaptivePushSentToday,
  tryDispatchBrowserPushNotification,
} from './services/reminders';
import { Navbar } from './components/layout/Navbar';
import { TodayView } from './components/today/TodayView';
import { HabitsView } from './components/habits/HabitsView';
import { StatsView } from './components/stats/StatsView';
import { ChallengesView } from './components/challenges/ChallengesView';
import { TemplatesView } from './components/templates/TemplatesView';
import { ProfileView } from './components/profile/ProfileView';
import { LandingPage } from './components/landing/LandingPage';
import { HabitModal, JournalSavePayload } from './components/habits/HabitModal';
import { getMoodMeta } from './services/journaling';
import { AuthModal } from './components/auth/AuthModal';
import { WeeklyReflectionModal } from './components/today/WeeklyReflectionModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';

const THEME_STORAGE_KEY = 'impulso_diario_theme';

export default function App() {
  const [theme, setTheme] = useState<'LIGHT' | 'DARK'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'DARK' || saved === 'LIGHT') return saved;
    } catch {
      // ignore storage errors
    }
    return 'LIGHT';
  });
  const [user, setUser] = useState<User | null>(null);
  const [currentRoute, setCurrentRoute] = useState<ViewRoute | 'landing'>('today');
  const [todayHabits, setTodayHabits] = useState<HabitWithTodayLog[]>([]);
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [allLogs, setAllLogs] = useState<HabitLog[]>([]);
  const [dailyFocus, setDailyFocus] = useState<DailyFocus | null>(null);
  const [weeklyFocus, setWeeklyFocus] = useState<WeeklyFocus | null>(null);
  const [allDailyFocuses, setAllDailyFocuses] = useState<DailyFocus[]>([]);
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<string[]>([]);
  const [customChallenges, setCustomChallenges] = useState<Challenge[]>([]);
  const [badges, setBadges] = useState<EvaluatedBadge[]>([]);
  const [categories, setCategories] = useState(StorageService.getCategories());
  const [templates, setTemplates] = useState(StorageService.getTemplates());

  // Modals & Toasts
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [journalPrompt, setJournalPrompt] = useState<{ habit: Habit; log: HabitLog } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isWeeklyReflectionOpen, setIsWeeklyReflectionOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [aiEncouragement, setAiEncouragement] = useState<AiEncouragementMessage | null>(null);
  const [isEncouragementLoading, setIsEncouragementLoading] = useState(false);
  const [encouragementError, setEncouragementError] = useState<string | null>(null);
  const [celebratingMilestones, setCelebratingMilestones] = useState<Record<string, StreakMilestone>>({});
  const skipNextAutoEncouragementRef = React.useRef(false);

  // Sync <html> .dark class & persist theme preference
  useEffect(() => {
    const isDark = theme === 'DARK';
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  // Initialize user & data on load
  useEffect(() => {
    // Check if user exists or initialize demo user if preferred
    const savedUser = StorageService.getUser();
    if (savedUser) {
      let hasExplicitStoredTheme = false;
      try {
        hasExplicitStoredTheme = localStorage.getItem(THEME_STORAGE_KEY) !== null;
      } catch {
        hasExplicitStoredTheme = false;
      }
      if (!hasExplicitStoredTheme && savedUser.themePreference) {
        setTheme(savedUser.themePreference);
      }
      StorageService.ensureDemoUserSeeded(savedUser);
      setUser(savedUser);
      setCurrentRoute('today');
      refreshData(savedUser);
    } else {
      // By default show Landing page with interactive demo or 1-click demo entry
      setCurrentRoute('landing');
    }
  }, []);

  // Auto-open Sunday Weekly Reflection modal on the first visit of the week
  useEffect(() => {
    if (!user) {
      setIsWeeklyReflectionOpen(false);
      return;
    }
    const weekKey = getSundayWeekKey(user.timezone);
    if (isTodaySunday(user.timezone) && !StorageService.hasSeenWeeklyReflection(user.id, weekKey)) {
      setIsWeeklyReflectionOpen(true);
    }
  }, [user?.id, user?.timezone]);

  // Auto-suggest adaptive push-notification-like reminder in the late afternoon for incomplete habits
  useEffect(() => {
    if (!user || user.reminderEnabled === false || todayHabits.length === 0) return;

    const checkAndNotify = () => {
      if (hasSentAdaptivePushToday(user.id, user.timezone)) return;
      const { timeInfo, suggestions } = buildAdaptiveReminders({
        habits: todayHabits,
        timezone: user.timezone,
        eveningCutoffTime: user.reminderEveningTime,
      });

      if (timeInfo.isLateAfternoon && suggestions.length > 0) {
        const primary = suggestions[0];
        markAdaptivePushSentToday(user.id, user.timezone);
        addToast({
          type: 'reminder',
          metaLabel: 'Impulso diario · Recordatorio adaptativo',
          title: `¿Completaste "${primary.habit.title}"?`,
          description: primary.reason,
          actionLabel: 'Completar ahora',
          onAction: () => handleCheckIn(primary.habit.id, undefined, true),
          secondaryLabel: `Ajustar a ${primary.suggestedTime}`,
          onSecondaryAction: () => handleApplyReminderTime(primary.habit.id, primary.suggestedTime),
        });
        tryDispatchBrowserPushNotification(
          `Impulso diario · ${primary.habit.title}`,
          primary.reason
        );
      }
    };

    checkAndNotify();
    const intervalId = window.setInterval(checkAndNotify, 60_000);
    return () => window.clearInterval(intervalId);
  }, [user?.id, user?.timezone, user?.reminderEnabled, user?.reminderEveningTime, todayHabits]);

  const triggerAiEncouragement = async (options: {
    activeUser: User;
    habitsList: HabitWithTodayLog[];
    focus: DailyFocus | null;
    trigger: 'daily_brief' | 'habit_completed' | 'journal_saved' | 'manual_boost';
    habitTitle?: string;
    habitStreak?: number;
    energyLevel?: EnergyLevel;
    moodTag?: MoodTag;
    forceRefresh?: boolean;
    showToast?: boolean;
  }) => {
    setIsEncouragementLoading(true);
    setEncouragementError(null);
    try {
      const msg = await requestAiEncouragement({
        user: options.activeUser,
        habits: options.habitsList,
        dailyFocus: options.focus,
        trigger: options.trigger,
        habitTitle: options.habitTitle,
        habitStreak: options.habitStreak,
        energyLevel: options.energyLevel,
        moodTag: options.moodTag,
        forceRefresh: options.forceRefresh,
      });
      setAiEncouragement(msg);
      if (options.showToast) {
        addToast({
          type: 'ai',
          metaLabel: 'Impulso IA',
          title: msg.headline,
          description: msg.message,
          durationMs: 7500,
        });
      }
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : 'No se pudo generar el mensaje de ánimo.';
      setEncouragementError(errMsg);
    } finally {
      setIsEncouragementLoading(false);
    }
  };

  const completedTodayCount = todayHabits.filter((h) => h.todayLog?.isCompleted).length;

  const currentTimeBucket = user ? getTimeOfDayPeriod(user.timezone) : null;

  // Auto-load personalized daily encouragement brief for TodayView
  useEffect(() => {
    if (!user) {
      setAiEncouragement(null);
      setEncouragementError(null);
      return;
    }
    if (skipNextAutoEncouragementRef.current) {
      skipNextAutoEncouragementRef.current = false;
      return;
    }
    triggerAiEncouragement({
      activeUser: user,
      habitsList: todayHabits,
      focus: dailyFocus,
      trigger: 'daily_brief',
    });
  }, [user?.id, user?.fullName, currentTimeBucket, todayHabits.length, completedTodayCount, dailyFocus?.intent]);

  const refreshData = (activeUser: User, notifyNewBadges = false) => {
    const habits = StorageService.getHabits(activeUser.id);
    const logs = StorageService.getLogs(activeUser.id);
    const todayH = StorageService.getTodayHabits(activeUser.id, activeUser.timezone);
    const focus = StorageService.getDailyFocus(activeUser.id, activeUser.timezone);
    const wFocus = StorageService.getWeeklyFocus(activeUser.id, activeUser.timezone);
    const focuses = StorageService.getAllDailyFocuses(activeUser.id);
    const joined = StorageService.getJoinedChallengeIds(activeUser.id);
    const custom = StorageService.getCustomChallenges(activeUser.id);
    const badgeEval = BadgesService.syncAndEvaluateBadges(activeUser.id, habits, logs);

    setAllHabits(habits);
    setAllLogs(logs);
    setTodayHabits(todayH);
    setDailyFocus(focus);
    setWeeklyFocus(wFocus);
    setAllDailyFocuses(focuses);
    setJoinedChallengeIds(joined);
    setCustomChallenges(custom);
    setBadges(badgeEval.badges);
    setCategories(StorageService.getCategories());
    setTemplates(StorageService.getTemplates());

    const completedIds = new Set(
      todayH.filter((h) => h.todayLog?.isCompleted).map((h) => h.id)
    );
    setCelebratingMilestones((prev) => {
      const next: Record<string, StreakMilestone> = {};
      Object.entries(prev).forEach(([id, milestone]) => {
        if (completedIds.has(id)) {
          next[id] = milestone;
        }
      });
      todayH.forEach((h) => {
        if (next[h.id]) return;
        const exact = getExactTodayStreakMilestone(
          h.currentStreak,
          Boolean(h.todayLog?.isCompleted)
        );
        if (
          exact &&
          !hasDismissedMilestoneToday(activeUser.id, h.id, exact.days, activeUser.timezone)
        ) {
          next[h.id] = exact;
        }
      });
      return next;
    });

    if (notifyNewBadges && badgeEval.newlyUnlocked.length > 0) {
      badgeEval.newlyUnlocked.forEach((b) => {
        addToast({
          type: 'success',
          title: `¡Insignia desbloqueada: ${b.definition.name}!`,
          description: `${b.definition.subtitle} · ${b.qualifyingHabitTitle || b.definition.description}`,
        });
      });
    }
  };

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check-in handler
  const handleCheckIn = (
    habitId: string,
    completedValueChange?: number,
    forceCompleted?: boolean
  ) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const previousHabit = todayHabits.find((h) => h.id === habitId);
    const previousLog = previousHabit?.todayLog;
    const previousCompleted = previousLog ? previousLog.isCompleted : false;
    const previousStreak = previousHabit ? previousHabit.currentStreak : 0;

    try {
      const result = StorageService.checkInHabit(
        user.id,
        habitId,
        completedValueChange,
        forceCompleted,
        user.timezone
      );

      refreshData(user, true);

      const reachedMilestone = calculateReachedStreakMilestone({
        previousStreak,
        currentStreak: result.habit.currentStreak,
        isCompletedToday: result.log.isCompleted,
        wasCompletedBefore: previousCompleted,
      });

      if (reachedMilestone) {
        clearDismissedMilestoneToday(user.id, habitId, user.timezone);
        setCelebratingMilestones((prev) => ({
          ...prev,
          [habitId]: reachedMilestone,
        }));
        try {
          confetti({
            particleCount: 70,
            spread: 68,
            origin: { y: 0.62 },
            colors: ['#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#f43f5e'],
          });
        } catch {
          // ignore confetti canvas error
        }
      }

      // Toast feedback & Contextual Journaling prompt
      if (!previousCompleted && result.log.isCompleted) {
        const updatedToday = StorageService.getTodayHabits(user.id, user.timezone);
        const updatedFocus = StorageService.getDailyFocus(user.id, user.timezone);

        if (result.habit.contextualJournalingEnabled !== false) {
          skipNextAutoEncouragementRef.current = true;
          setJournalPrompt({ habit: result.habit, log: result.log });
        } else {
          skipNextAutoEncouragementRef.current = true;
          void triggerAiEncouragement({
            activeUser: user,
            habitsList: updatedToday,
            focus: updatedFocus,
            trigger: 'habit_completed',
            habitTitle: result.habit.title,
            habitStreak: result.habit.currentStreak,
            showToast: true,
          });
        }
        addToast({
          type: 'success',
          title: reachedMilestone
            ? `${reachedMilestone.headline} en ${result.habit.title}`
            : `¡${result.habit.title} completado!`,
          description: reachedMilestone
            ? reachedMilestone.message
            : `Racha en ${result.habit.currentStreak} días consecutivos.`,
          onUndo: () => {
            // Rollback check-in
            setJournalPrompt(null);
            setCelebratingMilestones((prev) => {
              const next = { ...prev };
              delete next[habitId];
              return next;
            });
            StorageService.checkInHabit(user.id, habitId, undefined, false, user.timezone);
            refreshData(user);
            addToast({
              type: 'undo',
              title: 'Registro deshecho',
              description: 'El hábito ha vuelto al estado pendiente.',
            });
          },
        });
      } else if (previousCompleted && !result.log.isCompleted) {
        setCelebratingMilestones((prev) => {
          const next = { ...prev };
          delete next[habitId];
          return next;
        });
        addToast({
          type: 'undo',
          title: 'Registro deshecho',
          description: 'Hábito marcado como pendiente.',
        });
      }
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Error al registrar',
        description: 'No se pudo guardar el progreso. Por favor intenta de nuevo.',
      });
    }
  };

  // Save Contextual Journal (Energy 1-5, Mood Tag, optional quick note)
  const handleSaveJournal = (habitId: string, payload: JournalSavePayload) => {
    if (!user) return;
    StorageService.saveLogContext(
      user.id,
      habitId,
      {
        energyLevel: payload.energyLevel,
        moodTag: payload.moodTag,
        journalEntry: payload.journalEntry,
      },
      user.timezone
    );

    if (payload.appendToRitualNotes && payload.journalEntry?.trim()) {
      const targetHabit = allHabits.find((h) => h.id === habitId);
      if (targetHabit) {
        const dateLabel = new Intl.DateTimeFormat('es-ES', {
          day: '2-digit',
          month: 'short',
        }).format(new Date());
        const existingNotes = (targetHabit.notes || '').trim();
        const appended = `- **${dateLabel}:** ${payload.journalEntry.trim()}`;
        const nextNotes = existingNotes ? `${existingNotes}\n${appended}` : appended;
        StorageService.updateHabit(user.id, habitId, { notes: nextNotes.slice(0, 2000) });
      }
    }

    setJournalPrompt(null);
    refreshData(user);

    const moodLabel = getMoodMeta(payload.moodTag)?.label;
    const summaryParts = [
      payload.energyLevel ? `Energía ${payload.energyLevel}/5` : null,
      moodLabel || null,
    ].filter(Boolean);

    addToast({
      type: 'success',
      title: 'Diario contextual guardado',
      description:
        summaryParts.length > 0
          ? `${summaryParts.join(' · ')} correlacionado en Estadísticas.`
          : 'Nota de sesión registrada correctamente.',
    });

    const completedHabit = allHabits.find((h) => h.id === habitId);
    const latestToday = StorageService.getTodayHabits(user.id, user.timezone);
    const latestFocus = StorageService.getDailyFocus(user.id, user.timezone);
    void triggerAiEncouragement({
      activeUser: user,
      habitsList: latestToday,
      focus: latestFocus,
      trigger: 'journal_saved',
      habitTitle: completedHabit?.title,
      habitStreak: completedHabit?.currentStreak,
      energyLevel: payload.energyLevel,
      moodTag: payload.moodTag,
      showToast: true,
    });
  };

  // Save Habit (create or update)
  const handleSaveHabit = (habitData: {
    title: string;
    categoryId: number;
    targetValue: number;
    unitLabel: string;
    scheduledDays: any[];
    reminderTime?: string;
    notes?: string;
    isActive: boolean;
    contextualJournalingEnabled: boolean;
    todayContext?: JournalSavePayload;
  }) => {
    if (!user) return;
    const { todayContext, ...habitFields } = habitData;

    if (habitToEdit) {
      StorageService.updateHabit(user.id, habitToEdit.id, habitFields);
      if (todayContext) {
        StorageService.saveLogContext(
          user.id,
          habitToEdit.id,
          todayContext,
          user.timezone
        );
      }
      addToast({
        type: 'success',
        title: 'Hábito actualizado',
        description: `Los cambios en "${habitData.title}" fueron guardados.`,
      });
    } else {
      StorageService.createHabit(user.id, habitFields);
      addToast({
        type: 'success',
        title: 'Hábito creado con éxito',
        description: `"${habitData.title}" ya forma parte de tu rutina.`,
      });
    }

    setHabitToEdit(null);
    refreshData(user);
  };

  // Toggle Pause/Resume
  const handleTogglePause = (habitId: string) => {
    if (!user) return;
    const habit = allHabits.find((h) => h.id === habitId);
    if (!habit) return;

    const newStatus = !habit.isActive;
    StorageService.updateHabit(user.id, habitId, { isActive: newStatus });
    refreshData(user);

    addToast({
      type: 'info',
      title: newStatus ? 'Hábito reanudado' : 'Hábito pausado',
      description: newStatus
        ? `"${habit.title}" volverá a aparecer en tu vista diaria.`
        : `"${habit.title}" ha sido pausado sin borrar su historial.`,
    });
  };

  // Reorder daily habit sequence
  const handleReorderHabits = (orderedHabitIds: string[]) => {
    if (!user) return;
    StorageService.reorderHabits(user.id, orderedHabitIds);
    refreshData(user);
  };

  // Delete Habit
  const handleDeleteHabit = (habitId: string) => {
    if (!user) return;
    const habit = allHabits.find((h) => h.id === habitId);
    StorageService.deleteHabit(user.id, habitId);
    refreshData(user);

    addToast({
      type: 'info',
      title: 'Hábito eliminado',
      description: habit ? `"${habit.title}" fue retirado de tu lista.` : undefined,
    });
  };

  // Add Template
  const handleAddTemplate = (templateId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const habit = StorageService.addTemplateToUser(user.id, templateId);
    refreshData(user);

    addToast({
      type: 'success',
      title: 'Hábito añadido a tu rutina',
      description: `"${habit.title}" se programó para tus días diarios.`,
    });
  };

  // Add AI Suggested Habit
  const handleAddSuggestedHabit = (suggestion: AiHabitSuggestion) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const habit = StorageService.addSuggestedHabit(user.id, suggestion);
    refreshData(user);

    addToast({
      type: 'success',
      title: 'Hábito recomendado añadido',
      description: `"${habit.title}" ya forma parte de tu rutina diaria.`,
    });
  };

  // Theme switcher
  const handleSetTheme = (nextTheme: 'LIGHT' | 'DARK') => {
    setTheme(nextTheme);
    if (user) {
      const merged = { ...user, themePreference: nextTheme };
      setUser(merged);
      StorageService.setUser(merged);
    }
  };

  const handleToggleTheme = () => {
    handleSetTheme(theme === 'DARK' ? 'LIGHT' : 'DARK');
  };

  // Update user profile
  const handleUpdateUser = (updatedUser: Partial<User>) => {
    if (!user) return;
    if (updatedUser.themePreference) {
      setTheme(updatedUser.themePreference);
    }
    const merged = { ...user, ...updatedUser };
    const cleanName = resolveDisplayName(merged.fullName, merged.email);
    if (cleanName) {
      merged.fullName = cleanName;
      StorageService.saveAccountProfile(merged.email, cleanName, merged.timezone, merged.id);
    }
    setUser(merged);
    StorageService.setUser(merged);
    refreshData(merged);
    addToast({
      type: 'success',
      title: 'Perfil actualizado',
      description: 'Tus preferencias y zona horaria se han guardado.',
    });
  };

  // Reset Data to Demo
  const handleResetData = () => {
    if (!user) return;
    StorageService.resetUserData(user.id);
    HealthWidgetsService.resetHealthData(user.id);
    refreshData(user);
    addToast({
      type: 'info',
      title: 'Datos restaurados',
      description: 'Se ha cargado la demostración inicial con rachas de ejemplo.',
    });
  };

  // Logout
  const handleLogout = (openLogin = false) => {
    StorageService.setUser(null);
    setUser(null);
    setCurrentRoute('landing');
    if (openLogin === true) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    }
    addToast({
      type: 'info',
      title: 'Sesión finalizada',
      description: 'Hasta la próxima sesión de consistencia.',
    });
  };

  // Daily Focus handlers
  const handleSaveFocus = (intent: string) => {
    if (!user) return;
    const saved = StorageService.saveDailyFocus(user.id, intent, user.timezone);
    setDailyFocus(saved);
    setAllDailyFocuses(StorageService.getAllDailyFocuses(user.id));
    addToast({
      type: 'success',
      title: 'Enfoque del día fijado',
      description: `"${saved.intent}"`,
    });
  };

  const handleToggleFocusComplete = () => {
    if (!user) return;
    const updated = StorageService.toggleDailyFocusCompleted(user.id, user.timezone);
    setDailyFocus(updated);
    setAllDailyFocuses(StorageService.getAllDailyFocuses(user.id));
    if (updated?.isCompleted) {
      addToast({
        type: 'success',
        title: '¡Enfoque del día logrado!',
        description: 'Excelente consistencia con tu intención principal.',
      });
    }
  };

  const handleClearFocus = () => {
    if (!user) return;
    StorageService.clearDailyFocus(user.id, user.timezone);
    setDailyFocus(null);
    setAllDailyFocuses(StorageService.getAllDailyFocuses(user.id));
    addToast({
      type: 'info',
      title: 'Enfoque limpiado',
      description: 'Puedes definir una nueva intención cuando quieras.',
    });
  };

  // Sunday Weekly Reflection & Weekly Focus Intent handlers
  const handleSaveWeeklyFocus = (intent: string, reflectionNote?: string) => {
    if (!user) return;
    const saved = StorageService.saveWeeklyFocus(user.id, intent, reflectionNote, user.timezone);
    setWeeklyFocus(saved);
    setIsWeeklyReflectionOpen(false);
    addToast({
      type: 'success',
      title: 'Enfoque semanal fijado',
      description: `"${saved.intent}" guiará tu próxima semana.`,
    });
  };

  const handleDismissWeeklyReflection = () => {
    if (user) {
      StorageService.markWeeklyReflectionSeen(user.id, getSundayWeekKey(user.timezone));
    }
    setIsWeeklyReflectionOpen(false);
  };

  // Adaptive Reminder handlers
  const handleApplyReminderTime = (habitId: string, newReminderTime: string) => {
    if (!user) return;
    const updated = StorageService.updateHabit(user.id, habitId, { reminderTime: newReminderTime });
    refreshData(user);
    addToast({
      type: 'success',
      title: 'Recordatorio reprogramado',
      description: `"${updated.title}" ahora está programado para las ${newReminderTime}.`,
    });
  };

  const handleTriggerPushAlert = (suggestion: AdaptiveReminderSuggestion) => {
    if (!user) return;
    addToast({
      type: 'reminder',
      metaLabel: 'Impulso diario · Alerta push adaptativa',
      title: `Pendiente hoy: ${suggestion.habit.title}`,
      description: suggestion.reason,
      actionLabel: 'Completar ahora',
      onAction: () => handleCheckIn(suggestion.habit.id, undefined, true),
      secondaryLabel: `Ajustar a ${suggestion.suggestedTime}`,
      onSecondaryAction: () => handleApplyReminderTime(suggestion.habit.id, suggestion.suggestedTime),
    });
    tryDispatchBrowserPushNotification(
      `Impulso diario · ${suggestion.habit.title}`,
      suggestion.reason
    );
  };

  // Challenge handlers
  const handleToggleJoinChallenge = (challengeId: string) => {
    if (!user) return;
    const wasJoined = joinedChallengeIds.includes(challengeId);
    const updated = StorageService.toggleJoinChallenge(user.id, challengeId);
    setJoinedChallengeIds(updated);
    addToast({
      type: wasJoined ? 'info' : 'success',
      title: wasJoined ? 'Saliste del reto mensual' : '¡Te uniste al reto!',
      description: wasJoined
        ? 'Tu historial de hábitos permanece intacto.'
        : 'Tus check-ins del mes sumarán automáticamente a este objetivo.',
    });
  };

  const handleCreateCustomChallenge = (data: {
    title: string;
    description: string;
    targetCount: number;
    unitLabel: string;
    categoryId?: number;
    endDate?: string;
  }) => {
    if (!user) return;
    const created = StorageService.createCustomChallenge(user.id, data);
    setCustomChallenges(StorageService.getCustomChallenges(user.id));
    addToast({
      type: 'success',
      title: 'Reto personal creado',
      description: `"${created.title}" añadido a tus hitos.`,
    });
  };

  const handleStepCustomChallenge = (challengeId: string, delta: number) => {
    if (!user) return;
    StorageService.stepCustomChallengeProgress(user.id, challengeId, delta);
    setCustomChallenges(StorageService.getCustomChallenges(user.id));
  };

  const handleDeleteCustomChallenge = (challengeId: string) => {
    if (!user) return;
    StorageService.deleteCustomChallenge(user.id, challengeId);
    setCustomChallenges(StorageService.getCustomChallenges(user.id));
    addToast({
      type: 'info',
      title: 'Reto eliminado',
      description: 'El reto personal ha sido retirado.',
    });
  };

  // Category Manager handlers
  const handleCreateCategory = (data: {
    name: string;
    iconName: string;
    colorHex: string;
    bioluminescentTheme?: import('./types').BioluminescentThemeId;
  }) => {
    if (!user) return;
    const created = StorageService.createCategory(data);
    refreshData(user);
    addToast({
      type: 'success',
      title: 'Categoría creada',
      description: `"${created.name}" ya está disponible para organizar tus hábitos.`,
    });
  };

  const handleUpdateCategory = (
    categoryId: number,
    updates: {
      name: string;
      iconName: string;
      colorHex: string;
      bioluminescentTheme?: import('./types').BioluminescentThemeId;
    }
  ) => {
    if (!user) return;
    const updated = StorageService.updateCategory(categoryId, updates);
    refreshData(user);
    addToast({
      type: 'success',
      title: 'Categoría actualizada',
      description: `Se actualizaron el nombre, color e iluminación de "${updated.name}".`,
    });
  };

  const handleDeleteCategory = (categoryId: number) => {
    if (!user) return;
    const target = categories.find((c) => c.id === categoryId);
    const result = StorageService.deleteCategory(user.id, categoryId);
    if (!result.deleted) {
      addToast({
        type: 'error',
        title: 'No se pudo eliminar',
        description: 'Debes mantener al menos una categoría activa.',
      });
      return;
    }
    refreshData(user);
    addToast({
      type: 'info',
      title: 'Categoría eliminada',
      description:
        result.reassignedCount > 0 && result.fallbackCategory
          ? `"${target?.name || 'Categoría'}" eliminada. ${result.reassignedCount} hábito(s) movido(s) a "${result.fallbackCategory.name}".`
          : `"${target?.name || 'Categoría'}" fue eliminada.`,
    });
  };

  // Quick Demo Access from Landing Page
  const handleTryDemo = () => {
    const demoUser = StorageService.getOrCreateDemoUser();
    setUser(demoUser);
    setCurrentRoute('today');
    refreshData(demoUser);
    const greeting = getSpanishGreeting(demoUser.timezone);
    const firstName = getGreetingFirstName(demoUser.fullName, demoUser.email);
    addToast({
      type: 'success',
      title: `¡${greeting}, ${firstName}!`,
      description: 'Modo demostración activado: explora hábitos reales, mapas de calor y registro en tiempo real.',
    });
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-white dark:bg-[#0c0f12] text-[#17191c] dark:text-[#f1f5f9] flex flex-col selection:bg-[#fbe1d1] selection:text-[#5d2a1a] dark:selection:bg-[#5d2a1a] dark:selection:text-[#fbe1d1] transition-colors duration-200">
      {/* 3-Zone Navigation Header */}
      <Navbar
        currentRoute={currentRoute}
        user={user}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onNavigate={(route) => setCurrentRoute(route)}
        onOpenCreateModal={() => {
          setHabitToEdit(null);
          setIsHabitModalOpen(true);
        }}
        onOpenAuth={(mode = 'login') => {
          setAuthMode(mode);
          setIsAuthModalOpen(true);
        }}
        onLogout={() => handleLogout(true)}
      />

      {/* Main Container */}
      <main
        className={
          currentRoute === 'landing' && !user
            ? 'flex-1 w-full min-w-0'
            : 'flex-1 max-w-[1200px] w-full min-w-0 mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10'
        }
      >
        {currentRoute === 'landing' && !user && (
          <LandingPage
            isDark={theme === 'DARK'}
            onStartFree={() => {
              setAuthMode('register');
              setIsAuthModalOpen(true);
            }}
            onLogin={() => {
              setAuthMode('login');
              setIsAuthModalOpen(true);
            }}
            onTryDemo={handleTryDemo}
          />
        )}

        {user && currentRoute === 'today' && (
          <TodayView
            user={user}
            habits={todayHabits}
            dailyFocus={dailyFocus}
            weeklyFocus={weeklyFocus}
            onSaveFocus={handleSaveFocus}
            onToggleFocusComplete={handleToggleFocusComplete}
            onClearFocus={handleClearFocus}
            onOpenWeeklyReflection={() => setIsWeeklyReflectionOpen(true)}
            onApplyReminderTime={handleApplyReminderTime}
            onTriggerPushAlert={handleTriggerPushAlert}
            onCheckIn={handleCheckIn}
            onOpenCreateModal={() => {
              setHabitToEdit(null);
              setIsHabitModalOpen(true);
            }}
            onOpenTemplates={() => setCurrentRoute('templates')}
            onEditHabit={(h) => {
              setHabitToEdit(h);
              setIsHabitModalOpen(true);
            }}
            onTogglePause={handleTogglePause}
            onDeleteHabit={handleDeleteHabit}
            onReorderHabits={handleReorderHabits}
            aiEncouragement={aiEncouragement}
            isEncouragementLoading={isEncouragementLoading}
            encouragementError={encouragementError}
            onRefreshEncouragement={() => {
              if (!user) return;
              void triggerAiEncouragement({
                activeUser: user,
                habitsList: todayHabits,
                focus: dailyFocus,
                trigger: 'manual_boost',
                forceRefresh: true,
              });
            }}
            celebratingMilestones={celebratingMilestones}
            onDismissMilestone={(habitId, milestoneDays) => {
              if (user) {
                dismissMilestoneToday(user.id, habitId, milestoneDays, user.timezone);
              }
              setCelebratingMilestones((prev) => {
                const next = { ...prev };
                delete next[habitId];
                return next;
              });
            }}
            onReplayMilestone={(habitId, milestone) => {
              if (user) {
                clearDismissedMilestoneToday(user.id, habitId, user.timezone);
              }
              setCelebratingMilestones((prev) => ({
                ...prev,
                [habitId]: milestone,
              }));
              try {
                confetti({
                  particleCount: 45,
                  spread: 55,
                  origin: { y: 0.65 },
                  colors: ['#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#f43f5e'],
                });
              } catch {
                // ignore confetti errors
              }
            }}
          />
        )}

        {user && currentRoute === 'habits' && (
          <HabitsView
            habits={allHabits}
            categories={categories}
            onOpenCreateModal={() => {
              setHabitToEdit(null);
              setIsHabitModalOpen(true);
            }}
            onOpenTemplates={() => setCurrentRoute('templates')}
            onEditHabit={(h) => {
              setHabitToEdit(h);
              setIsHabitModalOpen(true);
            }}
            onTogglePause={handleTogglePause}
            onDeleteHabit={handleDeleteHabit}
          />
        )}

        {user && currentRoute === 'challenges' && (
          <ChallengesView
            userId={user.id}
            timezone={user.timezone}
            habits={allHabits}
            logs={allLogs}
            dailyFocuses={allDailyFocuses}
            categories={categories}
            badges={badges}
            joinedChallengeIds={joinedChallengeIds}
            customChallenges={customChallenges}
            onToggleJoin={handleToggleJoinChallenge}
            onCreateCustomChallenge={handleCreateCustomChallenge}
            onStepCustomChallenge={handleStepCustomChallenge}
            onDeleteCustomChallenge={handleDeleteCustomChallenge}
          />
        )}

        {user && currentRoute === 'stats' && (
          <StatsView
            habits={allHabits}
            logs={allLogs}
            categories={categories}
            badges={badges}
            userName={user.fullName}
            timezone={user.timezone}
            isDark={theme === 'DARK'}
            onApplyReminderTime={handleApplyReminderTime}
            onReportExported={(filename, topCategoryName, weeklyRate) => {
              addToast({
                type: 'success',
                title: 'Reporte semanal PDF generado',
                description: topCategoryName
                  ? `Adherencia 7d: ${weeklyRate}% · Top categoría: ${topCategoryName} (${filename})`
                  : `Archivo guardado como ${filename}`,
              });
            }}
          />
        )}

        {user && currentRoute === 'templates' && (
          <TemplatesView
            templates={templates}
            categories={categories}
            existingHabitTitles={allHabits.map((h) => h.title)}
            onAddTemplate={handleAddTemplate}
            onOpenCreateCustom={() => {
              setHabitToEdit(null);
              setIsHabitModalOpen(true);
            }}
            user={user}
            habits={allHabits}
            logs={allLogs}
            onAddSuggestedHabit={handleAddSuggestedHabit}
          />
        )}

        {user && currentRoute === 'profile' && (
          <ProfileView
            user={user}
            theme={theme}
            onChangeTheme={handleSetTheme}
            badges={badges}
            categories={categories}
            habits={allHabits}
            logs={allLogs}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onUpdateUser={handleUpdateUser}
            onResetData={handleResetData}
            onLogout={() => handleLogout(true)}
          />
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#ececec] dark:border-[#252e3a] bg-[#fafafb] dark:bg-[#101419] py-6 text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-center sm:justify-start text-center sm:text-left">
          <span>Impulso diario © {new Date().getFullYear()}</span>
        </div>
      </footer>

      {/* Habit Create / Edit & Contextual Journaling Modal */}
      <HabitModal
        isOpen={isHabitModalOpen || Boolean(journalPrompt)}
        onClose={() => {
          const skippedJournalHabit = journalPrompt?.habit;
          setIsHabitModalOpen(false);
          setHabitToEdit(null);
          setJournalPrompt(null);
          if (skippedJournalHabit && user) {
            void triggerAiEncouragement({
              activeUser: user,
              habitsList: todayHabits,
              focus: dailyFocus,
              trigger: 'habit_completed',
              habitTitle: skippedJournalHabit.title,
              habitStreak: skippedJournalHabit.currentStreak,
              showToast: true,
            });
          }
        }}
        categories={categories}
        habitToEdit={habitToEdit}
        mode={journalPrompt ? 'journal' : 'habit'}
        journalHabit={journalPrompt?.habit || null}
        journalLog={
          journalPrompt
            ? journalPrompt.log
            : habitToEdit && user
            ? allLogs.find(
                (l) =>
                  l.habitId === habitToEdit.id &&
                  l.logDate === getTodayDateString(user.timezone)
              ) || null
            : null
        }
        onSaveJournal={handleSaveJournal}
        onSave={handleSaveHabit}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          setCurrentRoute('today');
          refreshData(loggedUser);
          const greeting = getSpanishGreeting(loggedUser.timezone);
          const firstName = getGreetingFirstName(loggedUser.fullName, loggedUser.email);
          addToast({
            type: 'success',
            title: `¡${greeting}, ${firstName}!`,
            description: 'Nos alegra verte de nuevo. Tu rutina de hoy está lista.',
          });
        }}
      />

      {/* Sunday Weekly Reflection & Upcoming Week Focus Modal */}
      {user && (
        <WeeklyReflectionModal
          isOpen={isWeeklyReflectionOpen}
          habits={allHabits}
          logs={allLogs}
          categories={categories}
          badges={badges}
          timezone={user.timezone}
          userName={user.fullName}
          existingWeeklyFocus={weeklyFocus}
          onSaveWeeklyFocus={handleSaveWeeklyFocus}
          onDismiss={handleDismissWeeklyReflection}
        />
      )}

      {/* Global Toast Alerts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
