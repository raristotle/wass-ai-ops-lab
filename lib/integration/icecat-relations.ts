/**
 * Open Icecat accessory-relations ingestion (v5-S3 #10) — env-gated DORMANT, $0.
 *
 * Open Icecat publishes manufacturer-declared product RELATIONS (accessories,
 * compatible parts, bundles) alongside datasheets. Ingesting them gives the cross-
 * sell engine a fourth, manufacturer-authoritative companion signal on top of the
 * spec rules + affinity + market-basket. We pull the relations for a product (by
 * GTIN or brand+MPN), map each related part to a companion EDGE, and let the caller
 * resolve those MPNs to stocked SKUs.
 *
 * Reuses the same dormancy switch as the datasheet seam (ICECAT_USERNAME) — zero
 * network, $0, until the free Open Icecat account is configured. The JSON transform
 * is pure + unit-tested; the thin GET fails closed. Server-only.
 */

import { logApiError } from "@/lib/server/log";
import { ICECAT_API_URL, icecatConfigured } from "@/lib/integration/icecat-live";

/** A manufacturer-declared relation mapped to a companion edge. */
export interface IcecatRelationEdge {
  /** Related part's manufacturer part number (to resolve to a stocked SKU). */
  mpn: string;
  brand: string | null;
  title: string | null;
  /** Icecat relation category, normalized. */
  kind: "accessory" | "bundle" | "compatible" | "related";
  /** How we'd treat it in the companion graph. Accessories/compatible = recommended. */
  relation: "required" | "recommended";
}

const KIND_MAP: Record<string, IcecatRelationEdge["kind"]> = {
  accessory: "accessory",
  accessories: "accessory",
  bundle: "bundle",
  bundled: "bundle",
  compatible: "compatible",
  compatibility: "compatible",
};

/** Normalize Icecat's relation-type label to our kind. Unknown → "related". */
function normalizeKind(raw: unknown): IcecatRelationEdge["kind"] {
  if (typeof raw !== "string") return "related";
  return KIND_MAP[raw.trim().toLowerCase()] ?? "related";
}

/**
 * Pure transform: Icecat product JSON → companion relation edges. Defensive against
 * the several shapes Icecat returns relations in (`data.ProductRelated`, a
 * `Reasons`/`RelatedProducts` array, etc.). Manufacturer relations are advisory, so
 * every edge maps to `recommended` (never `required` — that stays with the
 * engineering spec rules). Returns [] for any unexpected shape.
 */
export function icecatRelationsToEdges(json: unknown): IcecatRelationEdge[] {
  const data = (json as { data?: unknown })?.data ?? json;
  if (!data || typeof data !== "object") return [];

  // Collect from whichever relation arrays are present.
  const buckets: unknown[] = [];
  const d = data as Record<string, unknown>;
  for (const key of ["ProductRelated", "RelatedProducts", "Reasons", "Accessories"]) {
    const v = d[key];
    if (Array.isArray(v)) buckets.push(...v);
  }
  if (buckets.length === 0) return [];

  const seen = new Set<string>();
  const edges: IcecatRelationEdge[] = [];
  for (const raw of buckets) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const mpn = String(r.ProductCode ?? r.Mpn ?? r.PartNumber ?? r.mpn ?? "").trim();
    if (!mpn || seen.has(mpn)) continue;
    seen.add(mpn);
    edges.push({
      mpn,
      brand: typeof r.Brand === "string" ? r.Brand : typeof r.brand === "string" ? r.brand : null,
      title: typeof r.Title === "string" ? r.Title : typeof r.Name === "string" ? r.Name : null,
      kind: normalizeKind(r.RelationType ?? r.Type ?? r.kind),
      relation: "recommended",
    });
  }
  return edges;
}

export type IcecatRelationsResult =
  | { enabled: false }
  | { enabled: true; edges: IcecatRelationEdge[] }
  | { enabled: true; error: string };

/**
 * Fetch a product's relations from Open Icecat by GTIN or brand+MPN. Dormant +
 * fail-closed: returns `{enabled:false}` until ICECAT_USERNAME is set, and never
 * throws into the caller on a network/HTTP error.
 */
export async function getIcecatRelations(params: { gtin?: string; brand?: string; mpn?: string }): Promise<IcecatRelationsResult> {
  if (!icecatConfigured()) return { enabled: false };

  const username = process.env.ICECAT_USERNAME!.trim();
  const qs = new URLSearchParams({ shopname: username, lang: "en", content: "relations" });
  if (params.gtin) qs.set("GTIN", params.gtin);
  else if (params.brand && params.mpn) {
    qs.set("Brand", params.brand);
    qs.set("ProductCode", params.mpn);
  } else {
    return { enabled: true, error: "Provide a GTIN or brand + MPN" };
  }

  try {
    const headers: Record<string, string> = {};
    const apiToken = process.env.ICECAT_API_TOKEN?.trim();
    if (apiToken) headers["api-token"] = apiToken;
    const res = await fetch(`${ICECAT_API_URL}?${qs.toString()}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      logApiError("icecat:relations", new Error(`Icecat relations HTTP ${res.status}`));
      return { enabled: true, error: `fetch-failed` };
    }
    return { enabled: true, edges: icecatRelationsToEdges(await res.json()) };
  } catch (e) {
    logApiError("icecat:relations", e);
    return { enabled: true, error: "fetch-failed" };
  }
}
