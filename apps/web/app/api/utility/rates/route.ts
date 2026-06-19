import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { urdbConfigured, lookupUtilityRates } from "@/lib/integration/urdb-live";

export const dynamic = "force-dynamic";

/**
 * Utility-rate lookup (DI-13) — OpenEI URDB tariffs (energy/demand structure,
 * fixed charges) for a jobsite/branch address, for location-aware operating-cost
 * context on lighting/motor quotes. DORMANT/$0 until OPENEI_API_KEY (free) is set.
 * No-param probe is public (zero network); the lookup is auth-gated.
 *
 * GET (no params)        → { urdb } readiness boolean.
 * GET ?address=&sector=  → utility tariffs near the address (sector default Commercial).
 */
const QuerySchema = z.object({
  address: z.string().trim().min(3).max(200),
  sector: z.enum(["Residential", "Commercial", "Industrial", "Lighting"]).default("Commercial"),
});

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);

  const { searchParams } = new URL(req.url);
  if (!searchParams.has("address")) {
    return NextResponse.json({ urdb: urdbConfigured() });
  }

  const denied = requireApiAuth(req);
  if (denied) return denied;

  if (!urdbConfigured()) return NextResponse.json({ enabled: false, reason: "not-configured" });

  let q: z.infer<typeof QuerySchema>;
  try {
    q = QuerySchema.parse({
      address: searchParams.get("address"),
      sector: searchParams.get("sector") ?? undefined,
    });
  } catch {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  try {
    return NextResponse.json(await lookupUtilityRates(q.address, q.sector));
  } catch (e) {
    logApiError("/api/utility/rates:GET", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
