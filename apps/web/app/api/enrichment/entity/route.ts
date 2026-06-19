import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { gleifConfigured, lookupEntity } from "@/lib/integration/gleif-live";
import { wikidataConfigured, lookupBrandOwnership } from "@/lib/integration/wikidata-live";

export const dynamic = "force-dynamic";

/**
 * Brand/legal-entity enrichment (DI-S2 live) — the live-refresh companion to the
 * static brand-entity layer. GLEIF resolves a legal name → LEI + parent chain;
 * Wikidata resolves a brand → owner/parent + official/short names + GTIN/LEI. Both
 * lanes are FREE/keyless but DORMANT/$0 until their config switches are set
 * (GLEIF_API_BASE_URL; WIKIDATA_USER_AGENT). No-param probe is public (zero network);
 * the lookup is auth-gated.
 *
 * GET (no params)  → { gleif, wikidata } readiness booleans.
 * GET ?name=       → GLEIF entity + parent-chain lookup.
 * GET ?brand=      → Wikidata brand-ownership lookup.
 * (Pass both to query both lanes.)
 */
const QuerySchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  brand: z.string().trim().min(1).max(160).optional(),
});

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);

  const { searchParams } = new URL(req.url);
  const hasLookup = searchParams.has("name") || searchParams.has("brand");
  if (!hasLookup) {
    return NextResponse.json({ gleif: gleifConfigured(), wikidata: wikidataConfigured() });
  }

  const denied = requireApiAuth(req);
  if (denied) return denied;

  let q: z.infer<typeof QuerySchema>;
  try {
    q = QuerySchema.parse({
      name: searchParams.get("name") ?? undefined,
      brand: searchParams.get("brand") ?? undefined,
    });
  } catch {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  try {
    const [gleif, wikidata] = await Promise.all([
      q.name && gleifConfigured() ? lookupEntity(q.name) : Promise.resolve(null),
      q.brand && wikidataConfigured() ? lookupBrandOwnership(q.brand) : Promise.resolve(null),
    ]);
    if (!gleif && !wikidata) return NextResponse.json({ enabled: false, reason: "not-configured" });
    return NextResponse.json({ gleif, wikidata });
  } catch (e) {
    logApiError("/api/enrichment/entity:GET", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
