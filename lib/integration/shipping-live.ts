/**
 * Live multi-carrier shipping rates (REAL) — Shippo, env-gated like the FRED
 * commodity seam: real rate quotes only when SHIPPO_API_TOKEN is set, otherwise
 * the caller shows its simulated/disabled state. RATE QUOTING IS FREE (Shippo
 * only bills when you BUY a label — which this seam never does). Raw fetch, no
 * SDK, server-only. The rate→quote transform is pure + unit-tested; only the thin
 * fetch wrapper touches the network. Fail-closed: any error → {enabled:false}.
 *
 *   SHIPPO_API_TOKEN — Shippo key (shippo_test_/shippo_live_). The gate.
 */

import { logApiError } from "@/lib/server/log";

const SHIPMENTS_URL = "https://api.goshippo.com/shipments/";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True when Shippo is configured. Single source of dormancy. */
export function shippingConfigured(): boolean {
  return Boolean(env("SHIPPO_API_TOKEN"));
}

export interface ShippoAddress {
  name?: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}
export interface ShippoParcel {
  length: string;
  width: string;
  height: string;
  distance_unit: string;
  weight: string;
  mass_unit: string;
}
export interface RateQuote {
  carrier: string;
  service: string;
  serviceToken: string;
  amount: number;
  currency: string;
  estimatedDays: number | null;
  rateId: string;
}

interface ShippoRate {
  object_id?: string;
  provider?: string;
  servicelevel?: { name?: string; token?: string } | null;
  amount?: string;
  currency?: string;
  estimated_days?: number | null;
}

/** Pure: map Shippo `rates[]` to RateQuote[], dropping malformed rows, cheapest first. */
export function shippoRatesToQuotes(rates: ShippoRate[]): RateQuote[] {
  const out: RateQuote[] = [];
  for (const r of rates) {
    const amount = Number(r.amount);
    if (!r.object_id || !r.provider || !Number.isFinite(amount)) continue; // amount is a STRING from Shippo
    out.push({
      carrier: r.provider,
      service: r.servicelevel?.name ?? r.provider,
      serviceToken: r.servicelevel?.token ?? "",
      amount,
      currency: r.currency ?? "USD",
      estimatedDays: typeof r.estimated_days === "number" ? r.estimated_days : null,
      rateId: r.object_id,
    });
  }
  return out.sort((a, b) => a.amount - b.amount);
}

export type ShippingRatesResult =
  | { enabled: true; source: "Shippo"; quotes: RateQuote[]; fetchedAt: string }
  | { enabled: false; reason: "no-keys" | "error" };

/**
 * Get shipping rate quotes for a parcel. Returns {enabled:false} when dormant
 * (no token) or on any error — never throws. Synchronous rates via async:false.
 * Quoting only; never buys a label (no spend).
 */
export async function getShippingRates(input: {
  addressFrom: ShippoAddress;
  addressTo: ShippoAddress;
  parcel: ShippoParcel;
}): Promise<ShippingRatesResult> {
  const token = env("SHIPPO_API_TOKEN");
  if (!token) return { enabled: false, reason: "no-keys" }; // ← dormant: no token ⇒ no network

  try {
    const res = await fetch(SHIPMENTS_URL, {
      method: "POST",
      // NOTE: Shippo uses `ShippoToken <key>`, NOT Bearer.
      headers: { Authorization: `ShippoToken ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        address_from: input.addressFrom,
        address_to: input.addressTo,
        parcels: [input.parcel],
        async: false,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      logApiError("shippo:rates", new Error(`Shippo HTTP ${res.status}`));
      return { enabled: false, reason: "error" };
    }
    const json = (await res.json().catch(() => ({}))) as { rates?: ShippoRate[] };
    return { enabled: true, source: "Shippo", quotes: shippoRatesToQuotes(json.rates ?? []), fetchedAt: new Date().toISOString() };
  } catch (e) {
    logApiError("shippo:rates", e);
    return { enabled: false, reason: "error" };
  }
}
