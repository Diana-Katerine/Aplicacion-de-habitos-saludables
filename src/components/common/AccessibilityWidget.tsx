import React, { useState, useEffect, useRef } from 'react';
import {
  Accessibility,
  X,
  Type,
  SunMoon,
  Sparkles,
  RotateCcw,
  Check,
  Eye,
  Minus,
  Plus,
} from 'lucide-react';

export type TextScale = 'sm' | 'md' | 'lg' | 'xl';

export interface AccessibilitySettings {
  textScale: TextScale;
  highContrast: boolean;
  reduceMotion: boolean;
  readableFont: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  textScale: 'md',
  highContrast: false,
  reduceMotion: false,
  readableFont: false,
};

const STORAGE_KEY = 'impulso_diario_accessibility_settings_v1';

export function loadAccessibilitySettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      textScale: ['sm', 'md', 'lg', 'xl'].includes(parsed.textScale) ? parsed.textScale : 'md',
      highContrast: Boolean(parsed.highContrast),
      reduceMotion: Boolean(parsed.reduceMotion),
      readableFont: Boolean(parsed.readableFont),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAccessibilitySettings(settings: AccessibilitySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota errors
  }
}

export function applyAccessibilityToDOM(settings: AccessibilitySettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Clear previous text scaling classes
  root.classList.remove('a11y-font-sm', 'a11y-font-md', 'a11y-font-lg', 'a11y-font-xl');
  root.classList.add(`a11y-font-${settings.textScale}`);

  // High contrast
  if (settings.highContrast) {
    root.classList.add('a11y-high-contrast');
  } else {
    root.classList.remove('a11y-high-contrast');
  }

  // Reduced motion
  if (settings.reduceMotion) {
    root.classList.add('a11y-reduce-motion');
  } else {
    root.classList.remove('a11y-reduce-motion');
  }

  // Readable font
  if (settings.readableFont) {
    root.classList.add('a11y-readable-font');
  } else {
    root.classList.remove('a11y-readable-font');
  }
}

export const AccessibilityWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(loadAccessibilitySettings);

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Apply to DOM on settings change & persist
  useEffect(() => {
    applyAccessibilityToDOM(settings);
    saveAccessibilitySettings(settings);
  }, [settings]);

  // Handle Escape key to close and click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerButtonRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerButtonRef.current &&
        !triggerButtonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Trap focus inside panel when opened
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }
  }, [isOpen]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    val: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const TEXT_SCALE_OPTIONS: { id: TextScale; label: string; pct: string }[] = [
    { id: 'sm', label: 'Pequeño', pct: '88%' },
    { id: 'md', label: 'Normal', pct: '100%' },
    { id: 'lg', label: 'Grande', pct: '113%' },
    { id: 'xl', label: 'Extra', pct: '125%' },
  ];

  return (
    <>
      {/* Botón Flotante Fijo de Accesibilidad */}
      <div className="fixed bottom-5 right-5 z-40 print:hidden">
        <button
          ref={triggerButtonRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="a11y-accessibility-dialog"
          aria-label="Abrir panel de opciones de accesibilidad"
          title="Opciones de accesibilidad"
          className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg border transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
            isOpen
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-600/30 rotate-12 scale-105'
              : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:scale-105 shadow-black/10'
          }`}
        >
          <Accessibility className="w-6 h-6 stroke-[2.25]" />
          <span className="sr-only">Accesibilidad</span>
        </button>
      </div>

      {/* Panel de Opciones de Accesibilidad */}
      {isOpen && (
        <div
          ref={panelRef}
          id="a11y-accessibility-dialog"
          role="dialog"
          aria-modal="false"
          aria-labelledby="a11y-panel-title"
          className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 flex flex-col gap-4 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
                <Accessibility className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h2 id="a11y-panel-title" className="text-base font-bold leading-tight">
                  Accesibilidad
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Adapta la vista a tus preferencias
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                triggerButtonRef.current?.focus();
              }}
              aria-label="Cerrar panel de accesibilidad"
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Opciones */}
          <div className="space-y-4 text-sm">
            {/* 1. Tamaño del texto */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />
                  Tamaño de texto
                </label>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {TEXT_SCALE_OPTIONS.find((o) => o.id === settings.textScale)?.pct}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60">
                {TEXT_SCALE_OPTIONS.map((opt) => {
                  const isSelected = settings.textScale === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateSetting('textScale', opt.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Alto Contraste */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-start gap-2.5">
                <SunMoon className="w-4 h-4 text-slate-600 dark:text-slate-400 mt-0.5" />
                <div>
                  <span className="font-medium text-xs sm:text-sm block">Alto contraste</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Maximiza legibilidad y bordes
                  </span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.highContrast}
                onClick={() => updateSetting('highContrast', !settings.highContrast)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  settings.highContrast ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.highContrast ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 3. Reducir Animaciones */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-slate-600 dark:text-slate-400 mt-0.5" />
                <div>
                  <span className="font-medium text-xs sm:text-sm block">Reducir movimiento</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Desactiva transiciones bruscas
                  </span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.reduceMotion}
                onClick={() => updateSetting('reduceMotion', !settings.reduceMotion)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  settings.reduceMotion ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.reduceMotion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 4. Tipografía Lectura Fácil */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-start gap-2.5">
                <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400 mt-0.5" />
                <div>
                  <span className="font-medium text-xs sm:text-sm block">Fuente nítida y limpia</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Espaciado y glifos estándar
                  </span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.readableFont}
                onClick={() => updateSetting('readableFont', !settings.readableFont)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  settings.readableFont ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.readableFont ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Reset button */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Se guarda automáticamente
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer
            </button>
          </div>
        </div>
      )}
    </>
  );
};
