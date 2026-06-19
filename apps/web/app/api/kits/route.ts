import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { KIT_DEFS } from "@/lib/product-finder-kits";

export const dynamic = "force-dynamic";

/**
 * Curated kit / assembly catalog. Returns all kit definitions.
 * Auth-gated and rate-limited; kits are pure deterministic data ($0, no env gate).
 */
export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;
  return NextResponse.json({ kits: KIT_DEFS });
}
