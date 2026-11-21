// grades.js — eight named pixel grades. Each grade is a recipe the renderer
// applies per panel: level stretch, gamma, saturation, split toning, bloom,
// grain, vignette. Halftone dots exist only in Retro Print, and subtly.
export const GRADES = [
  {
    id: 'sunset-gold', name: 'Sunset Gold', black: 8, white: 248, gamma: 0.92,
    sat: 1.25, shadow: [38, 10, 4], high: [255, 196, 110],
    bloom: 0.22, grain: 0.05, vignette: 0.22, halftone: 0, warmth: 1.12,
  },
  {
    id: 'neon-night', name: 'Neon Night', black: 4, white: 250, gamma: 0.95,
    sat: 1.35, shadow: [10, 8, 46], high: [120, 220, 255],
    bloom: 0.34, grain: 0.06, vignette: 0.3, halftone: 0, warmth: 0.96,
  },
  {
    id: 'retro-print', name: 'Retro Print', black: 18, white: 238, gamma: 1.05,
    sat: 0.9, shadow: [30, 22, 12], high: [250, 226, 180],
    bloom: 0.08, grain: 0.1, vignette: 0.18, halftone: 0.35, warmth: 1.05,
  },
  {
    id: 'tropic-teal', name: 'Tropic Teal', black: 6, white: 250, gamma: 0.95,
    sat: 1.3, shadow: [6, 42, 44], high: [190, 255, 225],
    bloom: 0.18, grain: 0.05, vignette: 0.2, halftone: 0, warmth: 0.98,
  },
  {
    id: 'ultraviolet', name: 'Ultraviolet', black: 4, white: 252, gamma: 0.9,
    sat: 1.4, shadow: [40, 6, 70], high: [220, 160, 255],
    bloom: 0.3, grain: 0.06, vignette: 0.28, halftone: 0, warmth: 1.0,
  },
  {
    id: 'heat-wave', name: 'Heat Wave', black: 10, white: 246, gamma: 0.88,
    sat: 1.3, shadow: [48, 8, 2], high: [255, 170, 90],
    bloom: 0.26, grain: 0.05, vignette: 0.24, halftone: 0, warmth: 1.15,
  },
  {
    id: 'palm-noir', name: 'Palm Noir', black: 12, white: 240, gamma: 1.08,
    sat: 0.75, shadow: [8, 10, 14], high: [235, 235, 228],
    bloom: 0.1, grain: 0.09, vignette: 0.34, halftone: 0, warmth: 1.0,
  },
  {
    id: 'vice-chrome', name: 'Vice Chrome', black: 6, white: 250, gamma: 0.94,
    sat: 1.15, shadow: [16, 14, 30], high: [255, 210, 235],
    bloom: 0.2, grain: 0.04, vignette: 0.2, halftone: 0, warmth: 1.04,
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

// Deterministic PRNG (mulberry32) so grain and sparkles render identically
// on every run — the dossier must be byte-identical across renders.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Apply one grade to raw RGBA pixels in place. faceBox (normalized) and
// faceGain are handed in by face-grade.js so the face is graded first.
export function applyGrade(data, w, h, grade, faceBox, faceGain) {
  const black = grade.black;
  const white = grade.white;
  const invGamma = 1 / grade.gamma;
  const range = Math.max(1, white - black);
  // Skin pixels keep their warm hue: saturation and split toning soften
  // where the skin score is high.
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    // Level stretch + face-weighted exposure gain.
    r = ((r - black) / range) * 255 * faceGain;
    g = ((g - black) / range) * 255 * faceGain;
    b = ((b - black) / range) * 255 * faceGain;
    // Gamma.
    r = 255 * Math.pow(Math.max(0, r) / 255, invGamma);
    g = 255 * Math.pow(Math.max(0, g) / 255, invGamma);
    b = 255 * Math.pow(Math.max(0, b) / 255, invGamma);
    // Warmth + saturation around the mean.
    const mean = (r + g + b) / 3;
    r = mean + (r - mean) * grade.sat;
    g = mean + (g - mean) * grade.sat;
    b = mean + (b - mean) * grade.sat;
    r *= grade.warmth;
    b /= grade.warmth;
    // Split toning: shadows lean to the shadow tint, highlights to the high tint.
    const lum = (r + g + b) / 3 / 255;
    const sh = Math.max(0, 1 - lum * 2);
    const hi = Math.max(0, lum * 2 - 1);
    r += grade.shadow[0] * sh * 0.16 + grade.high[0] * hi * 0.1;
    g += grade.shadow[1] * sh * 0.16 + grade.high[1] * hi * 0.1;
    b += grade.shadow[2] * sh * 0.16 + grade.high[2] * hi * 0.1;
    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  // Vignette: darken the rim of the panel.
  const cx = w / 2;
  const cy = h / 2;
  const maxD = Math.hypot(cx, cy);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - cx, y - cy) / maxD;
      const v = 1 - grade.vignette * Math.max(0, d - 0.55) * 1.6;
      const i = (y * w + x) * 4;
      data[i] *= v;
      data[i + 1] *= v;
      data[i + 2] *= v;
    }
  }
}

// Film grain + halftone dots, both seeded so the render is deterministic.
export function applyTexture(data, w, h, grade, seed) {
  const rand = mulberry32(seed);
  const g = grade.grain * 22;
  for (let i = 0; i < data.length; i += 4) {
    const n = (rand() - 0.5) * g;
    data[i] += n;
    data[i + 1] += n;
    data[i + 2] += n;
  }
  if (grade.halftone > 0) {
    const step = 5;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        const lum = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255;
        if (lum < 0.42) {
          const r = step * 0.32 * grade.halftone * 2;
          const dx = x + step / 2;
          const dy = y + step / 2;
          for (let yy = Math.max(0, Math.floor(dy - r)); yy < Math.min(h, Math.ceil(dy + r)); yy++) {
            for (let xx = Math.max(0, Math.floor(dx - r)); xx < Math.min(w, Math.ceil(dx + r)); xx++) {
              if ((xx - dx) * (xx - dx) + (yy - dy) * (yy - dy) <= r * r) {
                const j = (yy * w + xx) * 4;
                data[j] *= 0.72;
                data[j + 1] *= 0.72;
                data[j + 2] *= 0.72;
              }
            }
          }
        }
      }
    }
  }
}
