// Tiny in-browser "vision": colors from regions of a photo.
// A production app would use a segmentation / face-landmark model instead.
import { nearestColor, rgbToHsl } from './colors.js';

function pixels(img, { x, y, w, h }, size = 48) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const W = img.naturalWidth, H = img.naturalHeight;
  ctx.drawImage(img, x * W, y * H, w * W, h * H, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size).data;
}

/** Most common palette color in a region; near-white pixels (likely background) count less. */
export function dominantColor(img, rect = { x: 0.2, y: 0.2, w: 0.6, h: 0.6 }) {
  const data = pixels(img, rect);
  const votes = {};
  for (let i = 0; i < data.length; i += 4) {
    const rgb = [data[i], data[i + 1], data[i + 2]];
    const [, s, l] = rgbToHsl(rgb);
    const name = nearestColor(rgb);
    votes[name] = (votes[name] || 0) + (l > 0.93 && s < 0.15 ? 0.15 : 1);
  }
  return Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
}

/** Average skin-like color in the middle of a selfie (cheeks / nose area). */
export function skinColor(img) {
  const data = pixels(img, { x: 0.35, y: 0.4, w: 0.3, h: 0.25 });
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [R, G, B] = [data[i], data[i + 1], data[i + 2]];
    if (R > G && G > B && R - B > 15) { r += R; g += G; b += B; n++; }
  }
  if (n < 20) return null;
  return [r / n, g / n, b / n];
}

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
