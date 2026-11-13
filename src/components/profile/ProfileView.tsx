import React, { useState } from 'react';
import {
  User as UserIcon,
  Globe,
  Bell,
  Download,
  RotateCcw,
  LogOut,
  Shield,
  Check,
  Palette,
} from 'lucide-react';
import { User } from '../../types';
import { detectBrowserTimezone, StorageService } from '../../services/storage';

interface Props {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  onResetData: () => void;
  onLogout: () => void;
}

const COMMON_TIMEZONES = [
  'America/Bogota',
  'America/Mexico_City',
  'America/Buenos_Aires',
  'America/Santiago',
  'America/Lima',
  'America/Caracas',
  'Europe/Madrid',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'UTC',
];

export const ProfileView: React.FC<Props> = ({
  user,
  onUpdateUser,
  onResetData,
  onLogout,
}) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [timezone, setTimezone] = useState(user.timezone || detectBrowserTimezone());
  const [reminderEnabled, setReminderEnabled] = useState(user.reminderEnabled ?? true);
  const [morningTime, setMorningTime] = useState(user.reminderMorningTime || '08:00');
  const [eveningTime, setEveningTime] = useState(user.reminderEveningTime || '21:00');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      fullName: fullName.trim() || user.fullName,
      email: email.trim() || user.email,
      timezone,
      reminderEnabled,
      reminderMorningTime: morningTime,
      reminderEveningTime: eveningTime,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportJSON = () => {
    try {
      const habits = StorageService.getHabits(user.id);
      const logs = StorageService.getLogs(user.id);
      const categories = StorageService.getCategories();
      const dailyFocuses = StorageService.getAllDailyFocuses(user.id);

      const backupPayload = {
        app: 'Luminous Momentum - Habit Tracker',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          timezone: user.timezone,
          createdAt: user.createdAt,
        },
        metadata: {
          totalHabits: habits.length,
          totalLogs: logs.length,
          categoriesCount: categories.length,
          dailyFocusesCount: dailyFocuses.length,
        },
        habits,
        logs,
        dailyFocuses,
        categories,
      };

      const jsonString = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = user.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const dateTag = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `luminous_habits_backup_${safeName}_${dateTag}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Error exporting backup:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-white/[0.06]">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Perfil & Configuración
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Ajustes de cuenta, zona horaria IANA para cortes de medianoche y recordatorios diarios.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Card */}
        <div className="rounded-xl p-5 md:p-6 bg-[#0F172A] border border-white/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-[#003824] flex items-center justify-center font-extrabold text-2xl shrink-0 shadow-[0_0_16px_rgba(16,185,129,0.4)]">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{user.fullName}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                <span>Miembro desde {new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
                <span>·</span>
                <span className="text-emerald-400 font-mono">Modo Activo</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/[0.06]">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20"
              />
            </div>
          </div>
        </div>

        {/* Timezone Configuration (Critical for 00:00 midnight resets) */}
        <div className="rounded-xl p-5 md:p-6 bg-[#0F172A] border border-white/[0.08]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white tracking-tight">
                Zona Horaria (Corte de Medianoche 00:00)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Tus hábitos y rachas se reinician exactamente a las 00:00 de tu hora local. Esta zona horaria fue autodetectada y previene desfasajes de días en tus registros.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Zona Horaria IANA
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#090D16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#10B981] cursor-pointer"
                  >
                    {!COMMON_TIMEZONES.includes(timezone) && (
                      <option value={timezone}>{timezone} (Detectada)</option>
                    )}
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setTimezone(detectBrowserTimezone())}
                    className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-[#27354A] border border-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                  >
                    Autodetectar del Navegador
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reminders / Notifications */}
        <div className="rounded-xl p-5 md:p-6 bg-[#0F172A] border border-white/[0.08]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Recordatorios Diarios
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Notificaciones en tu dispositivo para arrancar tu mañana y cerrar tu día.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#1E293B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                </label>
              </div>

              {reminderEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/[0.06]">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Recordatorio Matutino (Inicio de jornada)
                    </label>
                    <input
                      type="time"
                      value={morningTime}
                      onChange={(e) => setMorningTime(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#090D16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#10B981]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Revisión Nocturna (Cierre de rachas)
                    </label>
                    <input
                      type="time"
                      value={eveningTime}
                      onChange={(e) => setEveningTime(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#090D16] border border-white/15 text-white text-sm focus:outline-none focus:border-[#10B981]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Theme Information */}
        <div className="rounded-xl p-5 md:p-6 bg-[#0F172A] border border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Tema Visual: Luminous Momentum
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Diseño dark mode de alto rendimiento con bioluminiscencia esmeralda (#10B981) y fuego ámbar (#F59E0B) para mínima fatiga visual y máxima recompensa sensorial.
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Configuración guardada correctamente
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#003824] text-xs font-bold transition-all shadow-[0_0_16px_rgba(16,185,129,0.35)] cursor-pointer"
          >
            Guardar Cambios
          </button>
        </div>
      </form>

      {/* Dedicated Local Backup & Data Export Card */}
      <div className="rounded-xl p-5 md:p-6 bg-[#0F172A] border border-white/[0.08] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Copia de Seguridad Local (Exportar JSON)
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-wider">
                  Backup Local
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
                Descarga un archivo JSON estructurado con tu perfil, hábitos activos, metas, días programados y el historial cronológico de todos tus registros diarios (check-ins) para respaldo local en tu equipo.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-[0_0_16px_rgba(56,189,248,0.3)] flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Exportar Datos a JSON</span>
            </button>
          </div>
        </div>

        {exportSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Archivo JSON de respaldo generado y descargado exitosamente.</span>
          </div>
        )}
      </div>

      {/* Danger & Reset Section */}
      <div className="rounded-xl p-5 md:p-6 bg-[#0F172A]/70 border border-white/[0.08]">
        <h3 className="text-base font-bold text-white tracking-tight mb-4">
          Gestión de Sesión & Datos
        </h3>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Deseas reiniciar los datos a la demostración inicial?')) {
                onResetData();
              }
            }}
            className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-[#27354A] border border-white/10 text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reiniciar datos a demostración inicial</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-xs font-semibold text-red-300 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
