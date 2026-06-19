import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { blsPpiConfigured, getPpiTrends } from "@/lib/integration/bls-ppi-live";

export const dynamic = "force-dynamic";

/**
 * Producer Price Index trends (DI-11) — BLS PPI for electrical equipment /
 * switchgear / lighting, to enrich the commodity strip beyond FRED metals spot.
 * DORMANT/$0 until BLS_API_KEY (free) is set. A `probe=1` request returns the
 * readiness boolean publicly (zero network); the data fetch is auth-gated.
 *
 * GET ?probe=1  → { blsPpi } readiness boolean (public, no network).
 * GET           → PPI trend list (auth-gated; {enabled:false} when dormant).
 */
export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);

  const { searchParams } = new URL(req.url);
  if (searchParams.get("probe") === "1") {
    return NextResponse.json({ blsPpi: blsPpiConfigured() });
  }

  const denied = requireApiAuth(req);
  if (denied) return denied;

  if (!blsPpiConfigured()) return NextResponse.json({ enabled: false, reason: "not-configured" });

  try {
    // Server runtime (not a workflow script) — new Date() is fine here.
    const year = new Date().getUTCFullYear();
    return NextResponse.json(await getPpiTrends(year));
  } catch (e) {
    logApiError("/api/commodity/ppi:GET", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
