import { NextResponse } from "next/server";
import { getLiveCommodityIndex } from "@/lib/integration/commodity-live";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { logApiError } from "@/lib/server/log";

export const dynamic = "force-dynamic";

// Live metals index (FRED). Returns { enabled:false, reason:"no-keys" } when no
// FRED_API_KEY is set; the client then renders the deterministic simulation.
export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  try {
    return NextResponse.json(await getLiveCommodityIndex());
  } catch (e) {
    logApiError("/api/commodity", e);
    return NextResponse.json({ enabled: false, reason: "no-keys" });
  }
}
