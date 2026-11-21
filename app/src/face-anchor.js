// face-anchor.js — where is the face, precisely, in this photo?
// Detection runs on a fine 96-column grid at load; the anchor is the measured
// box, and the hand-set fallback only covers photos detection misses.
import { detectFaces } from './face-detect.js';

export const GRID_COLS = 96;

export function measureAnchor(img, fallback) {
  try {
    const found = detectFaces(img, GRID_COLS);
    if (found.length) {
      const b = found[0];
      return { ...b, source: 'measured', faces: found.length };
    }
  } catch {
    // Detection never breaks the poster: fall through to the fallback.
  }
  return { ...fallback, source: 'fallback', faces: 0 };
}

// Map a face anchor (normalized photo coords) through a panel crop to the
// panel's own normalized coords, for the overlay. crop = {sx, sy, sw, sh}
// in photo-normalized coords, panelW/panelH the panel's pixel size.
export function panelFaceBox(anchor, crop) {
  const x = (anchor.x - crop.sx) / crop.sw;
  const y = (anchor.y - crop.sy) / crop.sh;
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
    w: Math.max(0, Math.min(1 - Math.max(0, x), anchor.w / crop.sw)),
    h: Math.max(0, Math.min(1 - Math.max(0, y), anchor.h / crop.sh)),
  };
}

// Cover-fit crop of the photo for a panel, centred on the anchor's centre,
// with user zoom/nudge applied. Returns normalized {sx, sy, sw, sh}.
export function anchorCrop(photoW, photoH, panelW, panelH, anchor, zoom = 1, nx = 0, ny = 0) {
  const photoAspect = photoW / photoH;
  const panelAspect = panelW / panelH;
  let sw;
  let sh;
  if (photoAspect > panelAspect) {
    sh = 1;
    sw = panelAspect / photoAspect;
  } else {
    sw = 1;
    sh = photoAspect / panelAspect;
  }
  sw /= zoom;
  sh /= zoom;
  const cx = anchor.x + anchor.w / 2 + nx * sw * 0.4;
  const cy = anchor.y + anchor.h / 2 + ny * sh * 0.4;
  let sx = cx - sw / 2;
  let sy = cy - sh / 2;
  sx = Math.max(0, Math.min(1 - sw, sx));
  sy = Math.max(0, Math.min(1 - sh, sy));
  return { sx, sy, sw, sh };
}
