import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * B14 — Datasheet link-rot monitor (pure core).
 *
 * The catalog links ~9K manufacturer datasheet URLs. Over time some 404 / move. A scheduled sweep
 * (see /api/datasheets/sweep) HEAD-checks them in small, time-boxed batches and records each result
 * in the durable KvStore; the client then shows a "link may be outdated" badge before a rep emails a
 * submittal built on a dead link.
 *
 * This module is PURE (no network, no store) so it is trivially testable: URL extraction, the
 * round-robin batch selection, the status-map merge, and the "is this link known-dead" predicate.
 * The network HEAD-check + store I/O live in the route. $0.
 */

export const LINKROT_NS = "datasheet-linkrot";
export const LINKROT_STATUS_KEY = "status"; // KvStore key → LinkStatusMap
export const LINKROT_CURSOR_KEY = "cursor"; // KvStore key → number (round-robin sweep position)

export interface LinkStatus {
  /** True when the last check got a reachable (2xx/3xx) response. */
  ok: boolean;
  /** HTTP status code, or 0 for a network error / timeout. */
  code: number;
  checkedAtIso: string;
}
export type LinkStatusMap = Record<string, LinkStatus>;

/** Normalize a URL to a stable map key (trim, drop a trailing slash). Empty for non-http(s). */
export function normalizeUrl(url: string | undefined): string {
  const u = (url ?? "").trim();
  if (!/^https?:\/\//i.test(u)) return "";
  return u.replace(/\/+$/, "");
}

/** Every distinct datasheet URL in the catalog — the sweep's work-list. Deterministic (sorted). */
export function datasheetUrls(products: CatalogProduct[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    const k = normalizeUrl(p.specSheetUrl);
    if (k) set.add(k);
  }
  return [...set].sort();
}

/**
 * Round-robin batch selection: the `size` URLs starting at `cursor` (wrapping past the end), plus the
 * next cursor position. So repeated calls eventually cover every URL without holding all state.
 */
export function selectSweepBatch(
  urls: string[],
  cursor: number,
  size: number,
): { batch: string[]; nextCursor: number } {
  if (urls.length === 0) return { batch: [], nextCursor: 0 };
  const start = ((cursor % urls.length) + urls.length) % urls.length;
  const take = Math.min(size, urls.length);
  const batch: string[] = [];
  for (let i = 0; i < take; i++) batch.push(urls[(start + i) % urls.length]);
  return { batch, nextCursor: (start + take) % urls.length };
}

/** Merge freshly-checked statuses into the stored map (new results win). */
export function mergeStatuses(prev: LinkStatusMap | null, fresh: LinkStatusMap): LinkStatusMap {
  return { ...(prev ?? {}), ...fresh };
}

/** True when a URL is KNOWN dead (a recorded, non-OK check). Unknown/unchecked links are never flagged. */
export function isDeadLink(map: LinkStatusMap | null, url: string | undefined): boolean {
  const k = normalizeUrl(url);
  if (!k || !map) return false;
  const s = map[k];
  return s !== undefined && !s.ok;
}
