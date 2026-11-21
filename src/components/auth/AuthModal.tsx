import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import { User } from '../../types';
import { detectBrowserTimezone, StorageService } from '../../services/storage';
import { deriveNameFromEmail, isGenericPlaceholderName, resolveDisplayName } from '../../services/greeting';
import { ActionHint } from '../common/ActionHint';

interface Props {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [hasManualNameEdit, setHasManualNameEdit] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStarterHabit, setSelectedStarterHabit] = useState('tpl-1');
  const [error, setError] = useState<string | null>(null);

  // States for password recovery flow (HU #7)
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedCodeHint, setGeneratedCodeHint] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  React.useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessNotice(null);
    setForgotStep('request');
    setResetCode('');
    setNewPassword('');
    setGeneratedCodeHint(null);
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

  const handleRequestResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Por favor ingresa tu correo electrónico para enviarte las instrucciones.');
      return;
    }

    const { code } = StorageService.createPasswordResetToken(trimmedEmail);
    setGeneratedCodeHint(code);
    setForgotStep('verify');
    setSuccessNotice(
      `Hemos simulado el envío de un código de recuperación a ${trimmedEmail}. Código temporal: ${code}`
    );
  };

  const handleConfirmPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const trimmedEmail = email.trim();
    const res = StorageService.validateAndResetPassword(trimmedEmail, resetCode, newPassword);
    if (!res.success) {
      setError(res.error || 'Código incorrecto o expirado.');
      return;
    }

    setSuccessNotice('¡Tu contraseña ha sido actualizada con éxito! Ahora puedes iniciar sesión.');
    setPassword(newPassword);
    setForgotStep('request');
    setMode('login');
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
            {mode === 'login'
              ? 'Iniciar sesión'
              : mode === 'register'
              ? 'Crea tu cuenta'
              : 'Recuperar contraseña'}
          </h2>
          <p className="text-[13px] sm:text-[14px] text-[#777b86] dark:text-[#9aa4b2] mt-1.5">
            {mode === 'login'
              ? 'Accede a tus hábitos diarios y rachas continuas.'
              : mode === 'register'
              ? 'Empieza a transformar tu rutina con 1 minuto al día.'
              : 'Ingresa tu correo para restablecer tu acceso.'}
          </p>
        </div>

        {/* HU #1 Confirmation notice / HU #7 recovery feedback */}
        {successNotice && (
          <div className="mt-4 p-3 rounded-[16px] bg-[#ecfdf5] dark:bg-[#064e3b]/30 border border-[#059669]/30 text-[#065f46] dark:text-[#6ee7b7] text-[13px] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successNotice}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-[16px] bg-[#fbe1d1] dark:bg-[#241814] border border-transparent dark:border-[#4a2d20] text-[#5d2a1a] dark:text-[#fbdac7] text-[13px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FORGOT PASSWORD MODE (HU #7) */}
        {mode === 'forgot' ? (
          forgotStep === 'request' ? (
            <form onSubmit={handleRequestResetCode} className="mt-5 space-y-4">
              <div>
                <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-1.5">
                  Correo electrónico registrado
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[15px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399]"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-full bg-[#52796F] hover:bg-[#344E41] text-white text-[15px] font-normal transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Enviar código de recuperación</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  className="inline-flex items-center gap-1.5 text-[13px] text-[#52796F] dark:text-[#84A98C] font-medium hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver a iniciar sesión
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirmPasswordReset} className="mt-5 space-y-4">
              <div>
                <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-1.5">
                  Código de 6 dígitos
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder={generatedCodeHint || '123456'}
                  className="w-full px-4 py-2.5 tracking-widest text-center font-mono rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[18px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399]"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2] mb-1.5">
                  Nueva contraseña (mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] placeholder-[#a3a6af] dark:placeholder-[#6f7a8a] text-[15px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399]"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-full bg-[#52796F] hover:bg-[#344E41] text-white text-[15px] font-normal transition-colors cursor-pointer"
              >
                Establecer nueva contraseña
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setForgotStep('request')}
                  className="inline-flex items-center gap-1.5 text-[13px] text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Cambiar correo
                </button>
              </div>
            </form>
          )
        ) : (
          /* LOGIN & REGISTER MODES */
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
                  Contraseña
                </label>
                {/* HU #2 - Enlace visible a recuperación de contraseña */}
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessNotice(null);
                      setMode('forgot');
                    }}
                    className="text-[12px] text-[#059669] dark:text-[#34d399] hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
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

                <div className="mt-3 p-3 rounded-[14px] bg-[#F8FAFC] dark:bg-[#1E293B]/40 border border-[#E2E8F0] dark:border-[#334155] text-[12px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>Te enviaremos un correo de confirmación y bienvenida al registrarte.</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-full bg-[#52796F] hover:bg-[#344E41] text-white text-[15px] font-normal transition-colors cursor-pointer"
            >
              {mode === 'login' ? 'Entrar a mi cuenta' : 'Crear cuenta y comenzar'}
            </button>
          </form>
        )}

        {mode !== 'forgot' && (
          <div className="mt-4 pt-4 border-t border-[#ececec] dark:border-[#252e3a] space-y-1.5">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 rounded-full bg-transparent hover:bg-[#EAF4F4] dark:hover:bg-[#22332A] border border-[#84A98C]/40 hover:border-[#52796F] text-[14px] font-normal text-[#52796F] dark:text-[#84A98C] transition-colors cursor-pointer"
            >
              Acceder con cuenta demo (Alex)
            </button>
            <p className="text-center text-[12px] text-[#777b86] dark:text-[#9aa4b2]">
              Explora la rutina real de Alex Vance: 95 días de historial, rachas activas, diario e insignias.
            </p>
          </div>
        )}

        {mode !== 'forgot' && (
          <div className="text-center mt-4 text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
            {mode === 'login' ? (
              <span>
                ¿Aún no tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessNotice(null);
                    setMode('register');
                  }}
                  className="text-[#52796F] dark:text-[#84A98C] font-medium hover:underline cursor-pointer"
                >
                  Regístrate gratis
                </button>
              </span>
            ) : (
              <span>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessNotice(null);
                    setMode('login');
                  }}
                  className="text-[#52796F] dark:text-[#84A98C] font-medium hover:underline cursor-pointer"
                >
                  Inicia sesión
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
