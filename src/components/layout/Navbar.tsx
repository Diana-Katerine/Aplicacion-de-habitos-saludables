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
      className={`sticky top-0 z-40 w-full min-h-16 bg-white/95 dark:bg-[#1A2721]/95 backdrop-blur-md border-b border-[#84A98C]/25 dark:border-[#344E41] transition-colors duration-200`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 min-h-16 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-3 gap-y-2">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate(user ? 'today' : 'landing')}
          className="text-left whitespace-nowrap shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2 rounded-lg"
        >
          <span className="font-bold text-xl sm:text-2xl leading-tight tracking-tight text-[#344E41] dark:text-[#EAF4F4]">
            Impulso <span className="text-[#52796F] dark:text-[#84A98C]">Diario</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        {user ? (
          <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const active = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2 ${
                    active
                      ? 'bg-[#D8F3DC]/70 dark:bg-[#22332A] text-[#344E41] dark:text-[#D8F3DC] font-semibold border border-[#84A98C]/40'
                      : 'text-[#52796F] dark:text-[#84A98C] hover:text-[#344E41] dark:hover:text-white hover:bg-[#EAF4F4] dark:hover:bg-[#22332A]/70'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        ) : (
          <nav aria-label="Navegación de secciones" className="hidden md:flex items-center gap-6">
            {[
              { href: '#que-ofrecemos', label: 'Qué ofrecemos' },
              { href: '#como-funciona', label: 'Cómo funciona' },
              { href: '#historia', label: 'Testimonio' },
            ].map((anchor) => (
              <a
                key={anchor.href}
                href={anchor.href}
                className="min-h-[44px] inline-flex items-center text-sm font-medium text-[#52796F] dark:text-[#84A98C] hover:text-[#344E41] dark:hover:text-[#D8F3DC] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2 rounded-md px-2"
              >
                {anchor.label}
              </a>
            ))}
          </nav>
        )}

        {/* Zone 3: Theme Toggle, Pill CTA & User Action */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-full flex-wrap justify-end">
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
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg border border-[#84A98C]/30 bg-white dark:bg-[#22332A] hover:bg-[#EAF4F4] dark:hover:bg-[#1A2721] text-[#344E41] dark:text-[#EAF4F4] inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-[#84A98C] shrink-0" />
                ) : (
                  <Moon className="w-5 h-5 text-[#52796F] shrink-0" />
                )}
                <span className="hidden sm:inline">Tema</span>
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
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#52796F] hover:bg-[#344E41] text-white text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Nuevo hábito</span>
                </button>
              </ActionHint>

              <ActionHint
                message="Abrirá tu perfil, categorías y configuración"
                tone="accent"
                position="bottom"
                align="right"
              >
                <button
                  type="button"
                  onClick={() => onNavigate('profile')}
                  aria-label="Perfil y configuración"
                  className={`min-h-[44px] min-w-[44px] rounded-lg bg-[#D8F3DC] dark:bg-[#22332A] border border-[#84A98C]/40 text-[#344E41] dark:text-[#D8F3DC] hover:bg-[#84A98C]/20 text-sm font-bold flex items-center justify-center transition-all shrink-0 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2 ${
                    currentRoute === 'profile'
                      ? 'ring-2 ring-[#52796F] ring-offset-2'
                      : ''
                  }`}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.fullName.charAt(0).toUpperCase()
                  )}
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
                  aria-label="Cerrar sesión"
                  className="min-h-[44px] min-w-[44px] flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#22332A] hover:border-rose-300 dark:hover:border-rose-700 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2"
                >
                  <LogOut className="w-5 h-5" />
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
                  className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center text-[#344E41] dark:text-[#EAF4F4] bg-white dark:bg-[#22332A] border border-[#84A98C]/30 hover:bg-[#EAF4F4] dark:hover:bg-[#1A2721] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6 stroke-[2.25]" /> : <Menu className="w-6 h-6 stroke-[2.25]" />}
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
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#52796F] hover:bg-[#344E41] text-white text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2 shadow-sm transition-colors"
              >
                Iniciar sesión
              </button>
            </ActionHint>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-[#84A98C]/25 dark:border-[#344E41] bg-white dark:bg-[#1A2721] px-4 py-4 space-y-1 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain">
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
                className={`w-full min-h-[44px] text-left px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2 ${
                  active
                    ? 'bg-[#D8F3DC]/70 dark:bg-[#22332A] text-[#344E41] dark:text-[#D8F3DC] font-bold border border-[#84A98C]/40'
                    : 'text-[#52796F] dark:text-[#84A98C] hover:text-[#344E41] dark:hover:text-white hover:bg-[#EAF4F4] dark:hover:bg-[#22332A]'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2]" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 mt-2 border-t border-[#84A98C]/25 dark:border-[#344E41] space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCreateModal();
              }}
              className="w-full min-h-[44px] py-2.5 rounded-lg bg-[#52796F] hover:bg-[#344E41] text-white text-sm font-medium flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2 shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo hábito</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full min-h-[44px] py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#22332A] text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52796F] focus-visible:ring-offset-2"
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
