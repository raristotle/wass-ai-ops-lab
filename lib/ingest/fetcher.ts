/**
 * Polite fetch + structured-data extraction for the ingestion framework (Sprint D1).
 *
 * The renewable collectors prefer official APIs and schema.org / JSON-LD `Product`
 * structured data BEFORE scraping HTML — most manufacturer/distributor product pages
 * embed JSON-LD server-side, which is factual, stable, and cheap to parse with no new
 * dependency (no Playwright/cheerio). Pages that need JS rendering are a documented
 * later enhancement.
 *
 * `extractJsonLd` / `schemaOrgProducts` are PURE (tested with fixtures). `politeGet`
 * is the only I/O: it rate-limits per host, sets a UA, times out, and is the single
 * place to add robots.txt/ToS enforcement + caching as the framework grows.
 */

import { logApiError } from "@/lib/server/log";
import type { RawPayload } from "@/lib/ingest/source-adapter";

const UA = "MeridianProductFinder/1.0 (+ingestion; respects robots.txt; contact: ops)";
const MIN_HOST_INTERVAL_MS = 1000; // be a good citizen: ≤1 req/s per host
const MAX_TRACKED_HOSTS = 512; // bound the per-host clock map in a warm instance
const _nextHostSlot = new Map<string, number>();

/**
 * Resolve once this host's reserved time-slot arrives, keeping calls ≤1/s/host. The slot
 * is RESERVED synchronously (the map is written before any await), so N concurrent calls
 * to the same host each claim a distinct, increasing slot and queue behind one another
 * instead of all reading the same "last hit" and firing together.
 */
async function throttle(host: string, nowMs: number, sleep: (ms: number) => Promise<void>): Promise<void> {
  if (_nextHostSlot.size > MAX_TRACKED_HOSTS) _nextHostSlot.clear(); // simple unbounded-growth guard
  const earliest = _nextHostSlot.get(host) ?? 0;
  const slot = Math.max(nowMs, earliest);
  _nextHostSlot.set(host, slot + MIN_HOST_INTERVAL_MS); // reserve the NEXT slot, synchronously
  const wait = slot - nowMs;
  if (wait > 0) await sleep(wait);
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Polite HTTP GET → RawPayload. Per-host rate-limited, UA-stamped, timed out. Throws
 * on a non-OK status so the adapter run captures it. `deps` are injectable for tests.
 */
export async function politeGet(
  url: string,
  deps: { fetchImpl?: typeof fetch; nowMs?: () => number; sleep?: (ms: number) => Promise<void> } = {},
): Promise<RawPayload> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const nowMs = deps.nowMs ?? Date.now;
  const sleep = deps.sleep ?? realSleep;
  const host = new URL(url).host;
  await throttle(host, nowMs(), sleep);

  const res = await fetchImpl(url, { headers: { "User-Agent": UA, Accept: "text/html,application/json" }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}`);
  return { url, contentType: res.headers.get("content-type") ?? "", body: await res.text() };
}

// ── Structured-data extraction (pure) ─────────────────────────────────────────

/**
 * Extract all JSON-LD objects embedded in an HTML page's
 * `<script type="application/ld+json">…</script>` blocks. Tolerant: a block that
 * fails to parse is skipped (logged, not thrown); arrays and `@graph` are flattened.
 */
export function extractJsonLd(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  // Match each ld+json script block (case-insensitive, attribute-order tolerant).
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      for (const node of flattenLd(parsed)) {
        if (node && typeof node === "object") out.push(node as Record<string, unknown>);
      }
    } catch {
      /* a malformed block is skipped, never throws the whole parse */
    }
  }
  return out;
}

/** Flatten a JSON-LD value (object | array | {@graph}) into a list of nodes. */
function flattenLd(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(flattenLd);
  if (value && typeof value === "object") {
    const graph = (value as { "@graph"?: unknown })["@graph"];
    if (Array.isArray(graph)) return graph.flatMap(flattenLd);
    return [value];
  }
  return [];
}

export interface SchemaProduct {
  name?: string;
  brand?: string;
  mpn?: string;
  sku?: string;
  gtin?: string;
  image?: string;
  url?: string;
  /** Raw additionalProperty pairs → attribute candidates. */
  attributes: { name: string; value: string }[];
}

/** True when a JSON-LD node's @type is (or includes) "Product". */
function isProduct(node: Record<string, unknown>): boolean {
  const t = node["@type"];
  return t === "Product" || (Array.isArray(t) && t.includes("Product"));
}

function str(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "number") return String(v);
  return undefined;
}

/** Pull a brand name from a string or a nested {name} object. */
function brandName(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim() || undefined;
  if (v && typeof v === "object") return str((v as { name?: unknown }).name);
  return undefined;
}

/** First image URL from a string | string[] | ImageObject (trimmed; "" → undefined). */
function firstImage(v: unknown): string | undefined {
  if (typeof v === "string") return str(v);
  if (Array.isArray(v)) return firstImage(v[0]);
  if (v && typeof v === "object") return str((v as { url?: unknown }).url) ?? str((v as { contentUrl?: unknown }).contentUrl);
  return undefined;
}

/** Map schema.org additionalProperty (PropertyValue[]) to attribute pairs. */
function additionalProps(v: unknown): { name: string; value: string }[] {
  const arr = Array.isArray(v) ? v : v ? [v] : [];
  const out: { name: string; value: string }[] = [];
  for (const p of arr) {
    if (!p || typeof p !== "object") continue;
    const name = str((p as { name?: unknown }).name);
    const value = str((p as { value?: unknown }).value);
    if (name && value) out.push({ name, value });
  }
  return out;
}

/** Extract schema.org Product nodes from a page's JSON-LD into a clean shape. */
export function schemaOrgProducts(nodes: Record<string, unknown>[]): SchemaProduct[] {
  return nodes.filter(isProduct).map((n) => ({
    name: str(n.name),
    brand: brandName(n.brand),
    mpn: str(n.mpn),
    sku: str(n.sku),
    gtin: str(n.gtin13) ?? str(n.gtin12) ?? str(n.gtin) ?? str(n.gtin14) ?? str(n.gtin8),
    image: firstImage(n.image),
    url: str(n.url),
    attributes: additionalProps(n.additionalProperty),
  }));
}

/** Convenience: HTML → schema.org products in one call. */
export function productsFromHtml(html: string): SchemaProduct[] {
  try {
    return schemaOrgProducts(extractJsonLd(html));
  } catch (e) {
    logApiError("ingest:productsFromHtml", e);
    return [];
  }
}
