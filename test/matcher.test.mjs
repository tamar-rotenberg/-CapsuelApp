import test from 'node:test';
import assert from 'node:assert/strict';
import { colorScore, styleScore, buildOutfits } from '../public/matcher.js';
import { CATALOG } from '../public/catalog.js';

test('neutrals match anything better than clashing colors', () => {
  assert.ok(colorScore('black', 'red') > colorScore('red', 'green') - 0.1);
  assert.ok(colorScore('white', 'pink') > colorScore('pink', 'olive'));
});

test('shared style beats unrelated style', () => {
  assert.ok(styleScore(['chic'], ['chic']) > styleScore(['elegant'], ['sporty']));
});

test('a top gets a bottom, shoes and bag', () => {
  const top = CATALOG.find((p) => p.category === 'top');
  const outfits = buildOutfits(top);
  assert.ok(outfits.length >= 2);
  for (const o of outfits) {
    const cats = o.items.map((p) => p.category);
    assert.ok(cats.includes('bottom') || cats.includes('skirt'));
    assert.ok(cats.includes('shoes'));
    assert.ok(cats.includes('bag'));
    assert.ok(!o.items.some((p) => p.id === top.id));
  }
});

test('a dress never gets a top or bottom', () => {
  const dress = CATALOG.find((p) => p.category === 'dress');
  for (const o of buildOutfits(dress))
    assert.ok(!o.items.some((p) => ['top', 'bottom', 'skirt'].includes(p.category)));
});

test('budget is respected', () => {
  const anchor = { category: 'top', color: 'white', styles: ['casual'] };
  for (const o of buildOutfits(anchor, { maxBudget: 40 })) assert.ok(o.total <= 40);
});
