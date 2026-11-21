// main.js — wire the editor: state, controls, live preview, mini previews,
// Face Lab, undo/redo, drop/paste, export. The poster always opens finished:
// best face in the hero, the rest ranked behind it.
import { SAMPLES } from './samples.js';
import { TITLE_PRESETS, SIZES, TITLE_FONTS, SCRIPT_FONTS, sizeById, EDITION_TAG, RELEASE_LINE, BILLING_LINE } from './presets.js';
import { GRADES } from './grades.js';
import { LAYOUTS, layoutPanels } from './layouts.js';
import { measureAll, measureUpload } from './photos.js';
import { rankCast, assignPanels } from './face-rank.js';
import { renderPoster } from './render.js';
import { exportPNG, exportAll } from './exporter.js';
import { shotFromQuery, renderShot } from './shots.js';

const $ = (id) => document.getElementById(id);

const state = {
  layoutId: 'mosaic',
  gradeId: 'sunset-gold',
  sizeId: '1920x1080',
  title: TITLE_PRESETS[0].title,
  subtitle: TITLE_PRESETS[0].subtitle,
  tagline: TITLE_PRESETS[0].tagline,
  quote: TITLE_PRESETS[0].quote,
  source: TITLE_PRESETS[0].source,
  titleFont: 'Anton',
  scriptFont: 'Pacifico',
  billing: BILLING_LINE,
  panels: [],
  showOverlay: false,
  selectedPanel: 0,
};

let photos = [];
let ranked = [];
let history = [];
let future = [];

function snapshot() {
  return JSON.stringify({
    layoutId: state.layoutId, gradeId: state.gradeId, sizeId: state.sizeId,
    title: state.title, subtitle: state.subtitle, tagline: state.tagline,
    quote: state.quote, source: state.source, titleFont: state.titleFont,
    scriptFont: state.scriptFont,
    panels: state.panels.map((p) => ({ id: p.photo ? p.photo.id : null, zoom: p.zoom, nx: p.nx, ny: p.ny, flip: !!p.flip })),
  });
}

function restore(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  state.panels = s.panels.map((p) => ({
    photo: photos.find((x) => x.id === p.id) || null,
    zoom: p.zoom, nx: p.nx, ny: p.ny, flip: p.flip,
  }));
}

function pushHistory() {
  history.push(snapshot());
  if (history.length > 40) history.shift();
  future = [];
}

function dealPanels() {
  const slots = layoutPanels(state.layoutId, 16 / 9);
  const { assigned, leftOut } = assignPanels(ranked, slots);
  state.panels = assigned.map((a) => ({
    photo: a.photo, zoom: 1, nx: 0, ny: 0, flip: false, score: a.score,
  }));
  state.leftOut = leftOut;
}

function render() {
  const stage = $('poster');
  const size = sizeById(state.sizeId);
  const scale = Math.min(1, 960 / size.w);
  stage.width = Math.round(size.w * scale);
  stage.height = Math.round(size.h * scale);
  renderPoster(stage, state, { showOverlay: state.showOverlay });
  renderMinis();
  renderFaceLab();
}

function renderMinis() {
  const minis = [['miniWide', '1920x1080'], ['miniPortrait', '1080x1350'], ['miniSquare', '1080x1080']];
  for (const [id, sizeId] of minis) {
    const c = $(id);
    if (!c) continue;
    const size = sizeById(sizeId);
    const saved = state.sizeId;
    state.sizeId = sizeId;
    c.width = c.clientWidth || 192;
    c.height = Math.round(c.width * (size.h / size.w));
    renderPoster(c, state, { showOverlay: false });
    state.sizeId = saved;
  }
}

function renderFaceLab() {
  const lab = $('faceLab');
  if (!lab) return;
  const rows = ranked.map((r, i) => {
    const s = r.photo.signals || {};
    const sig = ['skin', 'sharp', 'exposure', 'size', 'center']
      .map((k) => `${k} ${(s[k] ?? 0).toFixed(2)}`)
      .join(' · ');
    return `<div class="faceRow${i === 0 ? ' hero' : ''}"><b>${i + 1}. ${r.photo.name}</b> — ${r.score.toFixed(3)} <span class="sig">${sig}</span></div>`;
  }).join('');
  const left = (state.leftOut || []).map((l) => `${l.photo.name} (${l.score.toFixed(2)})`).join(', ');
  lab.innerHTML = `<h3>Face Lab — measured, not guessed</h3>${rows}${left ? `<p class="hint">Left out this round: ${left}</p>` : ''}<p class="hint">Anchor: 96-column saliency grid. Scores recompute when you upload a photo.</p>`;
}

