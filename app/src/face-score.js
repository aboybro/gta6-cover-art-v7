// face-score.js — score a detected face 0..1 from five signals measured on the
// photo's own pixels. Nothing here is guessed: every signal is computed.
import { skinScoreAt } from './face-detect.js';

function facePixels(img, box, maxW = 96) {
  const scale = Math.min(1, maxW / img.naturalWidth);
  const w = Math.max(8, Math.round(img.naturalWidth * scale));
  const h = Math.max(8, Math.round(img.naturalHeight * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const x0 = Math.max(0, Math.floor(box.x * w));
  const y0 = Math.max(0, Math.floor(box.y * h));
  const x1 = Math.min(w, Math.ceil((box.x + box.w) * w));
  const y1 = Math.min(h, Math.ceil((box.y + box.h) * h));
  return { d, w, h, x0, y0, x1, y1 };
}

// Laplacian variance on 0..255 luma: sharp photos score high, soft ones low.
function laplacianVariance(d, w, x0, y0, x1, y1) {
  const lumas = [];
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      lumas.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    }
  }
  const cols = x1 - x0;
  const rows = y1 - y0;
  if (cols < 3 || rows < 3 || lumas.length < 9) return 0;
  const vals = [];
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      const c = lumas[y * cols + x];
      const lap =
        lumas[(y - 1) * cols + x] + lumas[(y + 1) * cols + x] +
        lumas[y * cols + x - 1] + lumas[y * cols + x + 1] - 4 * c;
      vals.push(lap);
    }
  }
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  return vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / vals.length;
}

export function scoreFace(img, box) {
  const { d, w, x0, y0, x1, y1 } = facePixels(img, box);
  let skin = 0;
  let lumaSum = 0;
  let n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      skin += skinScoreAt(d[i], d[i + 1], d[i + 2]);
      lumaSum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      n++;
    }
  }
  if (!n) return { score: 0, signals: {} };
  const skinFraction = skin / n;
  const meanLuma = lumaSum / n;
  const lapVar = laplacianVariance(d, w, x0, y0, x1, y1);
  const areaFrac = box.w * box.h;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const dist = Math.hypot(cx - 0.5, (cy - 0.42) * 1.2);

  // Each signal is 0..1; weights sum to 1.
  const signals = {
    skin: Math.min(1, skinFraction / 0.55),
    sharp: Math.min(1, lapVar / 1400),
    exposure: Math.max(0, 1 - Math.abs(meanLuma - 118) / 118),
    size: areaFrac < 0.02 ? areaFrac / 0.02 : areaFrac > 0.55 ? Math.max(0, 1 - (areaFrac - 0.55) / 0.3) : 1,
    center: Math.max(0, 1 - dist / 0.55),
  };
  const score =
    signals.skin * 0.25 +
    signals.sharp * 0.25 +
    signals.exposure * 0.2 +
    signals.size * 0.15 +
    signals.center * 0.15;
  return { score: Math.round(score * 1000) / 1000, signals, lapVar: Math.round(lapVar) };
}
