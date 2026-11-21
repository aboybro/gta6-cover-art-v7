// samples.js — the cast. Anchors are the face boxes I measured from each
// photo (normalized coords); face-detect.js refines them at load, and the
// anchor is only the fallback when detection finds nothing.
export const SAMPLES = [
  { id: 'lucia', src: 'samples/lucia.jpg', name: 'Lucia', role: 'The Courier', face: { x: 0.29, y: 0.1, w: 0.42, h: 0.34 } },
  { id: 'dante', src: 'samples/dante.jpg', name: 'Dante', role: 'The Rider', face: { x: 0.29, y: 0.05, w: 0.44, h: 0.42 } },
  { id: 'victor', src: 'samples/victor.jpg', name: 'Victor', role: 'The Boss', face: { x: 0.3, y: 0.1, w: 0.4, h: 0.38 } },
  { id: 'marcus', src: 'samples/marcus.jpg', name: 'Marcus', role: 'The Fixer', face: { x: 0.31, y: 0.08, w: 0.38, h: 0.38 } },
  { id: 'rosa', src: 'samples/rosa.jpg', name: 'Rosa', role: 'The Lookout', face: { x: 0.32, y: 0.08, w: 0.4, h: 0.36 } },
  { id: 'carmen', src: 'samples/carmen.jpg', name: 'Carmen', role: 'Boulevard Queen', face: { x: 0.3, y: 0.1, w: 0.4, h: 0.36 } },
  { id: 'sal', src: 'samples/sal.jpg', name: 'Sal', role: 'The Angler', face: { x: 0.31, y: 0.08, w: 0.38, h: 0.38 } },
  { id: 'nadia', src: 'samples/nadia.jpg', name: 'Nadia', role: 'The Mechanic', face: { x: 0.3, y: 0.1, w: 0.4, h: 0.36 } },
  { id: 'ana', src: 'samples/ana.jpg', name: 'Ana', role: 'The Driver', face: { x: 0.31, y: 0.08, w: 0.38, h: 0.36 } },
  { id: 'boulevard', src: 'samples/boulevard.jpg', name: 'Paloma', role: 'The Wheelwoman', face: { x: 0.45, y: 0.12, w: 0.35, h: 0.3 } },
  { id: 'pier', src: 'samples/pier.jpg', name: 'Eddie', role: 'The Fisherman', face: { x: 0.3, y: 0.08, w: 0.32, h: 0.3 } },
];

export function sampleById(id) {
  return SAMPLES.find((s) => s.id === id) ?? SAMPLES[0];
}
