const CACHE_NAME = 'opsflow-it-v3';
const STATIC_CACHE = 'opsflow-static-v3';

// Asset utama yang di-precache saat install
const PRECACHE_ASSETS = [
  '/',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-maskable-512x512.png',
];

// ==================== INSTALL ====================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// ==================== ACTIVATE ====================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ==================== FETCH (Network-First Strategy) ====================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Lewati request non-GET
  if (event.request.method !== 'GET') return;

  // Lewati request ke Supabase / API eksternal (harus selalu online)
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/api/') ||
    url.pathname.includes('/_next/webpack-hmr') ||
    url.pathname.includes('/api/auth/')
  ) {
    return;
  }

  // Next.js static assets (_next/static) → Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Halaman navigasi → Network First, fallback ke cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            // Fallback offline page jika ada
            return caches.match('/');
          });
        })
    );
    return;
  }

  // Lainnya (gambar, font, dll) → Stale While Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// ==================== PUSH NOTIFICATION (future ready) ====================
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'OpsFlow IT', {
    body: data.body || 'Ada notifikasi baru.',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    data: { url: data.url || '/' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
