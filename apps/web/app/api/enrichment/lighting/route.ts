import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { energyStarConfigured, lookupCertifiedLighting } from "@/lib/integration/energy-star-live";
import { dlcQplConfigured, lookupDlcListing } from "@/lib/integration/dlc-qpl-live";

export const dynamic = "force-dynamic";

/**
 * Lighting certification enrichment (DI-2) — confirms ENERGY STAR certification +
 * photometrics (lumens/watts/efficacy) by brand+model, and/or a DLC QPL listing by
 * DLC Product ID. Both lanes are DORMANT/$0 until their env keys are set (ENERGY
 * STAR free token; DLC paid token). The no-param probe is public (zero network) for
 * health checks; an actual lookup is auth-gated.
 *
 * GET (no params)              → { energyStar, dlcQpl } readiness booleans.
 * GET ?model=&brand=           → ENERGY STAR lookup.
 * GET ?dlcId=                  → DLC QPL listing lookup.
 */
const QuerySchema = z.object({
  model: z.string().trim().min(1).max(120).optional(),
  brand: z.string().trim().min(1).max(120).optional(),
  dlcId: z.string().trim().min(1).max(60).optional(),
});

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);

  const { searchParams } = new URL(req.url);
  const hasLookup = searchParams.has("model") || searchParams.has("dlcId");
  if (!hasLookup) {
    // Public probe — booleans only, no outbound call.
    return NextResponse.json({ energyStar: energyStarConfigured(), dlcQpl: dlcQplConfigured() });
  }

  const denied = requireApiAuth(req);
  if (denied) return denied;

  let q: z.infer<typeof QuerySchema>;
  try {
    q = QuerySchema.parse({
      model: searchParams.get("model") ?? undefined,
      brand: searchParams.get("brand") ?? undefined,
      dlcId: searchParams.get("dlcId") ?? undefined,
    });
  } catch {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  try {
    const [energyStar, dlc] = await Promise.all([
      q.model && energyStarConfigured() ? lookupCertifiedLighting(q.model, q.brand) : Promise.resolve(null),
      q.dlcId && dlcQplConfigured() ? lookupDlcListing(q.dlcId) : Promise.resolve(null),
    ]);
    // If neither lane is configured, surface a single dormant signal.
    if (!energyStar && !dlc) return NextResponse.json({ enabled: false, reason: "not-configured" });
    return NextResponse.json({ energyStar, dlc });
  } catch (e) {
    logApiError("/api/enrichment/lighting:GET", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
