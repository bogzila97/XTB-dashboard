/* XTB Tracker service worker.
   Cache-first for the app shell so it works fully offline once installed.
   Bump CACHE_NAME any time you edit index.html/libs so phones pick up the change. */
const CACHE_NAME = 'xtb-tracker-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './libs/xlsx.full.min.js',
  './libs/chart.umd.min.js',
  './libs/chartjs-plugin-datalabels.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Cache-first, falling back to network, then updating the cache in the background.
   Google Fonts requests are left to the network/browser cache as-is (best effort;
   the app degrades gracefully to system fonts if unreachable). */
self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // don't intercept cross-origin (fonts, FX API)

  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(resp => {
        if(resp && resp.status === 200){
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
