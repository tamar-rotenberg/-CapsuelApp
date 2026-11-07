// Capsule wardrobe: a few pieces in your palette that mix into many outfits.
import { buildCapsule } from '../stylist.js';
import { itemCard, money } from '../ui.js';

export function render(el, ctx) {
  const p = ctx.profile;
  let budget = 200;
  const draw = () => {
    const c = buildCapsule(p, { budget });
    el.innerHTML = `<section class="card">
      <h2>Capsule wardrobe</h2>
      <p class="muted">${c.items.length} pieces in your ${p.season} palette that mix into <strong>${c.outfits.length} outfits</strong>. Pieces you own are used first.</p>
      <div class="opts">${[100, 150, 200, 300].map((b) => `<button class="opt ${b === budget ? 'active' : ''}" data-b="${b}">$${b}</button>`).join('')}</div>
      <p class="total">Total to buy: <strong>${money(c.spent)}</strong></p>
      <div class="grid">${c.items.map((x) => itemCard(x, { owned: p.closet.includes(x.id) })).join('')}</div>
      <h3>Some outfits it makes</h3>
      ${c.outfits.slice(0, 6).map((o) => `<div class="mini-look">${o.items.map((x) => x.title).join(' + ')} <span class="score">${o.score}%</span></div>`).join('')}
    </section>`;
    el.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => { budget = Number(b.dataset.b); draw(); }));
  };
  draw();
}
