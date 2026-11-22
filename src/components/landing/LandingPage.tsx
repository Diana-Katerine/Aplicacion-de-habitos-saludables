import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Plus, Minus, Flame, Sparkles, Headphones, Layers, Activity } from 'lucide-react';
import { HeroCreativeImage } from './HeroCreativeImage';

interface Props {
  isDark?: boolean;
  onStartFree: () => void;
  onLogin: () => void;
  onTryDemo: () => void;
}

const CORE_OFFERINGS = [
  {
    title: 'Vista Hoy con secuencia propia',
    description:
      'Ordena tus hábitos, respeta días de descanso y reinicia a tus 00:00 locales.',
    icon: Activity,
    cardClass:
      'bg-gradient-to-br from-[#ECFDF5] via-[#F0FDFA] to-[#FFFFFF] dark:from-[#059669]/18 dark:via-[#0d9488]/10 dark:to-[#141920] border border-[#059669]/25 dark:border-[#10b981]/35 rounded-[24px]',
    iconClass: 'bg-gradient-to-br from-[#10B981] to-[#0D9488] text-white shadow-sm shadow-[#10B981]/30',
  },
  {
    title: 'Enfoque Ambiental y diario breve',
    description:
      'Audio generativo inmersivo, notas en Markdown y registro rápido de energía y ánimo.',
    icon: Headphones,
    cardClass:
      'bg-gradient-to-br from-[#EEF2FF] via-[#F5F3FF] to-[#FFFFFF] dark:from-[#4F46E5]/18 dark:via-[#7C3AED]/10 dark:to-[#141920] border border-[#6366F1]/25 dark:border-[#818CF8]/35 rounded-[24px]',
    iconClass: 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-sm shadow-[#6366F1]/30',
  },
  {
    title: 'Mapa de 90 días y pronóstico IA',
    description:
      'Visualiza tu constancia, compara meses y detecta tus mejores franjas horarias.',
    icon: Sparkles,
    cardClass:
      'bg-gradient-to-br from-[#E0F2FE] via-[#ECFEFF] to-[#FFFFFF] dark:from-[#0284C7]/18 dark:via-[#06B6D4]/10 dark:to-[#141920] border border-[#0284C7]/25 dark:border-[#38BDF8]/35 rounded-[24px]',
    iconClass: 'bg-gradient-to-br from-[#0284C7] to-[#06B6D4] text-white shadow-sm shadow-[#0284C7]/30',
  },
  {
    title: 'Categorías, retos y respaldo',
    description:
      'Organiza con categorías propias, únete a retos y exporta tu historial en JSON o PDF.',
    icon: Layers,
    cardClass:
      'bg-gradient-to-br from-[#FFFBEB] via-[#FFF1F2] to-[#FFFFFF] dark:from-[#D97706]/18 dark:via-[#F43F5E]/10 dark:to-[#141920] border border-[#F59E0B]/28 dark:border-[#FBBF24]/35 rounded-[24px]',
    iconClass: 'bg-gradient-to-br from-[#F59E0B] to-[#F43F5E] text-white shadow-sm shadow-[#F59E0B]/30',
  },
];

const WORKFLOW_STEPS = [
  {
    num: '01',
    numClass: 'bg-gradient-to-br from-[#10B981] to-[#0D9488] text-white shadow-xs',
    title: 'Diseña tu rutina',
    body: 'Define hábitos y elige únicamente los días que planeas practicar.',
  },
  {
    num: '02',
    numClass: 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-xs',
    title: 'Registra en segundos',
    body: 'Marca tu avance en Hoy o entra en Enfoque Ambiental para bloques profundos.',
  },
  {
    num: '03',
    numClass: 'bg-gradient-to-br from-[#F59E0B] to-[#F43F5E] text-white shadow-xs',
    title: 'Ajusta con datos reales',
    body: 'Identifica patrones de energía y adopta tus mejores horarios.',
  },
];

export const LandingPage: React.FC<Props> = ({
  isDark = false,
  onStartFree,
  onLogin,
  onTryDemo,
}) => {
  const [demoWater, setDemoWater] = useState(6);
  const [demoMeditation, setDemoMeditation] = useState(false);
  const [demoStreak, setDemoStreak] = useState(14);

  const isWaterDone = demoWater >= 8;

  const handleWaterStep = (delta: number) => {
    setDemoWater((prev) => Math.max(0, Math.min(8, prev + delta)));
  };

  const handleToggleMeditation = () => {
    const next = !demoMeditation;
    setDemoMeditation(next);
    setDemoStreak((s) => (next ? s + 1 : Math.max(14, s - 1)));
  };

  return (
    <div className="w-full bg-white dark:bg-[#0c0f12] text-[#17191c] dark:text-[#f1f5f9]">
      {/* SECTION 1: Hero — Singular Editorial Statement + Animable Three.js 3D Sculpture */}
      <section className="relative overflow-hidden w-full bg-gradient-to-b from-white via-[#f7fdfa] to-white dark:from-[#0c0f12] dark:via-[#10151d] dark:to-[#0c0f12] pt-10 pb-16 md:pt-14 md:pb-20">
        {/* Ambient Chromatic Mesh Blurs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#10B981]/18 via-[#06B6D4]/14 to-transparent blur-3xl dark:from-[#10B981]/16 dark:via-[#06B6D4]/12"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-10 right-0 w-[460px] h-[460px] rounded-full bg-gradient-to-bl from-[#8B5CF6]/16 via-[#EC4899]/10 to-[#F59E0B]/10 blur-3xl dark:from-[#8B5CF6]/18 dark:via-[#EC4899]/10"
        />
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <h1 className="font-signifier font-normal text-[36px] sm:text-[56px] xl:text-[72px] leading-[1.06] tracking-[-0.025em] text-[#17191c] dark:text-[#f1f5f9] text-balance">
                Construye hábitos{' '}
                <em className="italic font-normal chromatic-gradient-text">en un minuto al día</em>
              </h1>

              <p className="text-[17px] leading-[1.5] text-[#5c616d] dark:text-[#9aa4b2] max-w-[480px]">
                Rituales diarios, enfoque ambiental y analítica clara sobre un lienzo adaptable, libre de ruido visual.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onStartFree}
                  className="px-6 py-3 rounded-full btn-chromatic text-[15px] leading-none font-medium whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Crear cuenta
                </button>

                <button
                  type="button"
                  onClick={onTryDemo}
                  className="px-6 py-3 rounded-full bg-white dark:bg-[#141920] border border-[#17191c]/25 dark:border-[#252e3a] hover:border-[#059669] dark:hover:border-[#34d399] hover:text-[#059669] dark:hover:text-[#34d399] text-[#17191c] dark:text-[#f1f5f9] text-[15px] leading-none font-normal transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Probar demo
                </button>
              </div>

              <p className="text-[13px] text-[#777b86] dark:text-[#9aa4b2]">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={onLogin}
                  className="text-[#059669] dark:text-[#34d399] font-medium hover:underline underline-offset-4 cursor-pointer"
                >
                  Iniciar sesión
                </button>
              </p>
            </div>

            <div className="lg:col-span-6">
              <HeroCreativeImage isDark={isDark} />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Qué ofrecemos */}
      <section id="que-ofrecemos" className="w-full bg-[#fafafb] dark:bg-[#101419] py-16 border-t border-[#ececec] dark:border-[#252e3a]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 space-y-10">
          <div className="max-w-[600px]">
            <h2 className="font-signifier font-normal text-[36px] md:text-[46px] leading-[1.15] tracking-[-0.015em] text-[#17191c] dark:text-[#f1f5f9]">
              Todo lo esencial para{' '}
              <em className="italic font-normal chromatic-gradient-text">sostener tu constancia</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {CORE_OFFERINGS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className={`${item.cardClass} p-4 sm:p-6 flex items-start gap-3.5 sm:gap-4 transition-transform duration-200 hover:-translate-y-0.5`}
                >
                  <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 ${item.iconClass}`}>
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="text-[18px] font-medium text-[#17191c] dark:text-[#f1f5f9] tracking-[-0.01em]">
                      {item.title}
                    </h3>
                    <p className="text-[14px] leading-[1.55] text-[#5c616d] dark:text-[#9aa4b2]">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: Cómo funciona + Prueba interactiva */}
      <section id="como-funciona" className="w-full bg-white dark:bg-[#0c0f12] py-16 border-t border-[#ececec] dark:border-[#252e3a]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-7">
            <h2 className="font-signifier font-normal text-[36px] md:text-[44px] leading-[1.15] tracking-[-0.015em] text-[#17191c] dark:text-[#f1f5f9]">
              Tres pasos hacia una{' '}
              <em className="italic font-normal text-[#059669] dark:text-[#34d399]">rutina predecible</em>
            </h2>

            <div className="divide-y divide-[#ececec] dark:divide-[#252e3a] border-t border-b border-[#ececec] dark:border-[#252e3a]">
              {WORKFLOW_STEPS.map((s) => (
                <div key={s.num} className="py-5 flex items-start gap-4">
                  <span className={`w-9 h-9 rounded-full text-[14px] font-semibold tabular-nums flex items-center justify-center shrink-0 mt-0.5 ${s.numClass}`}>
                    {s.num}
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-[17px] font-medium text-[#17191c] dark:text-[#f1f5f9]">
                      {s.title}
                    </h3>
                    <p className="text-[14px] leading-[1.55] text-[#5c616d] dark:text-[#9aa4b2]">
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Single Clean Interactive Preview Card */}
          <div className="lg:col-span-6">
            <div className="steep-artifact p-4 sm:p-7 space-y-5 border border-[#059669]/15 dark:border-[#34d399]/20">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#ececec] dark:border-[#252e3a]">
                <span className="text-[16px] font-medium text-[#17191c] dark:text-[#f1f5f9]">
                  Registro diario en vivo
                </span>
                <span className="text-[13px] font-medium text-[#B45309] dark:text-[#fbbf24] tabular-nums inline-flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#D97706] dark:text-[#fbbf24]" />
                  {demoStreak} d en racha
                </span>
              </div>

              <div className="space-y-3">
                {/* Meditation item */}
                <div
                  className={`p-3.5 sm:p-4 rounded-[16px] border transition-colors ${
                    demoMeditation
                      ? 'bg-[#ECFDF5]/60 dark:bg-[#059669]/15 border-[#059669]/35 dark:border-[#34d399]/40'
                      : 'bg-white dark:bg-[#1b222b] border-[#ececec] dark:border-[#252e3a]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 block">Mente &amp; Foco</span>
                      <p
                        className={`text-[15px] font-medium mt-0.5 line-clamp-2 sm:truncate ${
                          demoMeditation ? 'text-emerald-800 dark:text-emerald-300 font-semibold' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        Meditación consciente matutina
                      </p>
                    </div>

                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={handleToggleMeditation}
                      aria-label="Completar meditación de prueba"
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors shrink-0 cursor-pointer ${
                        demoMeditation
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-[#141920] border-slate-300 dark:border-slate-700 text-transparent hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400'
                      }`}
                    >
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </motion.button>
                  </div>
                </div>

                {/* Water stepper item */}
                <div
                  className={`p-3.5 sm:p-4 rounded-[16px] border transition-colors ${
                    isWaterDone
                      ? 'bg-[#E0F2FE]/55 dark:bg-[#0284C7]/15 border-[#0284C7]/35 dark:border-[#38bdf8]/40'
                      : 'bg-white dark:bg-[#1b222b] border-[#ececec] dark:border-[#252e3a]'
                  }`}
                >
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[12px] font-medium text-[#0284C7] dark:text-[#38bdf8] block">Vitalidad</span>
                      <p
                        className={`text-[15px] font-medium mt-0.5 line-clamp-2 sm:truncate ${
                          isWaterDone ? 'text-sky-700 dark:text-sky-400 font-semibold' : 'text-[#17191c] dark:text-[#f1f5f9]'
                        }`}
                      >
                        Tomar 8 vasos de agua
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[13px] font-medium text-[#0369A1] dark:text-[#38bdf8] tabular-nums mr-1">
                        {demoWater}/8
                      </span>
                      <button
                        type="button"
                        onClick={() => handleWaterStep(-1)}
                        disabled={demoWater <= 0}
                        aria-label="Restar vaso"
                        className="w-9 h-9 rounded-full border border-[#ececec] dark:border-[#252e3a] bg-white dark:bg-[#141920] hover:bg-[#f2f2f3] dark:hover:bg-[#252e3a] disabled:opacity-35 text-[#17191c] dark:text-[#f1f5f9] flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-4 h-4 stroke-[2.25]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWaterStep(1)}
                        disabled={demoWater >= 8}
                        aria-label="Sumar vaso"
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          isWaterDone
                            ? 'bg-[#0369A1] text-white'
                            : 'bg-[#E0F2FE] dark:bg-[#0284C7]/25 hover:bg-[#0369A1] hover:text-white text-[#0369A1] dark:text-[#38bdf8]'
                        }`}
                      >
                        <Plus className="w-4 h-4 stroke-[2.25]" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[#f2f2f3] dark:bg-[#141920] mt-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0284C7] to-[#059669] transition-all duration-300"
                      style={{ width: `${(demoWater / 8) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-end text-[13px]">
                <button
                  type="button"
                  onClick={onTryDemo}
                  className="text-[#059669] dark:text-[#34d399] font-medium hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
                >
                  Abrir app demo →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Testimonial + Closing CTA */}
      <section id="historia" className="w-full bg-[#fafafb] dark:bg-[#101419] py-16 border-t border-[#ececec] dark:border-[#252e3a]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 space-y-14">
          <div className="steep-card-peach p-6 sm:p-10 md:p-12 border border-[#f2ceb8] dark:border-[#4a2d20]">
            <div className="max-w-[820px] space-y-4">
              <blockquote className="font-signifier font-normal text-[20px] sm:text-[26px] md:text-[30px] leading-[1.3] tracking-[-0.015em] text-[#5d2a1a] dark:text-[#fbdac7]">
                “Llevo 42 días consecutivos de lectura e hidratación. Tener mis hábitos sobre un lienzo limpio, respetando mis días programados, convirtió el registro en un ritual sereno.”
              </blockquote>
              <p className="text-[14px] text-[#5d2a1a] dark:text-[#fbdac7]/90">
                <span className="font-medium">Diego Valencia</span> · Diseñador de Producto, Bogotá
              </p>
            </div>
          </div>

          <div className="max-w-[680px] mx-auto text-center space-y-6">
            <h2 className="font-signifier font-normal text-[30px] sm:text-[38px] md:text-[48px] leading-[1.15] tracking-[-0.015em] text-[#17191c] dark:text-[#f1f5f9]">
              Empieza tu rutina hoy con{' '}
              <em className="italic font-normal chromatic-gradient-text">total claridad</em>
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={onStartFree}
                className="px-6 py-3 rounded-full btn-chromatic text-[15px] leading-none font-medium whitespace-nowrap shrink-0 cursor-pointer"
              >
                Crear cuenta
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="px-6 py-3 rounded-full bg-white dark:bg-[#141920] border border-[#17191c]/25 dark:border-[#252e3a] hover:border-[#059669] dark:hover:border-[#34d399] hover:text-[#059669] dark:hover:text-[#34d399] text-[#17191c] dark:text-[#f1f5f9] text-[15px] leading-none font-normal transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
