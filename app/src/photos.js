// photos.js — load images, measure their faces, rank the cast. Every sample
// gets a measured anchor and a measured quality score at load; uploads go
// through the same pipeline so a user's own photo can take the hero slot.
import { measureAnchor } from './face-anchor.js';
import { scoreFace } from './face-score.js';
import { detectFaces } from './face-detect.js';

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

// Measure one photo: anchor (measured or fallback), best face box, quality.
export async function measurePhoto(def) {
  const img = await loadImage(def.src);
  const anchor = measureAnchor(img, def.face);
  let faceScore = 0;
  let signals = {};
  let lapVar = 0;
  try {
    const boxes = detectFaces(img, 96);
    const box = boxes.length ? boxes[0] : anchor;
    const scored = scoreFace(img, box);
    faceScore = scored.score;
    signals = scored.signals;
    lapVar = scored.lapVar;
  } catch {
    faceScore = 0;
  }
  return {
    ...def,
    img,
    anchor,
    faceScore,
    signals,
    lapVar,
    w: img.naturalWidth,
    h: img.naturalHeight,
  };
}

export async function measureAll(defs) {
  const out = [];
  for (const d of defs) {
    try {
      out.push(await measurePhoto(d));
    } catch {
      // A photo that fails to load is left out, never breaks the poster.
    }
  }
  return out;
}

// A user upload becomes a photo through the same measurement: detect its
// face, score it, and let it compete for the hero slot.
export async function measureUpload(file, name) {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  const fallback = { x: 0.3, y: 0.08, w: 0.4, h: 0.38 };
  const anchor = measureAnchor(img, fallback);
  let faceScore = 0;
  try {
    const boxes = detectFaces(img, 96);
    faceScore = scoreFace(img, boxes.length ? boxes[0] : anchor).score;
  } catch {
    faceScore = 0;
  }
  return {
    id: `upload-${Date.now()}`,
    src: url,
    name: name || 'You',
    role: 'The Lead',
    img,
    anchor,
    faceScore,
    w: img.naturalWidth,
    h: img.naturalHeight,
    uploaded: true,
  };
}
