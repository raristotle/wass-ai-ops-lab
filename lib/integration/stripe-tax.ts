/**
 * Live sales-tax calculation (REAL) — Stripe Tax, env-gated exactly like the
 * Mouser/Digi-Key distributor seam and the FRED commodity seam: real tax math
 * only when STRIPE_SECRET_KEY is set, otherwise the caller treats tax as
 * unavailable and shows the pre-tax total.
 *
 * Zero cost until a key is added — AND zero cost even when active: this calls
 * POST /v1/tax/calculations (a *calculation*, which Stripe does NOT bill) and
 * NEVER creates a tax *transaction* (POST /v1/tax/transactions, the only billed
 * step). A calculation is not a charge and creates no PaymentIntent.
 *
 * Called with raw fetch — no Stripe SDK dependency, mirroring how the rest of
 * the repo talks to Neon/FRED/Upstash over HTTP. The request/response shaping is
 * pure and unit-tested; only the thin fetch wrapper touches the network.
 *
 * Project rule — never log raw payment payloads: addresses are PII, so on error
 * we log ONLY the HTTP status + Stripe error type/code/param + the COARSE
 * country/state (enough to route a tax-registration error); never the postal
 * code, the full address, the request body, or the response — and the API route
 * never echoes the address back.
 *
 *   STRIPE_SECRET_KEY   — server-only secret (sk_test_/sk_live_). The gate.
 *   STRIPE_API_VERSION  — optional; pins the `Stripe-Version` header so a
 *                         Stripe-side default bump can't change the response shape.
 */

import { z } from "zod";
import { logApiError } from "@/lib/server/log";

const STRIPE_TAX_URL = "https://api.stripe.com/v1/tax/calculations";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True only when the Stripe secret key is present. Single source of dormancy. */
export function stripeTaxConfigured(): boolean {
  return Boolean(env("STRIPE_SECRET_KEY"));
}

// ── Input — amounts are integers in the SMALLEST currency unit (cents) ──
export const TaxLineSchema = z.object({
  amount: z.number().int().nonnegative(), // 1000 = $10.00 (USD); JPY is 1:1
  reference: z.string().trim().min(1).max(500),
});
export const TaxAddressSchema = z.object({
  country: z.string().trim().length(2), // ISO 3166-1 alpha-2, e.g. "US"
  postal_code: z.string().trim().min(1).max(20).optional(), // required for accurate US rates
  state: z.string().trim().max(40).optional(),
  city: z.string().trim().max(80).optional(),
  line1: z.string().trim().max(200).optional(),
  line2: z.string().trim().max(200).optional(),
});
export const TaxQuoteInputSchema = z.object({
  currency: z.string().trim().length(3), // lowercase ISO, e.g. "usd"
  line_items: z.array(TaxLineSchema).min(1).max(100),
  address: TaxAddressSchema,
  address_source: z.enum(["billing", "shipping"]).default("shipping"),
});
export type TaxQuoteInput = z.infer<typeof TaxQuoteInputSchema>;

// ── Response — only the fields we use; all amounts are cents ──
const TaxBreakdownSchema = z.object({
  amount: z.number().int(),
  inclusive: z.boolean(),
  taxable_amount: z.number().int(),
  taxability_reason: z.string().nullable().optional(),
  tax_rate_details: z
    .object({
      country: z.string().nullable().optional(),
      state: z.string().nullable().optional(),
      percentage_decimal: z.string().nullable().optional(),
      tax_type: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});
const TaxCalcSchema = z.object({
  object: z.literal("tax.calculation"),
  amount_total: z.number().int(), // subtotal + tax, in cents
  tax_amount_exclusive: z.number().int(), // tax added on top, in cents
  tax_amount_inclusive: z.number().int(),
  currency: z.string(),
  tax_breakdown: z.array(TaxBreakdownSchema),
});
export type TaxCalculation = z.infer<typeof TaxCalcSchema>;

/**
 * Build the form-encoded body for a calculation (Stripe is
 * application/x-www-form-urlencoded with bracket-nested params, NOT JSON).
 * Pure + unit-tested.
 */
export function buildTaxForm(input: TaxQuoteInput): URLSearchParams {
  const form = new URLSearchParams();
  form.set("currency", input.currency);
  input.line_items.forEach((li, i) => {
    form.set(`line_items[${i}][amount]`, String(li.amount));
    form.set(`line_items[${i}][reference]`, li.reference);
  });
  const a = input.address;
  form.set("customer_details[address][country]", a.country);
  if (a.postal_code) form.set("customer_details[address][postal_code]", a.postal_code);
  if (a.state) form.set("customer_details[address][state]", a.state);
  if (a.city) form.set("customer_details[address][city]", a.city);
  if (a.line1) form.set("customer_details[address][line1]", a.line1);
  if (a.line2) form.set("customer_details[address][line2]", a.line2);
  form.set("customer_details[address_source]", input.address_source);
  return form;
}

export type TaxResult =
  | { enabled: false; reason: "not-configured" }
  | { enabled: false; reason: "error" }
  | { enabled: true; calculation: TaxCalculation };

/**
 * Calculate sales tax for a quote. Returns {enabled:false} when the seam is
 * dormant (no key) or on any Stripe/network error — callers fall back to the
 * pre-tax total. Does NOT create a charge or a tax transaction; safe to call.
 */
export async function calculateTax(input: TaxQuoteInput): Promise<TaxResult> {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) return { enabled: false, reason: "not-configured" }; // ← dormant guard: no key ⇒ no network

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const ver = env("STRIPE_API_VERSION");
  if (ver) headers["Stripe-Version"] = ver;

  try {
    const res = await fetch(STRIPE_TAX_URL, {
      method: "POST",
      headers,
      body: buildTaxForm(input).toString(),
      signal: AbortSignal.timeout(10_000),
    });
    const json: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = (json as { error?: { type?: string; code?: string; param?: string } }).error;
      const a = input.address;
      logApiError("stripe-tax:calculate", new Error(`Stripe Tax HTTP ${res.status}`), {
        type: err?.type ?? "unknown",
        code: err?.code ?? null,
        param: err?.param ?? null,
        // Coarse jurisdiction only — never the postal code, full address, or body (PII).
        country: a.country,
        region: a.state ?? null,
      });
      return { enabled: false, reason: "error" };
    }
    return { enabled: true, calculation: TaxCalcSchema.parse(json) };
  } catch (e) {
    logApiError("stripe-tax:calculate", e);
    return { enabled: false, reason: "error" };
  }
}
