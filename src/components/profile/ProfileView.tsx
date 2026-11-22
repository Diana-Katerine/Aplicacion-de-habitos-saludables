import React, { useState, useRef } from 'react';
import {
  Globe,
  Bell,
  Download,
  RotateCcw,
  LogOut,
  Check,
  Palette,
  Sun,
  Moon,
  Camera,
  Trash2,
} from 'lucide-react';
import { BioluminescentThemeId, Category, EvaluatedBadge, Habit, HabitLog, User } from '../../types';
import { detectBrowserTimezone, StorageService } from '../../services/storage';
import { HealthWidgetsService } from '../../services/healthWidgets';
import { CategoryManager } from './CategoryManager';
import { HealthWidgetsSection } from './HealthWidgetsSection';
import { ActionHint } from '../common/ActionHint';

interface Props {
  user: User;
  badges: EvaluatedBadge[];
  categories: Category[];
  habits: Habit[];
  logs?: HabitLog[];
  theme?: 'LIGHT' | 'DARK';
  onChangeTheme?: (theme: 'LIGHT' | 'DARK') => void;
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
  logs = [],
  theme = 'LIGHT',
  onChangeTheme,
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
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      onUpdateUser({ avatarUrl: result });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(undefined);
    onUpdateUser({ avatarUrl: undefined });
  };

  const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      fullName: fullName.trim() || user.fullName,
      email: email.trim() || user.email,
      timezone,
      avatarUrl,
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
        app: 'Impulso diario',
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
        healthWidgets: HealthWidgetsService.getHealthState(user.id, user.timezone),
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
      <div className="pb-6 border-b border-[#ececec] dark:border-[#252e3a]">
        <h1 className="font-signifier font-normal text-[36px] md:text-[44px] leading-[1.15] tracking-[-0.015em] text-[#17191c] dark:text-[#f1f5f9]">
          Perfil &amp; <em className="italic font-normal text-[#059669] dark:text-[#34d399]">configuración</em>
        </h1>
      </div>

      {/* Health Widgets: Energy, Mood & Sleep */}
      <HealthWidgetsSection
        userId={user.id}
        habits={habits}
        logs={logs}
        timezone={user.timezone}
      />

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
        <div className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative group shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.fullName}
                  loading="lazy"
                  decoding="async"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover border border-[#ececec] dark:border-[#252e3a] shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#059669] to-[#0284C7] text-white flex items-center justify-center font-signifier text-[28px] shadow-xs">
                  {user.fullName.charAt(0)}
                </div>
              )}

              {/* Quick upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Cambiar foto de perfil"
                className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                <h3 className="text-[18px] font-medium text-[#17191c] dark:text-[#f1f5f9] break-words">{user.fullName}</h3>
                <span className="text-[12px] text-[#979799] dark:text-[#6f7a8a]">· {user.role}</span>
              </div>
              <p className="text-[14px] text-[#777b86] dark:text-[#9aa4b2] mt-0.5 break-all">{user.email}</p>
              
              {/* Photo customization controls (HU #8) */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-[#ececec] dark:border-[#252e3a] bg-[#fafafb] dark:bg-[#1b222b] text-[12px] font-medium text-[#17191c] dark:text-[#f1f5f9] hover:bg-[#ececec] dark:hover:bg-[#252e3a] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Subir foto
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-[12px] font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Quitar foto
                  </button>
                )}

                <div className="flex items-center gap-1.5 ml-1">
                  <span className="text-[11px] text-[#777b86] dark:text-[#9aa4b2]">Predefinidos:</span>
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(preset);
                        onUpdateUser({ avatarUrl: preset });
                      }}
                      className="w-6 h-6 rounded-full overflow-hidden border border-[#ececec] dark:border-[#252e3a] hover:scale-110 transition-transform cursor-pointer"
                    >
                      <img
                        src={preset}
                        alt={`Avatar preset ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-[#ececec] dark:border-[#252e3a]">
            <div>
              <label className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] text-[14px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] text-[14px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399]"
              />
            </div>
          </div>
        </div>

        {/* Timezone Configuration */}
        <div className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-[14px] bg-[#E0F2FE] dark:bg-[#0284C7]/18 text-[#0284C7] dark:text-[#38bdf8] flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
                Zona horaria (corte de medianoche 00:00)
              </h3>
              <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-1">
                Corte diario a las 00:00 según tu hora local.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 items-end">
                <div>
                  <label className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1.5">
                    Zona horaria IANA
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] text-[14px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399] cursor-pointer"
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
                  <ActionHint
                    message="Detectará y aplicará la zona horaria actual de tu navegador"
                    tone="accent"
                    position="top"
                    align="center"
                    className="w-full sm:w-auto"
                  >
                    <button
                      type="button"
                      onClick={() => setTimezone(detectBrowserTimezone())}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-transparent hover:bg-[#fafafb] dark:hover:bg-[#1b222b] border border-[#17191c]/25 dark:border-[#252e3a] hover:border-[#17191c] dark:hover:border-[#38bdf8] text-[13px] text-[#17191c] dark:text-[#f1f5f9] transition-colors cursor-pointer text-center"
                    >
                      Autodetectar del navegador
                    </button>
                  </ActionHint>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reminders / Notifications */}
        <div className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-[14px] bg-[#FEF3C7] dark:bg-[#D97706]/18 text-[#D97706] dark:text-[#fbbf24] flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-[17px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
                    Recordatorios diarios
                  </h3>
                  <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-0.5">
                    Avisos de inicio de jornada y cierre de rachas.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#f2f2f3] dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:shadow-xs after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#059669] peer-checked:border-[#059669]"></div>
                </label>
              </div>

              {reminderEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-[#ececec] dark:border-[#252e3a]">
                  <div>
                    <label className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1.5">
                      Recordatorio matutino
                    </label>
                    <input
                      type="time"
                      value={morningTime}
                      onChange={(e) => setMorningTime(e.target.value)}
                      className="w-full px-4 py-2 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] text-[14px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399] dark:[color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#17191c] dark:text-[#f1f5f9] mb-1.5">
                      Revisión nocturna
                    </label>
                    <input
                      type="time"
                      value={eveningTime}
                      onChange={(e) => setEveningTime(e.target.value)}
                      className="w-full px-4 py-2 rounded-[16px] bg-white dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] text-[14px] focus:outline-none focus:border-[#17191c] dark:focus:border-[#34d399] dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Appearance & Theme Selector */}
        <div className="rounded-[24px] p-4 sm:p-6 bg-[#EEF2FF]/60 dark:bg-[#141920] border border-[#4F46E5]/15 dark:border-[#252e3a]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-[14px] bg-white dark:bg-[#4F46E5]/18 border border-[#4F46E5]/20 dark:border-[#818CF8]/30 text-[#4F46E5] dark:text-[#a5b4fc] flex items-center justify-center shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[16px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
                  Apariencia &amp; tema visual
                </h3>
                <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-0.5">
                  Alterna entre modo claro y oscuro obsidiana.
                </p>
              </div>
            </div>

            <div
              role="group"
              aria-label="Seleccionar tema visual"
              className="inline-flex items-center gap-1 p-1 rounded-full bg-[#f2f2f3] dark:bg-[#1b222b] border border-[#ececec] dark:border-[#252e3a] self-start sm:self-center max-w-full overflow-x-auto shrink-0"
            >
              <ActionHint
                message={
                  theme === 'LIGHT'
                    ? 'Modo claro activo actualmente'
                    : 'Cambiará de modo oscuro a modo claro'
                }
                tone="theme"
                position="top"
                align="center"
              >
                <button
                  type="button"
                  onClick={() => onChangeTheme?.('LIGHT')}
                  aria-pressed={theme === 'LIGHT'}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] inline-flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    theme === 'LIGHT'
                      ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                      : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
                  }`}
                >
                  <Sun className="w-4 h-4 text-[#D97706]" />
                  <span>Modo Claro</span>
                </button>
              </ActionHint>
              <ActionHint
                message={
                  theme === 'DARK'
                    ? 'Modo oscuro activo actualmente'
                    : 'Cambiará de modo claro a modo oscuro'
                }
                tone="theme"
                position="top"
                align="right"
              >
                <button
                  type="button"
                  onClick={() => onChangeTheme?.('DARK')}
                  aria-pressed={theme === 'DARK'}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] inline-flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    theme === 'DARK'
                      ? 'bg-white dark:bg-[#252e3a] text-[#17191c] dark:text-[#f1f5f9] font-medium shadow-xs'
                      : 'text-[#777b86] dark:text-[#9aa4b2] hover:text-[#17191c] dark:hover:text-[#f1f5f9]'
                  }`}
                >
                  <Moon className="w-4 h-4 text-[#4F46E5] dark:text-[#a5b4fc]" />
                  <span>Modo Oscuro</span>
                </button>
              </ActionHint>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {savedSuccess ? (
            <span className="text-[13px] font-medium text-[#047857] dark:text-[#34d399] flex items-center gap-1.5">
              <Check className="w-4 h-4 shrink-0" /> Configuración guardada correctamente
            </span>
          ) : (
            <span className="hidden sm:inline" />
          )}

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-[14px] transition-colors cursor-pointer shadow-xs text-center"
          >
            Guardar cambios
          </button>
        </div>
      </form>

      {/* Dedicated Local Backup & Data Export Card */}
      <div className="rounded-[24px] p-4 sm:p-6 bg-white dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-[14px] bg-[#D1FAE5] dark:bg-[#059669]/18 text-[#047857] dark:text-[#34d399] flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[17px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
                Copia de seguridad local (JSON)
              </h3>
              <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2] mt-1 max-w-xl">
                Descarga un archivo JSON con tus hábitos, metas e historial completo.
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto self-start sm:self-center">
            <button
              type="button"
              onClick={handleExportJSON}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-transparent hover:bg-[#ECFDF5]/60 dark:hover:bg-[#059669]/15 border border-[#059669]/35 dark:border-[#34d399]/35 hover:border-[#059669] dark:hover:border-[#34d399] text-[#047857] dark:text-[#34d399] text-[13px] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Exportar datos JSON</span>
            </button>
          </div>
        </div>

        {exportSuccess && (
          <div className="mt-4 p-3 rounded-[14px] bg-[#D1FAE5] dark:bg-[#059669]/20 text-[13px] text-[#047857] dark:text-[#6ee7b7] flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 shrink-0" />
            <span>Archivo JSON de respaldo generado y descargado exitosamente.</span>
          </div>
        )}
      </div>

      {/* Session & Reset Section */}
      <div className="rounded-[24px] p-4 sm:p-6 bg-[#fafafb] dark:bg-[#141920] border border-[#ececec] dark:border-[#252e3a]">
        <h3 className="text-[17px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em] mb-4">
          Gestión de sesión &amp; datos
        </h3>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-[#5d2a1a] dark:text-[#fbdac7]">
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
                className="px-4 py-2 rounded-full bg-white dark:bg-[#1b222b] hover:bg-[#fafafb] dark:hover:bg-[#252e3a] border border-[#ececec] dark:border-[#252e3a] text-[13px] text-[#17191c] dark:text-[#f1f5f9] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <ActionHint
              message="Restaurará los datos de demostración iniciales"
              tone="danger"
              position="top"
              align="left"
              className="w-full sm:w-auto"
            >
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-white dark:bg-[#1b222b] hover:bg-[#f2f2f3] dark:hover:bg-[#252e3a] border border-[#ececec] dark:border-[#252e3a] text-[13px] text-[#17191c] dark:text-[#f1f5f9] transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-normal text-left sm:text-center"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#5d2a1a] dark:text-[#fca5a5] shrink-0" />
                <span>Reiniciar datos a demostración inicial</span>
              </button>
            </ActionHint>
          )}

          <ActionHint
            message="Cerrará tu sesión actual e irá al inicio de sesión"
            tone="danger"
            position="top"
            align="right"
            className="w-full sm:w-auto"
          >
            <button
              type="button"
              onClick={onLogout}
              className="w-full sm:w-auto px-4 py-2 rounded-full bg-white dark:bg-[#1b222b] hover:bg-[#fbe1d1]/50 dark:hover:bg-[#7f1d1d]/25 border border-[#ececec] dark:border-[#252e3a] hover:border-[#b91c1c]/40 dark:hover:border-[#f87171]/45 text-[13px] text-[#b91c1c] dark:text-[#fca5a5] transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          </ActionHint>
        </div>
      </div>
    </div>
  );
};
