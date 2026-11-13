import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
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
      fullName: fullName.trim() || 'Usuario Impulso Diario',
      timezone,
      themePreference: 'LIGHT',
      role: 'USER',
      createdAt: new Date().toISOString(),
      reminderEnabled: true,
      reminderMorningTime: '08:00',
      reminderEveningTime: '21:00',
    };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17191c]/35 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md steep-modal p-7 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-5 top-5 p-2 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#f2f2f3] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center pb-2">
          <h2 className="font-signifier font-normal text-[30px] leading-[1.2] tracking-[-0.015em] text-[#17191c]">
            {mode === 'login' ? 'Iniciar sesión' : 'Crea tu cuenta'}
          </h2>
          <p className="text-[14px] text-[#777b86] mt-1.5">
            {mode === 'login'
              ? 'Accede a tus hábitos diarios y rachas continuas.'
              : 'Empieza a transformar tu rutina con 1 minuto al día.'}
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-[16px] bg-[#fbe1d1] text-[#5d2a1a] text-[13px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-[13px] text-[#777b86] mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Alex Vance"
                className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] placeholder-[#a3a6af] text-[15px] focus:outline-none focus:border-[#17191c]"
              />
            </div>
          )}

          <div>
            <label className="block text-[13px] text-[#777b86] mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] placeholder-[#a3a6af] text-[15px] focus:outline-none focus:border-[#17191c]"
            />
          </div>

          <div>
            <label className="block text-[13px] text-[#777b86] mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] placeholder-[#a3a6af] text-[15px] focus:outline-none focus:border-[#17191c]"
            />
          </div>

          {mode === 'register' && (
            <div className="pt-1">
              <label className="block text-[13px] text-[#777b86] mb-2">
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
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[16px] text-[14px] text-left cursor-pointer transition-colors ${
                        selected
                          ? 'bg-[#17191c] text-white'
                          : 'bg-[#f2f2f3] hover:bg-[#e8e8ea] text-[#17191c]'
                      }`}
                    >
                      <span>{item.title}</span>
                      <span
                        className={`text-[12px] tabular-nums ${
                          selected ? 'text-white/75' : 'text-[#777b86]'
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
            className="w-full mt-2 py-3 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[15px] font-normal transition-colors cursor-pointer"
          >
            {mode === 'login' ? 'Entrar a mi cuenta' : 'Crear cuenta y comenzar'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-[#ececec]">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 rounded-full bg-transparent hover:bg-[#fafafb] border border-[#17191c] text-[14px] font-normal text-[#17191c] transition-colors cursor-pointer"
          >
            Acceder con cuenta demo
          </button>
        </div>

        <div className="text-center mt-4 text-[13px] text-[#777b86]">
          {mode === 'login' ? (
            <span>
              ¿Aún no tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-[#17191c] font-medium hover:underline cursor-pointer"
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
                className="text-[#17191c] font-medium hover:underline cursor-pointer"
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
