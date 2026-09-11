// Script para generar íconos PNG para la PWA desde SVG
// Ejecutar con: node generate-icons.js
import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '../public/icons');

try { mkdirSync(iconsDir, { recursive: true }); } catch(e) {}

function drawIcon(size, maskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const pad = maskable ? size * 0.1 : 0;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  // Background — dark ocean blue
  ctx.fillStyle = '#0a172c';
  if (maskable) {
    ctx.fillRect(0, 0, size, size);
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Outer ring
  ctx.strokeStyle = 'rgba(56,189,248,0.4)';
  ctx.lineWidth = size * 0.015;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
  ctx.stroke();

  // Water gradient (bottom half)
  const grad = ctx.createLinearGradient(0, cy, 0, size - pad);
  grad.addColorStop(0, 'rgba(7,89,133,0.7)');
  grad.addColorStop(1, 'rgba(3,105,161,0.4)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.3, r * 0.75, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boat hull
  const hullW = size * 0.38;
  const hullH = size * 0.12;
  const hullY = cy + size * 0.15;
  ctx.fillStyle = '#1e3a5f';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = size * 0.018;
  ctx.beginPath();
  ctx.moveTo(cx - hullW * 0.5, hullY);
  ctx.quadraticCurveTo(cx, hullY + hullH, cx + hullW * 0.5, hullY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mast
  const mastX = cx - size * 0.02;
  const mastTop = cy - size * 0.36;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = size * 0.022;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(mastX, hullY);
  ctx.lineTo(mastX, mastTop);
  ctx.stroke();

  // Main sail (large triangle — white/cyan)
  const sailGrad = ctx.createLinearGradient(mastX, mastTop, cx + size * 0.18, hullY);
  sailGrad.addColorStop(0, 'rgba(56,189,248,0.9)');
  sailGrad.addColorStop(1, 'rgba(255,255,255,0.6)');
  ctx.fillStyle = sailGrad;
  ctx.beginPath();
  ctx.moveTo(mastX, mastTop + size * 0.04);
  ctx.lineTo(mastX, hullY - size * 0.03);
  ctx.lineTo(cx + size * 0.18, hullY - size * 0.03);
  ctx.closePath();
  ctx.fill();

  // Jib (foresail — smaller triangle)
  ctx.fillStyle = 'rgba(248,250,252,0.7)';
  ctx.beginPath();
  ctx.moveTo(mastX, mastTop + size * 0.1);
  ctx.lineTo(mastX, hullY - size * 0.03);
  ctx.lineTo(cx - size * 0.18, hullY - size * 0.03);
  ctx.closePath();
  ctx.fill();

  // Compass rose (top-right area)
  const roseR = size * 0.1;
  const roseX = cx + size * 0.26;
  const roseY = cy - size * 0.22;
  ctx.strokeStyle = 'rgba(245,158,11,0.8)';
  ctx.lineWidth = size * 0.012;
  ctx.beginPath(); ctx.moveTo(roseX, roseY - roseR); ctx.lineTo(roseX, roseY + roseR); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(roseX - roseR, roseY); ctx.lineTo(roseX + roseR, roseY); ctx.stroke();
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(roseX, roseY - roseR);
  ctx.lineTo(roseX - roseR * 0.3, roseY - roseR * 0.3);
  ctx.lineTo(roseX + roseR * 0.3, roseY - roseR * 0.3);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

const sizes = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

for (const { name, size, maskable } of sizes) {
  const canvas = drawIcon(size, maskable);
  const buffer = canvas.toBuffer('image/png');
  const outPath = resolve(iconsDir, name);
  writeFileSync(outPath, buffer);
  console.log(`✅ Generated ${name} (${size}x${size})`);
}
console.log('🎉 All PWA icons generated!');
