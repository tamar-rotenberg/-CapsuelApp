import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFeed, cheapestLook } from '../public/stylist.js';
import { buildOutfits } from '../public/matcher.js';
import { emptyTaste } from '../public/profile.js';
import { CATALOG } from '../public/catalog.js';

// A full look: top + bottom (or a dress), shoes, bag, jacket and accessory,
// leaving out only pieces the catalog has none of.
const isFull = (items, catalog) => {
  const c = new Set(items.map((p) => p.category));
  const has = (cat) => catalog.some((p) => p.category === cat);
  const body = c.has('dress') || (c.has('top') && (c.has('bottom') || c.has('skirt')));
  return body && ['shoes', 'bag', 'outerwear', 'accessory'].every((cat) => c.has(cat) || !has(cat));
};

test('every look in the feed is a full outfit and within budget', () => {
  // A small catalog where some palettes have no tops and budgets are tight, like the real SHEIN set.
  const small = CATALOG.filter((p, i) => i % 4 === 0);
  for (const season of ['Warm Autumn', 'Cool Winter', 'Light Summer']) {
    for (const budget of [cheapestLook(small) + 25, 150, 0]) {
      const profile = { season, shape: 'hourglass', styles: ['casual'], budget, taste: emptyTaste(), closet: [] };
      const feed = buildFeed(profile, { count: 6, catalog: small });
      assert.ok(feed.length > 0, `${season} $${budget}: no looks`);
      for (const look of feed) {
        assert.ok(isFull(look.items, small), `${season} $${budget}: ${look.items.map((p) => p.category)}`);
        if (budget) assert.ok(look.total <= budget, `${season}: $${look.total} > $${budget}`);
      }
    }
  }
});

test('a missing category (no accessories yet) is left out instead of hiding every look', () => {
  const noAccessories = CATALOG.filter((p) => p.category !== 'accessory');
  const top = noAccessories.find((p) => p.category === 'top');
  const [look] = buildOutfits(top, { catalog: noAccessories });
  assert.ok(look, 'a look is still built');
  const cats = look.items.map((p) => p.category);
  assert.ok(cats.includes('outerwear') && cats.includes('shoes') && cats.includes('bag'));
  assert.ok(!cats.includes('accessory'));
  assert.ok(isFull([top, ...look.items], noAccessories));
});

test('a budget below the cheapest full look gives no looks rather than half looks', () => {
  const small = CATALOG.filter((p, i) => i % 4 === 0);
  const profile = { season: 'Warm Autumn', shape: 'pear', styles: ['casual'], budget: cheapestLook(small) - 5, taste: emptyTaste(), closet: [] };
  assert.deepEqual(buildFeed(profile, { catalog: small }), []);
});
