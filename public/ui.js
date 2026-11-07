// Shared rendering helpers.
import { COLORS } from './colors.js';
import { garmentSvg } from './icons.js';

export const $ = (id) => document.getElementById(id);
export const cap = (s) => s[0].toUpperCase() + s.slice(1);
export const money = (n) => `$${n.toFixed(2)}`;
export const opts = (list, sel) => list.map((v) => `<option value="${v}" ${v === sel ? 'selected' : ''}>${cap(v)}</option>`).join('');

export function thumb(p) {
  return `<div class="thumb">${p.img ? `<img src="${p.img}" alt="">` : garmentSvg(p.category, COLORS[p.color].hex)}</div>`;
}

/** A product tile. mode 'shop' links to SHEIN, 'pick' is a button. */
export function itemCard(p, { mode = 'shop', owned = false } = {}) {
  const inner = `${thumb(p)}<span class="t">${p.title}</span>
    <span class="p">${owned ? '<span class="own">You own this</span>' : money(p.price)}</span>
    ${mode === 'shop' && !owned ? '<span class="shop">Shop on SHEIN ↗</span>' : ''}`;
  return mode === 'shop'
    ? `<a class="item" href="${p.url}" target="_blank" rel="noopener">${inner}</a>`
    : `<button class="item" data-id="${p.id}">${inner}</button>`;
}

/** A full look with score, reasons and shoppable items. */
export function lookCard(look, { title, closet = [], actions = null, index = 0 } = {}) {
  const toBuy = look.items.filter((p) => !closet.includes(p.id));
  const total = toBuy.reduce((s, p) => s + p.price, 0);
  const btns = {
    rate: `<button class="act" data-act="dislike" data-i="${index}" aria-label="Not for me">✕</button>
      <button class="act ${look.saved ? 'on' : ''}" data-act="save" data-i="${index}" aria-label="Save look">♥</button>`,
    remove: `<button class="act" data-act="remove" data-i="${index}" aria-label="Remove">Remove</button>`,
  }[actions] || '';
  return `<article class="outfit">
    <div class="outfit-head"><strong>${title}</strong>
      <span><span class="score">${look.score}% for you</span> · ${money(total)}</span></div>
    ${look.reasons?.length ? `<p class="why">${cap(look.reasons.join(' · '))}</p>` : ''}
    <div class="grid look">${look.items.map((p) => itemCard(p, { owned: closet.includes(p.id) })).join('')}</div>
    ${btns ? `<div class="look-actions">${btns}</div>` : ''}
  </article>`;
}

/** Stable id for a look, from its items. */
export const lookId = (items) => items.map((p) => p.id).sort().join(',');

export function swatches(colors, cls = '') {
  return `<div class="swatches ${cls}">${colors.map((c) => `<span title="${c}" style="background:${COLORS[c].hex}"></span>`).join('')}</div>`;
}
