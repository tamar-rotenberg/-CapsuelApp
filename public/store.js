// Profile + closet persistence (per browser). Wrapped so private mode never breaks the app.
import { emptyTaste } from './profile.js';

const KEY = 'capsule.profile.v1';

export function loadProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY));
    if (p) return { taste: emptyTaste(), closet: [], styles: [], ...p };
  } catch {}
  return null;
}

export function saveProfile(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function clearProfile() {
  try { localStorage.removeItem(KEY); } catch {}
}
