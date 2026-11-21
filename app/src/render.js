// render.js — draw the poster. Panels first (photo, face-anchored crop, grade),
// then furniture (top bar, title, ribbon, tags, seal, billing, barcode).
import { layoutPanels, furnitureZones } from './layouts.js';
import { gradeById, applyGrade, applyTexture } from './grades.js';
import { anchorCrop, panelFaceBox } from './face-anchor.js';
import { faceExposureGain, sharpenFaceBox } from './face-grade.js';
import {
  drawTopBar, drawChromeTitle, drawScript, drawRibbon, drawNameTag,
  drawSeal, drawSparkles, drawFlare, drawRelease, drawBilling, drawBarcode,
} from './furniture.js';

function gradePanel(photo, panel, W, H, grade, seed) {
  const pw = Math.max(8, Math.round(panel.w * W));
  const ph = Math.max(8, Math.round(panel.h * H));
  const off = document.createElement('canvas');
  off.width = pw;
  off.height = ph;
  const octx = off.getContext('2d', { willReadFrequently: true });
  const crop = anchorCrop(photo.w, photo.h, pw, ph, photo.anchor, panel.zoom || 1, panel.nx || 0, panel.ny || 0);
  const sx = crop.sx * photo.w;
  const sy = crop.sy * photo.h;
  const sw = crop.sw * photo.w;
  const sh = crop.sh * photo.h;
  if (panel.flip) {
    octx.save();
    octx.translate(pw, 0);
    octx.scale(-1, 1);
    octx.drawImage(photo.img, sx, sy, sw, sh, 0, 0, pw, ph);
    octx.restore();
  } else {
    octx.drawImage(photo.img, sx, sy, sw, sh, 0, 0, pw, ph);
  }
  const img = octx.getImageData(0, 0, pw, ph);
  const faceInPanel = panelFaceBox(photo.anchor, crop);
  const gain = faceExposureGain(img.data, pw, ph, faceInPanel);
  applyGrade(img.data, pw, ph, grade, faceInPanel, gain);
  sharpenFaceBox(img.data, pw, ph, faceInPanel, 0.55);
  applyTexture(img.data, pw, ph, grade, seed + Math.round(panel.x * 1000) + Math.round(panel.y * 100));
  octx.putImageData(img, 0, 0);
  return { canvas: off, crop, faceInPanel };
}

