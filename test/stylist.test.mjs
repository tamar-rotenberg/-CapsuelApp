import test from 'node:test';
import assert from 'node:assert/strict';
import { seasonFrom, skinToAnswers, paletteScore, shapeFromMeasurements, bodyScore, emptyTaste, learn, tasteScore, personalScore } from '../public/profile.js';
import { swipeDeck, buildFeed, scanOutfit, buildCapsule } from '../public/stylist.js';
import { CATALOG } from '../public/catalog.js';

const profile = { season: 'Soft Autumn', shape: 'pear', styles: ['chic', 'casual'], budget: 90, taste: emptyTaste(), closet: [] };

test('quiz answers map to the expected seasons', () => {
  assert.equal(seasonFrom({ warmth: 1, depth: 0.3, chroma: -0.5 }), 'Warm Autumn');
  assert.equal(seasonFrom({ warmth: -1, depth: 0.3, chroma: 1 }), 'Cool Winter');
  assert.equal(seasonFrom({ warmth: 0.5, depth: -1, chroma: 0.5 }), 'Light Spring');
});

test('skin reading: yellow-ish light skin is warm and light', () => {
  const a = skinToAnswers([236, 200, 160]);
  assert.ok(a.warmth > 0 && a.depth < 0);
});

test('palette: best colors beat avoid colors', () => {
  assert.ok(paletteScore('olive', 'Soft Autumn') > paletteScore('black', 'Soft Autumn'));
});

test('body shape from measurements', () => {
  assert.equal(shapeFromMeasurements(86, 66, 100), 'pear');
  assert.equal(shapeFromMeasurements(92, 66, 92), 'hourglass');
  assert.equal(shapeFromMeasurements(100, 84, 90), 'inverted-triangle');
  assert.equal(shapeFromMeasurements(90, 88, 92), 'apple');
});

test('a-line flatters pear more than pencil', () => {
  const aline = CATALOG.find((p) => p.cuts.includes('a-line'));
  const pencil = CATALOG.find((p) => p.cuts.includes('pencil'));
  assert.ok(bodyScore(aline, 'pear') > bodyScore(pencil, 'pear'));
});

test('swipes teach taste', () => {
  const sporty = CATALOG.filter((p) => p.styles.includes('sporty')).slice(0, 3);
  const elegant = CATALOG.filter((p) => p.styles.includes('elegant')).slice(0, 3);
  let t = emptyTaste();
  for (let i = 0; i < 5; i++) { t = learn(t, sporty, true); t = learn(t, elegant, false); }
  assert.ok(tasteScore(t, sporty) > 0.5 && tasteScore(t, elegant) < 0.5);
});

test('swipe deck has 20 varied outfits', () => {
  const deck = swipeDeck(20);
  assert.equal(deck.length, 20);
  assert.ok(new Set(deck.map((d) => d.style)).size >= 6);
});

test('feed respects budget, is varied and personal', () => {
  const feed = buildFeed(profile);
  assert.ok(feed.length >= 6);
  for (const look of feed) assert.ok(look.total <= 90);
  assert.equal(new Set(feed.map((l) => l.items[0].name)).size, feed.length);
  const avgPalette = feed.flatMap((l) => l.items).reduce((s, i) => s + paletteScore(i.color, 'Soft Autumn'), 0) / feed.flatMap((l) => l.items).length;
  assert.ok(avgPalette > 0.65, `palette ${avgPalette}`);
  assert.ok(feed[0].reasons.length > 0);
});

test('scanner is deterministic and suggests a better swap for a weak outfit', () => {
  const a = scanOutfit({ top: 'black', bottom: 'orange' }, profile);
  assert.deepEqual(a, scanOutfit({ top: 'black', bottom: 'orange' }, profile));
  assert.ok(a.swap && a.swap.newScore > a.score);
  assert.ok(scanOutfit({ top: 'cream', bottom: 'brown' }, profile).score > a.score);
});

test('capsule fits budget and makes many outfits', () => {
  const c = buildCapsule(profile, { budget: 200 });
  assert.ok(c.spent <= 200);
  assert.ok(c.items.length >= 9);
  assert.ok(c.outfits.length >= 8, `outfits ${c.outfits.length}`);
});

test('owned items are preferred and free in the capsule', () => {
  const mine = CATALOG.find((p) => p.category === 'top' && paletteScore(p.color, 'Soft Autumn') === 1);
  const c = buildCapsule({ ...profile, closet: [mine.id] }, { budget: 200 });
  assert.ok(c.items.some((p) => p.id === mine.id));
  const look = personalScore([mine], { ...profile, closet: [mine.id] });
  assert.ok(look.reasons.some((r) => r.includes('you own')));
});

test('occasion changes the feed toward its styles', async () => {
  const { forOccasion } = await import('../public/stylist.js');
  const work = buildFeed(forOccasion(profile, 'work'));
  const share = work.filter((l) => l.items[0].styles.some((s) => ['office', 'chic'].includes(s))).length / work.length;
  assert.ok(share >= 0.8, `share ${share}`);
  assert.deepEqual(forOccasion(profile, 'everyday'), profile);
});

test('dislikes push similar looks down', () => {
  const before = buildFeed(profile);
  let taste = emptyTaste();
  for (let i = 0; i < 3; i++) taste = learn(taste, before[0].items, false);
  const after = buildFeed({ ...profile, taste });
  assert.ok(after[0].score <= before[0].score || after[0].items[0].id !== before[0].items[0].id);
});
