/* Simple service worker for AttendanceTracker PWA.
 * - Caches core shell assets for faster loading
 * - Serves an offline fallback page when network is unavailable
 *
 * This is intentionally minimal to avoid aggressive caching bugs.
 */

const CACHE_NAME = "attendance-tracker-shell-v1";
const OFFLINE_URL = "/offline.html";

const CORE_ASSETS = [
  "/",
  OFFLINE_URL,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle navigation requests (full page loads)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(OFFLINE_URL);
        return cached || Response.error();
      })
    );
    return;
  }

  // For other requests, just fall back to network
});

