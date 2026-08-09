// SkyFots PWA service worker.
// Deliberately caches ONLY immutable static assets. Navigations, HTML and API
// requests are left to the browser so the SW never interferes with auth
// redirects (which previously caused redirect loops).
const CACHE = "skyfots-v3";

const STATIC_PREFIXES = ["/_next/static/", "/icons/", "/brand/", "/assets/"];
const STATIC_EXT = /\.(?:png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf)$/i;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isStatic =
    STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) || STATIC_EXT.test(url.pathname);

  // Navigations, HTML, and /api are handled natively by the browser.
  if (!isStatic) return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          const cache = await caches.open(CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        return new Response("", { status: 504 });
      }
    })(),
  );
});
