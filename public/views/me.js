// Profile summary, closet ("I own this") and re-taking the quiz.
import { CATALOG, CATEGORIES } from '../catalog.js';
import { SEASONS, BODY_SHAPES, personalScore } from '../profile.js';
import { OCCASIONS } from '../stylist.js';
import { clearProfile } from '../store.js';
import { shareLook } from '../share.js';
import { $, cap, opts, swatches, itemCard, lookCard } from '../ui.js';

export function render(el, ctx) {
  const p = ctx.profile;
  const byId = new Map(CATALOG.map((x) => [x.id, x]));
  const savedLooks = (p.saved || [])
    .map((s) => ({ ...s, items: s.ids.map((id) => byId.get(id)).filter(Boolean) }))
    .filter((s) => s.items.length)
    .map((s) => ({ ...s, ...personalScore(s.items, p) }));
  const liked = Object.entries(p.taste?.styles || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

  el.innerHTML = `<section class="card">
      <h2>${p.season}</h2>
      <p class="muted">Wear these near your face:</p>${swatches(SEASONS[p.season].best)}
      <p class="muted">Keep these away from your face:</p>${swatches(SEASONS[p.season].avoid, 'avoid')}
      <h3>${BODY_SHAPES[p.shape]?.label || 'Body shape'}</h3>
      <p class="muted">${BODY_SHAPES[p.shape]?.tip || ''}</p>
      <h3>Style</h3>
      <p class="muted">${p.styles.map(cap).join(', ')}${liked.length ? ` · from your swipes you lean ${liked.join(', ')}` : ''}</p>
      <div class="opts">
        <button class="opt" id="redo">Redo quiz</button>
        <button class="opt" id="retrain">Redo swipes</button>
        <button class="opt" id="reset">Reset all</button>
      </div>
    </section>
    <section class="card">
      <h2>Saved looks <small class="muted">(${savedLooks.length})</small></h2>
      ${savedLooks.length
        ? savedLooks.map((l, i) => lookCard(l, { title: OCCASIONS[l.occasion]?.label || 'Look', closet: p.closet, actions: 'remove', index: i })).join('')
        : '<p class="muted">Tap ♥ on a look in For you to save it here.</p>'}
    </section>
    <section class="card">
      <h2>My closet <small class="muted" id="closet-count">(${p.closet.length})</small></h2>
      <p class="muted">Tap items you already own. Outfits and your capsule will use them first.</p>
      <div class="filters"><select id="cl-cat">${opts(CATEGORIES)}</select></div>
      <div class="grid" id="closet"></div>
    </section>`;

  const drawCloset = () => {
    const cat = $('cl-cat').value;
    $('closet').innerHTML = CATALOG.filter((x) => x.category === cat).map((x) =>
      `<div class="own-toggle ${ctx.profile.closet.includes(x.id) ? 'on' : ''}" data-id="${x.id}">${itemCard(x, { mode: 'pick' })}</div>`).join('');
  };
  $('cl-cat').addEventListener('change', drawCloset);
  $('closet').addEventListener('click', (e) => {
    const t = e.target.closest('.own-toggle');
    if (!t) return;
    const id = t.dataset.id;
    const owned = !ctx.profile.closet.includes(id);
    const closet = owned ? [...ctx.profile.closet, id] : ctx.profile.closet.filter((x) => x !== id);
    ctx.setProfile({ ...ctx.profile, closet });
    t.classList.toggle('on', owned);
    $('closet-count').textContent = `(${closet.length})`;
  });
  drawCloset();

  el.addEventListener('click', (e) => {
    const s = e.target.closest('[data-act=share]');
    if (s) {
      const look = savedLooks[Number(s.dataset.i)];
      return shareLook(look, OCCASIONS[look.occasion]?.label ? `${OCCASIONS[look.occasion].label} look` : 'My look');
    }
    const b = e.target.closest('[data-act=remove]');
    if (!b) return;
    const id = savedLooks[Number(b.dataset.i)].id;
    ctx.setProfile({ ...ctx.profile, saved: ctx.profile.saved.filter((s) => s.id !== id) });
    ctx.go('me');
  });

  $('redo').addEventListener('click', () => ctx.go('onboarding'));
  $('retrain').addEventListener('click', () => { ctx.startStep = 'swipe'; ctx.go('onboarding'); });
  $('reset').addEventListener('click', () => { clearProfile(); ctx.profile = null; ctx.go('onboarding'); });
}
