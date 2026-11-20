import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const outputDir = path.resolve('public/assets/images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// SVG Illustration representation of healthy habits: Meditation, Hydration, Nutrition, Focus
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 640" width="800" height="640">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" stop-opacity="0.12" />
      <stop offset="50%" stop-color="#0284c7" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#4f46e5" stop-opacity="0.14" />
    </linearGradient>
    <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="50%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#f8fafc" stop-opacity="0.9" />
    </linearGradient>
    <filter id="glassShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0f172a" flood-opacity="0.08" />
    </filter>
  </defs>

  <!-- Canvas Background Elements -->
  <rect width="800" height="640" rx="32" fill="url(#bgGrad)" />

  <!-- Ambient Decorative Rings -->
  <circle cx="400" cy="300" r="220" fill="none" stroke="url(#circleGrad)" stroke-width="2" stroke-dasharray="8 12" opacity="0.6" />
  <circle cx="400" cy="300" r="170" fill="none" stroke="url(#circleGrad)" stroke-width="1.5" opacity="0.4" />

  <!-- Central Habit Illustration Card -->
  <g filter="url(#glassShadow)">
    <rect x="250" y="140" width="300" height="340" rx="28" fill="url(#cardGrad)" stroke="#e2e8f0" stroke-width="1.5" />
  </g>

  <!-- Central Lotus / Growth Motif -->
  <g transform="translate(400, 260)">
    <!-- Base leaf -->
    <path d="M 0 30 C -50 10 -60 -40 0 -70 C 60 -40 50 10 0 30 Z" fill="url(#circleGrad)" opacity="0.9" />
    <!-- Left petal -->
    <path d="M -15 25 C -70 5 -80 -25 -50 -45 C -25 -25 -10 10 -15 25 Z" fill="#10b981" opacity="0.75" />
    <!-- Right petal -->
    <path d="M 15 25 C 70 5 80 -25 50 -45 C 25 -25 10 10 15 25 Z" fill="#6366f1" opacity="0.75" />
    <!-- Inner core spark -->
    <circle cx="0" cy="-20" r="14" fill="#ffffff" />
    <circle cx="0" cy="-20" r="7" fill="#059669" />
  </g>

  <!-- Orbiting Health Badges (Hydration, Energy, Focus) -->
  <!-- Badge 1: Hidratación / Agua -->
  <g filter="url(#glassShadow)" transform="translate(130, 200)">
    <rect width="170" height="74" rx="20" fill="#ffffff" stroke="#bae6fd" stroke-width="1.5" />
    <circle cx="38" cy="37" r="22" fill="#e0f2fe" />
    <path d="M 38 25 C 38 25 28 36 28 42 C 28 47.5 32.5 52 38 52 C 43.5 52 48 47.5 48 42 C 48 36 38 25 38 25 Z" fill="#0284c7" />
    <text x="70" y="34" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#0369a1">HIDRATACIÓN</text>
    <text x="70" y="52" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">8 / 8 vasos</text>
  </g>

  <!-- Badge 2: Racha / Constancia -->
  <g filter="url(#glassShadow)" transform="translate(500, 160)">
    <rect width="180" height="74" rx="20" fill="#ffffff" stroke="#fde68a" stroke-width="1.5" />
    <circle cx="38" cy="37" r="22" fill="#fef3c7" />
    <!-- Flame icon -->
    <path d="M 38 24 C 38 24 44 32 44 38 C 44 42 41 46 38 48 C 35 46 32 42 32 38 C 32 35 34 31 38 24 Z" fill="#d97706" />
    <text x="70" y="34" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#b45309">RACHA ACTIVA</text>
    <text x="70" y="52" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">14 días seguidos</text>
  </g>

  <!-- Badge 3: Enfoque y Mente -->
  <g filter="url(#glassShadow)" transform="translate(480, 390)">
    <rect width="190" height="74" rx="20" fill="#ffffff" stroke="#ddd6fe" stroke-width="1.5" />
    <circle cx="38" cy="37" r="22" fill="#ede9fe" />
    <!-- Sparkles icon -->
    <circle cx="38" cy="37" r="6" fill="#7c3aed" />
    <circle cx="48" cy="28" r="3" fill="#a78bfa" />
    <circle cx="28" cy="46" r="2.5" fill="#a78bfa" />
    <text x="70" y="34" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#6d28d9">ENFOQUE MENTAL</text>
    <text x="70" y="52" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">25 min Deep Work</text>
  </g>

  <!-- Bottom Milestone Card -->
  <g filter="url(#glassShadow)" transform="translate(230, 410)">
    <rect width="340" height="66" rx="18" fill="#ffffff" stroke="#bbf7d0" stroke-width="1.5" />
    <circle cx="36" cy="33" r="18" fill="#dcfce7" />
    <path d="M 28 33 L 34 39 L 45 27" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    <text x="66" y="30" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#15803d">Progreso Diario: 100%</text>
    <text x="66" y="48" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#64748b">Todos tus hábitos cumplidos hoy</text>
  </g>
</svg>
`;

// Save SVG
const svgPath = path.join(outputDir, 'habitos-saludables-hero.svg');
fs.writeFileSync(svgPath, svgContent);

// Generate WebP
const webpPath = path.join(outputDir, 'habitos-saludables-hero.webp');
await sharp(Buffer.from(svgContent))
  .webp({ quality: 90 })
  .toFile(webpPath);

// Generate AVIF
const avifPath = path.join(outputDir, 'habitos-saludables-hero.avif');
await sharp(Buffer.from(svgContent))
  .avif({ quality: 85 })
  .toFile(avifPath);

console.log('Optimized images generated successfully in WebP, AVIF, and SVG!');
