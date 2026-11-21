// layouts.js — three poster layouts, each with per-size geometry in normalized
// coords. The title and ribbon live in their own band BELOW the panels in
// Six Grid, so lettering never crosses a face (that was v6's square-shot bug).
export const LAYOUTS = [
  { id: 'mosaic', name: 'Cast Mosaic' },
  { id: 'strips', name: 'Diagonal Strips' },
  { id: 'grid', name: 'Six Grid' },
];

const GAP = 0.008;

// Panels are {x, y, w, h, hero} in normalized coords of the poster area
// (the area below the top bar). Furniture zones are separate.
export function layoutPanels(id, aspect) {
  if (id === 'strips') {
    return [
      { x: 0, y: 0, w: 1, h: 0.36, hero: true, slant: 0.06 },
      { x: 0, y: 0.36 + GAP, w: 0.5 - GAP / 2, h: 0.32 - GAP, hero: false, slant: -0.04 },
      { x: 0.5 + GAP / 2, y: 0.36 + GAP, w: 0.5 - GAP / 2, h: 0.32 - GAP, hero: false, slant: 0.04 },
      { x: 0, y: 0.68 + GAP, w: 0.34 - GAP / 2, h: 0.32 - GAP, hero: false, slant: 0 },
      { x: 0.34 + GAP / 2, y: 0.68 + GAP, w: 0.33 - GAP / 2, h: 0.32 - GAP, hero: false, slant: 0 },
      { x: 0.67 + GAP / 2, y: 0.68 + GAP, w: 0.33 - GAP / 2, h: 0.32 - GAP, hero: false, slant: 0 },
    ];
  }
  if (id === 'grid') {
    const rows = 3;
    const cols = 2;
    const panels = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        panels.push({
          x: c * (1 / cols) + (c ? GAP / 2 : 0),
          y: r * (1 / rows) + (r ? GAP / 2 : 0),
          w: 1 / cols - (c ? GAP / 2 : GAP / 2),
          h: 1 / rows - (r ? GAP / 2 : GAP / 2),
          hero: r === 0 && c === 0,
          slant: 0,
        });
      }
    }
    return panels;
  }
  // Cast Mosaic (default): big hero on the left, three strips on the right.
  const heroW = aspect >= 1.4 ? 0.56 : 0.52;
  return [
    { x: 0, y: 0, w: heroW, h: 1, hero: true, slant: 0 },
    { x: heroW + GAP, y: 0, w: 1 - heroW - GAP, h: 0.32, hero: false, slant: 0 },
    { x: heroW + GAP, y: 0.32 + GAP, w: 1 - heroW - GAP, h: 0.32, hero: false, slant: 0 },
    { x: heroW + GAP, y: 0.64 + GAP * 2, w: 1 - heroW - GAP, h: 0.36 - GAP * 2, hero: false, slant: 0 },
  ];
}

// Where the furniture goes, as fractions of the full poster (W x H).
// topBar: the review strip. titleBand: title + script + ribbon zone.
export function furnitureZones(layoutId, W, H) {
  const topBarH = Math.round(H * 0.052);
  if (layoutId === 'grid') {
    // Grid keeps its own bottom band for the title — lettering stays clear.
    return {
      topBar: { x: 0, y: 0, w: W, h: topBarH },
      poster: { x: 0, y: topBarH, w: W, h: Math.round(H * 0.74) },
      titleBand: { x: 0, y: topBarH + Math.round(H * 0.74), w: W, h: H - topBarH - Math.round(H * 0.74) },
      bottom: { x: 0, y: H - Math.round(H * 0.045), w: W, h: Math.round(H * 0.045) },
    };
  }
  return {
    topBar: { x: 0, y: 0, w: W, h: topBarH },
    poster: { x: 0, y: topBarH, w: W, h: H - topBarH },
    titleBand: null,
    bottom: { x: 0, y: H - Math.round(H * 0.045), w: W, h: Math.round(H * 0.045) },
  };
}
