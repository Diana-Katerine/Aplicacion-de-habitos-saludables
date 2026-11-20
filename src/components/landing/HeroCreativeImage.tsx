import React from 'react';

interface HeroCreativeImageProps {
  isDark?: boolean;
}

export const HeroCreativeImage: React.FC<HeroCreativeImageProps> = ({ isDark = false }) => {
  return (
    <div
      className={`relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[520px] rounded-3xl overflow-hidden p-2 sm:p-3 flex items-center justify-center transition-all duration-300 ${
        isDark
          ? 'bg-slate-900/60 border border-slate-700/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
          : 'bg-white/70 border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)]'
      } backdrop-blur-md group`}
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden">
        <picture className="w-full h-full flex items-center justify-center">
          <source srcSet="/assets/images/hero-cover.avif" type="image/avif" />
          <source srcSet="/assets/images/hero-cover.webp" type="image/webp" />
          <img
            src="/assets/images/hero-cover.jpg"
            alt="Portada artística e inspiradora de Impulso Diario: hábitos saludables, bienestar mental, hidratación y energía matutina"
            width={1200}
            height={675}
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </picture>

        {/* Subtle glass reflection highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20 dark:ring-white/10"
        />
      </div>
    </div>
  );
};
