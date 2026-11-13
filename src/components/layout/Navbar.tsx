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
} from 'lucide-react';
import { User, ViewRoute } from '../../types';

interface Props {
  currentRoute: ViewRoute | 'landing';
  user: User | null;
  onNavigate: (route: ViewRoute | 'landing') => void;
  onOpenCreateModal: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentRoute,
  user,
  onNavigate,
  onOpenCreateModal,
  onOpenAuth,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { route: ViewRoute; label: string }[] = [
    { route: 'today', label: 'Hoy' },
    { route: 'habits', label: 'Hábitos' },
    { route: 'challenges', label: 'Retos' },
    { route: 'stats', label: 'Estadísticas' },
    { route: 'templates', label: 'Plantillas' },
    { route: 'profile', label: 'Perfil' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md ${
        user ? 'border-b border-[#ececec]' : ''
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-5 sm:px-6 h-[72px] flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate(user ? 'today' : 'landing')}
          className="flex items-center gap-2.5 text-left text-[#17191c] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span className="font-signifier text-[24px] leading-none tracking-[-0.02em] text-[#17191c]">
            Impulso
          </span>
        </button>

        {/* Zone 2: Whisper-quiet Navigation Links */}
        {user ? (
          <nav className="hidden md:flex items-center gap-7 text-[15px] font-normal">
            {navItems.map((item) => {
              const active = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  className={`py-0.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-[#17191c] underline decoration-[#17191c] underline-offset-[6px]'
                      : 'text-[#777b86] hover:text-[#17191c] hover:underline hover:underline-offset-[6px]'
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
                className="py-0.5 text-[#777b86] hover:text-[#17191c] hover:underline hover:underline-offset-[6px] transition-colors whitespace-nowrap shrink-0"
              >
                {anchor.label}
              </a>
            ))}
          </nav>
        )}

        {/* Zone 3: Pill CTA / User Action */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[14px] leading-none font-normal transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo hábito</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#fbe1d1] text-[13px] font-medium text-[#17191c] hover:text-[#5d2a1a] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title="Ver perfil"
              >
                {user.fullName.charAt(0).toUpperCase()}
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Abrir menú"
                className="md:hidden p-2 rounded-full text-[#17191c] hover:bg-[#f2f2f3] cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="text-[15px] font-normal text-[#17191c] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="px-5 py-2.5 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[15px] leading-none font-normal transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Comenzar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-[#ececec] bg-white px-5 py-4 space-y-1">
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
                    ? 'bg-[#f2f2f3] text-[#17191c] font-medium'
                    : 'text-[#777b86] hover:text-[#17191c] hover:bg-[#fafafb]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-3 mt-2 border-t border-[#ececec]">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCreateModal();
              }}
              className="w-full py-3 rounded-full bg-[#17191c] text-white text-[14px] font-normal text-center cursor-pointer"
            >
              + Nuevo hábito
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
