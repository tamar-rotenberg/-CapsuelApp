// Profile summary, closet ("I own this") and re-taking the quiz.
import { CATALOG, CATEGORIES } from '../catalog.js';
import { SEASONS, BODY_SHAPES } from '../profile.js';
import { clearProfile } from '../store.js';
import { $, cap, opts, swatches, itemCard } from '../ui.js';

export function render(el, ctx) {
  const p = ctx.profile;
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

  $('redo').addEventListener('click', () => ctx.go('onboarding'));
  $('retrain').addEventListener('click', () => { ctx.startStep = 'swipe'; ctx.go('onboarding'); });
  $('reset').addEventListener('click', () => { clearProfile(); ctx.profile = null; ctx.go('onboarding'); });
}
