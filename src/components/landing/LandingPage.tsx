import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Plus, Minus } from 'lucide-react';
import { HeroThreeScene } from './HeroThreeScene';

interface Props {
  onStartFree: () => void;
  onLogin: () => void;
  onTryDemo: () => void;
}

const CORE_OFFERINGS = [
  {
    tag: 'Ritual diario',
    title: 'Vista Hoy con secuencia propia',
    description:
      'Ordena tus hábitos arrastrando tarjetas, respeta tus días de descanso sin romper rachas y reinicia exactamente a las 00:00 locales.',
  },
  {
    tag: 'Concentración',
    title: 'Enfoque Ambiental y diario breve',
    description:
      'Atenúa la pantalla con audio generativo, redacta notas de ritual en Markdown y registra tu energía (1–5) y ánimo al completar.',
  },
  {
    tag: 'Analítica e IA',
    title: 'Mapa de 90 días y zonas de impulso',
    description:
      'Visualiza tu constancia trimestral, compara tu progreso mes a mes y descubre con IA los horarios óptimos para cada hábito.',
  },
  {
    tag: 'Control total',
    title: 'Categorías, retos y respaldo portable',
    description:
      'Personaliza categorías con halos suaves, únete a metas mensuales, explora plantillas y exporta todo tu historial en JSON o PDF.',
  },
];

const WORKFLOW_STEPS = [
  {
    num: '01',
    title: 'Diseña tu rutina sin rigidez',
    body: 'Crea hábitos numéricos o binarios eligiendo únicamente los días que planeas practicar.',
  },
  {
    num: '02',
    title: 'Registra en segundos cada día',
    body: 'Marca tu avance desde la vista Hoy o entra en Enfoque Ambiental para bloques profundos.',
  },
  {
    num: '03',
    title: 'Ajusta con evidencia real',
    body: 'Detecta patrones de energía, compara meses y adopta tus mejores franjas horarias.',
  },
];

