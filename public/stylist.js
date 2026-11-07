// Dressly-style features built on the matcher + profile:
// swipe deck, personal feed, outfit scanner and capsule wardrobe builder.
import { CATALOG, CATEGORIES, STYLES } from './catalog.js';
import { COLORS } from './colors.js';
import { buildOutfits, colorScore, outfitScore, pairScore } from './matcher.js';
import { paletteScore, bodyScore, personalScore, SEASONS } from './profile.js';

const MAIN = ['top', 'bottom', 'skirt', 'dress'];

/** How much an item suits this person on its own (palette, cut, ownership). */
export function itemBoost(p, profile = {}) {
  const body = bodyScore(p, profile.shape);
  return 0.3 * (paletteScore(p.color, profile.season) - 0.6)
    + 0.25 * ((body ?? 0.6) - 0.6)
    + (profile.closet?.includes(p.id) ? 0.12 : 0);
}

// ---------- Swipe deck ----------
/** ~20 varied outfits (every style, many colors) to learn taste from. */
export function swipeDeck(n = 20, catalog = CATALOG) {
  const deck = [];
  const usedAnchors = new Set();
  for (let round = 0; deck.length < n && round < 6; round++) {
    for (const style of STYLES) {
      if (deck.length >= n) break;
      const anchors = catalog.filter((p) => MAIN.includes(p.category) && p.styles.includes(style) && !usedAnchors.has(p.name));
      const a = anchors[(round * 7 + style.length * 3) % (anchors.length || 1)];
      if (!a) continue;
      usedAnchors.add(a.name);
      const [o] = buildOutfits(a, { count: 1, style, catalog });
      if (o) deck.push({ id: `swipe-${deck.length}`, style, items: [a, ...o.items] });
    }
  }
  return deck;
}

// ---------- Personal feed ----------
/** Outfits made for this person, best first, each with a score and reasons. */
export function buildFeed(profile = {}, { count = 10, catalog = CATALOG } = {}) {
  const budget = profile.budget || Infinity;
  // Your palette first. A category with almost nothing in your colors falls back to all its
  // items (scoring still prefers the closest colors), so every look can be complete.
  const inPalette = catalog.filter((p) => paletteScore(p.color, profile.season) >= 0.45);
  const pool = CATEGORIES.flatMap((c) => {
    const mine = inPalette.filter((p) => p.category === c);
    return mine.length >= 2 ? mine : catalog.filter((p) => p.category === c);
  });
  const used = new Map();
  const boost = (p) => itemBoost(p, profile) - 0.1 * (used.get(p.name) || 0);
  const looks = [];
  const seenAnchor = new Set();

  const addLooks = (pool, anchors) => {
    if (profile.styles?.length) {
      const styled = anchors.filter((p) => p.styles.some((s) => profile.styles.includes(s)));
      if (styled.length >= 8) anchors = styled;
    }
    // Best-suited anchors first; pieces already used in earlier looks get a penalty so the feed stays varied.
    anchors = [...anchors].sort((x, y) => itemBoost(y, profile) - itemBoost(x, profile));
    for (const a of anchors) {
      if (a.price > budget || seenAnchor.has(a.name)) continue;
      const [o] = buildOutfits(a, { count: 1, maxBudget: budget - a.price, catalog: pool, boost });
      if (!o) continue;
      const items = [a, ...o.items];
      const pairKey = items.filter((p) => MAIN.includes(p.category)).map((p) => p.name).sort().join('+');
      if (seenAnchor.has(pairKey)) continue;
      seenAnchor.add(a.name).add(pairKey);
      o.items.forEach((p) => used.set(p.name, (used.get(p.name) || 0) + 1));
      const total = +items.reduce((s, p) => s + p.price, 0).toFixed(2);
      looks.push({ items, total, ...personalScore(items, profile) });
    }
  };

  addLooks(pool, pool.filter((p) => MAIN.includes(p.category) && paletteScore(p.color, profile.season) >= 0.6));
  // Too few looks in your colors (small catalog or tight budget): allow any color, ranked lower.
  if (looks.length < count) addLooks(catalog, catalog.filter((p) => MAIN.includes(p.category)));
  return looks.sort((x, y) => y.score - x.score).slice(0, count);
}

/** Price of the cheapest full look the catalog allows: top + bottom (or a dress), shoes, bag, jacket, accessory. */
export function cheapestLook(catalog = CATALOG) {
  const min = (cats) => {
    const prices = catalog.filter((p) => cats.includes(p.category)).map((p) => p.price);
    return prices.length ? Math.min(...prices) : 0; // a piece the catalog lacks isn't part of the look
  };
  const body = Math.min(min(['top']) + min(['bottom', 'skirt']), min(['dress']) || Infinity);
  return Math.ceil(body + min(['shoes']) + min(['bag']) + min(['outerwear']) + min(['accessory']));
}

// ---------- Outfit scanner ----------
/**
 * Score an outfit from the colors detected in a photo.
 * Same input always gives the same score (Dressly's scores are reported to be inconsistent).
 */
