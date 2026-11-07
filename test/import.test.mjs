import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { categoryOf, colorOf, cutsOf, stylesOf, toProduct } from '../scripts/classify.mjs';
import { parseFeed, buildCatalog, readSource } from '../scripts/import-feed.mjs';

const FIXTURE = new URL('./fixtures/sample-feed.csv', import.meta.url).pathname;

test('categories from SHEIN-style titles', () => {
  assert.equal(categoryOf('SHEIN Belted Shirt Dress'), 'dress');
  assert.equal(categoryOf('Woven Straw Crossbody Bag'), 'bag');
  assert.equal(categoryOf('Wide Leather Look Belt'), 'accessory');
  assert.equal(categoryOf('High Waist Bootcut Jeans'), 'bottom');
  assert.equal(categoryOf('Cropped Knit Cardigan'), 'outerwear');
  assert.equal(categoryOf('Ribbed Crop Tank Top'), 'top');
  assert.equal(categoryOf('Women Long Sleeve Tee'), 'top');
  assert.equal(categoryOf('2pcs Crop Top & Shorts Set'), null);
  assert.equal(categoryOf('Men Solid Tee'), null);
});

test('feed colors map to the palette', () => {
  assert.equal(colorOf('Navy Blue'), 'navy');
  assert.equal(colorOf('Apricot'), 'beige');
  assert.equal(colorOf('Medium Wash'), 'denim');
  assert.equal(colorOf('Army Green'), 'olive');
  assert.equal(colorOf('Multicolor', 'Allover Print Dress'), null);
  assert.equal(colorOf('', 'Black Ribbed Tank'), 'black');
});

test('cuts and styles from titles', () => {
  assert.deepEqual(cutsOf('High Waist Wide Leg Jeans').sort(), ['high-waist', 'wide-leg']);
  assert.ok(cutsOf('Floral Wrap V Neck Midi Dress').includes('wrap'));
  assert.ok(stylesOf('Floral Tiered Maxi Skirt').includes('boho'));
  assert.deepEqual(stylesOf('Plain thing'), ['casual']);
});

test('reads CJ / Awin style column names', () => {
  const p = toProduct({ aw_product_id: '77', product_name: 'SHEIN Pencil Skirt', aw_deep_link: 'https://example.com/x', search_price: '9.50', colour: 'Charcoal', merchant_image_url: 'https://example.com/i.jpg' });
  assert.equal(p.category, 'skirt');
  assert.equal(p.color, 'grey');
  assert.equal(p.price, 9.5);
  assert.equal(p.title, 'Pencil Skirt');
  assert.equal(p.image, 'https://example.com/i.jpg');
});

test('parses the sample feed: skips men, sets, prints, home goods and duplicates', async () => {
  const rows = parseFeed(await readFile(FIXTURE, 'utf8'));
  assert.equal(rows.length, 33);
  assert.equal(rows[32].title, 'SHEIN Knot Front "Chic" Top, Short Sleeve');
  const { products, counts } = buildCatalog(rows);
  assert.equal(products.length, 28);
  assert.ok(Object.values(counts).every((n) => n > 0));
  assert.ok(!products.some((p) => /Men|Set|Pillow|Allover/.test(p.title)));
});

test('TSV, JSON and gzip feeds', async () => {
  const tsv = 'id\ttitle\tlink\tprice\tcolor\n1\tSHEIN Ballet Flats\thttps://example.com/1\t$12.00\tBlack\n';
  assert.equal(toProduct(parseFeed(tsv)[0]).category, 'shoes');
  const json = JSON.stringify({ products: [{ id: 2, title: 'Canvas Tote Bag', link: 'https://example.com/2', price: 8, color: 'Beige' }] });
  assert.equal(toProduct(parseFeed(json)[0]).category, 'bag');
  const dir = mkdtempSync(join(tmpdir(), 'feed-'));
  const gz = join(dir, 'feed.csv.gz');
  writeFileSync(gz, gzipSync(await readFile(FIXTURE)));
  assert.equal(parseFeed(await readSource(gz)).length, 33);
  await rm(dir, { recursive: true });
});

test('command line writes products.json, and refuses a feed too thin for outfits', () => {
  const dir = mkdtempSync(join(tmpdir(), 'out-'));
  const out = join(dir, 'products.json');
  const log = execFileSync('node', ['scripts/import-feed.mjs', FIXTURE, '--out', out], { encoding: 'utf8' });
  assert.match(log, /28 products/);
  const thin = join(dir, 'thin.csv');
  writeFileSync(thin, 'id,title,link,price,color\n1,Tee,https://example.com/1,5,Black\n');
  assert.throws(() => execFileSync('node', ['scripts/import-feed.mjs', thin, '--out', join(dir, 'x.json')], { stdio: 'pipe' }));
});
