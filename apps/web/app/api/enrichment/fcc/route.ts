import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { fccEasConfigured, lookupFccId } from "@/lib/integration/fcc-eas-live";

export const dynamic = "force-dynamic";

/**
 * FCC equipment-authorization enrichment (DI-9) — maps an FCC ID to its grantee
 * (manufacturer) organization. DORMANT/$0 until FCC_SOCRATA_APP_TOKEN (free) is set.
 * No-param probe is public (zero network); the lookup is auth-gated.
 *
 * GET (no params)  → { fccEas } readiness boolean.
 * GET ?fccId=      → grantee lookup for the FCC ID.
 */
const QuerySchema = z.object({ fccId: z.string().trim().min(4).max(40) });

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);

  const { searchParams } = new URL(req.url);
  if (!searchParams.has("fccId")) {
    return NextResponse.json({ fccEas: fccEasConfigured() });
  }

  const denied = requireApiAuth(req);
  if (denied) return denied;

  if (!fccEasConfigured()) return NextResponse.json({ enabled: false, reason: "not-configured" });

  let q: z.infer<typeof QuerySchema>;
  try {
    q = QuerySchema.parse({ fccId: searchParams.get("fccId") });
  } catch {
    return NextResponse.json({ error: "Invalid FCC ID" }, { status: 400 });
  }

  try {
    return NextResponse.json(await lookupFccId(q.fccId));
  } catch (e) {
    logApiError("/api/enrichment/fcc:GET", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
