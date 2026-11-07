#!/usr/bin/env node
// Import a SHEIN affiliate product feed into public/data/products.json.
//
//   node scripts/import-feed.mjs <file-or-url> [--per-category 150] [--out public/data/products.json]
//
// Accepts CSV, TSV or JSON (optionally .gz), with the column names used by
// Google Shopping-style feeds and the big affiliate networks (CJ, Awin, Impact).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { dirname } from 'node:path';
import { toProduct } from './classify.mjs';

const CATEGORIES = ['top', 'bottom', 'skirt', 'dress', 'outerwear', 'shoes', 'bag', 'accessory'];

export async function readSource(src) {
  let buf;
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Feed download failed: HTTP ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
  } else {
    buf = await readFile(src);
  }
  if (buf[0] === 0x1f && buf[1] === 0x8b) buf = gunzipSync(buf);
  return buf.toString('utf8').replace(/^﻿/, '');
}

/** Parse feed text into row objects. */
export function parseFeed(text) {
  const t = text.trimStart();
  if (t.startsWith('[') || t.startsWith('{')) {
    const data = JSON.parse(t);
    return Array.isArray(data) ? data : data.products || data.items || data.data || [];
  }
  const firstLine = t.slice(0, t.indexOf('\n') >>> 0);
  const delim = (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length ? '\t'
    : (firstLine.match(/\|/g) || []).length > (firstLine.match(/,/g) || []).length ? '|' : ',';
  const rows = parseDelimited(t, delim);
  const header = rows.shift().map((h) => h.trim());
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

// RFC 4180-style parser: quoted fields, escaped quotes, newlines inside quotes.
function parseDelimited(text, delim) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field === '') quoted = true;
    else if (ch === delim) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Normalize, de-duplicate and balance: at most `perCategory` products per category. */
export function buildCatalog(rows, { perCategory = 150 } = {}) {
  const seen = new Set();
  const byCat = Object.fromEntries(CATEGORIES.map((c) => [c, []]));
  let skipped = 0;
  for (const row of rows) {
    const p = toProduct(row);
    if (!p || seen.has(p.id)) { skipped++; continue; }
    seen.add(p.id);
    byCat[p.category].push(p);
  }
  // Keep color variety: round-robin over colors inside each category.
  const products = [];
  for (const cat of CATEGORIES) {
    const byColor = new Map();
    for (const p of byCat[cat]) byColor.set(p.color, [...(byColor.get(p.color) || []), p]);
    const lists = [...byColor.values()];
    let n = 0;
    for (let i = 0; n < perCategory && lists.some((l) => l.length > i); i++) {
      for (const l of lists) if (l[i] && n < perCategory) { products.push(l[i]); n++; }
    }
  }
  return { products, skipped, counts: Object.fromEntries(CATEGORIES.map((c) => [c, products.filter((p) => p.category === c).length])) };
}

async function main() {
  const args = process.argv.slice(2);
  const src = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a)) || process.env.SHEIN_FEED_URL;
  const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
  if (!src) {
    console.error('Usage: node scripts/import-feed.mjs <feed file or URL> [--per-category 150] [--out public/data/products.json]');
    process.exit(1);
  }
  const out = opt('out', 'public/data/products.json');
  const rows = parseFeed(await readSource(src));
  const { products, skipped, counts } = buildCatalog(rows, { perCategory: Number(opt('per-category', 150)) });
  const missing = Object.entries(counts).filter(([, n]) => n === 0).map(([c]) => c);
  if (products.length < 20 || missing.some((c) => ['top', 'shoes', 'bag'].includes(c))) {
    console.error(`Feed too thin to build outfits (${products.length} usable products; missing: ${missing.join(', ') || 'none'}). Not writing ${out}.`);
    process.exit(2);
  }
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify({ source: 'shein-affiliate-feed', updated: new Date().toISOString(), products }));
  console.log(`Read ${rows.length} rows → ${products.length} products (${skipped} skipped).`);
  console.log(Object.entries(counts).map(([c, n]) => `${c}: ${n}`).join(' · '));
  console.log(`Wrote ${out}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
