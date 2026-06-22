// Service worker da versão TABLET OFFLINE.
// IMPORTANTE: trocar o nome do cache a cada release para forçar atualização
// no tablet quando ele abrir com internet.

const CACHE_NAME = "robustus-tablet-offline-v2026-06-22-05";

const ASSETS_TO_CACHE = [
  // Rotas da SPA (todas resolvem para o index.html da SPA via fallback)
  "/tablet-offline",
  "/tablet-offline/cadastro",
  "/tablet-offline/jogo-memoria",
  "/tablet-offline/jogo-cesta",
  "/tablet-offline/validar-brinde",

  // Assets gerais
  "/favicon.ico",
  "/memoria-final.png",
  "/cesta-final.png",
  "/cesta-preview.png",

  // Banners do carrossel offline
  "/offline-banners/banner1.jpg",
  "/offline-banners/banner2.png",
  "/offline-banners/banner3.png",
  "/offline-banners/banner4.png",

  // Jogo da cesta (HTML/JS/CSS/imagens)
  "/robustus-catch-game/index.html",
  "/robustus-catch-game/styles.css",
  "/robustus-catch-game/game.js",
  "/robustus-catch-game/robustus-logo.png",
  "/robustus-catch-game/robuscao-idle.webp",
  "/robustus-catch-game/robuscao-walk-a.webp",
  "/robustus-catch-game/robuscao-walk-b.webp",
  "/robustus-catch-game/robuscat-idle.webp",
  "/robustus-catch-game/robuscat-walk-a.webp",
  "/robustus-catch-game/robuscat-walk-b.webp",
  "/robustus-catch-game/package-cao-adulto.png",
  "/robustus-catch-game/package-cao-filhote.png",
  "/robustus-catch-game/package-cao-mini.png",
  "/robustus-catch-game/package-gato-adulto.png",
  "/robustus-catch-game/package-gato-castrado.png",
];

// 1) Install: pré-cache e ativação imediata
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(ASSETS_TO_CACHE.map((url) => cache.add(url)))
      )
  );
});

// 2) Activate: apaga TODOS os caches antigos (não só os com nome diferente
//    de versões anteriores — qualquer cache que não seja o atual)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3) Fetch: HTML/navegação = network-first; assets = cache-first
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation =
    req.mode === "navigate" ||
    (req.destination === "" && req.headers.get("accept")?.includes("text/html"));

  // Network-first para HTML / navegações da SPA offline
  if (isNavigation || url.pathname.endsWith(".html")) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          // Fallback para a home offline
          const fallback = await caches.match("/tablet-offline");
          if (fallback) return fallback;
          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
          });
        }
      })()
    );
    return;
  }

  // Cache-first para demais assets (JS/CSS/imagens/áudio)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
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
