// Vice Heat v7 — the hand-in program (Node 22, standard library only).
// It copies this repo's app/ and screenshots/ into the output directory and
// writes /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. The app itself is plain static files: app/index.html and
// its ES modules, no library, no network request.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer refuses an entry with no screenshots or more than four, so
// check early and fail loudly instead of handing in a broken dossier.
const shotDir = join(here, 'screenshots');
const shots = existsSync(shotDir)
  ? readdirSync(shotDir).filter((f) => !f.startsWith('.'))
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
}

mkdirSync(out, { recursive: true });
if (!existsSync(join(here, 'app', 'index.html'))) {
  throw new Error('app/index.html is missing — the app cannot be served');
}
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotDir, join(out, 'screenshots'), { recursive: true });

// Caps from the scorer's own reference: the dossier text is capped at
// 160 KiB, screenshots at 4 files of 256 KiB, app/ at 993 files and 48 MiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`handed in ${shots.length} screenshot(s) into ${out}: ${shots.join(', ')}`);
