// face-rank.js — rank the cast by measured face quality and deal them to the
// poster's panels: the best face takes the hero, the rest follow in order,
// the weakest is left out when there are more photos than slots.
export function rankCast(photos) {
  const scored = photos
    .map((p) => ({ photo: p, score: typeof p.faceScore === 'number' ? p.faceScore : 0 }))
    .sort((a, b) => b.score - a.score);
  return scored;
}

// Assign ranked photos to panel slots (slots[0] is the hero). Returns
// [{slot, photo, score, leftOut}] — leftOut lists the photos with no slot.
export function assignPanels(ranked, slots) {
  const assigned = slots.map((slot, i) => ({
    slot,
    photo: ranked[i] ? ranked[i].photo : null,
    score: ranked[i] ? ranked[i].score : 0,
  }));
  const leftOut = ranked.slice(slots.length).map((r) => ({ photo: r.photo, score: r.score }));
  return { assigned, leftOut };
}

// The hero is the top-ranked photo; its face must clear a quality floor,
// otherwise the poster falls back to the largest face found.
export function pickHero(ranked) {
  if (!ranked.length) return null;
  return ranked[0];
}
