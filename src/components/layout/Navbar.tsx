import React from 'react';
import {
  Plus,
  Calendar,
  CheckSquare,
  BarChart3,
  BookOpen,
  Trophy,
  User as UserIcon,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { User, ViewRoute } from '../../types';
import { ActionHint } from '../common/ActionHint';

interface Props {
  currentRoute: ViewRoute | 'landing';
  user: User | null;
  theme?: 'LIGHT' | 'DARK';
  onToggleTheme?: () => void;
  onNavigate: (route: ViewRoute | 'landing') => void;
  onOpenCreateModal: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentRoute,
  user,
  theme = 'LIGHT',
  onToggleTheme,
  onNavigate,
  onOpenCreateModal,
  onOpenAuth,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const isDark = theme === 'DARK';

  React.useEffect(() => {
    if (!user) {
      setMobileMenuOpen(false);
    }
  }, [user]);

  const navItems: { route: ViewRoute; label: string }[] = [
    { route: 'today', label: 'Hoy' },
    { route: 'habits', label: 'Hábitos' },
    { route: 'challenges', label: 'Retos' },
    { route: 'stats', label: 'Estadísticas' },
    { route: 'templates', label: 'Plantillas' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0c0f12]/95 backdrop-blur-md transition-colors duration-200 ${
        user ? 'border-b border-[#ececec] dark:border-[#252e3a]' : 'border-b border-transparent dark:border-[#181f28]'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-3 sm:px-6 min-h-[64px] py-2 sm:py-0 sm:h-[72px] flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-2 sm:gap-4">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate(user ? 'today' : 'landing')}
          className="text-left text-[#17191c] dark:text-[#f1f5f9] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span className="font-signifier text-[19px] sm:text-[24px] leading-none tracking-[-0.02em] text-[#17191c] dark:text-[#f1f5f9]">
            Impulso <span className="chromatic-gradient-text italic">diario</span>
          </span>
        </button>

        {/* Zone 2: Whisper-quiet Navigation Links */}
        {user ? (
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-[14px] lg:text-[15px] font-normal">
            {navItems.map((item) => {
              const active = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  className={`py-0.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-[#059669] dark:text-[#34d399] font-medium underline decoration-[#059669] dark:decoration-[#34d399] decoration-2 underline-offset-[6px]'
                      : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] hover:underline hover:underline-offset-[6px]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-7 text-[15px] font-normal">
            {[
              { href: '#que-ofrecemos', label: 'Qué ofrecemos' },
              { href: '#como-funciona', label: 'Cómo funciona' },
              { href: '#historia', label: 'Testimonio' },
            ].map((anchor) => (
              <a
                key={anchor.href}
                href={anchor.href}
                className="py-0.5 text-[#777b86] dark:text-[#9aa4b2] hover:text-[#059669] dark:hover:text-[#34d399] hover:underline hover:underline-offset-[6px] transition-colors whitespace-nowrap shrink-0"
              >
                {anchor.label}
              </a>
            ))}
          </nav>
        )}

        {/* Zone 3: Theme Toggle, Pill CTA & User Action */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 max-w-full flex-wrap justify-end">
          {onToggleTheme && (
            <ActionHint
              message={
                isDark
                  ? 'Cambiará de modo oscuro a modo claro'
                  : 'Cambiará de modo claro a modo oscuro'
              }
              tone="theme"
              position="bottom"
              align="right"
            >
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-[#ececec] dark:border-[#252e3a] bg-[#fafafb] dark:bg-[#141920] hover:border-[#4F46E5]/45 dark:hover:border-[#818cf8]/50 hover:bg-[#EEF2FF]/70 dark:hover:bg-[#4F46E5]/15 text-[#17191c] dark:text-[#f1f5f9] inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#fbbf24] shrink-0" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#4F46E5] shrink-0" />
                )}
                <span>Cambiar claro/oscuro</span>
              </button>
            </ActionHint>
          )}

          {user ? (
            <>
              <ActionHint
                message="Abrirá el formulario para crear un nuevo hábito"
                tone="accent"
                position="bottom"
                align="center"
                className="hidden sm:inline-flex"
              >
                <button
                  type="button"
                  onClick={onOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full btn-chromatic text-[14px] leading-none font-medium whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Nuevo hábito</span>
                </button>
              </ActionHint>

              <ActionHint
                message="Abrirá tu perfil, categorías y tema visual"
                tone="accent"
                position="bottom"
                align="right"
              >
                <button
                  type="button"
                  onClick={() => onNavigate('profile')}
                  aria-label="Perfil y configuración"
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#059669] via-[#0284c7] to-[#7c3aed] hover:opacity-90 text-[13px] font-medium text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs ${
                    currentRoute === 'profile'
                      ? 'ring-2 ring-[#0284c7] dark:ring-[#38bdf8] ring-offset-2 ring-offset-white dark:ring-offset-[#0c0f12]'
                      : ''
                  }`}
                >
                  {user.fullName.charAt(0).toUpperCase()}
                </button>
              </ActionHint>

              <ActionHint
                message="Cerrará tu sesión actual e irá al inicio de sesión"
                tone="danger"
                position="bottom"
                align="right"
                className="hidden sm:inline-flex"
              >
                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="Cerrar sesión e ir al login"
                  className="flex w-10 h-10 rounded-full border border-[#ececec] dark:border-[#252e3a] bg-[#fafafb] dark:bg-[#141920] hover:border-[#b91c1c]/45 dark:hover:border-[#f87171]/45 text-[#777b86] dark:text-[#9aa4b2] hover:text-[#b91c1c] dark:hover:text-[#fca5a5] items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                </button>
              </ActionHint>

              <ActionHint
                message={
                  mobileMenuOpen
                    ? 'Cerrará el menú de navegación'
                    : 'Abrirá el menú de navegación'
                }
                tone="neutral"
                position="bottom"
                align="right"
                className="md:hidden"
              >
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-[#17191c] dark:text-[#f1f5f9] bg-[#fafafb] dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a] hover:bg-[#f2f2f3] dark:hover:bg-[#1b222b] cursor-pointer"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.25]" />}
                </button>
              </ActionHint>
            </>
          ) : (
            <ActionHint
              message="Abrirá el inicio de sesión para entrar a tu cuenta"
              tone="accent"
              position="bottom"
              align="right"
            >
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full btn-chromatic text-[12px] sm:text-[14px] leading-none font-medium whitespace-nowrap shrink-0 cursor-pointer"
              >
                Iniciar sesión
              </button>
            </ActionHint>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-[#ececec] dark:border-[#252e3a] bg-white dark:bg-[#141920] px-4 py-4 space-y-1 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain">
          {[
            { route: 'today' as ViewRoute, label: 'Hoy', icon: Calendar },
            { route: 'habits' as ViewRoute, label: 'Mis Hábitos', icon: CheckSquare },
            { route: 'challenges' as ViewRoute, label: 'Retos', icon: Trophy },
            { route: 'stats' as ViewRoute, label: 'Estadísticas', icon: BarChart3 },
            { route: 'templates' as ViewRoute, label: 'Plantillas', icon: BookOpen },
            { route: 'profile' as ViewRoute, label: 'Perfil & Zona Horaria', icon: UserIcon },
          ].map((item) => {
            const Icon = item.icon;
            const active = currentRoute === item.route;
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => {
                  onNavigate(item.route);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-full text-[15px] flex items-center gap-3 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#ECFDF5] dark:bg-[#059669]/20 text-[#047857] dark:text-[#34d399] font-medium'
                    : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9] hover:bg-[#fafafb] dark:hover:bg-[#1b222b]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 mt-2 border-t border-[#ececec] dark:border-[#252e3a] space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCreateModal();
              }}
              className="w-full py-3 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[14px] font-medium text-center cursor-pointer"
            >
              + Nuevo hábito
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full py-2.5 rounded-full border border-[#ececec] dark:border-[#252e3a] text-[#b91c1c] dark:text-[#fca5a5] text-[14px] font-normal flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
