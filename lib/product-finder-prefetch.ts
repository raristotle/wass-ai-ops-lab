/**
 * Intent-prefetch (v3-S1 #1) — warm the product-detail endpoint on hover/focus/
 * touchstart so a click into the detail modal resolves with no spinner.
 *
 * $0: this only hits the already-free, internal `/api/products/[id]` route.
 * A module-level promise cache dedupes repeat intents and is shared with the
 * detail modal (which reads `fetchProductDetailCached`), so a prefetched click
 * never re-requests. A concurrency cap keeps a fast mouse sweep from fanning out
 * dozens of in-flight requests — over the cap, prefetch is simply skipped and the
 * eventual click fetches normally.
 */

/** Shape the detail route returns (the modal reads equivalents + coverage). */
export interface ProductDetailResponse {
  product?: unknown;
  equivalents?: unknown;
  coverage?: unknown;
}

const cache = new Map<string, Promise<ProductDetailResponse | null>>();
let inflight = 0;
const MAX_INFLIGHT = 6;
const MAX_CACHE = 80;

function keyFor(id: string, branchId?: string): string {
  return `${id}|${branchId ?? ""}`;
}

function detailUrl(id: string, branchId?: string): string {
  const b = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
  return `/api/products/${encodeURIComponent(id)}${b}`;
}

function doFetch(id: string, branchId?: string): Promise<ProductDetailResponse | null> {
  return fetch(detailUrl(id, branchId))
    .then((r) => (r.ok ? (r.json() as Promise<ProductDetailResponse>) : null))
    .catch(() => null);
}

function remember(key: string, p: Promise<ProductDetailResponse | null>): void {
  cache.set(key, p);
  if (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

/**
 * Fetch (or reuse a prefetched) product-detail response. The detail modal uses
 * this so a warmed entry returns instantly. Never throws — resolves to null on
 * any network/HTTP error, matching the modal's existing fail-soft behavior.
 */
export function fetchProductDetailCached(id: string, branchId?: string): Promise<ProductDetailResponse | null> {
  const key = keyFor(id, branchId);
  const hit = cache.get(key);
  if (hit) return hit;
  const p = doFetch(id, branchId);
  remember(key, p);
  return p;
}

/**
 * Best-effort warm of the detail cache on user intent. No-op when already cached
 * or when the in-flight cap is reached (the click will fetch normally then).
 */
export function prefetchProductDetail(id: string, branchId?: string): void {
  if (!id) return;
  const key = keyFor(id, branchId);
  if (cache.has(key)) return;
  if (inflight >= MAX_INFLIGHT) return;
  inflight += 1;
  const p = doFetch(id, branchId).finally(() => {
    inflight -= 1;
  });
  remember(key, p);
}

/** Test-only: reset the module cache + in-flight counter between cases. */
export function __resetPrefetchCache(): void {
  cache.clear();
  inflight = 0;
}
