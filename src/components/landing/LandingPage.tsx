import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  Check,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  TrendingUp,
  Droplets,
  Calendar,
  Compass,
  CheckCircle,
} from 'lucide-react';

interface Props {
  onStartFree: () => void;
  onLogin: () => void;
  onTryDemo: () => void;
}

export const LandingPage: React.FC<Props> = ({
  onStartFree,
  onLogin,
  onTryDemo,
}) => {
  // Interactive Hero Demo State
  const [demoWater, setDemoWater] = useState(6);
  const [demoMeditation, setDemoMeditation] = useState(false);
  const [demoStreak, setDemoStreak] = useState(14);
  const [showCelebration, setShowCelebration] = useState(false);

  const isWaterDone = demoWater >= 8;

  const handleWaterStep = (delta: number) => {
    const next = Math.max(0, Math.min(8, demoWater + delta));
    setDemoWater(next);
    if (next === 8 && !isWaterDone) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2500);
    }
  };

  const handleToggleMeditation = () => {
    const next = !demoMeditation;
    setDemoMeditation(next);
    if (next) {
      setDemoStreak((s) => s + 1);
    } else {
      setDemoStreak((s) => Math.max(14, s - 1));
    }
  };

  return (
    <div className="space-y-20 py-8 md:py-16">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sistema Luminous Momentum — Diseño de Alto Rendimiento</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight text-balance leading-tight">
          Construye hábitos saludables en{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] via-[#34D399] to-emerald-300">
            1 minuto al día
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed text-balance">
          El habit tracker de mínima fricción diseñado con motor de rachas transaccional, bioluminiscencia táctil y respeto milimétrico a tu zona horaria local.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onStartFree}
            className="w-full sm:w-auto px-7 py-3 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#003824] text-sm font-bold transition-all shadow-[0_0_24px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Comenzar gratis</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            onClick={onTryDemo}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#1E293B] hover:bg-[#27354A] border border-white/10 text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            Probar demo interactiva
          </button>
        </div>

        <div className="pt-2 text-xs text-slate-500">
          Sin tarjeta de crédito · Funciona en móvil y escritorio · Datos sincronizados
        </div>
      </div>

      {/* Interactive Live Preview Sandbox */}
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-3">
          <span className="text-xs uppercase tracking-widest font-bold text-slate-400">
            Prueba el registro en vivo aquí abajo ↓
          </span>
        </div>

        <div className="rounded-2xl bg-[#0F172A] border border-white/15 p-5 md:p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wide">
                Vista "Hoy" — Registro en tiempo real
              </span>
            </div>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums glow-amber-flame"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#F59E0B',
              }}
            >
              <Flame className="w-3.5 h-3.5 fill-[#F59E0B]" />
              <span>{demoStreak} días en racha</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Interactive Single Node: Meditación */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                demoMeditation
                  ? 'bg-[#111827] border-emerald-500/30 ring-1 ring-emerald-500/20'
                  : 'bg-[#181b25] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                      Mente & Foco
                    </span>
                    <h4
                      className={`text-sm font-bold transition-colors ${
                        demoMeditation ? 'text-slate-300 line-through' : 'text-white'
                      }`}
                    >
                      Meditación consciente matutina
                    </h4>
                    <span className="text-[11px] text-slate-400">Meta: 1 sesión diaria</span>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.88 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={handleToggleMeditation}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    demoMeditation
                      ? 'bg-[#10B981] text-[#003824] border border-[#34D399] glow-emerald-node'
                      : 'bg-[#1E293B] text-slate-500 hover:text-white border border-white/15'
                  }`}
                  title="Haz clic para marcar como completado"
                >
                  <Check className={`w-4 h-4 stroke-[3] ${demoMeditation ? 'text-[#003824]' : ''}`} />
                </motion.button>
              </div>
            </div>

            {/* Interactive Cumulative: Vasos de agua */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isWaterDone
                  ? 'bg-[#111827] border-emerald-500/30 ring-1 ring-emerald-500/20'
                  : 'bg-[#181b25] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                      Hidratación
                    </span>
                    <h4
                      className={`text-sm font-bold transition-colors ${
                        isWaterDone ? 'text-slate-300 line-through' : 'text-white'
                      }`}
                    >
                      Tomar 8 vasos de agua
                    </h4>
                    <span className="text-[11px] text-slate-400">Meta: 8 vasos al día</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tabular-nums mr-1">
                    {demoWater}/8
                  </span>

                  <button
                    onClick={() => handleWaterStep(-1)}
                    disabled={demoWater <= 0}
                    className="w-8 h-8 rounded-lg bg-[#1E293B] hover:bg-[#27354A] disabled:opacity-30 text-white flex items-center justify-center border border-white/10 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleWaterStep(1)}
                    disabled={demoWater >= 8}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                      isWaterDone
                        ? 'bg-[#10B981] border-[#34D399] text-[#003824] glow-emerald'
                        : 'bg-[#10B981]/20 hover:bg-[#10B981] hover:text-[#003824] border-[#10B981]/40 text-[#10B981]'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </motion.button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-[#1E293B] mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#10B981] transition-all duration-300"
                  style={{ width: `${(demoWater / 8) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {showCelebration && (
            <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-center text-xs font-bold text-emerald-300 animate-bounce">
              🎉 ¡Meta de hidratación cumplida! Así de fácil se siente avanzar.
            </div>
          )}
        </div>
      </div>

      {/* 3 Pillars / Feature Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl p-6 bg-[#0F172A] border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Registro en 1 Clic
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Sin fricción ni formularios interminables. Tu vista "Hoy" reúne exclusivamente lo que te toca hacer hoy según tu programación semanal.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 mt-4 block">
            Actualización optimista instantánea
          </span>
        </div>

        <div className="rounded-xl p-6 bg-[#0F172A] border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Flame className="w-5 h-5 fill-amber-400" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Motor de Rachas Transaccional
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Cálculo riguroso de racha actual y récord histórico. Si un hábito está programado solo L-M-V, los fines de semana no rompen tu racha.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-amber-400 mt-4 block">
            Reconocimiento de días programados
          </span>
        </div>

        <div className="rounded-xl p-6 bg-[#0F172A] border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Zona Horaria IANA Precisa
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Cortes de medianoche estrictamente a las 00:00 de tu hora local. Sin sorpresas donde tus hábitos se reinicien antes de que te vayas a dormir.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-indigo-400 mt-4 block">
            Detección automática de huso horario
          </span>
        </div>
      </div>

      {/* Social Proof */}
      <div className="max-w-4xl mx-auto rounded-2xl bg-[#0F172A] border border-white/[0.08] p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0">
            DV
          </div>
          <div className="space-y-1 text-center md:text-left">
            <p className="text-sm md:text-base text-slate-200 italic leading-relaxed">
              "Llevo 42 días consecutivos de lectura e hidratación. La interfaz oscura con el resplandor verde hace que marcar el hábito sea un placer sensorial, y el respeto por los días programados me quitó la culpa de los fines de semana."
            </p>
            <div className="text-xs text-slate-400 pt-1">
              <strong className="text-white">Diego Valencia</strong> · Diseñador de Producto, Bogotá (GMT-5)
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="max-w-5xl mx-auto text-center rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0F172A] to-emerald-950/40 border border-emerald-500/30 p-8 md:p-12 space-y-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Empieza a construir tu mejor versión hoy
        </h2>
        <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto">
          Únete a cientos de personas que han transformado su consistencia diaria sin esfuerzo innecesario.
        </p>
        <div className="pt-2">
          <button
            onClick={onStartFree}
            className="px-8 py-3 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#003824] text-sm font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
          >
            Crear mi cuenta gratis
          </button>
        </div>
      </div>
    </div>
  );
};
