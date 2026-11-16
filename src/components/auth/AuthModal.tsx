import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { User } from '../../types';
import { detectBrowserTimezone, StorageService } from '../../services/storage';
import { deriveNameFromEmail, isGenericPlaceholderName, resolveDisplayName } from '../../services/greeting';
import { ActionHint } from '../common/ActionHint';

interface Props {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [hasManualNameEdit, setHasManualNameEdit] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStarterHabit, setSelectedStarterHabit] = useState('tpl-1');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setMode(initialMode);
    setError(null);
    if (isOpen) {
      setHasManualNameEdit(false);
    }
  }, [initialMode, isOpen]);

  React.useEffect(() => {
    if (!isOpen || hasManualNameEdit) return;
    const savedName = StorageService.getSavedAccountName(email);
    if (savedName) {
      setFullName(savedName);
    }
  }, [email, isOpen, hasManualNameEdit]);

  if (!isOpen) return null;

  const handleDemoLogin = () => {
    const user = StorageService.getOrCreateDemoUser();
    onSuccess(user);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    const savedProfile = StorageService.getSavedAccountProfile(trimmedEmail);
    const typedName = fullName.trim();

    if (typedName && isGenericPlaceholderName(typedName)) {
      setError('Por favor escribe tu nombre real para poder saludarte por tu nombre.');
      return;
    }

    const candidateName =
      (typedName && !isGenericPlaceholderName(typedName) ? typedName : '') ||
      (savedProfile && !isGenericPlaceholderName(savedProfile.fullName) ? savedProfile.fullName : '') ||
      deriveNameFromEmail(trimmedEmail);

    const resolvedName = resolveDisplayName(candidateName, trimmedEmail);

    if (mode === 'register' && !typedName) {
      setError('Por favor introduce tu nombre completo.');
      return;
    }

    if (!resolvedName || isGenericPlaceholderName(resolvedName)) {
      setError('Por favor escribe tu nombre para poder saludarte por tu nombre.');
      return;
    }

    const timezone = detectBrowserTimezone();
    const activeTheme =
      typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
        ? 'DARK'
        : 'LIGHT';
    const newUser: User = {
      id: savedProfile?.id || `usr-${Date.now()}`,
      email: trimmedEmail,
      fullName: resolvedName,
      timezone,
      themePreference: activeTheme,
      role: 'USER',
      createdAt: new Date().toISOString(),
      reminderEnabled: true,
      reminderMorningTime: '08:00',
      reminderEveningTime: '21:00',
    };

    StorageService.saveAccountProfile(trimmedEmail, resolvedName, timezone, newUser.id);
    StorageService.setUser(newUser);
    StorageService.initializeSeedData(newUser.id, false);

    if (mode === 'register' && selectedStarterHabit) {
      try {
        StorageService.addTemplateToUser(newUser.id, selectedStarterHabit);
      } catch (err) {
        console.error(err);
      }
    }

    onSuccess(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-5 bg-[#17191c]/35 dark:bg-[#050709]/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md steep-modal p-5 sm:p-8 my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] overflow-y-auto overscroll-contain">
        <ActionHint
          message="Cerrará esta ventana sin iniciar sesión"
          tone="neutral"
          position="bottom"
          align="right"
          className="!absolute right-3.5 top-3.5 sm:right-4 sm:top-4"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-11 h-11 rounded-full border border-[#ececec] dark:border-[#252e3a] bg-[#fafafb] dark:bg-[#1b222b] text-[#5c616d] dark:text-[#9aa4b2] hover:text-[#b91c1c] dark:hover:text-[#fca5a5] hover:bg-[#fee2e2]/60 dark:hover:bg-[#7f1d1d]/30 hover:border-[#ef4444]/40 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </ActionHint>

        <div className="text-center pb-2 px-10 sm:px-8">
          <h2 className="font-signifier font-normal text-[25px] sm:text-[30px] leading-[1.2] tracking-[-0.015em] text-[#17191c] dark:text-[#f1f5f9]">
            {mode === 'login' ? 'Iniciar sesión' : 'Crea tu cuenta'}
          </h2>
          <p className="text-[13px] sm:text-[14px] text-[#777b86] dark:text-[#9aa4b2] mt-1.5">
            {mode === 'login'
              ? 'Accede a tus hábitos diarios y rachas continuas.'
              : 'Empieza a transformar tu rutina con 1 minuto al día.'}
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-[16px] bg-[#fbe1d1] dark:bg-[#241814] border border-transparent dark:border-[#4a2d20] text-[#5d2a1a] dark:text-[#fbdac7] text-[13px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-1.5">
              {mode === 'register' ? 'Nombre completo' : 'Tu nombre'}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setHasManualNameEdit(true);
                setFullName(e.target.value);
              }}
              placeholder="Ej: Diana Pérez"
              className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[15px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399]"
            />
          </div>

          <div>
            <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[15px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399]"
            />
          </div>

          <div>
            <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[15px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399]"
            />
          </div>

          {mode === 'register' && (
            <div className="pt-1">
              <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-2">
                Primer hábito sugerido para hoy
              </label>
              <div className="space-y-2">
                {[
                  { id: 'tpl-1', title: 'Tomar 8 vasos de agua', meta: '8 vasos' },
                  { id: 'tpl-2', title: 'Caminar 20 minutos', meta: '20 min' },
                  { id: 'tpl-3', title: 'Meditación matutina', meta: '10 min' },
                ].map((item) => {
                  const selected = selectedStarterHabit === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedStarterHabit(item.id)}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 sm:px-4 py-2.5 rounded-[16px] text-[13px] sm:text-[14px] text-left cursor-pointer transition-colors border ${
                        selected
                          ? 'bg-[#ECFDF5] dark:bg-[#059669]/18 border-[#059669] dark:border-[#34d399] text-[#17191c] dark:text-[#f1f5f9] font-medium'
                          : 'bg-[#f2f2f3] dark:bg-[#1b222b] border-transparent dark:border-[#252e3a] hover:bg-[#e8e8ea] dark:hover:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9]'
                      }`}
                    >
                      <span className="min-w-0 break-words">{item.title}</span>
                      <span
                        className={`text-[12px] tabular-nums shrink-0 ${
                          selected ? 'text-[#047857] dark:text-[#34d399]' : 'text-[#777b86] dark:text-[#9aa4b2]'
                        }`}
                      >
                        {item.meta}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[15px] font-normal transition-colors cursor-pointer"
          >
            {mode === 'login' ? 'Entrar a mi cuenta' : 'Crear cuenta y comenzar'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-[#ececec] dark:border-[#252e3a] space-y-1.5">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 rounded-full bg-transparent hover:bg-[#E0F2FE]/60 dark:hover:bg-[#0284C7]/15 border border-[#0284C7]/40 dark:border-[#38BDF8]/40 hover:border-[#0284C7] dark:hover:border-[#38BDF8] text-[14px] font-normal text-[#0369A1] dark:text-[#38bdf8] transition-colors cursor-pointer"
          >
            Acceder con cuenta demo (Alex)
          </button>
          <p className="text-center text-[12px] text-[#777b86] dark:text-[#9aa4b2]">
            Explora la rutina real de Alex Vance: 95 días de historial, rachas activas, diario e insignias.
          </p>
        </div>

        <div className="text-center mt-4 text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
          {mode === 'login' ? (
            <span>
              ¿Aún no tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-[#059669] dark:text-[#34d399] font-medium hover:underline cursor-pointer"
              >
                Regístrate gratis
              </button>
            </span>
          ) : (
            <span>
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#059669] dark:text-[#34d399] font-medium hover:underline cursor-pointer"
              >
                Inicia sesión
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
