// "Style it": pick a SHEIN item (or upload your own piece) and get outfits around it.
import { CATALOG, CATEGORIES, STYLES } from '../catalog.js';
import { COLORS } from '../colors.js';
import { buildOutfits } from '../matcher.js';
import { personalScore } from '../profile.js';
import { itemBoost } from '../stylist.js';
import { dominantColor, loadImage } from '../vision.js';
import { $, cap, opts, itemCard, lookCard, thumb } from '../ui.js';

export function render(el, ctx) {
  const p = ctx.profile;
  let tab = 'browse', upload = null;

  function drawPicker() {
    el.innerHTML = `<section class="card">
      <h2>Style one piece</h2>
      <p class="muted">Pick something you love and we'll build the rest of the outfit.</p>
      <div class="tabs">
        <button class="tab ${tab === 'browse' ? 'active' : ''}" data-tab="browse">SHEIN items</button>
        <button class="tab ${tab === 'upload' ? 'active' : ''}" data-tab="upload">My own piece</button>
      </div>
      ${tab === 'browse' ? `
        <div class="filters">
          <select id="f-category"><option value="">All categories</option>${opts(CATEGORIES)}</select>
          <input id="f-search" type="search" placeholder="Search e.g. satin skirt">
        </div>
        <div class="grid" id="catalog"></div>` : `
        <label class="drop">
          <input type="file" id="file" accept="image/*" hidden>
          ${upload?.img ? `<img src="${upload.img}" alt="">` : '<span>📷 Add a photo of your item</span>'}
        </label>
        <div class="row">
          <label>Category <select id="u-category">${opts(CATEGORIES, upload?.category || 'top')}</select></label>
          <label>Color <select id="u-color">${opts(Object.keys(COLORS), upload?.color || 'black')}</select></label>
          <label>Style <select id="u-style">${opts(STYLES, upload?.style || p.styles[0] || 'casual')}</select></label>
        </div>
        <button class="primary" id="u-go">Style it</button>`}
    </section>`;
    el.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; drawPicker(); }));
    if (tab === 'browse') {
      const list = () => {
        const cat = $('f-category').value, q = $('f-search').value.trim().toLowerCase();
        let items = CATALOG.filter((x) => (!cat || x.category === cat) && (!q || x.title.toLowerCase().includes(q)));
        if (!cat && !q) items = items.filter((x, i, all) => all.findIndex((y) => y.name === x.name) === i).slice(0, 60);
        $('catalog').innerHTML = items.map((x) => itemCard(x, { mode: 'pick' })).join('') || '<p class="empty">Nothing found</p>';
      };
      $('f-category').addEventListener('change', list);
      $('f-search').addEventListener('input', list);
      $('catalog').addEventListener('click', (e) => {
        const b = e.target.closest('.item');
        if (b) drawResults(CATALOG.find((x) => x.id === b.dataset.id));
      });
      list();
    } else {
      $('file').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const img = await loadImage(file);
        upload = { ...readUpload(), img: img.src, color: dominantColor(img) };
        drawPicker();
      });
      $('u-go').addEventListener('click', () => {
        const u = { ...upload, ...readUpload() };
        drawResults({ id: 'mine', title: `Your ${u.color} ${u.category}`, category: u.category, color: u.color, styles: [u.style], cuts: [], price: 0, img: u.img });
      });
    }
  }

  const readUpload = () => ({ category: $('u-category').value, color: $('u-color').value, style: $('u-style').value });

  function drawResults(anchor) {
    const outfits = buildOutfits(anchor, { count: 5, maxBudget: p.budget || Infinity, boost: (x) => itemBoost(x, p) })
      .map((o) => ({ ...o, ...personalScore([anchor, ...o.items], p), items: o.items }))
      .sort((a, b) => b.score - a.score);
    el.innerHTML = `<section class="card">
      <div class="anchor">${thumb(anchor)}<div><strong>${anchor.title}</strong><small>${cap(anchor.category)} · ${anchor.styles.map(cap).join(', ')}</small></div></div>
      ${outfits.map((o, i) => lookCard(o, { title: `Look ${i + 1}`, closet: p.closet })).join('') || '<p class="empty">No looks within your budget.</p>'}
      <button class="ghost" id="back">← Pick another piece</button>
    </section>`;
    $('back').addEventListener('click', drawPicker);
    window.scrollTo(0, 0);
  }

  drawPicker();
}