export function scanOutfit({ top, bottom }, profile = {}, catalog = CATALOG) {
  const harmony = colorScore(top, bottom);
  const pTop = paletteScore(top, profile.season), pBottom = paletteScore(bottom, profile.season);
  const loudBoth = !COLORS[top].neutral && !COLORS[bottom].neutral;
  const score = Math.round(100 * (0.6 * harmony + 0.4 * (0.6 * pTop + 0.4 * pBottom)));

  const notes = [];
  notes.push(harmony >= 0.8
    ? { ok: true, text: `${top} and ${bottom} work well together` }
    : harmony >= 0.6
      ? { ok: true, text: `${top} with ${bottom} is a safe, tonal pairing` }
      : { ok: false, text: `${top} and ${bottom} clash a little` });
  if (profile.season) {
    notes.push(pTop >= 0.75
      ? { ok: true, text: `${top} near your face suits your ${profile.season} coloring` }
      : pTop <= 0.2
        ? { ok: false, text: `${top} is not in your ${profile.season} palette, try it away from your face` }
        : { ok: true, text: `${top} is okay for your coloring` });
  }
  if (loudBoth && harmony < 0.8) notes.push({ ok: false, text: 'two strong colors compete; anchor one with a neutral' });

  // Suggest one SHEIN swap for the weaker piece.
  let swap = null;
  if (score < 85) {
    const replace = pTop < pBottom ? 'top' : 'bottom';
    const keep = replace === 'top' ? bottom : top;
    const cats = replace === 'top' ? ['top'] : ['bottom', 'skirt'];
    const best = catalog
      .filter((p) => cats.includes(p.category))
      .map((p) => ({ p, s: colorScore(p.color, keep) + paletteScore(p.color, profile.season) * (replace === 'top' ? 1 : 0.6) }))
      .sort((a, b) => b.s - a.s)[0];
    if (best) {
      const next = replace === 'top' ? { top: best.p.color, bottom } : { top, bottom: best.p.color };
      const newScore = scanOutfit(next, profile, []).score;
      if (newScore > score) swap = { replace, item: best.p, newScore };
    }
  }
  return { score, notes, swap };
}

// ---------- Capsule wardrobe ----------
const CAPSULE_PLAN = [['top', 4], ['bottom|skirt', 3], ['outerwear', 1], ['shoes', 2], ['bag', 1]];

/** A small set of pieces that mix into many outfits, within palette and budget. Owned items are free. */
export function buildCapsule(profile = {}, { budget = Infinity, catalog = CATALOG } = {}) {
  const owned = (p) => profile.closet?.includes(p.id);
  // Prefer your palette; relax it when the catalog is too small to fill a capsule.
  const inPalette = (min) => catalog.filter((p) => paletteScore(p.color, profile.season) >= min || owned(p));
  const pool = [0.6, 0.45, 0].map(inPalette).find((list) => list.length >= 40) || catalog;
  const slotsLeft = () => CAPSULE_PLAN.reduce((s, [, n]) => s + n, 0) - chosen.length;
  const chosen = [];
  let spent = 0;
  for (const [slot, n] of CAPSULE_PLAN) {
    const cats = slot.split('|');
    for (let k = 0; k < n; k++) {
      const left = budget - spent;
      const cap = left / slotsLeft() * 1.8;
      const cand = pool
        .filter((p) => cats.includes(p.category) && !chosen.some((c) => c.name === p.name))
        .filter((p) => owned(p) || p.price <= Math.min(left, cap))
        .map((p) => {
          const fit = chosen.length ? chosen.reduce((s, c) => s + pairScore(c, p), 0) / chosen.length : 0.7;
          const style = profile.styles?.length && p.styles.some((s) => profile.styles.includes(s)) ? 0.15 : 0;
          const versatile = COLORS[p.color].neutral ? 0.08 : 0;
          return { p, s: fit + itemBoost(p, profile) + style + versatile + (owned(p) ? 0.3 : 0) };
        })
        .sort((a, b) => b.s - a.s);
      if (!cand[0]) continue;
      chosen.push(cand[0].p);
      if (!owned(cand[0].p)) spent += cand[0].p.price;
    }
  }

  // Count the good outfits the capsule makes.
  const of = (cats) => chosen.filter((p) => cats.includes(p.category));
  const outfits = [];
  for (const t of of(['top'])) for (const b of of(['bottom', 'skirt'])) for (const s of of(['shoes'])) {
    const base = [t, b, s, ...of(['bag'])];
    const score = outfitScore(base);
    if (score >= 0.7) outfits.push({ items: base, score: Math.round(score * 100) });
  }
  outfits.sort((a, b) => b.score - a.score);
  return { items: chosen, spent: +spent.toFixed(2), outfits };
}

export { SEASONS };

// ---------- Occasions ----------
export const OCCASIONS = {
  everyday: { label: 'Everyday', styles: null },
  work: { label: 'Work', styles: ['office', 'chic'] },
  date: { label: 'Date night', styles: ['elegant', 'chic'] },
  weekend: { label: 'Weekend', styles: ['casual', 'street', 'boho'] },
  active: { label: 'Active', styles: ['sporty', 'street'] },
};

/** The profile with its styles swapped for the occasion's styles. */
export function forOccasion(profile, occasion) {
  const o = OCCASIONS[occasion];
  return o?.styles ? { ...profile, styles: o.styles } : profile;
}
