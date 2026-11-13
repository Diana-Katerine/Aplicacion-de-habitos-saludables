import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { User } from '../../types';
import { detectBrowserTimezone, StorageService } from '../../services/storage';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStarterHabit, setSelectedStarterHabit] = useState('tpl-1');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleDemoLogin = () => {
    const user = StorageService.getOrCreateDemoUser();
    onSuccess(user);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      setError('Por favor introduce tu nombre completo.');
      return;
    }

    const timezone = detectBrowserTimezone();
    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: email.trim(),
      fullName: fullName.trim() || 'Usuario Luminous',
      timezone,
      themePreference: 'DARK',
      role: 'USER',
      createdAt: new Date().toISOString(),
      reminderEnabled: true,
      reminderMorningTime: '08:00',
      reminderEveningTime: '21:00',
    };

    StorageService.setUser(newUser);
    StorageService.initializeSeedData(newUser.id, false);

    // If starter habit chosen, ensure it's in habits
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-[#111827] border border-white/10 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pb-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crea tu Cuenta'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'Accede a tus hábitos diarios y rachas continuas.'
              : 'Empieza a transformar tu rutina con 1 minuto al día.'}
          </p>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-950/50 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Alex Vance"
                className="w-full px-3.5 py-2 rounded-lg bg-[#090D16] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#10B981]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full px-3.5 py-2 rounded-lg bg-[#090D16] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#10B981]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-lg bg-[#090D16] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#10B981]"
            />
          </div>

          {/* If registering, offer 1-click first habit */}
          {mode === 'register' && (
            <div className="pt-1">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Primer hábito sugerido para hoy
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'tpl-1', title: 'Tomar 8 vasos de agua', meta: '8 vasos' },
                  { id: 'tpl-2', title: 'Caminar 20 minutos', meta: '20 min' },
                  { id: 'tpl-3', title: 'Meditación matutina', meta: '10 min' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedStarterHabit(item.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs text-left cursor-pointer transition-all ${
                      selectedStarterHabit === item.id
                        ? 'bg-[#1E293B] border-emerald-500 text-white'
                        : 'bg-[#090D16] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{item.title}</span>
                    <span className="text-[10px] text-slate-500 tabular-nums">{item.meta}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#003824] text-xs font-bold transition-all shadow-[0_0_16px_rgba(16,185,129,0.35)] cursor-pointer"
          >
            {mode === 'login' ? 'Entrar a mi cuenta' : 'Crear cuenta y comenzar'}
          </button>
        </form>

        {/* Quick Demo Access Button */}
        <div className="mt-4 pt-3 border-t border-white/[0.08]">
          <button
            onClick={handleDemoLogin}
            className="w-full py-2 rounded-lg bg-[#1E293B] hover:bg-[#27354A] border border-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Acceder de inmediato con Cuenta Demo</span>
          </button>
        </div>

        {/* Switch mode */}
        <div className="text-center mt-3 text-xs text-slate-400">
          {mode === 'login' ? (
            <span>
              ¿Aún no tienes cuenta?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-emerald-400 font-semibold hover:underline cursor-pointer"
              >
                Regístrate gratis
              </button>
            </span>
          ) : (
            <span>
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-emerald-400 font-semibold hover:underline cursor-pointer"
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
