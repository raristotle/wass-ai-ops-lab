import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { requireApiAuth } from "@/lib/server/api-auth";
import { logApiError } from "@/lib/server/log";
import { geocodingConfigured, geocode } from "@/lib/integration/geocoding-live";

export const dynamic = "force-dynamic";

/**
 * Geocode an address → lat/long (Geocodio primary, capped Google fallback).
 * Dormant until GEOCODIO_API_KEY (or GOOGLE_MAPS_API_KEY) is set: POST then
 * returns {configured:false, point:null} WITHOUT any upstream call. Rate-limited
 * and auth-gated like the other credentialed seams. Coordinates are cached
 * forever per normalized address, so steady-state lookups are free.
 */
const BodySchema = z.object({ address: z.string().trim().min(3).max(300) });

export function GET() {
  return NextResponse.json({ configured: geocodingConfigured() });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);
  const denied = requireApiAuth(req);
  if (denied) return denied;

  if (!geocodingConfigured()) {
    return NextResponse.json({ configured: false, point: null });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid address." }, { status: 400 });

    const result = await geocode(parsed.data.address);
    if (!result.enabled) {
      return NextResponse.json({ configured: true, point: null });
    }
    return NextResponse.json({ configured: true, point: result.point, cached: result.cached });
  } catch (e) {
    logApiError("/api/geo/geocode:POST", e);
    return NextResponse.json({ error: "Could not geocode." }, { status: 400 });
  }
}
