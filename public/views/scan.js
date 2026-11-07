// Outfit scanner: photo of what you're wearing → score /100, reasons, one SHEIN swap.
import { COLORS } from '../colors.js';
import { scanOutfit } from '../stylist.js';
import { dominantColor, loadImage } from '../vision.js';
import { $, opts, itemCard } from '../ui.js';

// Where we look for the top and bottom in a full-body photo.
const TOP = { x: 0.3, y: 0.22, w: 0.4, h: 0.25 };
const BOTTOM = { x: 0.3, y: 0.58, w: 0.4, h: 0.25 };

export function render(el, ctx) {
  let photo = null, colors = null;

  function draw() {
    const res = colors && scanOutfit(colors, ctx.profile);
    el.innerHTML = `<section class="card">
      <h2>Rate my outfit</h2>
      <p class="muted">Upload a full-body photo. We check color harmony and your palette.</p>
      <label class="drop scan">
        <input type="file" id="photo" accept="image/*" hidden>
        ${photo ? `<div class="scan-img"><img src="${photo}" alt="">${box(TOP, 'Top')}${box(BOTTOM, 'Bottom')}</div>` : '<span>📷 Add outfit photo</span>'}
      </label>
      ${colors ? `
        <div class="row">
          <label>Top color <select id="c-top">${opts(Object.keys(COLORS), colors.top)}</select></label>
          <label>Bottom color <select id="c-bottom">${opts(Object.keys(COLORS), colors.bottom)}</select></label>
        </div>
        <div class="score-ring" style="--p:${res.score}"><span>${res.score}</span><small>/100</small></div>
        <ul class="notes">${res.notes.map((n) => `<li class="${n.ok ? 'ok' : 'bad'}">${n.ok ? '✓' : '!'} ${n.text}</li>`).join('')}</ul>
        ${res.swap ? `<div class="swap">
          <p><strong>Try this ${res.swap.replace} instead</strong> → ${res.swap.newScore}/100</p>
          <div class="grid">${itemCard(res.swap.item)}</div>
        </div>` : ''}` : ''}
    </section>`;
    $('photo').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const img = await loadImage(file);
      photo = img.src;
      colors = { top: dominantColor(img, TOP), bottom: dominantColor(img, BOTTOM) };
      draw();
    });
    if (colors) {
      ['top', 'bottom'].forEach((k) => $(`c-${k}`).addEventListener('change', (e) => { colors[k] = e.target.value; draw(); }));
    }
  }
  draw();
}

function box({ x, y, w, h }, label) {
  return `<span class="box" style="left:${x * 100}%;top:${y * 100}%;width:${w * 100}%;height:${h * 100}%">${label}</span>`;
}
