import { COLORS, nearestColor, rgbToHsl } from './colors.js';
import { CATALOG, CATEGORIES, STYLES } from './catalog.js';
import { buildOutfits } from './matcher.js';
import { garmentSvg } from './icons.js';

const $ = (id) => document.getElementById(id);
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const opts = (list, sel) => list.map((v) => `<option value="${v}" ${v === sel ? 'selected' : ''}>${cap(v)}</option>`).join('');

let anchor = null;

// ---- setup ----
$('f-category').innerHTML += opts(CATEGORIES);
$('u-category').innerHTML = opts(CATEGORIES, 'top');
$('u-color').innerHTML = opts(Object.keys(COLORS), 'black');
$('u-style').innerHTML = opts(STYLES, 'casual');
$('r-style').innerHTML += opts(STYLES);

document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
  $('panel-browse').classList.toggle('hidden', t.dataset.tab !== 'browse');
  $('panel-upload').classList.toggle('hidden', t.dataset.tab !== 'upload');
}));

// ---- browse ----
function itemCard(p, tag = 'button') {
  const href = tag === 'a' ? ` href="${p.url}" target="_blank" rel="noopener"` : '';
  return `<${tag} class="item" data-id="${p.id}"${href}>
    <div class="thumb">${garmentSvg(p.category, COLORS[p.color].hex)}</div>
    <span class="t">${p.title}</span>
    <span class="p">$${p.price.toFixed(2)}</span>
    ${tag === 'a' ? '<span class="shop">Shop on SHEIN ↗</span>' : ''}
  </${tag}>`;
}

function renderCatalog() {
  const cat = $('f-category').value;
  const q = $('f-search').value.trim().toLowerCase();
  let list = CATALOG.filter((p) => (!cat || p.category === cat) && (!q || p.title.toLowerCase().includes(q)));
  // In the unfiltered view show only two colors per product to keep the grid short.
  if (!cat && !q) list = list.filter((p) => p.id.endsWith('-0') || p.id.endsWith('-1'));
  $('catalog').innerHTML = list.map((p) => itemCard(p)).join('') || '<p class="empty">Nothing found</p>';
}
$('f-category').addEventListener('change', renderCatalog);
$('f-search').addEventListener('input', renderCatalog);
$('catalog').addEventListener('click', (e) => {
  const el = e.target.closest('.item');
  if (el) showResults(CATALOG.find((p) => p.id === el.dataset.id));
});

// ---- upload ----
let uploadedSrc = null;
$('file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  uploadedSrc = URL.createObjectURL(file);
  const img = $('preview');
  img.src = uploadedSrc; img.hidden = false; $('drop-text').hidden = true;
  await img.decode();
  $('u-color').value = detectColor(img);
});

// Dominant color in the center of the photo; near-white pixels (likely background) count less.
function detectColor(img) {
  const size = 60;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const w = img.naturalWidth, h = img.naturalHeight, crop = Math.min(w, h) * 0.6;
  ctx.drawImage(img, (w - crop) / 2, (h - crop) / 2, crop, crop, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const votes = {};
  for (let i = 0; i < data.length; i += 4) {
    const rgb = [data[i], data[i + 1], data[i + 2]];
    const [, s, l] = rgbToHsl(rgb);
    const weight = l > 0.93 && s < 0.15 ? 0.15 : 1;
    const name = nearestColor(rgb);
    votes[name] = (votes[name] || 0) + weight;
  }
  return Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
}

$('u-go').addEventListener('click', () => {
  const category = $('u-category').value, color = $('u-color').value, style = $('u-style').value;
  showResults({ id: 'mine', title: `Your ${color} ${category}`, category, color, styles: [style], price: 0, img: uploadedSrc });
});

// ---- results ----
function showResults(item) {
  anchor = item;
  $('start').classList.add('hidden');
  $('results').classList.remove('hidden');
  const thumb = item.img ? `<img src="${item.img}" alt="">` : garmentSvg(item.category, COLORS[item.color].hex);
  $('anchor').innerHTML = `<div class="thumb">${thumb}</div>
    <div><strong>${item.title}</strong><small>${cap(item.category)} · ${item.styles.map(cap).join(', ')}</small></div>`;
  renderOutfits();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderOutfits() {
  const style = $('r-style').value || null;
  const maxBudget = Number($('r-budget').value) || Infinity;
  const outfits = buildOutfits(anchor, { count: 5, style, maxBudget });
  $('outfits').innerHTML = outfits.length ? outfits.map((o, i) => `
    <article class="outfit">
      <div class="outfit-head"><strong>Look ${i + 1}</strong>
        <span><span class="score">${o.score}% match</span> · $${o.total.toFixed(2)}</span></div>
      <p class="why">${cap(o.why)}.</p>
      <div class="grid">${o.items.map((p) => itemCard(p, 'a')).join('')}</div>
    </article>`).join('') : '<p class="empty">No looks fit these filters. Try another vibe or a bigger budget.</p>';
}
$('r-style').addEventListener('change', renderOutfits);
$('r-budget').addEventListener('change', renderOutfits);
$('back').addEventListener('click', () => {
  $('results').classList.add('hidden');
  $('start').classList.remove('hidden');
});

renderCatalog();
