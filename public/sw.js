// Offline support: serve the app files from cache, refresh them in the background.
const CACHE = 'capsule-v2';
const FILES = [
  './', 'index.html', 'styles.css', 'app.js', 'catalog.js', 'colors.js', 'icons.js', 'matcher.js',
  'profile.js', 'store.js', 'stylist.js', 'ui.js', 'vision.js',
  'views/onboarding.js', 'views/feed.js', 'views/styleit.js', 'views/scan.js', 'views/capsule.js', 'views/me.js',
  'manifest.webmanifest', 'icons/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Stale-while-revalidate for same-origin GETs.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(e.request);
    const fresh = fetch(e.request).then((res) => {
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
