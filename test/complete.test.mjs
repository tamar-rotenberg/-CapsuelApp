import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFeed, cheapestLook } from '../public/stylist.js';
import { emptyTaste } from '../public/profile.js';
import { CATALOG } from '../public/catalog.js';

const isComplete = (items) => {
  const c = new Set(items.map((p) => p.category));
  return (c.has('dress') || (c.has('top') && (c.has('bottom') || c.has('skirt')))) && c.has('shoes') && c.has('bag');
};

test('every look in the feed is complete (top + bottom or a dress, plus shoes and a bag) and within budget', () => {
  // A small catalog where some palettes have no tops and budgets are tight, like the real SHEIN set.
  const small = CATALOG.filter((p, i) => i % 5 === 0);
  for (const season of ['Warm Autumn', 'Cool Winter', 'Light Summer']) {
    for (const budget of [cheapestLook(small) + 15, 90, 0]) {
      const profile = { season, shape: 'hourglass', styles: ['casual'], budget, taste: emptyTaste(), closet: [] };
      const feed = buildFeed(profile, { count: 6, catalog: small });
      assert.ok(feed.length > 0, `${season} $${budget}: no looks`);
      for (const look of feed) {
        assert.ok(isComplete(look.items), `${season} $${budget}: ${look.items.map((p) => p.category)}`);
        if (budget) assert.ok(look.total <= budget, `${season}: $${look.total} > $${budget}`);
      }
    }
  }
});

test('a budget below the cheapest complete look gives no looks rather than half looks', () => {
  const small = CATALOG.filter((p, i) => i % 5 === 0);
  const profile = { season: 'Warm Autumn', shape: 'pear', styles: ['casual'], budget: cheapestLook(small) - 5, taste: emptyTaste(), closet: [] };
  assert.deepEqual(buildFeed(profile, { catalog: small }), []);
});
