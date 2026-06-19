/**
 * OpenEI Utility Rate Database (URDB) live lookup (REAL) — env-gated DORMANT, $0
 * (DI-13). Resolves a jobsite/branch address to the applicable electric utility
 * tariffs (energy + demand charge structure, fixed charges, sector) so the app can
 * add location-aware operating-cost context to lighting/motor/HVAC quotes —
 * deepening the rebate/SPA surface from a generic estimate toward a real, local
 * utility-rate figure.
 *
 * The URDB "Get Utility Rates" service (api.openei.org/utility_rates) is FREE; data
 * is CC0 (public domain). It requires a free OpenEI api_key; the shared DEMO_KEY
 * works for smoke-testing but is heavily throttled, so we gate on OPENEI_API_KEY
 * (a real free key) — that's the dormancy switch and the prod activation step.
 *
 *   OPENEI_API_KEY — free OpenEI/api.data.gov key (the gate + the rate quota).
 *
 * The items transform is pure + unit-tested; the thin GET fails closed. Server-only;
 * the key is a query param to OpenEI and is never returned to the client.
 */

import { logApiError } from "@/lib/server/log";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

export const URDB_URL = "https://api.openei.org/utility_rates";

/** True only when a real OPENEI_API_KEY is set. Single source of dormancy. */
export function urdbConfigured(): boolean {
  return Boolean(env("OPENEI_API_KEY"));
}

export interface UtilityRate {
  label: string; // URDB rate id
  utility: string | null;
  name: string | null; // rate/tariff name
  sector: string | null; // Residential | Commercial | Industrial | Lighting
  /** Fixed charge amount + unit ($/day | $/month | ...), when present. */
  fixedCharge: number | null;
  fixedChargeUnits: string | null;
  /** True when the tariff carries a demand ($/kW) charge structure. */
  hasDemandCharges: boolean;
  /** True when the tariff carries a time-varying energy ($/kWh) structure. */
  hasEnergyCharges: boolean;
  startDate: string | null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Pure: a URDB `items[]` element → normalized rate (defensive; detail=full shape). */
export function parseUrdbItem(item: Record<string, unknown>): UtilityRate {
  const energy = item.energyratestructure;
  const demand = item.demandratestructure;
  const flatDemand = item.flatdemandstructure;
  return {
    label: str(item.label) ?? "",
    utility: str(item.utility),
    name: str(item.name),
    sector: str(item.sector),
    fixedCharge: num(item.fixedchargefirstmeter),
    fixedChargeUnits: str(item.fixedchargeunits),
    hasDemandCharges: (Array.isArray(demand) && demand.length > 0) || (Array.isArray(flatDemand) && flatDemand.length > 0),
    hasEnergyCharges: Array.isArray(energy) && energy.length > 0,
    startDate: str(item.startdate),
  };
}

/** Pure: full URDB response → the first `limit` normalized rates. */
export function parseUrdbResponse(json: unknown, limit = 10): UtilityRate[] {
  const items = (json as { items?: unknown })?.items;
  if (!Array.isArray(items)) return [];
  return items.slice(0, limit).map((i) => parseUrdbItem(i as Record<string, unknown>));
}

export type UrdbResult =
  | { enabled: true; source: "OpenEI URDB"; address: string; rates: UtilityRate[]; fetchedAt: string }
  | { enabled: false; reason: "no-keys" | "fetch-failed" | "no-match" };

export type UrdbSector = "Residential" | "Commercial" | "Industrial" | "Lighting";

/**
 * Look up utility tariffs for an address (default sector Commercial). Returns
 * {enabled:false} when dormant (no key) / on error / no match.
 */
export async function lookupUtilityRates(address: string, sector: UrdbSector = "Commercial"): Promise<UrdbResult> {
  const key = env("OPENEI_API_KEY");
  if (!key) return { enabled: false, reason: "no-keys" }; // ← dormant: no key ⇒ no network
  const addr = address.trim();
  if (!addr) return { enabled: false, reason: "no-match" };
  try {
    const params = new URLSearchParams({
      version: "7",
      format: "json",
      detail: "full",
      approved: "true",
      sector,
      address: addr,
      limit: "10",
      api_key: key,
    });
    const res = await fetch(`${URDB_URL}?${params.toString()}`, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      logApiError("urdb", new Error(`URDB HTTP ${res.status}`));
      return { enabled: false, reason: "fetch-failed" };
    }
    const json = await res.json().catch(() => null);
    const rates = parseUrdbResponse(json);
    if (rates.length === 0) return { enabled: false, reason: "no-match" };
    return { enabled: true, source: "OpenEI URDB", address: addr, rates, fetchedAt: new Date().toISOString() };
  } catch (e) {
    logApiError("urdb", e);
    return { enabled: false, reason: "fetch-failed" };
  }
}
