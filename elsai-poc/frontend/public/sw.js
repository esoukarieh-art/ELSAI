// Service worker minimal PWA — cache statique (pas de cache API pour respecter le droit à l'oubli)
const CACHE_NAME = "elsai-poc-v1";
const ASSETS = ["/", "/chat", "/scan", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Jamais mettre en cache les appels API (contenu utilisateur sensible)
  if (request.url.includes("/api/")) return;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => cached))
  );
});
