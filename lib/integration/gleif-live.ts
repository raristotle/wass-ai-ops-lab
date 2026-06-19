/**
 * GLEIF live LEI lookup (REAL) — env-gated DORMANT, $0 until enabled (DI-S2 live).
 *
 * The static brand-entity layer (Increment 1, data/real/brand-entities.ts) carries
 * a curated LEI + parent/ultimate-parent for ~50 brands. This seam is the LIVE
 * refresh path: it resolves an arbitrary manufacturer/customer legal name to its
 * canonical GLEIF Legal Entity Identifier and walks the direct/ultimate parent
 * chain on demand, so the brand-entity panel and a KYB/compliance facet can verify
 * counterparties beyond the curated set.
 *
 * GLEIF's Access API is FREE, KEYLESS, and the data is CC0 (public domain). Our
 * standing rule is still "zero network until explicitly enabled," so we gate on
 * GLEIF_API_BASE_URL — setting it (to the documented default below) is the switch.
 * 60 req/min/IP is the only governor; callers should batch/cache.
 *
 *   GLEIF_API_BASE_URL — e.g. "https://api.gleif.org/api/v1". The dormancy switch.
 *
 * The JSON:API parsing is pure + unit-tested; only the thin fetch wrappers touch
 * the network, fail-closed to {enabled:false} on any error (never throw into a
 * request). Server-only; no secret is involved (keyless), so nothing to leak.
 */

import { logApiError } from "@/lib/server/log";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** The documented default base; set GLEIF_API_BASE_URL to this to activate. */
export const GLEIF_DEFAULT_BASE = "https://api.gleif.org/api/v1";

/** True only when GLEIF_API_BASE_URL is set. Single source of dormancy. */
export function gleifConfigured(): boolean {
  return Boolean(env("GLEIF_API_BASE_URL"));
}

function baseUrl(): string {
  // Honor an override but normalize a trailing slash; default to the GLEIF prod host.
  return (env("GLEIF_API_BASE_URL") ?? GLEIF_DEFAULT_BASE).replace(/\/+$/, "");
}

/** A 20-char GLEIF LEI (ISO 17442). */
const LEI_RE = /^[A-Z0-9]{20}$/;

export interface GleifEntity {
  lei: string;
  legalName: string | null;
  status: string | null; // entity status, e.g. "ACTIVE"
  jurisdiction: string | null;
}

/**
 * Pure: extract the LEI + legal name + status from a single JSON:API `lei-records`
 * resource object (the shape returned by /lei-records and /lei-records/{lei}).
 * Returns null when the object isn't a usable record.
 */
export function parseLeiRecord(resource: unknown): GleifEntity | null {
  if (!resource || typeof resource !== "object") return null;
  const r = resource as {
    id?: unknown;
    attributes?: {
      lei?: unknown;
      entity?: { legalName?: { name?: unknown }; status?: unknown; jurisdiction?: unknown };
    };
  };
  const lei = typeof r.id === "string" && LEI_RE.test(r.id) ? r.id : null;
  if (!lei) return null;
  const entity = r.attributes?.entity;
  const legalName =
    entity && typeof entity.legalName?.name === "string" ? entity.legalName.name : null;
  const status = entity && typeof entity.status === "string" ? entity.status : null;
  const jurisdiction =
    entity && typeof entity.jurisdiction === "string" ? entity.jurisdiction : null;
  return { lei, legalName, status, jurisdiction };
}

/** Pure: extract the first N entities from a JSON:API list response (`data: [...]`). */
export function parseLeiList(json: unknown, limit = 5): GleifEntity[] {
  const data = (json as { data?: unknown })?.data;
  if (!Array.isArray(data)) return [];
  const out: GleifEntity[] = [];
  for (const item of data) {
    const e = parseLeiRecord(item);
    if (e) out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

export interface GleifLookup {
  query: string;
  matches: GleifEntity[];
  directParent: GleifEntity | null;
  ultimateParent: GleifEntity | null;
}

export type GleifResult =
  | { enabled: true; source: "GLEIF"; lookup: GleifLookup; fetchedAt: string }
  | { enabled: false; reason: "no-keys" | "fetch-failed" | "no-match" };

const ACCEPT = { Accept: "application/vnd.api+json" } as const;

async function getJson(url: string, quiet404 = false): Promise<unknown | null> {
  const res = await fetch(url, { headers: ACCEPT, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    // A 404 on a relationship sub-resource is the documented "no parent declared"
    // case (see fetchParent) — expected, not an error worth alerting on. Only log
    // genuine failures (5xx, timeouts, unexpected 4xx on the search call).
    if (!(quiet404 && res.status === 404)) {
      logApiError("gleif", new Error(`GLEIF HTTP ${res.status}`));
    }
    return null;
  }
  return res.json().catch(() => null);
}

/** Fetch the direct or ultimate parent record for an LEI, or null when undeclared. */
async function fetchParent(lei: string, kind: "direct" | "ultimate"): Promise<GleifEntity | null> {
  // The relationship sub-resource 404s (or returns no data) when the parent
  // relationship isn't declared — that's a normal "no parent", not an error, so
  // pass quiet404 to keep it out of the error stream / error-rate alerting.
  const json = await getJson(`${baseUrl()}/lei-records/${encodeURIComponent(lei)}/${kind}-parent`, true);
  if (!json) return null;
  return parseLeiRecord((json as { data?: unknown }).data);
}

/**
 * Resolve a legal-entity name to its LEI record(s) and parent chain. Returns
 * {enabled:false} when dormant (base URL unset) or on any error — callers hide the
 * panel and never see a throw. `name` is the entity's legal name (e.g. "Eaton Corp").
 */
export async function lookupEntity(name: string): Promise<GleifResult> {
  if (!gleifConfigured()) return { enabled: false, reason: "no-keys" }; // ← dormant
  const q = name.trim();
  if (!q) return { enabled: false, reason: "no-match" };
  try {
    const listJson = await getJson(
      `${baseUrl()}/lei-records?filter[entity.legalName]=${encodeURIComponent(q)}&page[size]=5`,
    );
    if (!listJson) return { enabled: false, reason: "fetch-failed" };
    const matches = parseLeiList(listJson, 5);
    if (matches.length === 0) return { enabled: false, reason: "no-match" };

    // Walk the hierarchy for the best (first) match only — one extra pair of calls.
    const [directParent, ultimateParent] = await Promise.all([
      fetchParent(matches[0].lei, "direct"),
      fetchParent(matches[0].lei, "ultimate"),
    ]);

    return {
      enabled: true,
      source: "GLEIF",
      lookup: { query: q, matches, directParent, ultimateParent },
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    logApiError("gleif", e);
    return { enabled: false, reason: "fetch-failed" };
  }
}
