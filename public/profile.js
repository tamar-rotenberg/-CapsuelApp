// The user's style profile, Dressly-style: color season + body shape + learned taste.
// Everything the feed, scanner and capsule builder rank by lives here.
import { COLORS } from './colors.js';
import { outfitScore } from './matcher.js';

// ---------- Color seasons (12-season color analysis) ----------
// proto: [warmth -1 cool..1 warm, depth -1 light..1 deep, chroma -1 soft..1 bright]
export const SEASONS = {
  'Light Spring':  { proto: [0.5, -1, 0.5],   best: ['cream', 'beige', 'pink', 'yellow', 'sage', 'teal', 'lilac'], avoid: ['black', 'burgundy', 'brown', 'purple'] },
  'Warm Spring':   { proto: [1, -0.3, 0.7],   best: ['cream', 'beige', 'orange', 'yellow', 'green', 'teal', 'brown'], avoid: ['black', 'grey', 'burgundy', 'lilac', 'purple'] },
  'Bright Spring': { proto: [0.4, 0, 1],      best: ['white', 'red', 'orange', 'yellow', 'teal', 'blue', 'pink', 'navy'], avoid: ['sage', 'brown', 'beige', 'olive'] },
  'Light Summer':  { proto: [-0.5, -1, -0.3], best: ['white', 'grey', 'pink', 'lilac', 'sage', 'denim', 'blue'], avoid: ['black', 'orange', 'brown', 'yellow', 'olive'] },
  'Cool Summer':   { proto: [-1, -0.3, -0.3], best: ['grey', 'navy', 'denim', 'pink', 'lilac', 'blue', 'teal', 'burgundy'], avoid: ['orange', 'yellow', 'brown', 'olive', 'beige'] },
  'Soft Summer':   { proto: [-0.4, 0, -1],    best: ['grey', 'sage', 'denim', 'lilac', 'pink', 'navy', 'burgundy'], avoid: ['black', 'orange', 'white', 'yellow', 'red'] },
  'Soft Autumn':   { proto: [0.4, 0, -1],     best: ['beige', 'cream', 'sage', 'olive', 'brown', 'teal', 'denim'], avoid: ['black', 'white', 'blue', 'lilac', 'purple'] },
  'Warm Autumn':   { proto: [1, 0.3, -0.5],   best: ['brown', 'olive', 'orange', 'beige', 'cream', 'teal', 'green', 'yellow'], avoid: ['black', 'pink', 'lilac', 'grey', 'white'] },
  'Deep Autumn':   { proto: [0.5, 1, -0.3],   best: ['brown', 'olive', 'burgundy', 'teal', 'green', 'orange', 'black', 'cream'], avoid: ['pink', 'lilac', 'grey', 'white'] },
  'Deep Winter':   { proto: [-0.5, 1, 0.3],   best: ['black', 'white', 'navy', 'burgundy', 'red', 'teal', 'purple', 'green'], avoid: ['beige', 'orange', 'sage', 'brown', 'cream'] },
  'Cool Winter':   { proto: [-1, 0.3, 0.7],   best: ['black', 'white', 'navy', 'blue', 'red', 'purple', 'pink', 'grey'], avoid: ['orange', 'beige', 'brown', 'olive', 'cream'] },
  'Bright Winter': { proto: [-0.4, 0, 1],     best: ['black', 'white', 'red', 'blue', 'purple', 'pink', 'teal', 'green'], avoid: ['beige', 'olive', 'brown', 'sage'] },
};

/** Pick the season whose prototype is closest to the answers. */
export function seasonFrom({ warmth, depth, chroma }) {
  let best = null, bestD = Infinity;
  for (const [name, s] of Object.entries(SEASONS)) {
    const d = (s.proto[0] - warmth) ** 2 + (s.proto[1] - depth) ** 2 + (s.proto[2] - chroma) ** 2;
    if (d < bestD) { bestD = d; best = name; }
  }
  return best;
}

/**
 * Rough skin reading from an average face RGB (a real app would use face landmarks).
 * Yellower skin hue → warm, pinker → cool; lightness → depth.
 */
export function skinToAnswers([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 510;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    hue = max === r ? ((g - b) / d) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
    if (hue < 0) hue += 360;
  }
  const clamp = (x) => Math.max(-1, Math.min(1, x));
  return { warmth: clamp((hue - 22) / 10), depth: clamp((0.62 - l) / 0.18) };
}

/** 1 = in your palette, ~0.1 = a color to avoid. */
export function paletteScore(color, season) {
  const s = SEASONS[season];
  if (!s) return 0.6;
  if (s.best.includes(color)) return 1;
  if (s.avoid.includes(color)) return 0.1;
  return COLORS[color].neutral ? 0.6 : 0.45;
}

