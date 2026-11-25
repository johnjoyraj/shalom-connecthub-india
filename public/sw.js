// SHALOM CONNECTHUB INDIA — Safe Service Worker
// Strictly NEVER caches private documents, payment endpoints, auth tokens, or private dashboards.

const CACHE_VERSION = 'schi-static-v1';
const STATIC_SHELL_ASSETS = ['/', '/offline.html', '/manifest.webmanifest', '/icons/icon-192.svg', '/icons/icon-512.svg'];

const BLOCKED_CACHE_PREFIXES = [
  '/dashboard',
  '/admin',
  '/employer',
  '/owner',
  '/school-dashboard',
  '/login',
  '/register',
  '/verify-otp',
  '/forgot-password',
  '/complete-profile',
];

const BLOCKED_SUBSTRINGS = [
  '/auth/v1/',
  '/rest/v1/',
  '/functions/v1/',
  '/storage/v1/object/authenticated',
  'private-documents',
  'razorpay',
  'payments',
  'invoices',
];

function isSafeToCache(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  const path = url.pathname.toLowerCase();
  if (BLOCKED_CACHE_PREFIXES.some((p) => path.startsWith(p))) return false;
  if (BLOCKED_SUBSTRINGS.some((s) => url.href.toLowerCase().includes(s))) return false;
  return path.startsWith('/assets/') || path.startsWith('/icons/') || path === '/manifest.webmanifest' || path === '/offline.html';
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  if (!isSafeToCache(request)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : { title: 'SHALOM CONNECTHUB INDIA', body: 'You have a new platform update.' };
  event.waitUntil(
    self.registration.showNotification(payload.title || 'SHALOM CONNECTHUB INDIA', {
      body: payload.body || '',
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
    })
  );
});
