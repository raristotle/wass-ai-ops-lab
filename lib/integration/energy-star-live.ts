/**
 * ENERGY STAR certified-products live lookup (REAL) — env-gated DORMANT, $0 (DI-2).
 *
 * Confirms a lighting SKU's ENERGY STAR certification and pulls the photometric
 * facts utilities care about — lumens, watts, efficacy (lm/W) — plus a UPC from the
 * companion identifier dataset. This is the free half of the documented activation
 * path for the rebate estimator (product-finder-rebates.ts): ENERGY STAR / DLC
 * tell you a product is rebate-ELIGIBLE.
 *
 * Served by Socrata (data.energystar.gov), EPA public domain. Keyless reads work
 * for the public "Connected Light Bulbs" + "UPC" datasets, but a free Socrata app
 * token removes IP throttling AND unlocks the broader (now access-restricted)
 * lighting tables. Per our "zero network until enabled" rule we gate on
 * ENERGY_STAR_APP_TOKEN — registering the free token is the switch.
 *
 *   ENERGY_STAR_APP_TOKEN — free Socrata app token (X-App-Token header) + the gate.
 *   ENERGY_STAR_DATASET    — optional dataset id override (default: connected bulbs).
 *
 * The row→fields transform is pure + unit-tested; the thin fetch fails closed.
 * Server-only; the token is sent as a header and never returned to the client.
 */

import { logApiError } from "@/lib/server/log";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

const HOST = "https://data.energystar.gov/resource";
/** Public "Connected Light Bulbs" dataset — full lumens/watts/efficacy schema. */
export const DEFAULT_LIGHTING_DATASET = "msj5-kqfv";
/** Public cross-category "UPC Codes" dataset (join on model_number / brand). */
export const UPC_DATASET = "8edu-y555";

/** True only when the free ENERGY_STAR_APP_TOKEN is set. Single source of dormancy. */
export function energyStarConfigured(): boolean {
  return Boolean(env("ENERGY_STAR_APP_TOKEN"));
}

export interface EnergyStarRecord {
  brand: string | null;
  model: string | null;
  /** Brightness in lumens. */
  lumens: number | null;
  /** Energy used, watts. */
  watts: number | null;
  /** Efficacy, lumens per watt. */
  efficacy: number | null;
  cct: number | null; // correlated color temperature, Kelvin
  cri: number | null; // color rendering index
  upc: string | null; // joined from the UPC dataset when available
  certified: true; // presence in the dataset IS the ENERGY STAR certification
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Pure: a Socrata lighting row → our normalized record (defensive on field names). */
export function parseEnergyStarRow(row: Record<string, unknown>): EnergyStarRecord {
  return {
    brand: str(row.brand_name),
    model: str(row.model_number) ?? str(row.model_name),
    lumens: num(row.brightness_lumens),
    watts: num(row.energy_used_watts),
    efficacy: num(row.efficacy_lumens_watt),
    cct: num(row.light_appearance_kelvin),
    cri: num(row.color_quality_cri),
    upc: str(row.upc), // present only after a UPC-dataset join
    certified: true,
  };
}

/** Pure: SoQL `$where` clause for an exact brand+model match (single-quotes escaped). */
export function buildWhere(brand: string | undefined, model: string): string {
  const esc = (s: string) => s.replace(/'/g, "''");
  const parts = [`model_number='${esc(model)}'`];
  if (brand && brand.trim()) parts.push(`upper(brand_name)=upper('${esc(brand.trim())}')`);
  return parts.join(" AND ");
}

export type EnergyStarResult =
  | { enabled: true; source: "ENERGY STAR"; records: EnergyStarRecord[]; fetchedAt: string }
  | { enabled: false; reason: "no-keys" | "fetch-failed" | "no-match" };

async function socrataGet(dataset: string, query: string, token: string): Promise<unknown[] | null> {
  const url = `${HOST}/${dataset}.json?${query}`;
  const res = await fetch(url, {
    headers: { "X-App-Token": token, Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    logApiError("energy-star", new Error(`Socrata HTTP ${res.status}`));
    return null;
  }
  const json = await res.json().catch(() => null);
  return Array.isArray(json) ? json : null;
}

/**
 * Look up ENERGY STAR certification + photometrics for a lighting product by
 * brand + model. Returns {enabled:false} when dormant / on error / no match.
 * A best-effort UPC join enriches the record but never fails the lookup.
 */
export async function lookupCertifiedLighting(model: string, brand?: string): Promise<EnergyStarResult> {
  const token = env("ENERGY_STAR_APP_TOKEN");
  if (!token) return { enabled: false, reason: "no-keys" }; // ← dormant
  const m = model.trim();
  if (!m) return { enabled: false, reason: "no-match" };
  const dataset = env("ENERGY_STAR_DATASET") ?? DEFAULT_LIGHTING_DATASET;
  try {
    const where = encodeURIComponent(buildWhere(brand, m));
    const rows = await socrataGet(dataset, `$where=${where}&$limit=10`, token);
    if (!rows) return { enabled: false, reason: "fetch-failed" };
    if (rows.length === 0) return { enabled: false, reason: "no-match" };
    const records = rows.map((r) => parseEnergyStarRow(r as Record<string, unknown>));

    // Best-effort UPC join (separate dataset). Never blocks the primary result.
    try {
      const upcWhere = encodeURIComponent(`model_number='${m.replace(/'/g, "''")}'`);
      const upcRows = await socrataGet(UPC_DATASET, `$select=model_number,upc&$where=${upcWhere}&$limit=1`, token);
      const upc = str((upcRows?.[0] as Record<string, unknown> | undefined)?.upc);
      if (upc && records[0]) records[0].upc = upc;
    } catch {
      /* UPC enrichment is optional — ignore. */
    }

    return { enabled: true, source: "ENERGY STAR", records, fetchedAt: new Date().toISOString() };
  } catch (e) {
    logApiError("energy-star", e);
    return { enabled: false, reason: "fetch-failed" };
  }
}
