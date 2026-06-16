import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { nexarConfigured, enrichByMpn } from "@/lib/integration/nexar-live";

export const dynamic = "force-dynamic";

/**
 * Manufacturer-backed parts enrichment (Nexar / Octopart): compliance docs,
 * multi-distributor inventory + price breaks, datasheets, second sources.
 * Dormant until NEXAR_CLIENT_ID + NEXAR_CLIENT_SECRET are set: POST then returns
 * {enabled:false, reason:"no-keys"} WITHOUT any Nexar call, so callers fall back
 * to simulated enrichment. POST is rate-limited + auth-gated (it spends the Nexar
 * plan); GET is a config boolean only.
 */

const BodySchema = z.object({
  mpn: z.string().trim().min(1).max(120),
  limit: z.number().int().positive().max(10).optional(),
});

export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  return NextResponse.json({ configured: nexarConfigured() });
}

export async function POST(req: Request) {
  // Tighter limit than other routes — each enrich call spends Nexar plan credits.
  const rl = await rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  // Dormant: no keys ⇒ no Nexar call; the caller uses simulated enrichment.
  if (!nexarConfigured()) return NextResponse.json({ enabled: false, reason: "no-keys" });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const r = await enrichByMpn(parsed.data.mpn, parsed.data.limit ? { limit: parsed.data.limit } : undefined);
    return NextResponse.json(r);
  } catch (e) {
    logApiError("/api/parts/enrich:POST", e);
    return NextResponse.json({ error: "Could not enrich the part." }, { status: 400 });
  }
}
