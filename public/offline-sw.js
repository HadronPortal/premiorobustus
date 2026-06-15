// Service worker da versão TABLET OFFLINE.
// Faz cache dos assets do app e dos jogos para funcionar sem internet
// depois do primeiro carregamento.

const CACHE = "robustus-tablet-offline-v1";

const PRECACHE_URLS = [
  "/tablet-offline",
  "/favicon.ico",
  "/memoria-final.png",
  "/cesta-final.png",
  "/cesta-preview.png",
  "/robustus-catch-game/index.html",
  "/robustus-catch-game/styles.css",
  "/robustus-catch-game/game.js",
  "/robustus-catch-game/robustus-logo.png",
  "/robustus-catch-game/start-dog.png",
  "/robustus-catch-game/start-cat.png",
  "/robustus-catch-game/dog-basket-repaired.png",
  "/robustus-catch-game/cat-basket-clean.png",
  "/robustus-catch-game/package-cao-adulto.png",
  "/robustus-catch-game/package-cao-filhote.png",
  "/robustus-catch-game/package-cao-mini.png",
  "/robustus-catch-game/package-gato-adulto.png",
  "/robustus-catch-game/package-gato-castrado.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // SPA fallback para navegações dentro de /tablet-offline
  if (req.mode === "navigate" && url.pathname.startsWith("/tablet-offline")) {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match("/tablet-offline").then(
          (cached) =>
            cached ||
            new Response("Offline", { status: 503, statusText: "Offline" })
        )
      )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(
          () =>
            cached ||
            new Response("Offline", { status: 503, statusText: "Offline" })
        );
    })
  );
});