function buildControls() {
  const layoutRow = $('layoutRow');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.textContent = l.name;
    b.className = l.id === state.layoutId ? 'on' : '';
    b.onclick = () => {
      pushHistory();
      state.layoutId = l.id;
      dealPanels();
      buildControls();
      render();
    };
    layoutRow.appendChild(b);
  });
  const gradeRow = $('gradeRow');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.textContent = g.name;
    b.className = g.id === state.gradeId ? 'on' : '';
    b.onclick = () => {
      pushHistory();
      state.gradeId = g.id;
      buildControls();
      render();
    };
    gradeRow.appendChild(b);
  });
  const sizeRow = $('sizeRow');
  SIZES.forEach((s) => {
    const b = document.createElement('button');
    b.textContent = s.label;
    b.className = s.id === state.sizeId ? 'on' : '';
    b.onclick = () => {
      state.sizeId = s.id;
      buildControls();
      render();
    };
    sizeRow.appendChild(b);
  });
  const preset = $('presetSelect');
  preset.innerHTML = '';
  TITLE_PRESETS.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = `${p.title} — ${p.subtitle}`;
    preset.appendChild(o);
  });
  const titleFonts = $('titleFontSelect');
  titleFonts.innerHTML = '';
  TITLE_FONTS.forEach((f) => {
    const o = document.createElement('option');
    o.value = f.id;
    o.textContent = f.label;
    titleFonts.appendChild(o);
  });
  const scriptFonts = $('scriptFontSelect');
  scriptFonts.innerHTML = '';
  SCRIPT_FONTS.forEach((f) => {
    const o = document.createElement('option');
    o.value = f.id;
    o.textContent = f.label;
    scriptFonts.appendChild(o);
  });
  const strip = $('sampleStrip');
  strip.innerHTML = '';
  photos.forEach((p) => {
    const d = document.createElement('button');
    d.className = 'sample';
    d.innerHTML = `<img src="${p.src}" alt="${p.name}"><span>${p.name} ${(p.faceScore ?? 0).toFixed(2)}</span>`;
    d.onclick = () => {
      pushHistory();
      const slot = state.panels[state.selectedPanel];
      if (slot) {
        slot.photo = p;
        render();
      }
    };
    strip.appendChild(d);
  });
}

