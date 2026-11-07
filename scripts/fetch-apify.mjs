#!/usr/bin/env node
// Fetch real SHEIN products through Apify's "SHEIN Scraper" (hypebridge/shein-scraper).
// Costs money per product (about $0.12 each + $0.10 per search), so it checks the Apify
// credit before every search and saves raw results; rebuilding the catalog is then free.
//
//   APIFY_TOKEN=... NODE_USE_ENV_PROXY=1 node scripts/fetch-apify.mjs [--budget 4.2] [--dry-run]
//
// Searches come from scripts/apify-queries.json: [{ "query": "women black shoulder bag", "color": "black", "count": 3 }]
// Raw results are appended to data/shein-apify-raw.json; then run scripts/build-catalog.mjs.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const API = 'https://api.apify.com/v2';
const ACTOR = 'hypebridge~shein-scraper';
const PER_ITEM = 0.12, PER_RUN = 0.10;
const RAW = 'data/shein-apify-raw.json';
const token = process.env.APIFY_TOKEN || 'proxy-injected';
const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
const args = process.argv.slice(2);
const budget = Number(args[args.indexOf('--budget') + 1]) || 4.2;
const dryRun = args.includes('--dry-run');

const api = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, { headers, ...opts });
  const body = await res.json();
  if (!res.ok) throw new Error(`Apify ${path}: ${body.error?.message || res.status}`);
  return body.data ?? body;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function creditLeft() {
  const d = await api('/users/me/limits');
  return d.limits.maxMonthlyUsageUsd - d.current.monthlyUsageUsd;
}

async function search({ query, count }) {
  const run = await api(`/acts/${ACTOR}/runs`, {
    method: 'POST',
    body: JSON.stringify({ searchQueries: [query], maxItems: count, maxPagesPerStartUrl: 1, getProductDetails: false }),
  });
  let r = run;
  while (['READY', 'RUNNING'].includes(r.status)) { await sleep(8000); r = await api(`/actor-runs/${run.id}`); }
  if (r.status !== 'SUCCEEDED') throw new Error(`run ${run.id} ${r.status}`);
  const items = await api(`/datasets/${r.defaultDatasetId}/items?clean=1`);
  return { items, cost: r.usageTotalUsd };
}

async function main() {
  const queries = JSON.parse(await readFile('scripts/apify-queries.json', 'utf8'));
  let raw = [];
  try { raw = JSON.parse(await readFile(RAW, 'utf8')); } catch {}
  const done = new Set(raw.map((r) => r.query));
  let spent = 0;
  for (const q of queries) {
    if (done.has(q.query)) { console.log(`skip (already fetched): ${q.query}`); continue; }
    const est = PER_RUN + PER_ITEM * q.count;
    const left = await creditLeft();
    if (spent + est > budget || est > left - 0.05) { console.log(`stop: next search ~$${est.toFixed(2)}, credit left $${left.toFixed(2)}, spent $${spent.toFixed(2)}`); break; }
    if (dryRun) { console.log(`would fetch ${q.count} × "${q.query}" (~$${est.toFixed(2)})`); spent += est; continue; }
    const { items, cost } = await search(q);
    spent += cost;
    raw.push({ query: q.query, color: q.color, fetched: new Date().toISOString(), items });
    await mkdir('data', { recursive: true });
    await writeFile(RAW, JSON.stringify(raw, null, 1));
    console.log(`${items.length} × "${q.query}" ($${cost.toFixed(2)})`);
  }
  console.log(`spent $${spent.toFixed(2)}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
