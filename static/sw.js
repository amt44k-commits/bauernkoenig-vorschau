/* Service Worker Bauern König.
   Strategie: Netz zuerst (Shop-Daten immer frisch), Cache als Offline-Fallback.
   Statische Assets (Bilder, CSS, Icons) cache-first. */
const CACHE = 'bk-v1';
const PRECACHE = ['/', '/bauernkoenig-vorschau/static/favicon.svg', '/bauernkoenig-vorschau/static/img/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // API und Bestellungen NIE cachen
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/bestellung') ||
      url.pathname.startsWith('/admin') || url.pathname.startsWith('/stripe')) return;

  if (url.pathname.startsWith('/bauernkoenig-vorschau/static/')) {
    // cache-first fuer Assets
    e.respondWith(
      caches.match(e.request).then((hit) => hit ||
        fetch(e.request).then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return resp;
        }))
    );
    return;
  }
  // network-first fuer Seiten
  e.respondWith(
    fetch(e.request).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return resp;
    }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('/')))
  );
});
