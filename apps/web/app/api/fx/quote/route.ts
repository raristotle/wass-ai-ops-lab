import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { logApiError } from "@/lib/server/log";
import { fxConfigured, configuredCurrencies, getIndicativeRates } from "@/lib/integration/fx-live";

export const dynamic = "force-dynamic";

/**
 * Indicative FX rates for multi-currency quoting (Frankfurter). Dormant until
 * FX_QUOTE_CURRENCIES is set: GET then returns {configured:false} WITHOUT any
 * upstream call, so quotes show only the authoritative USD total.
 *
 * Read-only + display-only: it returns nothing but public ECB reference rates,
 * carries no secret, no PII, and never touches pricing or payment — so it is
 * rate-limited (to bound abuse) but intentionally NOT auth-gated, because the
 * customer-facing quote-acceptance page (no login) consumes it. The seam's daily
 * cache + single-flight keep steady-state request volume from fanning out to
 * repeated upstream fetches.
 */
export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);

  if (!fxConfigured()) {
    return NextResponse.json({ configured: false, currencies: [] });
  }

  try {
    const result = await getIndicativeRates();
    if (!result.enabled) {
      // Configured but upstream unavailable — caller just omits the secondary line.
      return NextResponse.json({ configured: true, currencies: configuredCurrencies(), rates: null });
    }
    return NextResponse.json({
      configured: true,
      base: result.rates.base,
      asOf: result.rates.asOf,
      rates: result.rates.rates, // [{ currency, rate, asOf }]
    });
  } catch (e) {
    logApiError("/api/fx/quote:GET", e);
    return NextResponse.json({ configured: true, rates: null }, { status: 200 });
  }
}
