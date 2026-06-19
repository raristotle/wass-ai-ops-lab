/**
 * Open Icecat datasheet enrichment (REAL) — env-gated DORMANT, $0 (DI-10).
 *
 * Pulls normalized specifications, a datasheet/manual PDF link, a product image,
 * and GTIN(s) for a product by GTIN or brand+MPN — feeding the datasheet/spec
 * facets and the GTIN/identifier resolution layer. Open Icecat is the FREE tier
 * (register a free account → username + tokens); it covers participating
 * ("sponsoring") brands' datasheets. Full Icecat (broader brands) is a separate
 * paid subscription.
 *
 * Gated on ICECAT_USERNAME so the seam is dormant (zero network) until the free
 * account is configured.
 *
 *   ICECAT_USERNAME      — Open Icecat account (the `shopname`; the dormancy switch).
 *   ICECAT_API_TOKEN     — optional product-data token (sent as `api-token` header).
 *   ICECAT_CONTENT_TOKEN — optional asset token (sent as `content-token` header).
 *
 * LICENSING: Icecat requires asset URLs (images/media) be hosted in your OWN
 * environment rather than hot-linked at scale, and some brands restrict rich media
 * to authorized resellers — so this seam returns the asset URLs as REFERENCES for an
 * operator to mirror, and never auto-embeds them. The JSON transform is pure +
 * unit-tested; the thin GET fails closed. Server-only; tokens are headers only.
 */

import { logApiError } from "@/lib/server/log";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

export const ICECAT_API_URL = "https://live.icecat.biz/api";

/** True only when ICECAT_USERNAME is set. Single source of dormancy. */
export function icecatConfigured(): boolean {
  return Boolean(env("ICECAT_USERNAME"));
}

export interface IcecatSpec {
  name: string;
  value: string;
}

export interface IcecatProduct {
  brand: string | null;
  mpn: string | null;
  title: string | null;
  gtins: string[];
  /** Datasheet/manual PDF URL — a REFERENCE to mirror, not to hot-link. */
  datasheetUrl: string | null;
  /** Primary image URL — a REFERENCE to mirror, not to hot-link. */
  imageUrl: string | null;
  specs: IcecatSpec[];
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * Pure: Icecat Live JSON → normalized product. Reads the `data.GeneralInfo`,
 * `data.Image`, and `data.FeaturesGroups` sections defensively; tolerates missing
 * sections (returns nulls/empties). Spec values prefer the presentation value.
 */
export function parseIcecatProduct(json: unknown): IcecatProduct | null {
  const data = (json as { data?: unknown })?.data;
  if (!data || typeof data !== "object") return null;
  const d = data as {
    GeneralInfo?: {
      Brand?: unknown;
      ProductCode?: unknown;
      Title?: unknown;
      GTIN?: unknown;
      Description?: { ManualPDFURL?: unknown; PDFURL?: unknown };
    };
    Image?: { HighPic?: unknown; LowPic?: unknown };
    FeaturesGroups?: unknown;
  };
  const gi = d.GeneralInfo ?? {};
  const gtins = Array.isArray(gi.GTIN) ? (gi.GTIN as unknown[]).map(str).filter((x): x is string => !!x) : [];

  const specs: IcecatSpec[] = [];
  const groups = Array.isArray(d.FeaturesGroups) ? (d.FeaturesGroups as unknown[]) : [];
  for (const g of groups) {
    const features = (g as { Features?: unknown })?.Features;
    if (!Array.isArray(features)) continue;
    for (const f of features as unknown[]) {
      const ff = f as { Feature?: { Name?: { Value?: unknown } }; PresentationValue?: unknown; Value?: unknown };
      const name = str(ff.Feature?.Name?.Value);
      const value = str(ff.PresentationValue) ?? str(ff.Value);
      if (name && value) specs.push({ name, value });
    }
  }

  return {
    brand: str(gi.Brand),
    mpn: str(gi.ProductCode),
    title: str(gi.Title),
    gtins,
    datasheetUrl: str(gi.Description?.PDFURL) ?? str(gi.Description?.ManualPDFURL),
    imageUrl: str(d.Image?.HighPic) ?? str(d.Image?.LowPic),
    specs,
  };
}

export type IcecatResult =
  | { enabled: true; source: "Open Icecat"; product: IcecatProduct; fetchedAt: string }
  | { enabled: false; reason: "no-keys" | "fetch-failed" | "no-match" };

export interface IcecatQuery {
  gtin?: string;
  brand?: string;
  mpn?: string;
}

/**
 * Look up a product datasheet by GTIN, or brand+MPN. Returns {enabled:false} when
 * dormant (no username) / on error / when the brand isn't an Open Icecat sponsor
 * (a not-authorized response is treated as no-match — graceful degrade).
 */
export async function lookupDatasheet(query: IcecatQuery): Promise<IcecatResult> {
  const shopname = env("ICECAT_USERNAME");
  if (!shopname) return { enabled: false, reason: "no-keys" }; // ← dormant

  const params = new URLSearchParams({ lang: "EN", shopname, content: "" });
  if (query.gtin?.trim()) {
    params.set("GTIN", query.gtin.trim());
  } else if (query.brand?.trim() && query.mpn?.trim()) {
    params.set("Brand", query.brand.trim());
    // ProductCode must be upper-cased per the Icecat contract.
    params.set("ProductCode", query.mpn.trim().toUpperCase());
  } else {
    return { enabled: false, reason: "no-match" };
  }

  // Optional tokens sharpen access; absent, Open Icecat Live works with shopname alone.
  const headers: Record<string, string> = { Accept: "application/json" };
  const apiToken = env("ICECAT_API_TOKEN");
  const contentToken = env("ICECAT_CONTENT_TOKEN");
  if (apiToken) headers["api-token"] = apiToken;
  if (contentToken) headers["content-token"] = contentToken;

  try {
    const res = await fetch(`${ICECAT_API_URL}?${params.toString()}`, {
      headers,
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      // 4xx commonly = product not found / brand not authorized → graceful no-match.
      if (res.status >= 400 && res.status < 500) return { enabled: false, reason: "no-match" };
      logApiError("icecat", new Error(`Icecat HTTP ${res.status}`));
      return { enabled: false, reason: "fetch-failed" };
    }
    const json = await res.json().catch(() => null);
    const product = parseIcecatProduct(json);
    if (!product) return { enabled: false, reason: "no-match" };
    return { enabled: true, source: "Open Icecat", product, fetchedAt: new Date().toISOString() };
  } catch (e) {
    logApiError("icecat", e);
    return { enabled: false, reason: "fetch-failed" };
  }
}
