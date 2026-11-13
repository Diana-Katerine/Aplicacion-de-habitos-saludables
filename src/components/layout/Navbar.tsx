import React from 'react';
import {
  Flame,
  Plus,
  Calendar,
  CheckSquare,
  BarChart3,
  BookOpen,
  Trophy,
  User as UserIcon,
  LogIn,
  LogOut,
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
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <>
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 w-full bg-[#090D16]/95 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (single text element) */}
          <button
            onClick={() => onNavigate(user ? 'today' : 'landing')}
            className="flex items-center gap-2.5 text-left text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#10B981] to-[#34D399] flex items-center justify-center text-[#003824] shadow-[0_0_12px_rgba(16,185,129,0.4)]">
              <Flame className="w-5 h-5 fill-[#003824]" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
              Luminous Momentum
            </span>
          </button>

          {/* Zone 2: Navigation Links (single-line, whitespace-nowrap) */}
          {user && (
            <nav className="hidden md:flex items-center gap-5 text-sm font-semibold text-slate-300">
              <button
                onClick={() => onNavigate('today')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                  currentRoute === 'today'
                    ? 'text-white border-b-2 border-[#10B981]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Hoy
              </button>

              <button
                onClick={() => onNavigate('habits')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                  currentRoute === 'habits'
                    ? 'text-white border-b-2 border-[#10B981]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mis Hábitos
              </button>

              <button
                onClick={() => onNavigate('challenges')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                  currentRoute === 'challenges'
                    ? 'text-white border-b-2 border-[#10B981]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Retos
              </button>

              <button
                onClick={() => onNavigate('stats')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                  currentRoute === 'stats'
                    ? 'text-white border-b-2 border-[#10B981]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Estadísticas
              </button>

              <button
                onClick={() => onNavigate('templates')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                  currentRoute === 'templates'
                    ? 'text-white border-b-2 border-[#10B981]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Plantillas
              </button>

              <button
                onClick={() => onNavigate('profile')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                  currentRoute === 'profile'
                    ? 'text-white border-b-2 border-[#10B981]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Perfil
              </button>
            </nav>
          )}

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <>
                <button
                  onClick={onOpenCreateModal}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#003824] text-xs font-bold transition-all shadow-[0_0_14px_rgba(16,185,129,0.35)] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Nuevo Hábito</span>
                </button>

                <button
                  onClick={() => onNavigate('profile')}
                  className="w-8 h-8 rounded-full bg-[#1E293B] hover:bg-[#27354A] border border-white/10 text-xs font-bold text-emerald-400 flex items-center justify-center cursor-pointer"
                  title="Ver perfil"
                >
                  {user.fullName.charAt(0)}
                </button>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#003824] text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer"
                >
                  Registrarse
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {user && mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.08] bg-[#0F172A] px-4 py-3 space-y-1">
            <button
              onClick={() => {
                onNavigate('today');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2.5 ${
                currentRoute === 'today' ? 'bg-[#1E293B] text-emerald-400' : 'text-slate-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Hoy</span>
            </button>

            <button
              onClick={() => {
                onNavigate('habits');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2.5 ${
                currentRoute === 'habits' ? 'bg-[#1E293B] text-emerald-400' : 'text-slate-300'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Mis Hábitos</span>
            </button>

            <button
              onClick={() => {
                onNavigate('challenges');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2.5 ${
                currentRoute === 'challenges' ? 'bg-[#1E293B] text-emerald-400' : 'text-slate-300'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Retos</span>
            </button>

            <button
              onClick={() => {
                onNavigate('stats');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2.5 ${
                currentRoute === 'stats' ? 'bg-[#1E293B] text-emerald-400' : 'text-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Estadísticas</span>
            </button>

            <button
              onClick={() => {
                onNavigate('templates');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2.5 ${
                currentRoute === 'templates' ? 'bg-[#1E293B] text-emerald-400' : 'text-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Plantillas</span>
            </button>

            <button
              onClick={() => {
                onNavigate('profile');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2.5 ${
                currentRoute === 'profile' ? 'bg-[#1E293B] text-emerald-400' : 'text-slate-300'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Perfil & Zona Horaria</span>
            </button>

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCreateModal();
                }}
                className="w-full py-2 rounded-lg bg-[#10B981] text-[#003824] text-xs font-bold text-center"
              >
                + Crear Hábito
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
