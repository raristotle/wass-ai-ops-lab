import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { topCrossGaps } from "@/lib/server/cross-misses";

export const dynamic = "force-dynamic";

/**
 * Demand-ranked cross-reference coverage gaps (#8) — the competitor/legacy SKUs
 * customers looked up for a Wesco cross but we don't cross yet, ranked by miss
 * count. Internal (auth-gated); read-only over the cross-misses counter.
 */
export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  try {
    const gaps = await topCrossGaps(20);
    return NextResponse.json({ gaps });
  } catch (e) {
    logApiError("/api/crosses/gaps:GET", e);
    return NextResponse.json({ gaps: [] });
  }
}
