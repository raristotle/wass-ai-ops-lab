/**
 * Wikidata live brand-ownership lookup (REAL) — env-gated DORMANT, $0 (DI-S2 live).
 *
 * The live-refresh companion to GLEIF for the brand-entity layer: it resolves a
 * brand name to its parent company (P127 owned-by / P749 parent-organization),
 * official + short names (P1448 / P1813) for alias search, and the stable
 * cross-walk identifiers GTIN (P3962) and LEI (P1278). Wikidata statement data is
 * CC0 (public domain), the SPARQL endpoint is keyless, and the ONLY hard rule is a
 * descriptive User-Agent (Wikimedia policy). So we gate on WIKIDATA_USER_AGENT —
 * which is BOTH the dormancy switch AND the policy-required identity, exactly like
 * the NWS weather seam's WEATHER_CONTACT.
 *
 *   WIKIDATA_USER_AGENT — e.g. "MeridianProductFinder/1.0 (ops@example.com)".
 *
 * Keep queries NARROW (single brand, small VALUES) — the public endpoint has a hard
 * 60s timeout and a shared budget; honor 429/Retry-After. The SPARQL-JSON parse is
 * pure + unit-tested; the thin fetch fails closed to {enabled:false}. Keyless, so
 * no secret to leak; server-only.
 */

import { logApiError } from "@/lib/server/log";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

export const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

/** True only when a WIKIDATA_USER_AGENT (switch + required identity) is set. */
export function wikidataConfigured(): boolean {
  return Boolean(env("WIKIDATA_USER_AGENT"));
}

export interface BrandOwnership {
  brand: string;
  /** Direct owner (P127) label, if any. */
  owner: string | null;
  /** Parent organization (P749) label, if any. */
  parent: string | null;
  /** Official name (P1448) — current; historical ones carry end-time qualifiers. */
  officialName: string | null;
  /** Short names (P1813) — abbreviations / alternative names. */
  shortNames: string[];
  /** Global Trade Item Numbers (P3962). */
  gtins: string[];
  /** Legal Entity Identifier (P1278) — bridges to GLEIF. */
  lei: string | null;
}

/** One row of a SPARQL JSON result: var name → { value }. */
interface SparqlBinding {
  [key: string]: { type?: string; value?: string; "xml:lang"?: string } | undefined;
}

function val(binding: SparqlBinding, key: string): string | null {
  const v = binding[key]?.value;
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * Pure: collapse SPARQL-JSON bindings for one brand into a single BrandOwnership.
 * Multiple rows (Wikidata returns the cartesian product of multi-valued props) are
 * merged: scalars take the first non-null; shortNames/gtins accumulate distinct
 * values. Expects vars: ownerLabel, parentLabel, officialName, shortName, gtin, lei.
 */
export function parseBrandOwnership(brand: string, json: unknown): BrandOwnership {
  const bindings = ((json as { results?: { bindings?: unknown } })?.results?.bindings ?? []) as SparqlBinding[];
  const out: BrandOwnership = {
    brand,
    owner: null,
    parent: null,
    officialName: null,
    shortNames: [],
    gtins: [],
    lei: null,
  };
  const shortSet = new Set<string>();
  const gtinSet = new Set<string>();
  for (const b of bindings) {
    out.owner ??= val(b, "ownerLabel");
    out.parent ??= val(b, "parentLabel");
    out.officialName ??= val(b, "officialName");
    out.lei ??= val(b, "lei");
    const s = val(b, "shortName");
    if (s) shortSet.add(s);
    const g = val(b, "gtin");
    if (g) gtinSet.add(g);
  }
  out.shortNames = [...shortSet];
  out.gtins = [...gtinSet];
  return out;
}

/**
 * Build the SPARQL for a brand label. Resolves the entity by exact English label
 * (rdfs:label) then reads the ownership + identifier properties. Narrow by design
 * (single label) so it stays inside the endpoint's 60s budget.
 */
export function buildBrandQuery(brand: string): string {
  // Escape embedded quotes/backslashes for the SPARQL string literal.
  const safe = brand.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `SELECT ?ownerLabel ?parentLabel ?officialName ?shortName ?gtin ?lei WHERE {
  ?brand rdfs:label "${safe}"@en .
  OPTIONAL { ?brand wdt:P127 ?owner. }
  OPTIONAL { ?brand wdt:P749 ?parent. }
  OPTIONAL { ?brand wdt:P1448 ?officialName. }
  OPTIONAL { ?brand wdt:P1813 ?shortName. }
  OPTIONAL { ?brand wdt:P3962 ?gtin. }
  OPTIONAL { ?brand wdt:P1278 ?lei. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 50`;
}

export type WikidataResult =
  | { enabled: true; source: "Wikidata"; ownership: BrandOwnership; fetchedAt: string }
  | { enabled: false; reason: "no-keys" | "fetch-failed" | "no-match" };

/**
 * Resolve a brand's ownership graph + identifiers, or {enabled:false} when dormant
 * (no User-Agent) / on error. The User-Agent is required by Wikimedia policy AND is
 * our dormancy gate.
 */
export async function lookupBrandOwnership(brand: string): Promise<WikidataResult> {
  const ua = env("WIKIDATA_USER_AGENT");
  if (!ua) return { enabled: false, reason: "no-keys" }; // ← dormant: zero network until set
  const name = brand.trim();
  if (!name) return { enabled: false, reason: "no-match" };
  try {
    const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(buildBrandQuery(name))}&format=json`;
    const res = await fetch(url, {
      headers: { Accept: "application/sparql-results+json", "User-Agent": ua },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      logApiError("wikidata", new Error(`Wikidata HTTP ${res.status}`));
      return { enabled: false, reason: "fetch-failed" };
    }
    const json = await res.json().catch(() => null);
    const ownership = parseBrandOwnership(name, json);
    // If nothing resolved at all, report no-match so the caller can hide the panel.
    const empty =
      !ownership.owner &&
      !ownership.parent &&
      !ownership.officialName &&
      ownership.shortNames.length === 0 &&
      ownership.gtins.length === 0 &&
      !ownership.lei;
    if (empty) return { enabled: false, reason: "no-match" };
    return { enabled: true, source: "Wikidata", ownership, fetchedAt: new Date().toISOString() };
  } catch (e) {
    logApiError("wikidata", e);
    return { enabled: false, reason: "fetch-failed" };
  }
}