// ---------- Body shape ----------
export const BODY_SHAPES = {
  hourglass: { label: 'Hourglass', tip: 'Show your waist: wrap, belted and fitted cuts.',
    good: ['wrap', 'belted', 'fitted', 'bodycon', 'pencil', 'high-waist', 'v-neck', 'bias-cut'], bad: ['oversized', 'baggy', 'chunky'] },
  pear: { label: 'Pear', tip: 'Balance hips with detail on top and flowing bottoms.',
    good: ['a-line', 'wide-leg', 'flare', 'puff-sleeve', 'cowl', 'square-neck', 'structured', 'v-neck', 'high-waist'], bad: ['pencil', 'bodycon', 'biker', 'baggy'] },
  apple: { label: 'Apple', tip: 'Elongate with V-necks, flowing and longline pieces.',
    good: ['v-neck', 'a-line', 'wrap', 'flowy', 'longline', 'straight', 'wide-leg'], bad: ['cropped', 'bodycon', 'belted', 'fitted'] },
  rectangle: { label: 'Rectangle', tip: 'Create curves with belts, wraps, volume and layers.',
    good: ['belted', 'wrap', 'puff-sleeve', 'tiered', 'a-line', 'cropped', 'flare', 'bias-cut'], bad: ['straight', 'oversized'] },
  'inverted-triangle': { label: 'Inverted triangle', tip: 'Add volume below and keep tops simple.',
    good: ['v-neck', 'wide-leg', 'a-line', 'flare', 'tiered', 'baggy', 'flowy', 'maxi'], bad: ['puff-sleeve', 'structured', 'high-neck', 'cowl', 'chunky'] },
};

/** Body shape from bust / waist / hip measurements (any unit). */
export function shapeFromMeasurements(bust, waist, hip) {
  if (hip - bust >= 0.07 * hip && hip - waist >= 0.2 * hip) return 'pear';
  if (bust - hip >= 0.05 * bust) return 'inverted-triangle';
  if (Math.abs(bust - hip) <= 0.05 * hip && Math.min(bust, hip) - waist >= 0.22 * hip) return 'hourglass';
  if (waist >= 0.9 * Math.min(bust, hip)) return 'apple';
  return 'rectangle';
}

/** 0..1 how flattering an item's cut is for a shape (null if the item has no cut info). */
export function bodyScore(item, shape) {
  const rules = BODY_SHAPES[shape];
  if (!rules || !item.cuts?.length) return null;
  let s = 0.6;
  for (const c of item.cuts) {
    if (rules.good.includes(c)) s += 0.2;
    if (rules.bad.includes(c)) s -= 0.3;
  }
  return Math.max(0, Math.min(1, s));
}

// ---------- Taste learned from swipes ----------
export function emptyTaste() { return { styles: {}, colors: {}, swipes: 0 }; }

/** Update taste weights from one like (+1) or dislike (-1) on an outfit. */
export function learn(taste, items, liked) {
  const t = structuredClone(taste);
  const delta = liked ? 1 : -1;
  for (const it of items) {
    t.colors[it.color] = (t.colors[it.color] || 0) + delta / items.length;
    for (const s of it.styles) t.styles[s] = (t.styles[s] || 0) + delta / (items.length * it.styles.length);
  }
  t.swipes++;
  return t;
}

/** 0..1 how much the learned taste likes these items (0.5 = no opinion). */
export function tasteScore(taste, items) {
  if (!taste || !taste.swipes) return 0.5;
  let raw = 0;
  for (const it of items) {
    raw += taste.colors[it.color] || 0;
    raw += it.styles.reduce((s, st) => s + (taste.styles[st] || 0), 0) / it.styles.length;
  }
  raw /= items.length;
  return 1 / (1 + Math.exp(-raw * 2.5));
}

// ---------- Personal ranking ----------
/**
 * Score a whole outfit for this user, 0..100, with reasons.
 * profile: { season, shape, styles[], budget, taste, closet[] }
 */
export function personalScore(items, profile = {}) {
  const harmony = Math.max(0, outfitScore(items));
  const palette = avg(items.map((i) => paletteScore(i.color, profile.season)));
  const bodies = items.map((i) => bodyScore(i, profile.shape)).filter((x) => x !== null);
  const body = bodies.length ? avg(bodies) : 0.6;
  const taste = tasteScore(profile.taste, items);
  const styleFit = profile.styles?.length
    ? avg(items.map((i) => (i.styles.some((s) => profile.styles.includes(s)) ? 1 : 0.4)))
    : 0.7;
  const owned = items.filter((i) => profile.closet?.includes(i.id)).length;
  const score = 0.3 * harmony + 0.22 * palette + 0.18 * body + 0.15 * taste + 0.15 * styleFit + Math.min(owned, 2) * 0.03;
  return { score: Math.round(Math.min(1, score) * 100), parts: { harmony, palette, body, taste, styleFit }, reasons: reasons(items, profile, { palette }) };
}

function reasons(items, profile, { palette }) {
  const out = [];
  if (profile.season && palette >= 0.75) {
    const inPal = items.filter((i) => SEASONS[profile.season].best.includes(i.color)).map((i) => i.color);
    out.push(`${[...new Set(inPal)].slice(0, 2).join(' & ')} ${inPal.length > 1 ? 'are' : 'is'} in your ${profile.season} palette`);
  }
  if (profile.shape) {
    const rules = BODY_SHAPES[profile.shape];
    const hit = items.flatMap((i) => i.cuts || []).find((c) => rules.good.includes(c));
    if (hit) {
      const cut = hit === 'a-line' ? 'A-line' : hit.replaceAll('-', ' ');
      const article = /^[aeiouh]/i.test(rules.label) ? 'an' : 'a';
      out.push(`${cut} cut flatters ${article} ${rules.label.toLowerCase()} shape`);
    }
  }
  const fav = profile.styles?.find((s) => items[0].styles.includes(s)) || profile.styles?.find((s) => items.some((i) => i.styles.includes(s)));
  if (fav) out.push(`fits your ${fav} style`);
  const owned = items.filter((i) => profile.closet?.includes(i.id));
  if (owned.length) out.push(`uses ${owned.length} piece${owned.length > 1 ? 's' : ''} you own`);
  return out;
}

const avg = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
