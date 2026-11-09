// Vela – Service Worker: App offline verfügbar. /api wird nie zwischengespeichert.
const CACHE = 'vela-v3';
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png'];

// Beim Installieren die Startseite laden und alle darin verlinkten Build-Dateien (/assets/…) mitspeichern,
// damit die App schon nach dem ersten Besuch offline startet.
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(SHELL);
    try {
      const html = await (await fetch('/', { cache: 'no-store' })).text();
      const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]))];
      await c.addAll(assets);
    } catch { /* beim nächsten Besuch */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;
  // Seiten: zuerst Netz (neue Version), sonst Cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('/', copy));
        return res;
      }).catch(() => caches.match('/', { ignoreVary: true })),
    );
    return;
  }
  // Assets & Schriften: Cache zuerst
  if (url.origin === location.origin || url.host.endsWith('fonts.googleapis.com') || url.host.endsWith('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(req, { ignoreVary: true }).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
  }
});
