/*
 * Simple service worker to provide offline support. It caches the core
 * application shell on installation and serves it from cache when offline.
 * This allows the app to be added to the home screen and used without
 * a network connection. Future enhancements can expand on this for
 * background sync and more complex caching strategies.
 */

const APP_VERSION = '1.0.1';
// Updated cache name for Taykof. Increment APP_VERSION whenever
// making changes to the cached files so the service worker picks up the new assets.
const CACHE_NAME = `taykof-cache-v${APP_VERSION}`;
/*
 * Determine the base path for caching resources. When deployed under a
 * subpath (e.g. GitHub Pages), the service worker will be located at
 * `<origin>/<repo-name>/service-worker.js`. We derive the base path by
 * removing the filename from the pathname. For example, if the service
 * worker is served at `/repo-name/service-worker.js`, BASE_PATH will be
 * `/repo-name/`. When served at the root it will be `/`.
 */
const BASE_PATH = (self.location.pathname || '/').replace(/service-worker\.js$/, '');
const URLS_TO_CACHE = [
  '',
  'index.html',
  'styles.css',
  'app.js',
  'storage.js',
  // include new icons for the PWA; these are referenced in the manifest
  'icon-192.png',
  'icon-512.png'
].map(path => {
  // ensure leading slash and join with base path
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return BASE_PATH + normalized;
});

const ASSET_REFRESH_PATTERN = /\.(?:js|css)$/i;
const NON_CACHEABLE_PATHS = new Set([
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}service-worker.js`,
]);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', event => {
  // Claim any clients immediately so the service worker is controlling pages as soon as possible.
  event.waitUntil(
    (async () => {
      // Remove old caches that don't match the current CACHE_NAME
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const requestPath = new URL(request.url).pathname;

  if (NON_CACHEABLE_PATHS.has(requestPath)) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (ASSET_REFRESH_PATTERN.test(new URL(request.url).pathname)) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request, { cache: 'reload' });
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        }
      })()
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request);
    })
  );
});
