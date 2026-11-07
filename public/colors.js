// Palette used by the catalog and the photo color detector.
// neutral: goes with almost anything.
export const COLORS = {
  black:     { hex: '#1c1c1e', neutral: true },
  white:     { hex: '#f7f7f5', neutral: true },
  grey:      { hex: '#9a9a9e', neutral: true },
  beige:     { hex: '#d9c4a3', neutral: true },
  brown:     { hex: '#7a5134', neutral: true },
  navy:      { hex: '#1f2f56', neutral: true },
  denim:     { hex: '#4a6c9b', neutral: true },
  cream:     { hex: '#efe6d2', neutral: true },
  red:       { hex: '#c8262f' },
  burgundy:  { hex: '#6d1a2a' },
  pink:      { hex: '#f2a7c3' },
  orange:    { hex: '#ec7a2e' },
  yellow:    { hex: '#f1cf3b' },
  olive:     { hex: '#6b7136' },
  green:     { hex: '#2f8a55' },
  sage:      { hex: '#a9b89a' },
  teal:      { hex: '#1f8a8a' },
  blue:      { hex: '#2f6fd6' },
  lilac:     { hex: '#b9a2d8' },
  purple:    { hex: '#6a3d9a' },
};

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hueOf(name) {
  return rgbToHsl(hexToRgb(COLORS[name].hex))[0];
}

// Map any RGB value to the closest palette color name.
export function nearestColor(rgb) {
  let best = null, bestD = Infinity;
  for (const [name, c] of Object.entries(COLORS)) {
    const [r, g, b] = hexToRgb(c.hex);
    // Weighted RGB distance (closer to human perception than plain RGB).
    const rm = (rgb[0] + r) / 2;
    const d = (2 + rm / 256) * (rgb[0] - r) ** 2 + 4 * (rgb[1] - g) ** 2 + (2 + (255 - rm) / 256) * (rgb[2] - b) ** 2;
    if (d < bestD) { bestD = d; best = name; }
  }
  return best;
}
