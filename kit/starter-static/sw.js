// The PWA's service worker: the whole app works offline (it has no server); new files load when online.
const SHELL = ['./', 'index.html', 'static/app.css', 'static/icon.svg', 'js/app.mjs', 'js/store.mjs', 'js/i18n.mjs', 'js/logic/notes.mjs', 'messages/en.json', 'messages/ja.json', 'manifest.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open('app-v1').then(cache => cache.addAll(SHELL))));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); caches.open('app-v1').then(cache => cache.put(event.request, copy)); return response; })
    .catch(() => caches.match(event.request).then(found => found || Response.error())));
});
