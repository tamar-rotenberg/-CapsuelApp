// Dressly-style onboarding: color analysis → body shape → style & budget → swipe training.
import { STYLES } from '../catalog.js';
import { SEASONS, BODY_SHAPES, seasonFrom, skinToAnswers, shapeFromMeasurements, emptyTaste, learn } from '../profile.js';
import { swipeDeck } from '../stylist.js';
import { skinColor, loadImage } from '../vision.js';
import { cap, swatches, thumb } from '../ui.js';

const STEPS = ['colors', 'body', 'style', 'swipe'];
const SWIPES = 20;

export function render(el, ctx) {
  const prev = ctx.profile || {};
  const s = {
    step: ctx.startStep || 'colors',
    answers: prev.answers || { warmth: null, depth: null, chroma: null },
    selfie: null,
    shape: prev.shape || null,
    styles: [...(prev.styles || [])],
    budget: prev.budget ?? 90,
    taste: ctx.startStep === 'swipe' ? emptyTaste() : prev.taste || emptyTaste(),
    deck: null,
    i: 0,
  };
  ctx.startStep = null;

  const season = () => {
    const a = s.answers;
    return a.warmth === null || a.depth === null || a.chroma === null ? null : seasonFrom(a);
  };
  const finish = () => {
    ctx.setProfile({ ...prev, answers: s.answers, season: season(), shape: s.shape, styles: s.styles, budget: s.budget, taste: s.taste, closet: prev.closet || [] });
    ctx.go('feed');
  };
  const next = () => {
    const i = STEPS.indexOf(s.step);
    if (i === STEPS.length - 1) return finish();
    s.step = STEPS[i + 1];
    draw();
    window.scrollTo(0, 0);
  };

  function progress() {
    const i = STEPS.indexOf(s.step);
    return `<div class="progress">${STEPS.map((_, k) => `<span class="${k <= i ? 'on' : ''}"></span>`).join('')}</div>`;
  }

  function choice(q, v, label, cur) {
    return `<button class="opt ${cur === v ? 'active' : ''}" data-q="${q}" data-v="${v}">${label}</button>`;
  }

  function draw() {
    if (s.step === 'colors') {
      const a = s.answers, sz = season();
      el.innerHTML = `<section class="card">${progress()}
        <h2>Your colors</h2>
        <p class="muted">We find your color season, the shades that light up your face.</p>
        <label class="drop small" id="selfie-drop">
          <input type="file" accept="image/*" capture="user" id="selfie" hidden>
          ${s.selfie ? `<img src="${s.selfie}" alt="">` : '<span>📷 Take a selfie in daylight (optional)</span>'}
        </label>
        ${s.selfieNote ? `<p class="muted small">${s.selfieNote}</p>` : ''}
        <h3>The veins on your wrist look…</h3>
        <div class="opts">${choice('warmth', -1, 'Blue / purple', a.warmth)}${choice('warmth', 0, 'Both / not sure', a.warmth)}${choice('warmth', 1, 'Green / olive', a.warmth)}</div>
        <h3>Your natural hair & skin are…</h3>
        <div class="opts">${choice('depth', -1, 'Light', a.depth)}${choice('depth', 0, 'Medium', a.depth)}${choice('depth', 1, 'Deep', a.depth)}</div>
        <h3>You look best in…</h3>
        <div class="opts">${choice('chroma', -1, 'Soft, muted colors', a.chroma)}${choice('chroma', 1, 'Clear, bright colors', a.chroma)}</div>
        ${sz ? `<div class="result"><small>Your season</small><strong>${sz}</strong>${swatches(SEASONS[sz].best)}</div>` : ''}
        <button class="primary" id="next" ${sz ? '' : 'disabled'}>Continue</button>
      </section>`;
      el.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => {
        s.answers[b.dataset.q] = Number(b.dataset.v);
        draw();
      }));
      el.querySelector('#selfie').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const img = await loadImage(file);
        s.selfie = img.src;
        const skin = skinColor(img);
        if (skin) {
          const { warmth, depth } = skinToAnswers(skin);
          s.answers.warmth = Math.round(warmth);
          s.answers.depth = Math.round(depth);
          s.selfieNote = 'We read your undertone and depth from the photo. Adjust below if it looks off.';
        } else {
          s.selfieNote = 'Could not read skin tone from this photo. Please answer below.';
        }
        draw();
      });
    }

    if (s.step === 'body') {
      el.innerHTML = `<section class="card">${progress()}
        <h2>Your shape</h2>
        <p class="muted">We favor cuts that flatter your body shape.</p>
        <div class="shapes">${Object.entries(BODY_SHAPES).map(([k, b]) => `
          <button class="opt shape ${s.shape === k ? 'active' : ''}" data-shape="${k}"><strong>${b.label}</strong><small>${b.tip}</small></button>`).join('')}</div>
        <details><summary>Not sure? Use measurements</summary>
          <div class="row">
            <label>Bust<input type="number" id="m-bust" inputmode="decimal"></label>
            <label>Waist<input type="number" id="m-waist" inputmode="decimal"></label>
            <label>Hips<input type="number" id="m-hip" inputmode="decimal"></label>
          </div>
          <button class="ghost-btn" id="calc">Find my shape</button>
        </details>
        <button class="primary" id="next" ${s.shape ? '' : 'disabled'}>Continue</button>
      </section>`;
      el.querySelectorAll('[data-shape]').forEach((b) => b.addEventListener('click', () => { s.shape = b.dataset.shape; draw(); }));
      el.querySelector('#calc').addEventListener('click', () => {
        const v = ['bust', 'waist', 'hip'].map((k) => Number(el.querySelector(`#m-${k}`).value));
        if (v.every((x) => x > 0)) { s.shape = shapeFromMeasurements(...v); draw(); }
      });
    }

    if (s.step === 'style') {
      el.innerHTML = `<section class="card">${progress()}
        <h2>Your style</h2>
        <p class="muted">Pick everything you like.</p>
        <div class="opts wrap">${STYLES.map((st) => `<button class="opt ${s.styles.includes(st) ? 'active' : ''}" data-style="${st}">${cap(st)}</button>`).join('')}</div>
        <h3>Budget per outfit</h3>
        <div class="opts">${[40, 60, 90, 0].map((b) => `<button class="opt ${s.budget === b ? 'active' : ''}" data-budget="${b}">${b ? `$${b}` : 'No limit'}</button>`).join('')}</div>
        <button class="primary" id="next" ${s.styles.length ? '' : 'disabled'}>Continue</button>
      </section>`;
      el.querySelectorAll('[data-style]').forEach((b) => b.addEventListener('click', () => {
        const st = b.dataset.style;
        s.styles = s.styles.includes(st) ? s.styles.filter((x) => x !== st) : [...s.styles, st];
        draw();
      }));
      el.querySelectorAll('[data-budget]').forEach((b) => b.addEventListener('click', () => { s.budget = Number(b.dataset.budget); draw(); }));
    }

    if (s.step === 'swipe') {
      s.deck ||= swipeDeck(SWIPES);
      const look = s.deck[s.i];
      el.innerHTML = `<section class="card">${progress()}
        <h2>Train your stylist</h2>
        <p class="muted">Would you wear this? <span class="counter">${Math.min(s.i + 1, SWIPES)} / ${SWIPES}</span></p>
        <div class="swipe-card" id="swipe-card">
          <div class="swipe-grid">${look.items.map((p) => `<div>${thumb(p)}<small>${p.title}</small></div>`).join('')}</div>
        </div>
        <div class="swipe-actions">
          <button class="round no" data-like="0" aria-label="Not for me">✕</button>
          <button class="round yes" data-like="1" aria-label="Love it">♥</button>
        </div>
        <button class="ghost" id="skip">Skip training</button>
      </section>`;
      const vote = (liked) => {
        s.taste = learn(s.taste, look.items, liked);
        s.i++;
        if (s.i >= s.deck.length) finish(); else draw();
      };
      el.querySelectorAll('[data-like]').forEach((b) => b.addEventListener('click', () => vote(b.dataset.like === '1')));
      el.querySelector('#skip').addEventListener('click', finish);
      enableDrag(el.querySelector('#swipe-card'), vote);
    }

    el.querySelector('#next')?.addEventListener('click', next);
  }

  draw();
}

// Swipe left/right with a finger or mouse.
function enableDrag(card, vote) {
  let x0 = null;
  card.addEventListener('pointerdown', (e) => { x0 = e.clientX; card.setPointerCapture(e.pointerId); });
  card.addEventListener('pointermove', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
  });
  card.addEventListener('pointerup', (e) => {
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 90) vote(dx > 0);
    else card.style.transform = '';
  });
}
