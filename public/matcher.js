// Outfit matching engine: scores color harmony + style compatibility,
// then fills the missing outfit slots around the item the user picked.
import { COLORS, hueOf } from './colors.js';
import { CATALOG } from './catalog.js';

// Styles that mix well even when they are not identical.
const STYLE_FRIENDS = {
  casual: ['street', 'boho', 'sporty', 'chic'],
  street: ['casual', 'sporty'],
  chic: ['elegant', 'office', 'casual'],
  elegant: ['chic'],
  boho: ['casual'],
  sporty: ['street', 'casual'],
  office: ['chic', 'elegant'],
};

// Which slots an outfit needs, depending on the anchor item.
const SLOTS_FOR = {
  top: ['bottom|skirt', 'shoes', 'bag', 'outerwear?', 'accessory?'],
  bottom: ['top', 'shoes', 'bag', 'outerwear?', 'accessory?'],
  skirt: ['top', 'shoes', 'bag', 'outerwear?', 'accessory?'],
  dress: ['shoes', 'bag', 'outerwear?', 'accessory?'],
  outerwear: ['top', 'bottom|skirt', 'shoes', 'bag'],
  shoes: ['top', 'bottom|skirt', 'bag', 'accessory?'],
  bag: ['top', 'bottom|skirt', 'shoes', 'accessory?'],
  accessory: ['top', 'bottom|skirt', 'shoes', 'bag'],
};

function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** 0..1 how well two colors go together. */
export function colorScore(a, b) {
  const ca = COLORS[a], cb = COLORS[b];
  if (a === b) return ca.neutral ? 0.85 : 0.6; // tonal look is fine, all-one-loud-color less so
  if (ca.neutral && cb.neutral) return 0.9;
  if (ca.neutral || cb.neutral) return 0.85;
  const d = hueDistance(hueOf(a), hueOf(b));
  if (d <= 35) return 0.75;               // analogous
  if (d >= 150) return 0.8;               // complementary
  if (d >= 105 && d <= 135) return 0.55;  // triadic
  return 0.3;                             // clashing
}

/** 0..1 how well two style tag sets go together. */
export function styleScore(sa, sb) {
  if (sa.some((s) => sb.includes(s))) return 1;
  if (sa.some((s) => (STYLE_FRIENDS[s] || []).some((f) => sb.includes(f)))) return 0.6;
  return 0.15;
}

export function pairScore(a, b) {
  return 0.55 * colorScore(a.color, b.color) + 0.45 * styleScore(a.styles, b.styles);
}

/** Average pairwise score of a full outfit, with a penalty for too many loud colors. */
export function outfitScore(items) {
  let sum = 0, n = 0;
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) { sum += pairScore(items[i], items[j]); n++; }
  const loud = new Set(items.filter((it) => !COLORS[it.color].neutral).map((it) => it.color)).size;
  const penalty = Math.max(0, loud - 2) * 0.08;
  return n ? sum / n - penalty : 0;
}

/**
 * Build outfits around an anchor item.
 * anchor: { category, color, styles }   (can be a catalog item or the user's own piece)
 * opts: { count, maxBudget, style, catalog }
 */
export function buildOutfits(anchor, opts = {}) {
  const { count = 4, maxBudget = Infinity, style = null, catalog = CATALOG } = opts;
  const slots = SLOTS_FOR[anchor.category] || SLOTS_FOR.top;
  const pool = catalog.filter((p) => p.id !== anchor.id && (!style || p.styles.includes(style)));
  const used = new Map(); // item id -> times used, to keep outfits varied
  const outfits = [];

  for (let k = 0; k < count; k++) {
    const picked = [anchor];
    for (const slot of slots) {
      const optional = slot.endsWith('?');
      const cats = slot.replace('?', '').split('|');
      const spent = picked.reduce((s, p) => s + (p.price || 0), 0) - (anchor.price || 0);
      const candidates = pool
        .filter((p) => cats.includes(p.category) && spent + p.price <= maxBudget)
        .filter((p) => !picked.some((x) => x.category === p.category))
        .map((p) => {
          const fit = picked.reduce((s, x) => s + pairScore(x, p), 0) / picked.length;
          const repeat = (used.get(p.id) || 0) * 0.25 + (used.get(p.name) || 0) * 0.12;
          return { p, score: fit - repeat };
        })
        .sort((a, b) => b.score - a.score);
      const best = candidates[0];
      if (!best) continue;
      if (optional && best.score < 0.72) continue; // only add extras that really fit
      picked.push(best.p);
    }
    const items = picked.slice(1);
    items.forEach((p) => {
      used.set(p.id, (used.get(p.id) || 0) + 1);
      used.set(p.name, (used.get(p.name) || 0) + 1);
    });
    if (!items.length) break;
    const sig = items.map((p) => p.id).sort().join(',');
    if (outfits.some((o) => o.sig === sig)) continue;
    outfits.push({
      sig,
      items,
      score: Math.round(outfitScore(picked) * 100),
      total: +items.reduce((s, p) => s + p.price, 0).toFixed(2),
      why: explain(anchor, items),
    });
  }
  return outfits.sort((a, b) => b.score - a.score);
}

function explain(anchor, items) {
  const loud = items.filter((p) => !COLORS[p.color].neutral);
  const parts = [];
  if (!loud.length) parts.push(`neutral pieces let your ${anchor.color} ${anchor.category} stand out`);
  else {
    const c = loud[0].color;
    const s = colorScore(anchor.color, c);
    parts.push(s >= 0.8 ? `${c} complements ${anchor.color}` : s >= 0.7 ? `${c} is a soft tonal match for ${anchor.color}` : `${c} adds a pop of color`);
  }
  const shared = items[0]?.styles.find((s) => anchor.styles.includes(s));
  if (shared) parts.push(`keeps a ${shared} vibe`);
  return parts.join(', ');
}
