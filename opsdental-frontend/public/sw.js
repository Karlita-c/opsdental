const CACHE_NAME = 'opsdental-v1';

// Recursos estáticos que se cachean al instalar el SW
const STATIC_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/logo.png',
];

// Rutas de API que NUNCA se cachean
const API_PATTERNS = [
  /\/api\//,
  /localhost:8000/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No cachear peticiones a la API ni POST/PUT/DELETE
  if (
    API_PATTERNS.some((p) => p.test(request.url)) ||
    request.method !== 'GET'
  ) {
    return;
  }

  // Estrategia: Network First para páginas, Cache First para assets estáticos
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/.test(url.pathname);

  if (isStaticAsset) {
    // Cache First: sirve del cache, actualiza en background
    event.respondWith(
      caches.match(request).then(
        (cached) => cached || fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
      )
    );
  } else {
    // Network First: intenta red, cae a cache si hay error de conexión
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
  }
});

// Notificaciones push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'OpsDental', body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'OpsDental', {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: data.tag || 'opsdental-notif',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      const existing = windowClients.find((w) => w.url === url);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
