/* 트쌤 service worker — offline shell + runtime caching. Bump VERSION on every release. */
const VERSION = 'tsam-v4';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/core.js', 'js/sync.js', 'js/data.program.js', 'js/data.diet.js', 'js/data.coach.js', 'js/data.supp.js', 'js/data.reco.js', 'js/data.exercises.js', 'js/data.nutrition.js', 'js/engine.js', 'js/charts.js',
  'js/ocr.js', 'js/alarm.js', 'js/ui.js', 'js/ui.home.js', 'js/ui.plan.js', 'js/ui.session.js', 'js/ui.lib.js',
  'js/ui.food.js', 'js/ui.body.js', 'js/ui.rec.js', 'js/ui.coach.js', 'js/ui.day.js', 'js/app.js',
  'vendor/fonts/wanted-sans/WantedSansVariable.css', 'vendor/fonts/chakra-petch/chakra-petch.css',
  'assets/icons/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // pages: network first, fall back to cached shell
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put('index.html', cp)); return r; }).catch(() => caches.match('index.html')));
    return;
  }
  // code: stale-while-revalidate so updates arrive on next launch
  if (/\.(js|css|webmanifest)$/.test(url.pathname) && !url.pathname.includes('/vendor/tesseract/')) {
    e.respondWith(caches.open(VERSION).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // images, fonts, OCR engine & language data: cache first
  e.respondWith(caches.open(VERSION).then(async (c) => {
    const hit = await c.match(req);
    if (hit) return hit;
    const r = await fetch(req);
    if (r.ok) c.put(req, r.clone());
    return r;
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./#home');
  }));
});
