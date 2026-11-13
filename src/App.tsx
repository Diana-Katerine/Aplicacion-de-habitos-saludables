import React, { useState, useEffect } from 'react';
import { Challenge, DailyFocus, Habit, HabitLog, HabitWithTodayLog, User, ViewRoute } from './types';
import { StorageService, getTodayDateString } from './services/storage';
import { Navbar } from './components/layout/Navbar';
import { TodayView } from './components/today/TodayView';
import { HabitsView } from './components/habits/HabitsView';
import { StatsView } from './components/stats/StatsView';
import { ChallengesView } from './components/challenges/ChallengesView';
import { TemplatesView } from './components/templates/TemplatesView';
import { ProfileView } from './components/profile/ProfileView';
import { LandingPage } from './components/landing/LandingPage';
import { HabitModal } from './components/habits/HabitModal';
import { AuthModal } from './components/auth/AuthModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentRoute, setCurrentRoute] = useState<ViewRoute | 'landing'>('today');
  const [todayHabits, setTodayHabits] = useState<HabitWithTodayLog[]>([]);
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [allLogs, setAllLogs] = useState<HabitLog[]>([]);
  const [dailyFocus, setDailyFocus] = useState<DailyFocus | null>(null);
  const [allDailyFocuses, setAllDailyFocuses] = useState<DailyFocus[]>([]);
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<string[]>([]);
  const [customChallenges, setCustomChallenges] = useState<Challenge[]>([]);
  const [categories, setCategories] = useState(StorageService.getCategories());
  const [templates, setTemplates] = useState(StorageService.getTemplates());

  // Modals & Toasts
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Initialize user & data on load
  useEffect(() => {
    // Check if user exists or initialize demo user if preferred
    const savedUser = StorageService.getUser();
    if (savedUser) {
      setUser(savedUser);
      setCurrentRoute('today');
      refreshData(savedUser);
    } else {
      // By default show Landing page with interactive demo or 1-click demo entry
      setCurrentRoute('landing');
    }
  }, []);

  const refreshData = (activeUser: User) => {
    const habits = StorageService.getHabits(activeUser.id);
    const logs = StorageService.getLogs(activeUser.id);
    const todayH = StorageService.getTodayHabits(activeUser.id, activeUser.timezone);
    const focus = StorageService.getDailyFocus(activeUser.id, activeUser.timezone);
    const focuses = StorageService.getAllDailyFocuses(activeUser.id);
    const joined = StorageService.getJoinedChallengeIds(activeUser.id);
    const custom = StorageService.getCustomChallenges(activeUser.id);

    setAllHabits(habits);
    setAllLogs(logs);
    setTodayHabits(todayH);
    setDailyFocus(focus);
    setAllDailyFocuses(focuses);
    setJoinedChallengeIds(joined);
    setCustomChallenges(custom);
    setCategories(StorageService.getCategories());
    setTemplates(StorageService.getTemplates());
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

    const previousLog = todayHabits.find((h) => h.id === habitId)?.todayLog;
    const previousCompleted = previousLog ? previousLog.isCompleted : false;
    const previousValue = previousLog ? previousLog.completedValue : 0;

    try {
      const result = StorageService.checkInHabit(
        user.id,
        habitId,
        completedValueChange,
        forceCompleted,
        user.timezone
      );

      refreshData(user);

      // Toast feedback
      if (!previousCompleted && result.log.isCompleted) {
        addToast({
          type: 'success',
          title: `¡${result.habit.title} completado!`,
          description: `Racha en ${result.habit.currentStreak} días consecutivos.`,
          onUndo: () => {
            // Rollback check-in
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
  }) => {
    if (!user) return;

    if (habitToEdit) {
      StorageService.updateHabit(user.id, habitToEdit.id, habitData);
      addToast({
        type: 'success',
        title: 'Hábito actualizado',
        description: `Los cambios en "${habitData.title}" fueron guardados.`,
      });
    } else {
      StorageService.createHabit(user.id, habitData);
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

  // Update user profile
  const handleUpdateUser = (updatedUser: Partial<User>) => {
    if (!user) return;
    const merged = { ...user, ...updatedUser };
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
    refreshData(user);
    addToast({
      type: 'info',
      title: 'Datos restaurados',
      description: 'Se ha cargado la demostración inicial con rachas de ejemplo.',
    });
  };

  // Logout
  const handleLogout = () => {
    StorageService.setUser(null);
    setUser(null);
    setCurrentRoute('landing');
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

  // Quick Demo Access from Landing Page
  const handleTryDemo = () => {
    const demoUser = StorageService.getOrCreateDemoUser();
    setUser(demoUser);
    setCurrentRoute('today');
    refreshData(demoUser);
    addToast({
      type: 'success',
      title: '¡Modo demostración activado!',
      description: 'Explora hábitos reales, mapas de calor y registro en tiempo real.',
    });
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#dfe2ef] flex flex-col selection:bg-[#10B981]/30 selection:text-white">
      {/* 3-Zone Navigation Header */}
      <Navbar
        currentRoute={currentRoute}
        user={user}
        onNavigate={(route) => setCurrentRoute(route)}
        onOpenCreateModal={() => {
          setHabitToEdit(null);
          setIsHabitModalOpen(true);
        }}
        onOpenAuth={(mode = 'login') => {
          setAuthMode(mode);
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {currentRoute === 'landing' && !user && (
          <LandingPage
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
            onSaveFocus={handleSaveFocus}
            onToggleFocusComplete={handleToggleFocusComplete}
            onClearFocus={handleClearFocus}
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
            joinedChallengeIds={joinedChallengeIds}
            customChallenges={customChallenges}
            onToggleJoin={handleToggleJoinChallenge}
            onCreateCustomChallenge={handleCreateCustomChallenge}
            onStepCustomChallenge={handleStepCustomChallenge}
            onDeleteCustomChallenge={handleDeleteCustomChallenge}
          />
        )}

        {user && currentRoute === 'stats' && (
          <StatsView habits={allHabits} logs={allLogs} categories={categories} />
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
          />
        )}

        {user && currentRoute === 'profile' && (
          <ProfileView
            user={user}
            onUpdateUser={handleUpdateUser}
            onResetData={handleResetData}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Luminous Momentum © {new Date().getFullYear()} — Habit Tracker & Ritual Formation</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Zona Horaria: <strong className="text-slate-300 font-mono">{user?.timezone || 'Auto'}</strong></span>
            <span>·</span>
            <span>Estilo: <strong className="text-emerald-400">Luminous Emerald</strong></span>
          </div>
        </div>
      </footer>

      {/* Habit Create / Edit Modal */}
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => {
          setIsHabitModalOpen(false);
          setHabitToEdit(null);
        }}
        categories={categories}
        habitToEdit={habitToEdit}
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
        }}
      />

      {/* Global Toast Alerts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
