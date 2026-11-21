// shots.js — deterministic screenshot modes. ?shot=cover|editor|portrait|square
// This module only decides the canvas size and renders; the shot's layout
// and grade are set by main.js (which also re-deals the panels for the new
// layout — a layout change with stale panels drops panels).
import { renderPoster } from './render.js';

export function shotFromQuery() {
  const q = new URLSearchParams(location.search);
  return {
    shot: q.get('shot') || null,
    w: Number(q.get('w')) || 1280,
    h: Number(q.get('h')) || 720,
  };
}

// Canvas size for each shot. The cover renders at 1280x720 (the gate's long
// side cap); portrait and square at their post sizes, capped the same way.
export function shotSize(shot) {
  if (shot.shot === 'portrait') return { w: 1024, h: 1280 };
  if (shot.shot === 'square') return { w: 1080, h: 1080 };
  return { w: shot.w, h: shot.h };
}

export async function renderShot(canvas, state, shot) {
  const size = shotSize(shot);
  canvas.width = size.w;
  canvas.height = size.h;
  await document.fonts.ready;
  renderPoster(canvas, state, { showOverlay: !!state.showOverlay });
  document.title = 'shot-ready';
}
