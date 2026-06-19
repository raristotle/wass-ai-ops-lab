import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { icecatConfigured, lookupDatasheet } from "@/lib/integration/icecat-live";

export const dynamic = "force-dynamic";

/**
 * Datasheet enrichment (DI-10) — Open Icecat product specs/datasheet/GTIN by GTIN
 * or brand+MPN. DORMANT/$0 until ICECAT_USERNAME (free account) is set. No-param
 * probe is public (zero network); the lookup is auth-gated.
 *
 * GET (no params)        → { icecat } readiness boolean.
 * GET ?gtin=             → datasheet by GTIN.
 * GET ?brand=&mpn=       → datasheet by brand + manufacturer part number.
 */
const QuerySchema = z
  .object({
    gtin: z.string().trim().min(8).max(14).regex(/^\d+$/).optional(),
    brand: z.string().trim().min(1).max(120).optional(),
    mpn: z.string().trim().min(1).max(120).optional(),
  })
  .refine((v) => Boolean(v.gtin) || (Boolean(v.brand) && Boolean(v.mpn)), {
    message: "Provide gtin, or brand + mpn",
  });

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);

  const { searchParams } = new URL(req.url);
  const hasLookup = searchParams.has("gtin") || searchParams.has("brand") || searchParams.has("mpn");
  if (!hasLookup) {
    return NextResponse.json({ icecat: icecatConfigured() });
  }

  const denied = requireApiAuth(req);
  if (denied) return denied;

  if (!icecatConfigured()) return NextResponse.json({ enabled: false, reason: "not-configured" });

  let q: z.infer<typeof QuerySchema>;
  try {
    q = QuerySchema.parse({
      gtin: searchParams.get("gtin") ?? undefined,
      brand: searchParams.get("brand") ?? undefined,
      mpn: searchParams.get("mpn") ?? undefined,
    });
  } catch {
    return NextResponse.json({ error: "Provide gtin, or brand + mpn" }, { status: 400 });
  }

  try {
    return NextResponse.json(await lookupDatasheet({ gtin: q.gtin, brand: q.brand, mpn: q.mpn }));
  } catch (e) {
    logApiError("/api/enrichment/datasheet:GET", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