export const LandingPage: React.FC<Props> = ({
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
    <div className="w-full bg-white text-[#17191c]">
      {/* SECTION 1: Hero — Singular Editorial Statement + Animable Three.js 3D Sculpture */}
      <section className="w-full bg-white pt-10 pb-20 md:pt-16 md:pb-24">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <h1 className="font-signifier font-normal text-[44px] sm:text-[60px] xl:text-[74px] leading-[1.06] tracking-[-0.025em] text-[#17191c] text-balance">
                Construye hábitos{' '}
                <em className="italic font-normal">en un minuto al día</em>
              </h1>

              <p className="text-[17px] leading-[1.5] text-[#777b86] max-w-[480px]">
                Rituales diarios, enfoque ambiental y analítica clara sobre un lienzo sereno, libre de ruido visual.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onStartFree}
                  className="px-6 py-3 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[15px] leading-none font-normal transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Comenzar gratis
                </button>

                <button
                  type="button"
                  onClick={onTryDemo}
                  className="px-6 py-3 rounded-full bg-transparent border border-[#17191c] hover:bg-[#fafafb] text-[#17191c] text-[15px] leading-none font-normal transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Probar demo
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <HeroThreeScene />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Sobre la página & Qué ofrecemos — 4 Core Pillars */}
      <section id="que-ofrecemos" className="w-full bg-[#fafafb] py-20 border-t border-[#ececec]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 space-y-12">
          <div className="max-w-[660px] space-y-3">
            <span className="text-[14px] text-[#979799] block">
              Qué ofrecemos
            </span>
            <h2 className="font-signifier font-normal text-[36px] md:text-[48px] leading-[1.15] tracking-[-0.015em] text-[#17191c]">
              Todo lo esencial para{' '}
              <em className="italic font-normal">sostener tu constancia</em>
            </h2>
            <p className="text-[16px] leading-[1.55] text-[#777b86]">
              Diseñamos Impulso Diario para acompañarte sin castigar tus días de descanso ni saturarte con gráficos innecesarios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CORE_OFFERINGS.map((item) => (
              <div
                key={item.title}
                className="steep-card-mist p-7 flex flex-col justify-between space-y-3"
              >
                <span className="text-[13px] text-[#979799] block">
                  {item.tag}
                </span>
                <h3 className="text-[20px] font-medium text-[#17191c] tracking-[-0.01em]">
                  {item.title}
                </h3>
                <p className="text-[15px] leading-[1.55] text-[#777b86]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Cómo funciona + Única prueba interactiva limpia */}
      <section id="como-funciona" className="w-full bg-white py-20 border-t border-[#ececec]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-3">
              <span className="text-[14px] text-[#979799] block">
                Cómo funciona
              </span>
              <h2 className="font-signifier font-normal text-[36px] md:text-[46px] leading-[1.15] tracking-[-0.015em] text-[#17191c]">
                Tres pasos hacia una{' '}
                <em className="italic font-normal">rutina predecible</em>
              </h2>
            </div>

            <div className="divide-y divide-[#ececec] border-t border-b border-[#ececec]">
              {WORKFLOW_STEPS.map((s) => (
                <div key={s.num} className="py-5 flex items-start gap-5">
                  <span className="text-[14px] font-medium text-[#5d2a1a] tabular-nums pt-0.5 shrink-0">
                    {s.num}
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-[17px] font-medium text-[#17191c]">
                      {s.title}
                    </h3>
                    <p className="text-[14px] leading-[1.55] text-[#777b86]">
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Single Clean Interactive Preview Card */}
          <div className="lg:col-span-6">
            <div className="steep-artifact p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#ececec]">
                <div>
                  <span className="text-[12px] text-[#979799] block">Vista previa</span>
                  <span className="text-[16px] font-medium text-[#17191c]">
                    Registro diario en vivo
                  </span>
                </div>
                <span className="text-[13px] text-[#5d2a1a] font-medium tabular-nums">
                  {demoStreak} días en racha
                </span>
              </div>

              <div className="space-y-3">
                {/* Meditation item */}
                <div
                  className={`p-4 rounded-[16px] border transition-colors ${
                    demoMeditation
                      ? 'bg-[#fafafb] border-[#17191c]/20'
                      : 'bg-white border-[#ececec]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[12px] text-[#979799] block">Mente &amp; Foco</span>
                      <p
                        className={`text-[15px] font-medium mt-0.5 truncate ${
                          demoMeditation ? 'text-[#777b86] line-through' : 'text-[#17191c]'
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
                      className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors shrink-0 cursor-pointer ${
                        demoMeditation
                          ? 'bg-[#17191c] border-[#17191c] text-white'
                          : 'bg-white border-[#17191c]/25 text-transparent hover:border-[#17191c] hover:text-[#777b86]'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </motion.button>
                  </div>
                </div>

                {/* Water stepper item */}
                <div
                  className={`p-4 rounded-[16px] border transition-colors ${
                    isWaterDone
                      ? 'bg-[#fafafb] border-[#17191c]/20'
                      : 'bg-white border-[#ececec]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[12px] text-[#979799] block">Vitalidad</span>
                      <p
                        className={`text-[15px] font-medium mt-0.5 truncate ${
                          isWaterDone ? 'text-[#777b86] line-through' : 'text-[#17191c]'
                        }`}
                      >
                        Tomar 8 vasos de agua
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[13px] font-medium text-[#17191c] tabular-nums mr-1">
                        {demoWater}/8
                      </span>
                      <button
                        type="button"
                        onClick={() => handleWaterStep(-1)}
                        disabled={demoWater <= 0}
                        aria-label="Restar vaso"
                        className="w-8 h-8 rounded-full border border-[#ececec] bg-white hover:bg-[#f2f2f3] disabled:opacity-35 text-[#17191c] flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWaterStep(1)}
                        disabled={demoWater >= 8}
                        aria-label="Sumar vaso"
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          isWaterDone
                            ? 'bg-[#17191c] text-white'
                            : 'bg-[#f2f2f3] hover:bg-[#17191c] hover:text-white text-[#17191c]'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[#f2f2f3] mt-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#17191c] transition-all duration-300"
                      style={{ width: `${(demoWater / 8) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[13px]">
                <span className="text-[#777b86]">
                  Adherencia semanal estimada:{' '}
                  <strong className="font-medium text-[#17191c] tabular-nums">92.4%</strong>
                </span>
                <button
                  type="button"
                  onClick={onTryDemo}
                  className="text-[#17191c] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
                >
                  Abrir app demo →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Single Blush Peach Callout + Quiet Closing CTA */}
      <section id="historia" className="w-full bg-[#fafafb] py-20 border-t border-[#ececec]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 space-y-20">
          <div className="steep-card-peach p-8 sm:p-12 md:p-14">
            <div className="max-w-[820px] space-y-5">
              <span className="text-[14px] text-[#5d2a1a]/80 block">
                Historia de constancia
              </span>
              <blockquote className="font-signifier font-normal text-[24px] sm:text-[32px] leading-[1.3] tracking-[-0.015em] text-[#5d2a1a]">
                “Llevo 42 días consecutivos de lectura e hidratación. Tener mis hábitos sobre un lienzo limpio, respetando mis días programados, convirtió el registro en un ritual sereno.”
              </blockquote>
              <p className="text-[14px] text-[#5d2a1a]">
                <span className="font-medium">Diego Valencia</span> · Diseñador de Producto, Bogotá
              </p>
            </div>
          </div>

          <div className="max-w-[720px] mx-auto text-center space-y-6">
            <h2 className="font-signifier font-normal text-[36px] md:text-[50px] leading-[1.15] tracking-[-0.015em] text-[#17191c]">
              Empieza tu rutina hoy con{' '}
              <em className="italic font-normal">total claridad</em>
            </h2>
            <p className="text-[16px] leading-[1.5] text-[#777b86]">
              Sin tarjetas de crédito ni configuraciones complejas. Respeta tu zona horaria desde el primer día.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={onStartFree}
                className="px-6 py-3 rounded-full bg-[#17191c] hover:bg-[#2a2d32] text-white text-[15px] leading-none font-normal transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Crear cuenta gratis
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="px-6 py-3 rounded-full bg-transparent border border-[#17191c] hover:bg-white text-[#17191c] text-[15px] leading-none font-normal transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
