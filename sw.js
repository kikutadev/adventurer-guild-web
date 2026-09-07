const RELEASE_ID = "0ba3caa2dac9";
const CACHE_NAMESPACE = `adventurer-guild-app:${self.registration.scope}`;
const CACHE_NAME = `${CACHE_NAMESPACE}:${RELEASE_ID}`;
const APP_SHELL_PATHS = [
  "assets/areas/forest-placeholder.svg",
  "assets/areas/generated/ancient-ruins.png",
  "assets/areas/generated/cave.png",
  "assets/areas/generated/forest.png",
  "assets/areas/generated/grassland.png",
  "assets/areas/grassland-placeholder.svg",
  "assets/backgrounds/guild-interior.webp",
  "assets/characters/generated/mage.png",
  "assets/dotgothic16-japanese-400-normal-DqORjlTR.woff2",
  "assets/index-D3gD7Egr.css",
  "assets/index-DxBwegyN.js",
  "assets/vendor/fantasy-portraits/mage-placeholder.png",
  "assets/vendor/fantasy-portraits/scout.png",
  "assets/vendor/fantasy-portraits/warrior.png",
  "guild-icon.svg",
  "icons/guild-icon-180.png",
  "icons/guild-icon-192.png",
  "icons/guild-icon-512.png",
  "index.html",
  "manifest.webmanifest"
];

const scopedUrl = (path) => new URL(path, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL_PATHS.map(scopedUrl));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const ownPrefix = `${CACHE_NAMESPACE}:`;
    await Promise.all(names
      .filter((name) => name.startsWith(ownPrefix) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Navigationはonline時に最新indexを優先し、offline時だけ現在scopeのinstall済みshellへfallbackする。
    if (request.mode === 'navigate') {
      try {
        return await fetch(request);
      } catch (error) {
        const shell = await cache.match(scopedUrl('index.html'), { ignoreVary: true });
        if (shell) return shell;
        throw error;
      }
    }

    const cached = await cache.match(request, { ignoreSearch: true, ignoreVary: true });
    if (cached) return cached;
    return fetch(request);
  })());
});
