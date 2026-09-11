// Service Worker — Simulador Náutico PWA
// Compatible con vite-plugin-pwa injectManifest strategy
// Los assets pre-cacheables son inyectados por el plugin en el build

const CACHE_NAME = 'nautico-v1';
const OFFLINE_URL = './simulador.html';

// Lista de assets a pre-cachear (inyectada por vite-plugin-pwa en el build)
// eslint-disable-next-line no-undef
const PRECACHE_MANIFEST = self.__WB_MANIFEST || [];

// ── Install: pre-cache todos los assets ─────────────────────────────
self.addEventListener('install', (event) => {
  const urlsToCache = [
    OFFLINE_URL,
    ...PRECACHE_MANIFEST.map(entry => typeof entry === 'string' ? entry : entry.url)
  ];
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll falla si alguna URL falla — usamos add individual para resilencia
      return Promise.allSettled(urlsToCache.map(url => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: limpiar caches viejos ─────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: estrategia híbrida ────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar misma origen
  if (url.origin !== location.origin) return;

  // HTML: Network first, fallback a cache
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // JS/CSS/Fonts/Assets: Cache first, fallback a network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});

// ── Message: skip waiting manual ────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
