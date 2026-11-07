// "For you": complete outfits ranked by the user's profile.
import { buildFeed } from '../stylist.js';
import { BODY_SHAPES } from '../profile.js';
import { lookCard, cap } from '../ui.js';

export function render(el, ctx) {
  const p = ctx.profile;
  let count = 6;
  const draw = () => {
    const feed = buildFeed(p, { count });
    el.innerHTML = `<section>
      <div class="intro">
        <h2>For you</h2>
        <p class="muted">${p.season} · ${BODY_SHAPES[p.shape]?.label || ''} · ${p.styles.map(cap).join(', ')}${p.budget ? ` · under $${p.budget}` : ''}</p>
      </div>
      ${feed.map((look, i) => lookCard(look, { title: `Look ${i + 1}`, closet: p.closet })).join('') || '<p class="empty">No looks yet. Try a bigger budget in Me.</p>'}
      ${feed.length === count ? '<button class="primary" id="more">Show more looks</button>' : ''}
    </section>`;
    el.querySelector('#more')?.addEventListener('click', () => { count += 6; draw(); });
  };
  draw();
}
