// The PWA's service worker: the app shell works offline; everything else goes to the network first.
const SHELL = ["/", "/static/app.css", "/static/htmx.min.js", "/static/basecoat.min.js", "/static/icon.svg"];
self.addEventListener("install", (event) => event.waitUntil(caches.open("shell-v1").then((cache) => cache.addAll(SHELL))));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
