/*
 * Simple service worker to provide offline support. It caches the core
 * application shell on installation and serves it from cache when offline.
 * This allows the app to be added to the home screen and used without
 * a network connection. Future enhancements can expand on this for
 * background sync and more complex caching strategies.
 */

const CACHE_NAME = 'pv-coach-cache-v2';
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
  'manifest.json',
  'icon.png'
].map(path => {
  // ensure leading slash and join with base path
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return BASE_PATH + normalized;
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('activate', event => {
  // remove old caches if any
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});