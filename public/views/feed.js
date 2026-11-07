// "For you": complete outfits ranked by the user's profile.
// ♥ saves a look and ✕ hides it; both keep teaching the stylist your taste.
import { buildFeed, OCCASIONS, forOccasion } from '../stylist.js';
import { BODY_SHAPES, learn } from '../profile.js';
import { lookCard, lookId, cap } from '../ui.js';

export function render(el, ctx) {
  let count = 6;
  let occasion = 'everyday';
  let feed = [];

  const draw = () => {
    const p = ctx.profile;
    const hidden = new Set(p.hidden || []);
    const saved = new Set((p.saved || []).map((s) => s.id));
    feed = buildFeed(forOccasion(p, occasion), { count: count + hidden.size })
      .filter((l) => !hidden.has(lookId(l.items)))
      .slice(0, count)
      .map((l) => ({ ...l, saved: saved.has(lookId(l.items)) }));
    el.innerHTML = `<section>
      <div class="intro">
        <h2>For you</h2>
        <p class="muted">${p.season} · ${BODY_SHAPES[p.shape]?.label || ''} · ${p.styles.map(cap).join(', ')}${p.budget ? ` · under $${p.budget}` : ''}</p>
        <div class="opts scroll">${Object.entries(OCCASIONS).map(([k, o]) =>
          `<button class="opt ${k === occasion ? 'active' : ''}" data-occ="${k}">${o.label}</button>`).join('')}</div>
      </div>
      ${feed.map((look, i) => lookCard(look, { title: `Look ${i + 1}`, closet: p.closet, actions: 'rate', index: i })).join('')
        || '<p class="empty">No looks yet. Try a bigger budget in Me.</p>'}
      ${feed.length === count ? '<button class="primary" id="more">Show more looks</button>' : ''}
    </section>`;
  };

  el.addEventListener('click', (e) => {
    const occ = e.target.closest('[data-occ]');
    if (occ) { occasion = occ.dataset.occ; count = 6; return draw(); }
    if (e.target.id === 'more') { count += 6; return draw(); }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    const look = feed[Number(act.dataset.i)];
    const id = lookId(look.items);
    const p = ctx.profile;
    if (act.dataset.act === 'save') {
      const isSaved = (p.saved || []).some((s) => s.id === id);
      ctx.setProfile({
        ...p,
        taste: isSaved ? p.taste : learn(p.taste, look.items, true),
        saved: isSaved
          ? p.saved.filter((s) => s.id !== id)
          : [{ id, ids: look.items.map((x) => x.id), occasion }, ...(p.saved || [])],
      });
      act.classList.toggle('on', !isSaved);
    } else if (act.dataset.act === 'dislike') {
      ctx.setProfile({ ...p, taste: learn(p.taste, look.items, false), hidden: [...(p.hidden || []), id] });
      draw();
    }
  });

  draw();
}
