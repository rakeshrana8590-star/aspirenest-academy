const CACHE_PREFIX = 'aspirenest-';
const CACHE_NAME = 'aspirenest-academy-shell-v3-intellibook';
const APP_SHELL = [
  '/',
  '/index.html',
  '/vendor/pdfjs/pdf.worker.mjs',
  '/vendor/pdfjs/pdf.mjs',
  '/learning-drive-v8/intellibook.js',
  '/learning-drive-v8/intellibook.css',
  '/intellibook.js',
  '/intellibook.css',
  '/styles.css',
  '/admin.css',
  '/v8-experiences.css',
  '/app.js',
  '/admin.js',
  '/v8-experiences.js',
  '/logo192.png',
  '/logo512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(APP_SHELL.map(url => cache.add(new Request(url, { cache: 'reload' }))))
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Identity files must never be served from an old role-specific cache.
  if (url.pathname === '/manifest.webmanifest' || url.pathname === '/manifest.json' || url.pathname === '/sw.js') {
    event.respondWith(
      fetch(new Request(request, { cache: 'reload' }))
        .catch(() => caches.match(request))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/') || caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
      return cached || network;
    })
  );
});
