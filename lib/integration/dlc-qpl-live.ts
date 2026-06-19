/**
 * DesignLights Consortium (DLC) Qualified Products List lookup (REAL) — env-gated
 * DORMANT (DI-2). Confirms whether a commercial lighting SKU carries a CURRENT DLC
 * listing (the gating condition for most commercial utility rebates) and returns
 * its Approved/Delisted status — the other half (with ENERGY STAR) of the rebate
 * estimator's documented activation path.
 *
 * IMPORTANT — unlike the other DI-2/free seams, DLC's programmatic API is NOT free:
 * the bearer token is issued only to PAID DLC data/API subscribers. So this seam
 * stays dormant ($0, zero network) until DLC_QPL_API_TOKEN is set, and activating
 * it requires a paid DLC subscription (the free MyDLC account only allows manual
 * web search). We build the seam so it's ready the moment a customer subscribes.
 *
 *   DLC_QPL_API_TOKEN — the per-subscriber bearer token (paid; the dormancy switch).
 *
 * The lookup-JSON transform is pure + unit-tested; the thin GET fails closed.
 * Server-only; the token is a header and never returned to the client.
 */

import { logApiError } from "@/lib/server/log";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

export const DLC_LOOKUP_URL = "https://qpl.designlights.org/tools/productlookup";

/** True only when the paid DLC_QPL_API_TOKEN is set. Single source of dormancy. */
export function dlcQplConfigured(): boolean {
  return Boolean(env("DLC_QPL_API_TOKEN"));
}

export interface DlcListing {
  productId: string;
  /** "Approved - Published" → listed; "Delisted" → no longer qualified. */
  status: string | null;
  /** True only when the status indicates a current, published qualification. */
  listed: boolean;
  productName: string | null;
  brand: string | null;
  manufacturer: string | null;
  qpl: string | null; // which list: ssl | nlc | hort | luna
  dateQualified: string | null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * Pure: DLC productlookup JSON → a normalized listing, or null when the response
 * carries no usable result (auth error / product not found). DLC nests the data
 * under a `result` section and echoes a status string; field casing varies, so we
 * read defensively.
 */
export function parseDlcLookup(json: unknown): DlcListing | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;
  const result = (root.result ?? root.Result ?? root) as Record<string, unknown>;
  const productId = str(result["Product ID"]) ?? str(result.product_id) ?? str(result.productId);
  const status = str(result.Status) ?? str(result.status);
  if (!productId && !status) return null; // an error envelope with neither is not a listing
  const listed = Boolean(status && /approved|published/i.test(status) && !/delist/i.test(status));
  return {
    productId: productId ?? "",
    status,
    listed,
    productName: str(result["Product Name"]) ?? str(result.product_name),
    brand: str(result["Brand Name"]) ?? str(result.brand),
    manufacturer: str(result.Manufacturer) ?? str(result.manufacturer),
    qpl: str(result.QPL) ?? str(result.qpl),
    dateQualified: str(result["Date Qualified"]) ?? str(result.date_qualified),
  };
}

export type DlcResult =
  | { enabled: true; source: "DLC QPL"; listing: DlcListing; fetchedAt: string }
  | { enabled: false; reason: "no-keys" | "fetch-failed" | "no-match" | "not-authorized" };

/**
 * Look up a DLC Product ID's listing status. Returns {enabled:false} when dormant
 * (no token) / on error. Distinguishes "not-authorized" (valid token, but the
 * subscription tier lacks API rights) so the caller can surface the right message.
 */
export async function lookupDlcListing(productId: string): Promise<DlcResult> {
  const token = env("DLC_QPL_API_TOKEN");
  if (!token) return { enabled: false, reason: "no-keys" }; // ← dormant
  const id = productId.trim();
  if (!id) return { enabled: false, reason: "no-match" };
  try {
    const url = `${DLC_LOOKUP_URL}?product=${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (res.status === 401 || res.status === 403) {
      // Valid-but-insufficient token, or bad token — distinct from a transport error.
      return { enabled: false, reason: "not-authorized" };
    }
    if (!res.ok) {
      logApiError("dlc-qpl", new Error(`DLC HTTP ${res.status}`));
      return { enabled: false, reason: "fetch-failed" };
    }
    const json = await res.json().catch(() => null);
    const listing = parseDlcLookup(json);
    if (!listing) return { enabled: false, reason: "no-match" };
    return { enabled: true, source: "DLC QPL", listing, fetchedAt: new Date().toISOString() };
  } catch (e) {
    logApiError("dlc-qpl", e);
    return { enabled: false, reason: "fetch-failed" };
  }
}
