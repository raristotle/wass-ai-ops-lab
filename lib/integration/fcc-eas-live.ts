/**
 * FCC Equipment Authorization (EAS) live lookup (REAL) — env-gated DORMANT, $0
 * (DI-9). Maps an FCC ID (printed on any intentional/unintentional radiator —
 * wireless access points, sensors, datacom gear) to its grantee organization, so
 * the brand-entity panel can show the real manufacturer/applicant behind a product
 * and a compliance facet can badge it "FCC grantee verified."
 *
 * Served by Socrata (opendata.fcc.gov, dataset 3b3k-34jp = grantee registrations),
 * US-Government public domain. Keyless reads work; a free Socrata app token removes
 * IP throttling. Per our "zero network until enabled" rule we gate on
 * FCC_SOCRATA_APP_TOKEN — registering the free token is the switch.
 *
 *   FCC_SOCRATA_APP_TOKEN — free Socrata app token (X-App-Token header) + the gate.
 *
 * NOTE: 3b3k-34jp is GRANTEE-level (grantee code → applicant/name), not full
 * per-grant detail (equipment class / frequencies live in the legacy EAS grant
 * reports). The exact column API names weren't byte-confirmable during research, so
 * the parser reads several candidate field names defensively. The FCC-ID→grantee
 * split + row transform are pure + unit-tested; the thin fetch fails closed.
 */

import { logApiError } from "@/lib/server/log";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

export const FCC_SOCRATA_URL = "https://opendata.fcc.gov/resource/3b3k-34jp.json";

/** True only when the free FCC_SOCRATA_APP_TOKEN is set. Single source of dormancy. */
export function fccEasConfigured(): boolean {
  return Boolean(env("FCC_SOCRATA_APP_TOKEN"));
}

/**
 * Pure: split an FCC ID into (grantee code, product code). FCC IDs concatenate a
 * grantee code + a product code. Grantee codes are 3 chars when the leading char is
 * a letter, 5 chars when it's a digit (2-9). Returns null for an unusable input.
 */
export function fccIdToGrantee(fccId: string): { granteeCode: string; productCode: string } | null {
  const clean = fccId.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length < 4) return null;
  const len = /^[0-9]/.test(clean) ? 5 : 3;
  if (clean.length <= len) return null; // need at least one product-code char
  return { granteeCode: clean.slice(0, len), productCode: clean.slice(len) };
}

export interface FccGrantee {
  granteeCode: string;
  /** Applicant / grantee organization name (manufacturer). */
  name: string | null;
  country: string | null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Pure: a Socrata grantee row → normalized record (defensive on field names). */
export function parseFccGranteeRow(row: Record<string, unknown>): FccGrantee {
  return {
    granteeCode: str(row.grantee_code) ?? str(row.grantee_code_id) ?? "",
    name:
      str(row.grantee_name) ??
      str(row.applicant_name) ??
      str(row.name) ??
      str(row.party_name),
    country: str(row.country) ?? str(row.grantee_country),
  };
}

export interface FccLookup {
  fccId: string;
  granteeCode: string;
  productCode: string;
  grantees: FccGrantee[];
}

export type FccResult =
  | { enabled: true; source: "FCC EAS"; lookup: FccLookup; fetchedAt: string }
  | { enabled: false; reason: "no-keys" | "fetch-failed" | "no-match" | "bad-id" };

/**
 * Resolve an FCC ID to its grantee record(s). Returns {enabled:false} when dormant
 * (no token) / on a malformed id / on error / no match.
 */
export async function lookupFccId(fccId: string): Promise<FccResult> {
  const token = env("FCC_SOCRATA_APP_TOKEN");
  if (!token) return { enabled: false, reason: "no-keys" }; // ← dormant
  const split = fccIdToGrantee(fccId);
  if (!split) return { enabled: false, reason: "bad-id" };
  try {
    const where = encodeURIComponent(`grantee_code='${split.granteeCode.replace(/'/g, "''")}'`);
    const url = `${FCC_SOCRATA_URL}?$where=${where}&$limit=5`;
    const res = await fetch(url, {
      headers: { "X-App-Token": token, Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      logApiError("fcc-eas", new Error(`FCC Socrata HTTP ${res.status}`));
      return { enabled: false, reason: "fetch-failed" };
    }
    const json = await res.json().catch(() => null);
    if (!Array.isArray(json) || json.length === 0) return { enabled: false, reason: "no-match" };
    const grantees = json.map((r) => parseFccGranteeRow(r as Record<string, unknown>));
    return {
      enabled: true,
      source: "FCC EAS",
      lookup: { fccId: fccId.trim(), granteeCode: split.granteeCode, productCode: split.productCode, grantees },
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    logApiError("fcc-eas", e);
    return { enabled: false, reason: "fetch-failed" };
  }
}
