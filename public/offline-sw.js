const CACHE_NAME = 'robustus-cesta-v2026-08-07-v3-cover';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline-sw.js',
  '/manifest.json',
  '/brand/robustus-laranja.png',
  '/brand/procion-logo-branco-crop.png',
  '/brand/cesta-bg.png',
  '/brand/game-card-v3.png',
  '/__l5e/assets-v1/9cfffecd-206b-45df-9412-56abe2c437dd/bg-home.jpg',
  '/__l5e/assets-v1/59df2173-b9ee-4ece-8ad2-a35003c12d75/banner-fixo.png',
  '/__l5e/assets-v1/ba13a936-5f2b-43a8-8019-90730a00edb2/banner-promo.png',
  '/cesta-final.png',
  '/robustus-catch-game/index.html',
  '/robustus-catch-game/game.js',
  '/robustus-catch-game/assets/bg.webp',
  '/robustus-catch-game/assets/ground.webp',
  '/robustus-catch-game/assets/racao_1.webp',
  '/robustus-catch-game/assets/racao_2.webp',
  '/robustus-catch-game/assets/racao_3.webp',
  '/robustus-catch-game/assets/racao_gato_1.webp',
  '/robustus-catch-game/assets/racao_gato_2.webp',
  '/robustus-catch-game/assets/racao_gato_3.webp',
  '/robustus-catch-game/assets/racao_errada.webp',
  '/robustus-catch-game/assets/dog_stand.webp',
  '/robustus-catch-game/assets/cat_stand.webp',
  '/audio/bg-music.mp3',
  '/audio/click.mp3',
  '/audio/correct.mp3',
  '/audio/error.mp3',
  '/audio/victory-applause.mp3',
  '/audio/lost.mp3',
  '/audio/bark.mp3',
  '/audio/meow.mp3',
  '/audio/fanfare.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
