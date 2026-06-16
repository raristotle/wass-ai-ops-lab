/**
 * Indicative multi-currency quoting (REAL) — env-gated exactly like the FRED
 * commodity and Stripe Tax seams. Pulls daily reference rates from the free,
 * NO-KEY Frankfurter API (ECB-sourced) so a quote can show a secondary-currency
 * total beside the authoritative USD total for cross-border (CA/MX/export)
 * accounts.
 *
 * DISPLAY-ONLY and SAFE BY DESIGN:
 *  - USD is always authoritative; the secondary line is clearly marked indicative.
 *  - Never touches pricing math or the payment path — it only multiplies a total
 *    the caller already has by a public rate.
 *  - Dormant by default: FX_QUOTE_CURRENCIES gates it. Unset ⇒ no fetch, no line,
 *    $0/zero-network. Frankfurter needs no API key, so the env var is purely the
 *    on/off switch plus which currencies to display.
 *  - Rates are cached per UTC day in the KV (global on the Postgres backend,
 *    per-instance on the in-memory fallback), and concurrent cache-misses are
 *    coalesced with a per-instance single-flight, so steady-state request volume
 *    does not fan out to repeated upstream calls.
 *
 *   FX_QUOTE_CURRENCIES — comma list of ISO-4217 codes, e.g. "CAD,MXN,EUR".
 */

import { z } from "zod";
import { logApiError } from "@/lib/server/log";
import { getStore } from "@/lib/server/persistence";

const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest";
const BASE = "USD";
const MAX_CURRENCIES = 5;
const CACHE_NS = "fx-rates";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/**
 * The configured secondary currencies (uppercased, de-duped, USD excluded,
 * validated as 3-letter codes, capped). Empty array ⇒ the seam is dormant.
 */
export function configuredCurrencies(): string[] {
  const raw = env("FX_QUOTE_CURRENCIES");
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tok of raw.split(",")) {
    const c = tok.trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(c) && c !== BASE && !seen.has(c)) {
      seen.add(c);
      out.push(c);
      if (out.length >= MAX_CURRENCIES) break;
    }
  }
  return out;
}

/** True only when at least one valid secondary currency is configured. */
export function fxConfigured(): boolean {
  return configuredCurrencies().length > 0;
}

export interface FxRate {
  currency: string;
  rate: number; // units of `currency` per 1 USD
  asOf: string; // ECB rate date (YYYY-MM-DD)
}
export interface FxRates {
  base: string;
  asOf: string;
  rates: FxRate[];
}

const FrankfurterSchema = z.object({
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
});

/**
 * Shape a Frankfurter `/latest` response into our FxRates for the requested
 * currencies, dropping any missing/non-finite/non-positive rate. Returns null
 * when the payload is unusable or no requested rate survived. Pure + unit-tested.
 */
export function frankfurterToRates(json: unknown, currencies: string[]): FxRates | null {
  const parsed = FrankfurterSchema.safeParse(json);
  if (!parsed.success) return null;
  const { base, date, rates } = parsed.data;
  if (base !== BASE) return null; // fail-closed if upstream ever echoes a non-USD base
  const out: FxRate[] = [];
  for (const c of currencies) {
    const r = rates[c];
    if (typeof r === "number" && Number.isFinite(r) && r > 0) {
      out.push({ currency: c, rate: r, asOf: date });
    }
  }
  if (out.length === 0) return null;
  return { base, asOf: date, rates: out };
}

async function fetchRates(currencies: string[]): Promise<FxRates | null> {
  const symbols = currencies.join(",");
  const url = `${FRANKFURTER_URL}?base=${BASE}&symbols=${encodeURIComponent(symbols)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) {
      logApiError("fx:fetch", new Error(`Frankfurter HTTP ${res.status}`), { symbols });
      return null;
    }
    const json: unknown = await res.json().catch(() => null);
    return frankfurterToRates(json, currencies);
  } catch (e) {
    logApiError("fx:fetch", e, { symbols });
    return null;
  }
}

export type FxResult =
  | { enabled: false; reason: "not-configured" }
  | { enabled: false; reason: "error" }
  | { enabled: true; rates: FxRates; cached: boolean };

// Per-instance single-flight: concurrent cache-misses for the same key share one
// upstream fetch instead of stampeding Frankfurter at a cold start / day rollover.
const g = globalThis as unknown as { __fxInflight?: Map<string, Promise<FxResult>> };
function inflight(): Map<string, Promise<FxResult>> {
  if (!g.__fxInflight) g.__fxInflight = new Map();
  return g.__fxInflight;
}

/**
 * Indicative USD→secondary rates, cached once per UTC day. Dormant (no fetch)
 * when FX_QUOTE_CURRENCIES is unset; returns {enabled:false} on any upstream
 * error so the caller simply omits the secondary line.
 */
export async function getIndicativeRates(): Promise<FxResult> {
  const currencies = configuredCurrencies();
  if (currencies.length === 0) return { enabled: false, reason: "not-configured" };

  const dayKey = new Date().toISOString().slice(0, 10);
  const cacheKey = `${BASE}:${currencies.join(",")}:${dayKey}`;
  const store = getStore();

  const cached = await store.get<FxRates>(CACHE_NS, cacheKey).catch(() => null);
  if (cached) return { enabled: true, rates: cached, cached: true };

  // Coalesce concurrent misses for this key into one upstream fetch.
  const flights = inflight();
  const existing = flights.get(cacheKey);
  if (existing) return existing;

  const flight: Promise<FxResult> = (async () => {
    const fresh = await fetchRates(currencies);
    if (!fresh) return { enabled: false, reason: "error" } as const;
    await store.put(CACHE_NS, cacheKey, fresh).catch(() => {});
    return { enabled: true, rates: fresh, cached: false } as const;
  })();
  flights.set(cacheKey, flight);
  try {
    return await flight;
  } finally {
    flights.delete(cacheKey);
  }
}
