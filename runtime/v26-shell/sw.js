const CACHE = 'aspirenest-learning-drive-v26-final-master-pwa-v2-brand';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icons/aspirenest-a-192.png',
  'icons/aspirenest-a-512.png',
  'icons/aspirenest-a-maskable-512.png',
  'integration/aspirenest-adapter.js',
  'vendor/jszip.min.js',
  'assets/templates/AspireNest_Mock_Test_Two_Sheet_Import_Template.xlsx'
];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const shellAsset = event.request.mode === 'navigate' || /\.(?:html|css|js)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (shellAsset) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request, {cache:'no-store'});
        const cache = await caches.open(CACHE);
        cache.put(event.request, fresh.clone());
        return fresh;
      } catch (_) {
        return (await caches.match(event.request)) || (await caches.match('./index.html'));
      }
    })());
    return;
  }
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(async response => {
    const cache = await caches.open(CACHE);
    cache.put(event.request, response.clone());
    return response;
  })));
});
