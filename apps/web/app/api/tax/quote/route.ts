import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { stripeTaxConfigured, calculateTax, TaxQuoteInputSchema } from "@/lib/integration/stripe-tax";

export const dynamic = "force-dynamic";

/**
 * Sales-tax quote (Stripe Tax). Dormant until STRIPE_SECRET_KEY is set: POST then
 * returns {configured:false, tax:null} WITHOUT any Stripe call, so the checkout
 * UI falls back to the pre-tax total. The address (PII) is never echoed back and
 * never logged. POST is rate-limited and auth-gated like the other API surfaces
 * that spend a server credential; GET is a config boolean only (no secret leaves).
 */

/** GET → whether real tax calc is configured (UI switches its messaging). */
export function GET() {
  return NextResponse.json({ configured: stripeTaxConfigured() });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  // Dormant: no key ⇒ no Stripe call; the UI shows the pre-tax total.
  if (!stripeTaxConfigured()) {
    return NextResponse.json({ configured: false, tax: null });
  }

  try {
    const parsed = TaxQuoteInputSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid tax request." }, { status: 400 });

    const result = await calculateTax(parsed.data);
    if (!result.enabled) {
      return NextResponse.json({ configured: true, tax: null, error: "Tax calculation unavailable." }, { status: 502 });
    }
    const c = result.calculation;
    // Return ONLY computed amounts (cents) — never echo the address back.
    return NextResponse.json({
      configured: true,
      currency: c.currency,
      amountTotal: c.amount_total,
      taxAmountExclusive: c.tax_amount_exclusive,
      taxBreakdown: c.tax_breakdown,
    });
  } catch (e) {
    logApiError("/api/tax/quote:POST", e);
    return NextResponse.json({ error: "Could not calculate tax." }, { status: 400 });
  }
}