function wire() {
  $('presetSelect').onchange = (e) => {
    pushHistory();
    const p = TITLE_PRESETS[Number(e.target.value)];
    Object.assign(state, { title: p.title, subtitle: p.subtitle, tagline: p.tagline, quote: p.quote, source: p.source });
    $('titleInput').value = p.title;
    $('subtitleInput').value = p.subtitle;
    $('taglineInput').value = p.tagline;
    $('quoteInput').value = p.quote;
    render();
  };
  $('titleInput').oninput = (e) => { state.title = e.target.value.toUpperCase(); render(); };
  $('subtitleInput').oninput = (e) => { state.subtitle = e.target.value; render(); };
  $('taglineInput').oninput = (e) => { state.tagline = e.target.value.toUpperCase(); render(); };
  $('quoteInput').oninput = (e) => { state.quote = e.target.value; render(); };
  $('titleFontSelect').onchange = (e) => { state.titleFont = e.target.value; render(); };
  $('scriptFontSelect').onchange = (e) => { state.scriptFont = e.target.value; render(); };
  $('flipBtn').onclick = () => {
    pushHistory();
    const s = state.panels[state.selectedPanel];
    if (s) s.flip = !s.flip;
    render();
  };
  $('prevPhotoBtn').onclick = () => stepPhoto(-1);
  $('nextPhotoBtn').onclick = () => stepPhoto(1);
  $('resetBtn').onclick = () => {
    pushHistory();
    dealPanels();
    render();
  };
  $('autofillBtn').onclick = () => {
    pushHistory();
    dealPanels();
    render();
  };
  $('zoomRange').oninput = (e) => {
    const s = state.panels[state.selectedPanel];
    if (s) { s.zoom = Number(e.target.value); render(); }
  };
  $('nudgeX').oninput = (e) => {
    const s = state.panels[state.selectedPanel];
    if (s) { s.nx = Number(e.target.value); render(); }
  };
  $('nudgeY').oninput = (e) => {
    const s = state.panels[state.selectedPanel];
    if (s) { s.ny = Number(e.target.value); render(); }
  };
  $('autoBtn').onclick = () => {
    pushHistory();
    dealPanels();
    const g = GRADES[Math.floor(Math.random() * GRADES.length)];
    state.gradeId = g.id;
    buildControls();
    render();
  };
  $('undoBtn').onclick = () => {
    if (!history.length) return;
    future.push(snapshot());
    restore(history.pop());
    buildControls();
    render();
  };
  $('redoBtn').onclick = () => {
    if (!future.length) return;
    history.push(snapshot());
    restore(future.pop());
    buildControls();
    render();
  };
  $('exportBtn').onclick = () => exportPNG(state, state.sizeId);
  $('exportAllBtn').onclick = () => exportAll(state);
  $('overlayToggle').onchange = (e) => {
    state.showOverlay = e.target.checked;
    render();
  };
  $('upload').onchange = async (e) => {
    for (const file of e.target.files) {
      const up = await measureUpload(file, file.name.replace(/\.[^.]+$/, ''));
      photos.push(up);
      ranked = rankCast(photos);
      dealPanels();
      buildControls();
      render();
    }
  };
  const poster = $('poster');
  poster.onclick = (e) => {
    const rect = poster.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const panels = layoutPanels(state.layoutId, poster.width / poster.height);
    const idx = panels.findIndex((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
    if (idx >= 0) {
      state.selectedPanel = idx;
      const s = state.panels[idx];
      $('panelLabel').textContent = s && s.photo
        ? `Panel ${idx + 1}: ${s.photo.name} (${(s.photo.faceScore ?? 0).toFixed(2)}) — pick a photo below`
        : `Panel ${idx + 1} is empty`;
      render();
    }
  };
  document.addEventListener('paste', async (e) => {
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith('image/')) {
        const up = await measureUpload(item.getAsFile(), 'Pasted');
        photos.push(up);
        ranked = rankCast(photos);
        dealPanels();
        buildControls();
        render();
      }
    }
  });
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', async (e) => {
    e.preventDefault();
    for (const file of e.dataTransfer.files) {
      if (!file.type.startsWith('image/')) continue;
      const up = await measureUpload(file, file.name.replace(/\.[^.]+$/, ''));
      photos.push(up);
      ranked = rankCast(photos);
      dealPanels();
      buildControls();
      render();
    }
  });
}

function stepPhoto(dir) {
  pushHistory();
  const slot = state.panels[state.selectedPanel];
  if (!slot || !slot.photo) return;
  const idx = photos.indexOf(slot.photo);
  const next = photos[(idx + dir + photos.length) % photos.length];
  slot.photo = next;
  render();
}

async function init() {
  $('status').textContent = 'Measuring faces…';
  photos = await measureAll(SAMPLES);
  ranked = rankCast(photos);
  dealPanels();
  buildControls();
  wire();
  const shot = shotFromQuery();
  if (shot.shot === 'editor') {
    // Editor shot: the full UI stays visible — this is the shot that proves
    // the app works in a browser. Overlay on so the Face Lab shows.
    state.showOverlay = true;
    $('overlayToggle').checked = true;
    await document.fonts.ready;
    render();
    document.title = 'shot-ready';
    $('status').textContent = 'Shot ready';
    return;
  }
  if (shot.shot) {
    // Poster-only shots: pick the layout/grade, re-deal the panels for the
    // new layout (a layout change with stale panels drops panels), hide the
    // UI, render full-bleed.
    if (shot.shot === 'portrait') {
      state.layoutId = 'mosaic';
      state.gradeId = 'neon-night';
      state.sizeId = '1080x1350';
    } else if (shot.shot === 'square') {
      state.layoutId = 'grid';
      state.gradeId = 'heat-wave';
      state.sizeId = '1080x1080';
    } else {
      state.layoutId = 'mosaic';
      state.gradeId = 'sunset-gold';
      state.sizeId = '1920x1080';
    }
    dealPanels();
    document.body.classList.add('shot');
    await document.fonts.ready;
    await renderShot($('poster'), state, shot);
    $('status').textContent = 'Shot ready';
    return;
  }
  await document.fonts.ready;
  render();
  $('status').textContent = `Ready — ${photos.length} photos measured, hero is ${ranked[0] ? ranked[0].photo.name : '—'} (${(ranked[0] ? ranked[0].score : 0).toFixed(2)})`;
}

init().catch((err) => {
  $('status').textContent = `Failed to start: ${err.message}`;
});
