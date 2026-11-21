// face-detect.js — find faces in a photo with skin-likelihood saliency.
// No model, no network: YCbCr skin scoring on a small grid, 3x3 smoothing,
// connected-component regions, face-box fitting. Works on any <img> or canvas.
export function skinScoreAt(r, g, b) {
  // YCbCr skin window (classic Chai-Kung bounds, softened at the edges).
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  const inCb = cb > 77 && cb < 127;
  const inCr = cr > 133 && cr < 173;
  if (inCb && inCr) return 1;
  // Soft rim: near the window counts a little, so edges do not shatter.
  const dCb = inCb ? 0 : Math.min(Math.abs(cb - 77), Math.abs(cb - 127));
  const dCr = inCr ? 0 : Math.min(Math.abs(cr - 133), Math.abs(cr - 173));
  const d = Math.max(dCb / 18, dCr / 18);
  return d >= 1 ? 0 : 1 - d;
}

function toGrid(img, maxW) {
  const scale = Math.min(1, maxW / img.naturalWidth);
  const w = Math.max(8, Math.round(img.naturalWidth * scale));
  const h = Math.max(8, Math.round(img.naturalHeight * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  return { data: ctx.getImageData(0, 0, w, h).data, w, h };
}

function smooth(grid, w, h) {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          sum += grid[yy * w + xx];
          n++;
        }
      }
      out[y * w + x] = sum / n;
    }
  }
  return out;
}

// Connected components over the thresholded saliency grid (4-neighbour flood).
function components(mask, w, h) {
  const seen = new Uint8Array(w * h);
  const boxes = [];
  const stack = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || seen[i]) continue;
    let minX = w;
    let minY = h;
    let maxX = -1;
    let maxY = -1;
    let area = 0;
    stack.length = 0;
    stack.push(i);
    seen[i] = 1;
    while (stack.length) {
      const p = stack.pop();
      const x = p % w;
      const y = (p / w) | 0;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      const nb = [p - 1, p + 1, p - w, p + w];
      for (const q of nb) {
        if (q < 0 || q >= w * h || seen[q] || !mask[q]) continue;
        // Do not wrap across row edges.
        if ((q % w === w - 1 && p % w === 0) || (q % w === 0 && p % w === w - 1)) continue;
        seen[q] = 1;
        stack.push(q);
      }
    }
    boxes.push({ minX, minY, maxX, maxY, area });
  }
  return boxes;
}

// Detect faces. Returns normalized boxes [{x, y, w, h, area}] sorted by area,
// largest first. Empty array when nothing skin-like is found.
export function detectFaces(img, maxW = 96) {
  const { data, w, h } = toGrid(img, maxW);
  const raw = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    raw[i] = skinScoreAt(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
  }
  const sal = smooth(raw, w, h);
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = sal[i] >= 0.35 ? 1 : 0;
  const total = w * h;
  const found = components(mask, w, h)
    .filter((b) => {
      const area = b.area / total;
      const bw = (b.maxX - b.minX + 1) / w;
      const bh = (b.maxY - b.minY + 1) / h;
      const aspect = bw / Math.max(bh, 0.001);
      return area >= 0.012 && area <= 0.6 && aspect > 0.45 && aspect < 2.2;
    })
    .map((b) => {
      // Pad a little: a face box should hold the whole head, not just skin.
      const padX = 0.12;
      const padY = 0.18;
      const x0 = Math.max(0, (b.minX / w - padX * ((b.maxX - b.minX + 1) / w)));
      const y0 = Math.max(0, (b.minY / h - padY * ((b.maxY - b.minY + 1) / h)));
      const x1 = Math.min(1, ((b.maxX + 1) / w + padX * ((b.maxX - b.minX + 1) / w)));
      const y1 = Math.min(1, ((b.maxY + 1) / h + padY * ((b.maxY - b.minY + 1) / h)));
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, area: b.area / total };
    })
    .sort((a, b) => b.area - a.area);
  return found;
}
