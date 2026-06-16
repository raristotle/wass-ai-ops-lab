import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { shippingConfigured, getShippingRates } from "@/lib/integration/shipping-live";

export const dynamic = "force-dynamic";

/**
 * Multi-carrier shipping rate quotes (Shippo). Dormant until SHIPPO_API_TOKEN is
 * set: POST returns {enabled:false, reason:"no-keys"} with no Shippo call. Quoting
 * is free; this seam never buys a label. Rate-limited + auth-gated (addresses are
 * PII and the call spends a server credential).
 */

const Addr = z.object({
  name: z.string().max(120).optional(),
  street1: z.string().min(1).max(200),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(40),
  zip: z.string().min(1).max(20),
  country: z.string().length(2),
});
const Parcel = z.object({
  length: z.string().max(12),
  width: z.string().max(12),
  height: z.string().max(12),
  distance_unit: z.string().max(8),
  weight: z.string().max(12),
  mass_unit: z.string().max(8),
});
const BodySchema = z.object({ addressFrom: Addr, addressTo: Addr, parcel: Parcel });

export function GET() {
  return NextResponse.json({ configured: shippingConfigured() });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  if (!shippingConfigured()) return NextResponse.json({ enabled: false, reason: "no-keys" });
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    return NextResponse.json(await getShippingRates(parsed.data));
  } catch (e) {
    logApiError("/api/shipping/rates:POST", e);
    return NextResponse.json({ error: "Could not fetch rates." }, { status: 400 });
  }
}
