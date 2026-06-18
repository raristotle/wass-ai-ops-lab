import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { geocode, geocodingConfigured } from "@/lib/integration/geocoding-live";
import { getJobsiteWeather, weatherConfigured } from "@/lib/integration/weather-live";

export const dynamic = "force-dynamic";

/**
 * Jobsite weather outlook for delivery/install scheduling (v3-S5 #7). Accepts
 * either explicit `lat`/`lng` or an `address` (chained through the dormant
 * geocoding seam). DORMANT by default: NWS is gated on WEATHER_CONTACT and, for
 * the address path, also on a geocoding key — with neither set this returns
 * {enabled:false} and makes ZERO outbound calls. NWS lookups are on-demand only
 * (never polled / no cron), and nothing is stored.
 */
export async function GET(req: Request) {
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl);

  // Fast dormant exit: if the weather lane itself is off, do nothing (no geocode either).
  if (!weatherConfigured()) {
    return NextResponse.json({ enabled: false, reason: "no-keys" });
  }

  const { searchParams } = new URL(req.url);
  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");
  const address = searchParams.get("address")?.trim();

  let lat: number | null = null;
  let lng: number | null = null;

  // Note: searchParams.get returns "" (not null) for `?lat=&lng=`, so guard on
  // non-empty — an empty/partial pair must fall through to the address/400 path,
  // not coerce via Number("")===0 into a bogus (0,0) coordinate.
  if (latRaw && lngRaw) {
    const pLat = Number(latRaw);
    const pLng = Number(lngRaw);
    if (Number.isFinite(pLat) && Number.isFinite(pLng) && Math.abs(pLat) <= 90 && Math.abs(pLng) <= 180) {
      lat = pLat;
      lng = pLng;
    } else {
      return NextResponse.json({ error: "Invalid lat/lng" }, { status: 400 });
    }
  } else if (address) {
    if (!geocodingConfigured()) {
      // Weather is on but we cannot resolve an address without the geocoding lane.
      return NextResponse.json({ enabled: false, reason: "no-geocode" });
    }
    const geo = await geocode(address);
    if (!geo.enabled) return NextResponse.json({ enabled: false, reason: "no-geocode" });
    lat = geo.point.lat;
    lng = geo.point.lng;
  } else {
    return NextResponse.json({ error: "Provide lat & lng, or address" }, { status: 400 });
  }

  const result = await getJobsiteWeather(lat, lng);
  return NextResponse.json(result);
}
