// furniture.js — the poster's furniture: review top bar, striped chrome title
// with glow, script subtitle, tagline ribbon, name tags that dodge the title,
// Leonida seal with ring text, sparkles, lens flare, release line, billing
// block and barcode. All drawn on canvas, all deterministic.
import { mulberry32 } from './grades.js';

export function drawTopBar(ctx, zone, quote, source, edition) {
  ctx.save();
  ctx.fillStyle = '#0d0a12';
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  ctx.fillStyle = '#f5c542';
  ctx.font = `bold ${Math.round(zone.h * 0.52)}px sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText('★★★★★', zone.x + zone.w * 0.015, zone.y + zone.h / 2);
  const starsW = ctx.measureText('★★★★★').width;
  ctx.fillStyle = '#f3ead8';
  ctx.font = `italic ${Math.round(zone.h * 0.42)}px Georgia, serif`;
  const q = `"${quote}" — ${source}`;
  ctx.fillText(q, zone.x + zone.w * 0.015 + starsW + zone.w * 0.02, zone.y + zone.h / 2, zone.w * 0.6);
  // Edition chip, right-aligned.
  const chip = edition.toUpperCase();
  ctx.font = `bold ${Math.round(zone.h * 0.4)}px sans-serif`;
  const tw = ctx.measureText(chip).width + zone.h * 0.9;
  const cx = zone.x + zone.w - tw - zone.w * 0.015;
  ctx.strokeStyle = '#f5c542';
  ctx.lineWidth = Math.max(1, zone.h * 0.05);
  roundRect(ctx, cx, zone.y + zone.h * 0.16, tw, zone.h * 0.68, zone.h * 0.34);
  ctx.stroke();
  ctx.fillStyle = '#f5c542';
  ctx.fillText(chip, cx + zone.h * 0.45, zone.y + zone.h / 2);
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Chrome title: fill the letters, then clip diagonal stripes over them.
export function drawChromeTitle(ctx, text, x, y, size, font, glowColor = '#ff5fa2') {
  ctx.save();
  ctx.font = `${size}px ${font}`;
  ctx.textBaseline = 'alphabetic';
  // Glow pass underneath.
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = size * 0.22;
  ctx.fillStyle = '#fff8e6';
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  // Stripe pass clipped to the letters.
  const off = document.createElement('canvas');
  off.width = Math.ceil(ctx.measureText(text).width) + 4;
  off.height = size * 1.4;
  const o = off.getContext('2d');
  o.font = `${size}px ${font}`;
  o.textBaseline = 'alphabetic';
  const grad = o.createLinearGradient(0, y - size, 0, y + size * 0.2);
  grad.addColorStop(0, '#fff6d8');
  grad.addColorStop(0.45, '#ffd34d');
  grad.addColorStop(0.55, '#ff5fa2');
  grad.addColorStop(1, '#7a2bff');
  o.fillStyle = grad;
  o.fillText(text, 0, size);
  o.globalCompositeOperation = 'source-atop';
  o.fillStyle = 'rgba(255,255,255,0.85)';
  const stripe = Math.max(3, size * 0.06);
  for (let sx = -off.height; sx < off.width + off.height; sx += stripe * 3) {
    o.beginPath();
    o.moveTo(sx, 0);
    o.lineTo(sx + stripe, 0);
    o.lineTo(sx + stripe - off.height * 0.5, off.height);
    o.lineTo(sx - off.height * 0.5, off.height);
    o.closePath();
    o.fill();
  }
  ctx.drawImage(off, x, y - size, off.width, off.height);
  ctx.restore();
}

export function drawScript(ctx, text, x, y, size, font, color = '#ff8fc7') {
  ctx.save();
  ctx.font = `${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = size * 0.25;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawRibbon(ctx, text, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#e83e8c';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - h * 0.5, y + h);
  ctx.lineTo(x + h * 0.5, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  // Shrink the text until it fits the ribbon — never let it run off the edge.
  let fs = Math.round(h * 0.52);
  ctx.font = `bold ${fs}px sans-serif`;
  while (ctx.measureText(text).width > w * 0.88 && fs > 8) {
    fs -= 1;
    ctx.font = `bold ${fs}px sans-serif`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

// Name tag with a keep-out check: if the bottom spot collides with a
// forbidden rect (title, subtitle, ribbon, seal, top bar), move to the
// panel's top-left instead.
export function drawNameTag(ctx, panel, name, role, keepOut) {
  const pad = Math.max(6, panel.w * 0.02);
  const fontSize = Math.max(11, Math.round(panel.w * 0.055));
  const subSize = Math.max(9, Math.round(fontSize * 0.62));
  ctx.save();
  ctx.font = `bold ${fontSize}px sans-serif`;
  const nameW = ctx.measureText(name.toUpperCase()).width;
  ctx.font = `${subSize}px sans-serif`;
  const roleW = ctx.measureText(role.toUpperCase()).width;
  const tagW = Math.max(nameW, roleW) + pad * 2;
  const tagH = fontSize + subSize + pad * 1.6;
  let tx = panel.x + pad;
  let ty = panel.y + panel.h - tagH - pad;
  const rect = { x: tx - pad, y: ty - pad, w: tagW + pad * 2, h: tagH + pad * 2 };
  const hits = keepOut.some(
    (k) => rect.x < k.x + k.w && rect.x + rect.w > k.x && rect.y < k.y + k.h && rect.y + rect.h > k.y,
  );
  if (hits) {
    ty = panel.y + pad;
  }
  ctx.fillStyle = 'rgba(10, 8, 16, 0.88)';
  ctx.fillRect(tx - pad * 0.4, ty - pad * 0.4, tagW, tagH);
  ctx.fillStyle = '#ff4d9d';
  ctx.fillRect(tx - pad * 0.4, ty - pad * 0.4, Math.max(3, pad * 0.45), tagH);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText(name.toUpperCase(), tx + pad * 0.6, ty + pad * 0.3);
  ctx.fillStyle = '#ffd9ec';
  ctx.font = `${subSize}px sans-serif`;
  ctx.fillText(role.toUpperCase(), tx + pad * 0.6, ty + pad * 0.3 + fontSize + pad * 0.3);
  ctx.restore();
  return { x: tx - pad * 0.4, y: ty - pad * 0.4, w: tagW, h: tagH };
}

export function drawSeal(ctx, cx, cy, r, label) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(12, 10, 18, 0.82)';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f5c542';
  ctx.lineWidth = Math.max(1.5, r * 0.07);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
  ctx.stroke();
  // Ring text.
  ctx.fillStyle = '#f5c542';
  ctx.font = `bold ${Math.max(7, r * 0.16)}px sans-serif`;
  const ring = label.toUpperCase();
  const step = (Math.PI * 2) / ring.length;
  for (let i = 0; i < ring.length; i++) {
    const a = -Math.PI / 2 + i * step;
    ctx.save();
    ctx.rotate(a);
    ctx.translate(0, -r * 0.77);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ring[i], 0, 0);
    ctx.restore();
  }
  ctx.fillStyle = '#ff4d9d';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.34);
  ctx.lineTo(r * 0.3, r * 0.1);
  ctx.lineTo(r * 0.12, r * 0.34);
  ctx.lineTo(-r * 0.12, r * 0.34);
  ctx.lineTo(-r * 0.3, r * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawSparkles(ctx, W, H, seed, count = 26, avoid = []) {
  const rand = mulberry32(seed);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = rand() * W;
    const y = rand() * H;
    if (avoid.some((a) => x > a.x && x < a.x + a.w && y > a.y && y < a.y + a.h)) continue;
    const s = 2 + rand() * 5;
    ctx.fillStyle = `rgba(255, 240, 180, ${0.5 + rand() * 0.5})`;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.28, y - s * 0.28);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x + s * 0.28, y + s * 0.28);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s * 0.28, y + s * 0.28);
    ctx.lineTo(x - s, y);
    ctx.lineTo(x - s * 0.28, y - s * 0.28);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawFlare(ctx, x, y, r) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, 'rgba(255, 230, 170, 0.85)');
  g.addColorStop(0.25, 'rgba(255, 180, 120, 0.35)');
  g.addColorStop(1, 'rgba(255, 180, 120, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawRelease(ctx, text, x, y, w, size) {
  ctx.save();
  ctx.fillStyle = '#ffd34d';
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y);
  ctx.restore();
}

export function drawBilling(ctx, text, x, y, w, size) {
  ctx.save();
  ctx.fillStyle = 'rgba(243, 234, 216, 0.92)';
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y, w * 0.96);
  ctx.restore();
}

// Deterministic barcode from a seed string: bars from the char codes.
export function drawBarcode(ctx, x, y, w, h, seedText) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#111';
  let px = x + w * 0.03;
  const end = x + w * 0.97;
  let i = 0;
  while (px < end) {
    const code = seedText.charCodeAt(i % seedText.length);
    const bw = 1 + ((code >> (i % 4)) % 3);
    if ((code + i) % 3 !== 0) ctx.fillRect(px, y + h * 0.06, bw, h * 0.68);
    px += bw + 1 + ((code + i) % 2);
    i++;
  }
  ctx.font = `${Math.max(8, h * 0.14)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('8 901234 567890', x + w / 2, y + h * 0.94);
  ctx.restore();
}
