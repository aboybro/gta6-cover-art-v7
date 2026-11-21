[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/aboybro/gta6-cover-art-v7/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/aboybro/gta6-cover-art-v7/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Heat — your photos become framed crime-epic key art

A web app that turns your photos into GTA 6-style cover art — a measured face pipeline, hero close-up, face-aware crops, 8 pixel grades, PNG in 3 sizes. Offline, in a desktop browser; photos never leave your machine.

## What it does

- **People first**: the default poster opens on real people — nine photorealistic character portraits plus the make.fun kit's two photos, auto-filled by measured face quality so the best face becomes the big hero close-up. Your own photos get the same treatment: upload one and it is detected, scored and ranked, so a stranger's best photo can take the hero slot too.
- **A face pipeline that is measured, not claimed** (see FACE-PIPELINE.md): `face-detect.js` finds faces with YCbCr skin-likelihood saliency on a 96-column grid; `face-score.js` scores each face 0–1 from five signals computed on the photo's own pixels (skin fraction, Laplacian sharpness, face-region exposure, face size, centrality); `face-anchor.js` maps the measured box through every panel crop; `face-grade.js` stretches exposure around the face's own luma and sharpens the face box only; `face-rank.js` deals the best face to the hero and leaves the weakest out. The editor's Face Lab shows every ranking, every signal, and a face-box overlay with the measured scores drawn on the poster.
- **3 layouts**: Cast Mosaic (default), Diagonal Strips and Six Grid — multi-panel poster arrangements for every post size. In Six Grid the title lives in its own band below the panels, so lettering never crosses a face.
- **8 named grades, a real pixel pipeline**: Sunset Gold, Neon Night, Retro Print, Tropic Teal, Ultraviolet, Heat Wave, Palm Noir and Vice Chrome. Each grade runs per panel in JavaScript on the pixels themselves — auto-exposure (percentile levels stretch), face-weighted gamma, tone curve, S-curve contrast, saturation, split toning, face-area sharpening, bloom, vignette, film grain and light leaks. Halftone dots appear only in Retro Print, and subtly. Skin tones keep their warm hue: saturation and split toning soften on skin pixels.
- **Poster furniture**: a review top bar (stars, quote, source, edition tag), striped chrome title lettering with a neon glow (Anton or Bebas Neue), script subtitle (Pacifico or Sacramento), a tagline ribbon, per-panel name tags that never sit under the title, subtitle, ribbon or seal, a Leonida seal with ring text, sparkles, a lens flare, a release line, a billing block and a barcode.
- **Fast and easy**: the app opens on a finished poster, with three live mini-previews (16:9, 4:5, 1:1) beside it. Click a panel to select it, then flip it, step its photo, zoom and nudge it, or auto-fill the whole poster by face quality. Drop or paste a photo anywhere on the page. One click exports a PNG in 1080×1080, 1080×1350 or 1920×1080; "Export all 3 sizes" does all three at once. Undo/redo and an Auto Poster button are built in.

## Face pipeline at a glance

| Module | What it does | How you can see it |
| --- | --- | --- |
| `face-detect.js` | Skin-likelihood saliency, 3×3 smoothing, connected components, face-box fitting | Face Lab overlay: green boxes on the poster |
| `face-score.js` | 0–1 score from skin, sharpness, exposure, size, centrality | Face Lab: score + 5 signals per photo |
| `face-anchor.js` | 96-column anchor grid, maps the face through panel crops | Crops stay on the face at any panel size |
| `face-grade.js` | Face-weighted exposure (gain 0.7–1.6), face-box unsharp mask | Faces stay bright and sharp in every grade |
| `face-rank.js` | Best face → hero, rest by quality, weakest left out | Face Lab ranking + "left out" note |

## Try it

```sh
node serve.ts
```

Then open http://localhost:8080, pick a layout and a grade, type your title, click a panel to re-crop it, and export.

## Determinism

The render is seeded (mulberry32, fixed seed 20261121): grain, sparkles and barcode bars render identically on every run. Two runs of `main.ts` produce byte-identical output.

## Credits

- Fonts: Anton, Bebas Neue, Pacifico and Sacramento, SIL Open Font License (see `app/fonts/OFL-*.txt`).
- Sample photos: Unsplash (free to use, Unsplash License) and the make.fun kit's own photos.
- Original art and lettering. No Rockstar Games logo, artwork or font.
