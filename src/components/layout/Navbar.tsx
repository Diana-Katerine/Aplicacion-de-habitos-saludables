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
      className={`sticky top-0 z-40 w-full min-h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 min-h-16 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-3 gap-y-2">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate(user ? 'today' : 'landing')}
          className="text-left text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 rounded-lg"
        >
          <span className="font-bold text-xl sm:text-2xl leading-tight tracking-tight text-slate-900 dark:text-white">
            Impulso <span className="text-indigo-600 dark:text-indigo-400">Diario</span>
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
                  className={`min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                    active
                      ? 'bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-semibold border border-slate-200 dark:border-slate-700'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
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
                className="min-h-[44px] inline-flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 rounded-md px-2"
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
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-amber-500 shrink-0" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-600 shrink-0" />
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
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 shadow-sm"
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
                  className={`min-h-[44px] min-w-[44px] rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-sm font-bold flex items-center justify-center transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
                    currentRoute === 'profile'
                      ? 'ring-2 ring-indigo-600 ring-offset-2'
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
                  aria-label="Cerrar sesión"
                  className="min-h-[44px] min-w-[44px] flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-rose-300 dark:hover:border-rose-700 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
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
                  className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
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
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 shadow-sm"
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
