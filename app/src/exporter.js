// exporter.js — export the poster as a PNG in the three post sizes, one at a
// time or all three at once. The PNG is the app's own drawing at full size.
import { renderPoster } from './render.js';
import { sizeById } from './presets.js';

function download(canvas, filename) {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename;
  a.click();
}

export function exportPNG(state, sizeId) {
  const size = sizeById(sizeId);
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderPoster(canvas, state, { showOverlay: false });
  download(canvas, `vice-heat-${size.id}.png`);
  return canvas;
}

export function exportAll(state) {
  for (const s of ['1920x1080', '1080x1350', '1080x1080']) {
    exportPNG(state, s);
  }
}