function clipPanel(ctx, panel, W, H) {
  const x = panel.x * W;
  const y = panel.y * H;
  const w = panel.w * W;
  const h = panel.h * H;
  ctx.save();
  ctx.beginPath();
  if (panel.slant) {
    const s = panel.slant * w;
    ctx.moveTo(x, y + s);
    ctx.lineTo(x + w, y - s);
    ctx.lineTo(x + w, y + h - s);
    ctx.lineTo(x, y + h + s);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.closePath();
  ctx.clip();
}

export function renderPoster(canvas, state, opts = {}) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  const grade = gradeById(state.gradeId);
  const zones = furnitureZones(state.layoutId, W, H);
  const aspect = W / H;
  const panels = layoutPanels(state.layoutId, aspect);
  const seed = 20261121;

  // Backdrop: warm sunset gradient behind everything.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#2b1055');
  bg.addColorStop(0.55, '#7597de');
  bg.addColorStop(1, '#ff9a5a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const keepOut = [{ ...zones.topBar }, { ...zones.bottom }];
  const tagRects = [];
  const faceBoxes = [];

  panels.forEach((panel, i) => {
    const assign = state.panels[i];
    if (!assign || !assign.photo) return;
    const px = zones.poster.x + panel.x * zones.poster.w;
    const py = zones.poster.y + panel.y * zones.poster.h;
    const pw = panel.w * zones.poster.w;
    const ph = panel.h * zones.poster.h;
    const local = { x: panel.x, y: panel.y, w: panel.w, h: panel.h, slant: panel.slant, zoom: assign.zoom, nx: assign.nx, ny: assign.ny, flip: assign.flip };
    const { canvas: pc, crop, faceInPanel } = gradePanel(assign.photo, local, zones.poster.w, zones.poster.h, grade, seed + i * 7);
    ctx.save();
    ctx.beginPath();
    if (panel.slant) {
      const s = panel.slant * pw;
      ctx.moveTo(px, py + s);
      ctx.lineTo(px + pw, py - s);
      ctx.lineTo(px + pw, py + ph - s);
      ctx.lineTo(px, py + ph + s);
    } else {
      ctx.rect(px, py, pw, ph);
    }
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(pc, px, py, pw, ph);
    // Bloom: a soft warm wash over the panel.
    if (grade.bloom > 0) {
      const wash = ctx.createRadialGradient(px + pw * 0.7, py + ph * 0.15, 0, px + pw * 0.7, py + ph * 0.15, pw * 0.8);
      wash.addColorStop(0, `rgba(255, 190, 120, ${grade.bloom * 0.5})`);
      wash.addColorStop(1, 'rgba(255, 190, 120, 0)');
      ctx.fillStyle = wash;
      ctx.fillRect(px, py, pw, ph);
    }
    ctx.restore();
    // Panel frame.
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(2, W * 0.003);
    ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);
    ctx.restore();
    faceBoxes.push({ panel: { x: px, y: py, w: pw, h: ph }, face: faceInPanel, photo: assign.photo });
  });

  // Title + script + ribbon.
  const titleSize = Math.round(H * (state.layoutId === 'grid' ? 0.085 : 0.105));
  if (state.layoutId === 'grid') {
    const band = zones.titleBand;
    drawChromeTitle(ctx, state.title, band.x + W * 0.03, band.y + band.h * 0.52, titleSize, state.titleFont);
    drawScript(ctx, state.subtitle, band.x + W * 0.03, band.y + band.h * 0.86, Math.round(titleSize * 0.34), state.scriptFont);
    drawRibbon(ctx, state.tagline, band.x + W * 0.62, band.y + band.h * 0.22, W * 0.35, band.h * 0.5);
    keepOut.push({ x: band.x, y: band.y, w: band.w, h: band.h });
  } else {
    const hero = panels[0];
    const hx = zones.poster.x + hero.x * zones.poster.w;
    const hy = zones.poster.y + hero.y * zones.poster.h;
    const hw = hero.w * zones.poster.w;
    const hh = hero.h * zones.poster.h;
    const tx = hx + hw * 0.03;
    // Title block stacked bottom-up: ribbon at the very bottom, script above
    // it, title above the script — nothing overlaps anything.
    const ribbonH = Math.round(H * 0.032);
    // The ribbon sits above the bottom zone (release + billing lines live
    // there) so it can never cover them.
    const ribbonY = hy + hh - ribbonH - zones.bottom.h - H * 0.005;
    const scriptY = ribbonY - H * 0.012;
    const ty = scriptY - titleSize * 0.42;
    drawChromeTitle(ctx, state.title, tx, ty, titleSize, state.titleFont);
    drawScript(ctx, state.subtitle, tx + titleSize * 0.12, scriptY, Math.round(titleSize * 0.36), state.scriptFont);
    keepOut.push({ x: tx - 10, y: ty - titleSize * 1.05, w: hw * 0.9, h: (ribbonY + ribbonH) - (ty - titleSize * 1.05) });
    const ribbonW = Math.min(hw * 0.62, W * 0.34);
    drawRibbon(ctx, state.tagline, tx, ribbonY, ribbonW, ribbonH);
    keepOut.push({ x: tx, y: ribbonY, w: ribbonW, h: ribbonH });
  }

  // Name tags (keep-out aware).
  panels.forEach((panel, i) => {
    const assign = state.panels[i];
    if (!assign || !assign.photo) return;
    const px = zones.poster.x + panel.x * zones.poster.w;
    const py = zones.poster.y + panel.y * zones.poster.h;
    const pw = panel.w * zones.poster.w;
    const ph = panel.h * zones.poster.h;
    const r = drawNameTag(ctx, { x: px, y: py, w: pw, h: ph }, assign.photo.name, assign.photo.role, keepOut);
    tagRects.push(r);
  });

  // Seal, top-right of the poster area.
  const sealR = Math.max(18, W * 0.032);
  drawSeal(ctx, zones.poster.x + zones.poster.w - sealR * 1.15, zones.poster.y + sealR * 1.15, sealR, 'LEONIDA • VICE HEAT • ');
  keepOut.push({ x: zones.poster.x + zones.poster.w - sealR * 2.3, y: zones.poster.y, w: sealR * 2.3, h: sealR * 2.3 });

  // Sparkles (never over the hero face) and flare.
  const heroFace = faceBoxes.length ? faceBoxes[0] : null;
  const avoid = heroFace ? [{ x: heroFace.panel.x + heroFace.face.x * heroFace.panel.w, y: heroFace.panel.y + heroFace.face.y * heroFace.panel.h, w: heroFace.face.w * heroFace.panel.w, h: heroFace.face.h * heroFace.panel.h }] : [];
  drawSparkles(ctx, W, H, seed, 26, avoid);
  drawFlare(ctx, zones.poster.x + zones.poster.w * 0.12, zones.poster.y + zones.poster.h * 0.1, Math.max(40, W * 0.08));

  // Top bar, release line, billing, barcode.
  drawTopBar(ctx, zones.topBar, state.quote, state.source, 'FIRST EDITION');
  const bottom = zones.bottom;
  drawRelease(ctx, 'COMING 2026  •  LEONIDA  •  VICE HEAT PICTURES', 0, bottom.y + bottom.h * 0.32, W, Math.max(9, Math.round(H * 0.016)));
  drawBilling(ctx, state.billing, 0, bottom.y + bottom.h * 0.82, W * 0.82, Math.max(8, Math.round(H * 0.013)));
  drawBarcode(ctx, W - W * 0.075, bottom.y - Math.round(H * 0.028), W * 0.062, Math.round(H * 0.042), 'VICEHEAT2026');

  // Face overlay for the Face Lab: measured boxes + scores on each panel.
  if (opts.showOverlay) {
    faceBoxes.forEach((fb) => {
      const fx = fb.panel.x + fb.face.x * fb.panel.w;
      const fy = fb.panel.y + fb.face.y * fb.panel.h;
      const fw = fb.face.w * fb.panel.w;
      const fh = fb.face.h * fb.panel.h;
      ctx.save();
      ctx.strokeStyle = '#39ff6a';
      ctx.lineWidth = Math.max(2, W * 0.0025);
      ctx.strokeRect(fx, fy, fw, fh);
      const label = `${fb.photo.name} ${(fb.photo.faceScore ?? 0).toFixed(2)}`;
      ctx.font = `bold ${Math.max(11, Math.round(W * 0.013))}px sans-serif`;
      const tw = ctx.measureText(label).width + 12;
      ctx.fillStyle = 'rgba(8, 40, 16, 0.9)';
      ctx.fillRect(fx, fy - Math.max(16, W * 0.02), tw, Math.max(16, W * 0.02));
      ctx.fillStyle = '#39ff6a';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, fx + 6, fy - Math.max(8, W * 0.01));
      ctx.restore();
    });
  }
  return { faceBoxes, tagRects };
}
