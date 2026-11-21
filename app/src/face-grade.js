// face-grade.js — grade the pixels around the face, not just the whole frame.
// Face-weighted exposure stretches the levels so the face's mean luma lands
// near the grade's target, and an unsharp mask sharpens the face box only.
function meanLumaInBox(data, w, h, box) {
  const x0 = Math.max(0, Math.floor(box.x * w));
  const y0 = Math.max(0, Math.floor(box.y * h));
  const x1 = Math.min(w, Math.ceil((box.x + box.w) * w));
  const y1 = Math.min(h, Math.ceil((box.y + box.h) * h));
  let sum = 0;
  let n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      n++;
    }
  }
  return n ? sum / n : 128;
}

export function faceExposureGain(data, w, h, faceBox, target = 128) {
  if (!faceBox) return 1;
  const mean = meanLumaInBox(data, w, h, faceBox);
  if (mean < 8) return 1;
  const gain = target / mean;
  return Math.max(0.7, Math.min(1.6, gain));
}

// Unsharp mask limited to the face box, feathered at its rim so no hard edge
// shows. data is a Uint8ClampedArray of RGBA pixels, w/h its size.
export function sharpenFaceBox(data, w, h, faceBox, amount = 0.55) {
  if (!faceBox) return;
  const x0 = Math.max(1, Math.floor(faceBox.x * w));
  const y0 = Math.max(1, Math.floor(faceBox.y * h));
  const x1 = Math.min(w - 1, Math.ceil((faceBox.x + faceBox.w) * w));
  const y1 = Math.min(h - 1, Math.ceil((faceBox.y + faceBox.h) * h));
  const src = new Uint8ClampedArray(data);
  const feather = 0.12;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const fx = Math.min(
        1,
        Math.min((x - x0) / (w * feather + 1), (x1 - x) / (w * feather + 1),
          (y - y0) / (h * feather + 1), (y1 - y) / (h * feather + 1)) * 2,
      );
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const blur =
          (src[i - 4 + c] + src[i + 4 + c] + src[i - w * 4 + c] + src[i + w * 4 + c]) / 4;
        data[i + c] = src[i + c] + (src[i + c] - blur) * amount * fx;
      }
    }
  }
}
