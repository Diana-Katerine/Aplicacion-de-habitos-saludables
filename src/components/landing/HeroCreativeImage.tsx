import React from 'react';

interface HeroCreativeImageProps {
  isDark?: boolean;
}

export const HeroCreativeImage: React.FC<HeroCreativeImageProps> = ({ isDark = false }) => {
  return (
    <div
      className={`relative w-full aspect-[5/4] max-h-[500px] rounded-3xl overflow-hidden p-3 sm:p-5 flex items-center justify-center transition-all duration-300 ${
        isDark
          ? 'bg-slate-900/60 border border-slate-700/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
          : 'bg-white/70 border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)]'
      } backdrop-blur-md`}
    >
      <picture className="w-full h-full flex items-center justify-center">
        <source srcSet="/assets/images/habitos-saludables-hero.avif" type="image/avif" />
        <source srcSet="/assets/images/habitos-saludables-hero.webp" type="image/webp" />
        <img
          src="/assets/images/habitos-saludables-hero.svg"
          alt="Ilustración creativa de hábitos saludables: meditación, hidratación balanceada y constancia diaria"
          width={800}
          height={640}
          loading="eager"
          decoding="async"
          className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-500 hover:scale-[1.02]"
        />
      </picture>
    </div>
  );
};
