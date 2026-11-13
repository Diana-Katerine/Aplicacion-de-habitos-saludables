import React, { useState } from 'react';
import {
  Globe,
  Bell,
  Download,
  RotateCcw,
  LogOut,
  Check,
  Palette,
} from 'lucide-react';
import { BioluminescentThemeId, Category, EvaluatedBadge, Habit, User } from '../../types';
import { detectBrowserTimezone, StorageService } from '../../services/storage';
import { BadgesModule } from '../badges/BadgesModule';
import { CategoryManager } from './CategoryManager';

interface Props {
  user: User;
  badges: EvaluatedBadge[];
  categories: Category[];
  habits: Habit[];
  onCreateCategory: (data: {
    name: string;
    iconName: string;
    colorHex: string;
    bioluminescentTheme?: BioluminescentThemeId;
  }) => void;
  onUpdateCategory: (
    categoryId: number,
    updates: {
      name: string;
      iconName: string;
      colorHex: string;
      bioluminescentTheme?: BioluminescentThemeId;
    }
  ) => void;
  onDeleteCategory: (categoryId: number) => void;
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
  badges,
  categories,
  habits,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
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
  const [exportSuccess, setExportSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

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

  const handleExportJSON = () => {
    try {
      const userHabits = StorageService.getHabits(user.id);
      const userLogs = StorageService.getLogs(user.id);
      const allCategories = StorageService.getCategories();
      const dailyFocuses = StorageService.getAllDailyFocuses(user.id);

      const backupPayload = {
        app: 'Impulso Diario - Habit Tracker',
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
          totalHabits: userHabits.length,
          totalLogs: userLogs.length,
          categoriesCount: allCategories.length,
          dailyFocusesCount: dailyFocuses.length,
          unlockedBadgesCount: badges.filter((b) => b.isUnlocked).length,
        },
        habits: userHabits,
        logs: userLogs,
        dailyFocuses,
        badges: badges
          .filter((b) => b.isUnlocked)
          .map((b) => ({
            id: b.definition.id,
            name: b.definition.name,
            tier: b.definition.tier,
            unlockedAt: b.unlockedAt,
            qualifyingHabitTitle: b.qualifyingHabitTitle,
          })),
        categories: allCategories,
      };

      const jsonString = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = user.fullName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const dateTag = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `impulso_diario_backup_${safeName}_${dateTag}.json`;
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
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="pb-6 border-b border-[#ececec]">
        <span className="text-[14px] text-[#979799] block">Cuenta &amp; preferencias</span>
        <h1 className="font-signifier font-normal text-[36px] md:text-[44px] leading-[1.2] tracking-[-0.015em] text-[#17191c] mt-1">
          Perfil &amp; <em className="italic font-normal">configuración</em>
        </h1>
        <p className="text-[16px] text-[#777b86] mt-1">
          Ajustes de cuenta, categorías personalizadas, zona horaria IANA y recordatorios diarios.
        </p>
      </div>

      {/* Streak Badges Showcase */}
      <BadgesModule badges={badges} />

      {/* Category Manager */}
      <CategoryManager
        categories={categories}
        habits={habits}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Card */}
        <div className="rounded-[24px] p-6 bg-white border border-[#ececec]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#17191c] text-white flex items-center justify-center font-signifier text-[28px] shrink-0">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[18px] font-medium text-[#17191c]">{user.fullName}</h3>
                <span className="text-[12px] text-[#979799]">· {user.role}</span>
              </div>
              <p className="text-[14px] text-[#777b86] mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 text-[12px] text-[#979799] mt-1">
                <span>
                  Miembro desde{' '}
                  {new Date(user.createdAt).toLocaleDateString('es-ES', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span>·</span>
                <span className="text-[#5d2a1a] font-medium">Modo activo</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-[#ececec]">
            <div>
              <label className="block text-[13px] font-medium text-[#17191c] mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] text-[14px] focus:outline-none focus:border-[#17191c]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#17191c] mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] text-[14px] focus:outline-none focus:border-[#17191c]"
              />
            </div>
          </div>
        </div>

        {/* Timezone Configuration */}
        <div className="rounded-[24px] p-6 bg-white border border-[#ececec]">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-[14px] bg-[#f2f2f3] text-[#17191c] flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-[17px] font-medium text-[#17191c] tracking-[-0.01em]">
                Zona horaria (corte de medianoche 00:00)
              </h3>
              <p className="text-[13px] text-[#777b86] mt-1 leading-relaxed">
                Tus hábitos y rachas se reinician exactamente a las 00:00 de tu hora local. Esta zona horaria fue autodetectada y previene desfasajes de días en tus registros.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 items-end">
                <div>
                  <label className="block text-[13px] font-medium text-[#17191c] mb-1.5">
                    Zona horaria IANA
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] text-[14px] focus:outline-none focus:border-[#17191c] cursor-pointer"
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

                <div>
                  <button
                    type="button"
                    onClick={() => setTimezone(detectBrowserTimezone())}
                    className="px-4 py-2.5 rounded-full bg-transparent hover:bg-[#fafafb] border border-[#17191c]/25 hover:border-[#17191c] text-[13px] text-[#17191c] transition-colors cursor-pointer"
                  >
                    Autodetectar del navegador
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reminders / Notifications */}
        <div className="rounded-[24px] p-6 bg-white border border-[#ececec]">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-[14px] bg-[#fbe1d1] text-[#5d2a1a] flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-[17px] font-medium text-[#17191c] tracking-[-0.01em]">
                    Recordatorios diarios
                  </h3>
                  <p className="text-[13px] text-[#777b86] mt-0.5">
                    Avisos inteligentes para arrancar tu mañana y proteger tus rachas antes de dormir.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#f2f2f3] border border-[#ececec] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:shadow-xs after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#17191c] peer-checked:border-[#17191c]"></div>
                </label>
              </div>

              {reminderEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-[#ececec]">
                  <div>
                    <label className="block text-[13px] font-medium text-[#17191c] mb-1.5">
                      Recordatorio matutino (inicio de jornada)
                    </label>
                    <input
                      type="time"
                      value={morningTime}
                      onChange={(e) => setMorningTime(e.target.value)}
                      className="w-full px-4 py-2 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] text-[14px] focus:outline-none focus:border-[#17191c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#17191c] mb-1.5">
                      Revisión nocturna (cierre de rachas)
                    </label>
                    <input
                      type="time"
                      value={eveningTime}
                      onChange={(e) => setEveningTime(e.target.value)}
                      className="w-full px-4 py-2 rounded-[16px] bg-white border border-[#ececec] text-[#17191c] text-[14px] focus:outline-none focus:border-[#17191c]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editorial Theme Information */}
        <div className="steep-card-mist p-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[14px] bg-white border border-[#ececec] text-[#17191c] flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[16px] font-medium text-[#17191c] tracking-[-0.01em]">
                Sistema visual editorial · Papel cálido
              </h3>
              <p className="text-[13px] text-[#777b86] mt-0.5 leading-relaxed">
                Tipografía Signifier sobre papel blanco (#ffffff), tarjetas suaves (#f2f2f3), acentos durazno (#fbe1d1) y halos de categoría adaptativos para lectura serena sin fatiga visual.
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-[13px] font-medium text-[#5d2a1a] flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Configuración guardada correctamente
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[14px] transition-colors cursor-pointer"
          >
            Guardar cambios
          </button>
        </div>
      </form>

      {/* Dedicated Local Backup & Data Export Card */}
      <div className="rounded-[24px] p-6 bg-white border border-[#ececec]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1">
            <div className="w-10 h-10 rounded-[14px] bg-[#f2f2f3] text-[#17191c] flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[17px] font-medium text-[#17191c] tracking-[-0.01em]">
                  Copia de seguridad local (JSON)
                </h3>
                <span className="text-[12px] text-[#979799]">· Backup local</span>
              </div>
              <p className="text-[13px] text-[#777b86] mt-1 leading-relaxed max-w-xl">
                Descarga un archivo JSON estructurado con tu perfil, hábitos activos, metas, días programados y el historial cronológico completo de tus check-ins.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-5 py-2.5 rounded-full bg-transparent hover:bg-[#fafafb] border border-[#17191c]/25 hover:border-[#17191c] text-[#17191c] text-[13px] transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar datos JSON</span>
            </button>
          </div>
        </div>

        {exportSuccess && (
          <div className="mt-4 p-3 rounded-[14px] bg-[#fbe1d1] text-[13px] text-[#5d2a1a] flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 shrink-0" />
            <span>Archivo JSON de respaldo generado y descargado exitosamente.</span>
          </div>
        )}
      </div>

      {/* Session & Reset Section */}
      <div className="rounded-[24px] p-6 bg-[#fafafb] border border-[#ececec]">
        <h3 className="text-[17px] font-medium text-[#17191c] tracking-[-0.01em] mb-4">
          Gestión de sesión &amp; datos
        </h3>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-[#5d2a1a]">
                ¿Reiniciar a la demostración inicial?
              </span>
              <button
                type="button"
                onClick={() => {
                  onResetData();
                  setConfirmReset(false);
                }}
                className="px-4 py-2 rounded-full bg-[#b91c1c] hover:bg-[#991b1b] text-white text-[13px] transition-colors cursor-pointer"
              >
                Confirmar reinicio
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 rounded-full bg-white border border-[#ececec] text-[13px] text-[#17191c] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2 rounded-full bg-white hover:bg-[#f2f2f3] border border-[#ececec] text-[13px] text-[#17191c] transition-colors inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#5d2a1a]" />
              <span>Reiniciar datos a demostración inicial</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 rounded-full bg-white hover:bg-[#fbe1d1]/50 border border-[#ececec] hover:border-[#b91c1c]/40 text-[13px] text-[#b91c1c] transition-colors inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
