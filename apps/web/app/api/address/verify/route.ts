import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { addressVerifyConfigured, verifyAddress } from "@/lib/integration/address-verify-live";

export const dynamic = "force-dynamic";

/**
 * Verify + standardize a ship-to / jobsite / will-call address (USPS v3).
 * Dormant until USPS_CLIENT_ID + USPS_CLIENT_SECRET are set: POST then returns
 * {configured:false, verified:null} WITHOUT any USPS call. Rate-limited and
 * auth-gated; the route returns only the standardized address it computed.
 */
const BodySchema = z.object({
  street: z.string().trim().min(2).max(200),
  secondary: z.string().trim().max(100).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(40).optional(),
  zip: z.string().trim().max(10).optional(),
});

export function GET() {
  return NextResponse.json({ configured: addressVerifyConfigured() });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  if (!addressVerifyConfigured()) {
    return NextResponse.json({ configured: false, verified: null });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid address." }, { status: 400 });

    const result = await verifyAddress(parsed.data);
    if (!result.enabled) {
      return NextResponse.json({ configured: true, verified: null });
    }
    return NextResponse.json({ configured: true, verified: result.verified });
  } catch (e) {
    logApiError("/api/address/verify:POST", e);
    return NextResponse.json({ error: "Could not verify address." }, { status: 400 });
  }
}
