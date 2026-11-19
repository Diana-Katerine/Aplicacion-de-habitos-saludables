import path from 'node:path';
import sharp from 'sharp';

const sourceImg = 'C:/Users/KATHE/.gemini/antigravity/brain/bc410f80-0ff5-4d53-8271-c9235e647e19/hero_cover_art_1795126422388.jpg';
const destDir = path.resolve('public/assets/images');

// WebP optimizado para web a 1200x675 (16:9) con alta fidelidad y mínimo peso
await sharp(sourceImg)
  .resize(1200, 675, { fit: 'cover', position: 'center' })
  .webp({ quality: 86, effort: 6 })
  .toFile(path.join(destDir, 'hero-cover.webp'));

// AVIF de última generación ultra-comprimido para máxima velocidad en intranet
await sharp(sourceImg)
  .resize(1200, 675, { fit: 'cover', position: 'center' })
  .avif({ quality: 80, effort: 6 })
  .toFile(path.join(destDir, 'hero-cover.avif'));

// Versión JPEG de respaldo
await sharp(sourceImg)
  .resize(1200, 675, { fit: 'cover', position: 'center' })
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(path.join(destDir, 'hero-cover.jpg'));

console.log('Cover images optimized and created in AVIF, WebP, and JPEG!');
