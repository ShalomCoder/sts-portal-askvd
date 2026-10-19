/*
 * Service worker for the UG Student Portal.
 *
 * Deliberately conservative, because every useful page here is authenticated:
 *
 *   - NEVER cache /api/* — all of it is per-user session traffic.
 *   - NEVER cache page navigations. Authenticated HTML must not be replayed to
 *     the next person to open the app on a shared device.
 *   - DO cache static build assets and brand images (cache-first), which is
 *     what makes the app open instantly and work as an installed app.
 *   - Offline navigations fall back to the static /offline page.
 */

const VERSION = "v1";
const STATIC_CACHE = `sts-static-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll([OFFLINE_URL, "/brand/icon-192.png"]).catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("sts-") && !k.endsWith(VERSION)).map((k) =>
          caches.delete(k),
        ),
      );
      await self.clients.claim();
    })(),
  );
});

const STATIC_RE =
  /^\/(_next\/static\/|brand\/)|\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf)$/i;

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Per-user traffic: always live.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network only, with an offline fallback. No HTML caching.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(STATIC_CACHE);
          return (
            (await cache.match(OFFLINE_URL)) ||
            new Response("You are offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })(),
    );
    return;
  }

  if (STATIC_RE.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        if (fresh && fresh.ok && fresh.type === "basic") {
          cache.put(request, fresh.clone());
        }
        return fresh;
      })(),
    );
  }
});
