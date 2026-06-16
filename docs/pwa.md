# Offline PWA + barcode scanner (#20)

Makes the product-finder an **installable, offline-resilient PWA** with a camera part lookup —
for field reps on rural jobsites with poor signal. Free / client-side; no env vars.

## Installable + offline

| File | Role |
|---|---|
| `apps/web/public/manifest.webmanifest` | name, icon, `standalone` display, theme color; scope `/product-finder`. |
| `apps/web/public/icon.svg` | maskable app icon. |
| `apps/web/public/sw.js` | **safe-by-design** service worker (see below). |
| `apps/web/public/offline.html` | static, chunk-free offline page (no hashed assets → can't break across deploys). |
| `apps/web/app/sw-register.tsx` | registers the SW (production-only, support-guarded, failure-swallowed). |
| `apps/web/app/layout.tsx` | wires the manifest + theme-color (viewport) + registration. |

### Service-worker caching strategy — and why it is deliberately narrow

The SW **never caches navigation HTML**. That single rule avoids two real production hazards:

1. **No cross-user page caching.** Caching navigation documents on a shared field device could
   serve another user a cached authenticated/customer page (login, quote-acceptance, dashboard).
   Navigations are **network-only**, so nothing user-specific is ever stored.
2. **No cross-deploy stale-shell white-screen.** A cached app shell from deploy *N* references
   hashed chunks that 404 after deploy *N+1*. Because we never cache the shell — only a static
   `offline.html` that loads **no hashed chunks** — an offline navigation degrades gracefully
   instead of white-screening.

What it **does** cache:

- **`/api/products*`** (the public, read-only catalog API) — network-first, falling back to cache
  when offline, with the cache **capped** (`API_MAX = 60`, LRU-ish trim) so it can't grow
  unbounded. Product data is not user-specific, so caching it is safe.
- **`offline.html`** — precached on install for the offline navigation fallback.

Everything else (hashed static chunks, etc.) passes straight through to the network. Net result:
installable + offline-resilient catalog, with **no** stale-shell, cross-user, or unbounded-growth
risk.

## Barcode / QR scan

`features/product-finder/BarcodeScannerModal.tsx` — native `BarcodeDetector` (Android Chrome /
Edge) with an **always-available manual part-number entry** fallback (iOS Safari has no
`BarcodeDetector`). On a hit it runs the catalog search and closes. Reached via **Ctrl/⌘-K →
"Scan barcode"**. a11y: focus-trap + Escape (`useModalA11y`), labeled input, `role="status"` error
announcements. Camera lifecycle is hardened: the stream is released on close/unmount, the
`getUserMedia` result is dropped (and its tracks stopped) if the modal closed during the permission
prompt, and `BarcodeDetector` construction is wrapped so a device that exposes but can't construct
it falls back to manual entry instead of hanging with the camera on.

## Verify

- **Installable:** open `app.raristotle.com/product-finder` in Chrome → an "Install" affordance
  appears; `manifest.webmanifest` + `icon.svg` are served.
- **Offline:** load once online, then go offline → the catalog API serves cached data and a
  navigation to a new page shows `offline.html` (never a broken shell).
- **Barcode:** Ctrl/⌘-K → "Scan barcode"; supported devices show "Scan with camera", others the
  manual entry — both run a catalog search.
