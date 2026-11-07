#!/usr/bin/env node
// Build public/data/products.json from the saved Apify results (data/shein-apify-raw.json).
// Free to re-run: it never calls Apify.
//
//   node scripts/build-catalog.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { colorOf } from './classify.mjs';
import { buildCatalog } from './import-feed.mjs';

/** Raw Apify search results → feed-style rows the importer understands. */
export function rowsFromApify(raw) {
  return raw.flatMap(({ query, color, items }) => items.map((it) => ({
    id: it.goodsId,
    title: it.title,
    link: it.productUrl,
    image_link: it.imageUrl,
    price: it.price,
    // The title's own color wins; otherwise the color we searched for.
    color: colorOf('', it.title) || color || '',
    product_type: query,
  })));
}

async function main() {
  const raw = JSON.parse(await readFile('data/shein-apify-raw.json', 'utf8'));
  const rows = rowsFromApify(raw);
  const { products, skipped, counts } = buildCatalog(rows, { perCategory: 150 });
  await mkdir('public/data', { recursive: true });
  const updated = raw.map((r) => r.fetched).sort().at(-1);
  await writeFile('public/data/products.json', JSON.stringify({ source: 'shein-apify', updated, products }, null, 1));
  console.log(`${rows.length} scraped → ${products.length} products (${skipped} skipped)`);
  console.log(Object.entries(counts).map(([c, n]) => `${c}: ${n}`).join(' · '));
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
