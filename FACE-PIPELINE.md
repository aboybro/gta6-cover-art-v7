# Face Pipeline — how it works, honestly

Vice Heat's face pipeline is five small modules that run in the browser on the
photo's own pixels. No model, no network, no guessing: every number the Face
Lab shows is computed from the image in front of it.

## 1. Detection — `face-detect.js`

Each photo is downsampled to a 96-column grid. Every cell gets a skin score
from YCbCr: skin lives in a window around Cb 77–127 and Cr 133–173, with a
soft rim so edges do not shatter. A 3×3 smoothing pass joins the skin into
blobs, connected components are flood-filled, and blobs are kept only when
they are big enough (≥1.2% of the grid), small enough (≤60%), and shaped like
a face (aspect 0.45–2.2). The box is padded 12% sideways and 18% vertically
so it holds the whole head, not just the skin. Result: one or more normalized
face boxes per photo, largest first.

Limitation, stated plainly: skin-colour detection is a heuristic. It is
weakest on very dark or very bright skin in flat light, on faces in profile,
and on skin-coloured objects (wood, sand, warm walls). That is why every
sample also carries a hand-measured fallback anchor: when detection finds
nothing, the poster still crops on the face. The fallback is a safety net,
not the pipeline — the Face Lab labels each anchor `measured` or `fallback`.

## 2. Scoring — `face-score.js`

Each detected face is scored 0–1 from five signals, all measured:

| Signal | What is measured | Ideal |
| --- | --- | --- |
| skin | fraction of skin-score pixels inside the box | ≥ 0.55 |
| sharp | Laplacian variance of the face luma (0–255 scale) | ≥ 1400 |
| exposure | face-region mean luma vs 118 | close to 118 |
| size | face-box area fraction | 0.02–0.55 |
| center | distance of the face centre from the photo centre | near centre |

Weights: skin 0.25, sharp 0.25, exposure 0.20, size 0.15, center 0.15. The
sharpness divisor (1400) was calibrated from real data: sharp portraits
measure 1800–4500, soft scenes 36–420. The raw Laplacian variance is shown
in the Face Lab breakdown so the calibration can be checked.

## 3. Anchoring — `face-anchor.js`

The measured box is stored as the photo's anchor on a 96-column grid.
`anchorCrop` turns it into a cover-fit crop for any panel: the crop rectangle
is centred on the anchor's centre, then clamped inside the photo, with the
user's zoom and nudge applied. `panelFaceBox` maps the anchor back through
the same crop so the overlay box sits exactly on the face in the panel.

## 4. Grading — `face-grade.js`

Two face-aware steps run before the colour grade:

- **Face-weighted exposure.** The face region's mean luma is measured and
  the level stretch is gained so the face lands near luma 128. The gain is
  clamped to 0.7–1.6: a face in shadow is lifted, a blown-out face is pulled
  back, but never into a posterised mess.
- **Face-box unsharp mask.** A 3×3 blur is subtracted inside the face box
  only, feathered at the rim, amount 0.55. Eyes and hair stay crisp while
  the background keeps the grade's soft bloom.

## 5. Ranking — `face-rank.js`

Photos are sorted by measured score. The best face takes the hero panel, the
rest follow in order, and when there are more photos than slots the weakest
is left out and named in the Face Lab. Uploads go through the same
detection + scoring, so a user's own photo competes for the hero slot on its
own merits.

## What the pipeline does not do

It does not recognise who anyone is, it does not store anything, and it does
not upload a pixel. Everything runs on the visitor's machine, on photos the
visitor chose. The scores are a crop-and-grade aid, not a judgement of the
people in the photos.
