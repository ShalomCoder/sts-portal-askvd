const CACHE_NAME = "sts-static-v1";
const DATA_CACHE = "sts-data-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event: any) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([OFFLINE_URL, "/brand/icon-192.png"]).catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("sts-") && !k.endsWith("v1"))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

const STATIC_RE =
  /^\/(_next\/static\/|brand\/)|\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf)$/i;

const DATA_PATHS = [
  "/api/welcome",
  "/api/notifications",
  "/api/payments",
  "/api/profile",
  "/api/exams",
  "/api/calendar",
];

self.addEventListener("fetch", (event: any) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) {
    if (DATA_PATHS.includes(url.pathname)) {
      event.respondWith(
        (async () => {
          const cache = await caches.open(DATA_CACHE);
          const cached = await cache.match(request).catch(() => null);
          try {
            const fresh = await fetch(request);
            if (fresh.ok) {
              cache.put(request, fresh.clone());
            }
            if (cached) return cached;
            return fresh;
          } catch {
            if (cached) return cached;
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: { "Content-Type": "application/json; charset=utf-8" },
            });
          }
        })(),
      );
      return;
    }
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match(OFFLINE_URL)) || new Response("Offline");
        }
      })(),
    );
    return;
  }
  if (STATIC_RE.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
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

self.addEventListener("message", (event: any) => {
  if (event.data?.type === "sync-data") {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  const cache = await caches.open(DATA_CACHE);
  for (const p of DATA_PATHS) {
    try {
      const res = await fetch(p);
      if (res.ok) await cache.put(p, res.clone());
    } catch {}
  }
  const clients = await self.clients.matchAll();
  clients.forEach((c) => c.postMessage({ type: "sync-done" }));
}
