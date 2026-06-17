// Meridian Product Finder — offline service worker (#20).
//
// SAFE BY DESIGN — it deliberately does NOT cache navigation HTML:
//  - Navigation documents are network-ONLY, falling back to a static, chunk-free
//    /offline.html. This avoids two traps: (a) caching authenticated/customer
//    pages (login / quote-acceptance / dashboard) that could be served to another
//    user on a shared device, and (b) the cross-deploy "stale shell references a
//    404'd hashed chunk" white-screen, since offline.html loads no hashed assets.
//  - Only the PUBLIC, read-only catalog API (/api/products*) is cached, network-
//    first with a fallback, and the cache is CAPPED so it can't grow unbounded.
// Net: installable + offline-resilient catalog, with no stale-shell or cross-user
// caching risk.
const PRECACHE = "meridian-precache-v1";
const API_CACHE = "meridian-api-v1";
const API_MAX = 60; // cap cached catalog responses (LRU-ish trim)

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      await cache.add("/offline.html").catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== PRECACHE && k !== API_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

async function trim(cache, max) {
  const keys = await cache.keys();
  if (keys.length <= max) return;
  for (const k of keys.slice(0, keys.length - max)) await cache.delete(k);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // skip cross-origin (incl. proxied routes)

  // Public, read-only catalog API → network-first, capped cache fallback.
  // (Product data is not user-specific, so caching it is safe.)
  if (url.pathname.startsWith("/api/products")) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          if (fresh.ok) {
            const cache = await caches.open(API_CACHE);
            await cache.put(req, fresh.clone()).catch(() => {});
            void trim(cache, API_MAX);
          }
          return fresh;
        } catch {
          const cached = await caches.match(req);
          return (
            cached ||
            new Response(JSON.stringify({ items: [], total: 0, offline: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
        }
      })(),
    );
    return;
  }

  // Navigations → network-ONLY, with a static chunk-free offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch {
          return (
            (await caches.match("/offline.html")) ||
            new Response("You are offline.", { status: 503, headers: { "Content-Type": "text/plain" } })
          );
        }
      })(),
    );
    return;
  }

  // Everything else (hashed static chunks, etc.) → pass through to the network.
});

// Web push (#17): a no-payload "tickle" wakes the SW; show a generic alert that
// opens the product finder. (We deliberately don't send payloads, so there's no
// sensitive data in the push and no payload encryption.)
self.addEventListener("push", (event) => {
  let body = "You have a new Meridian alert. Open the app to view it.";
  try {
    if (event.data) {
      const d = event.data.json();
      if (d && typeof d.body === "string") body = d.body;
    }
  } catch {
    /* no/!JSON payload — use the generic message */
  }
  event.waitUntil(
    self.registration.showNotification("Meridian", {
      body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: "meridian-alert",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = "/product-finder";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/product-finder") && "focus" in client) return client.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow(url) : undefined;
    }),
  );
});
