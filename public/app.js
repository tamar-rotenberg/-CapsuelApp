// App shell: holds the profile, switches between views.
import { loadProfile, saveProfile } from './store.js';
import { $ } from './ui.js';
import * as onboarding from './views/onboarding.js';
import * as feed from './views/feed.js';
import * as styleit from './views/styleit.js';
import * as scan from './views/scan.js';
import * as capsule from './views/capsule.js';
import * as me from './views/me.js';

const VIEWS = { onboarding, feed, styleit, scan, capsule, me };

const ctx = {
  profile: loadProfile(),
  setProfile(p) {
    ctx.profile = p;
    saveProfile(p);
    updateChrome();
  },
  go(name) {
    const view = VIEWS[name] ? name : 'feed';
    const el = $('view');
    el.innerHTML = '';
    el.dataset.view = view;
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    updateChrome();
    VIEWS[view].render(el, ctx);
    window.scrollTo(0, 0);
  },
};

function updateChrome() {
  const onboarded = !!ctx.profile?.season;
  const inOnboarding = $('view').dataset.view === 'onboarding';
  $('tabs').hidden = !onboarded || inOnboarding;
  const chip = $('profile-chip');
  chip.hidden = !onboarded || inOnboarding;
  if (onboarded) chip.textContent = ctx.profile.season;
}

document.querySelectorAll('#tabs button').forEach((b) => b.addEventListener('click', () => ctx.go(b.dataset.view)));
$('profile-chip').addEventListener('click', () => ctx.go('me'));

ctx.go(ctx.profile?.season ? 'feed' : 'onboarding');

// Installable + works offline.
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
