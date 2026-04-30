const CACHE_VERSION = 'craftfocus-pwa-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

function getBasePath() {
  const scopePath = new URL(self.registration.scope).pathname;
  return scopePath.endsWith('/') ? scopePath.slice(0, -1) : scopePath;
}

function withBase(path) {
  const base = getBasePath();
  return `${base}${path}`;
}

const PRECACHE_PATHS = [
  '/',
  '/index.html',
  '/home.html',
  '/focus.html',
  '/room.html',
  '/crafts.html',
  '/friends.html',
  '/profile.html',
  '/exchanges.html',
  '/manifest.webmanifest',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      const urls = PRECACHE_PATHS.map(withBase);
      return Promise.allSettled(urls.map((url) => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('craftfocus-pwa-') && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(pathname) {
  return (
    pathname.includes('/_expo/static/') ||
    /\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff|woff2|ttf|webmanifest)$/i.test(pathname)
  );
}

function shouldBypass(requestUrl, request) {
  if (request.method !== 'GET') return true;
  if (requestUrl.origin !== self.location.origin) return true;

  const path = requestUrl.pathname;
  if (path.includes('/rest/v1/') || path.includes('/auth/v1/') || path.includes('/storage/v1/')) {
    return true;
  }

  return false;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    const fallback = await caches.match(withBase('/index.html'));
    if (fallback) return fallback;

    const rootFallback = await caches.match(withBase('/'));
    if (rootFallback) return rootFallback;
    throw new Error('No cached navigation fallback');
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (shouldBypass(requestUrl, request)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(requestUrl.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
