/**
 * Geocoding (REAL) — env-gated DORMANT, exactly like the FRED/Stripe/FX seams.
 * Turns a US/Canada address into lat/long + a normalized formatted address — the
 * missing primitive under nearest-branch routing, jobsite weather, landed-cost
 * freight, and territory analytics.
 *
 * Cost-disciplined by design:
 *  - Geocodio is the PRIMARY provider (free 2,500 lookups/day, no card).
 *  - Google Maps geocoding is an OPTIONAL fallback (free 10k/mo then paid) used
 *    ONLY when Geocodio is unavailable AND a HARD monthly call ceiling has not
 *    been hit — so it can never silently bill past the free tier.
 *  - Every result is cached FOREVER per normalized address (coordinates don't
 *    move), so steady-state lookups cost nothing.
 *  - Dormant until a key is set: no key ⇒ no fetch, $0/zero-network.
 *
 *   GEOCODIO_API_KEY     — primary provider key (free). The gate.
 *   GOOGLE_MAPS_API_KEY  — optional capped fallback.
 *   GEO_GOOGLE_MONTHLY_CAP — optional override of the Google monthly ceiling (default 8000).
 */

import { z } from "zod";
import { logApiError } from "@/lib/server/log";
import { getStore, mutate } from "@/lib/server/persistence";

// v1.7 intentionally pinned — the fields read here (location.lat/lng,
// formatted_address, accuracy) are stable across Geocodio's v1.x minors.
const GEOCODIO_URL = "https://api.geocod.io/v1.7/geocode";
const GOOGLE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const CACHE_NS = "geocode";
const USAGE_NS = "geo-usage";
const DEFAULT_GOOGLE_CAP = 8000;

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

export function geocodingConfigured(): boolean {
  return Boolean(env("GEOCODIO_API_KEY") || env("GOOGLE_MAPS_API_KEY"));
}

function googleMonthlyCap(): number {
  const raw = env("GEO_GOOGLE_MONTHLY_CAP");
  const n = raw ? parseInt(raw, 10) : NaN;
  // 0 is valid and means "never use the paid Google fallback"; only a missing /
  // negative / non-numeric value falls back to the default ceiling.
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_GOOGLE_CAP;
}

/** Normalize an address for a stable, case-insensitive cache key. */
export function normalizeAddress(address: string): string {
  return address.trim().replace(/\s+/g, " ").toLowerCase();
}

export interface GeoPoint {
  lat: number;
  lng: number;
  formatted: string;
  accuracy: number | null; // provider confidence, 0..1 (null when not provided)
  source: "geocodio" | "google";
}

const GeocodioSchema = z.object({
  results: z
    .array(
      z.object({
        formatted_address: z.string().optional(),
        location: z.object({ lat: z.number(), lng: z.number() }),
        accuracy: z.number().optional(),
      }),
    )
    .min(1),
});

/** Pure: shape a Geocodio response into a GeoPoint (first/best result). */
export function geocodioToPoint(json: unknown): GeoPoint | null {
  const parsed = GeocodioSchema.safeParse(json);
  if (!parsed.success) return null;
  const r = parsed.data.results[0];
  if (!Number.isFinite(r.location.lat) || !Number.isFinite(r.location.lng)) return null;
  return {
    lat: r.location.lat,
    lng: r.location.lng,
    formatted: r.formatted_address ?? "",
    accuracy: typeof r.accuracy === "number" ? r.accuracy : null,
    source: "geocodio",
  };
}

const GoogleSchema = z.object({
  status: z.string(),
  results: z
    .array(
      z.object({
        formatted_address: z.string().optional(),
        geometry: z.object({ location: z.object({ lat: z.number(), lng: z.number() }) }),
      }),
    )
    .optional(),
});

/** Pure: shape a Google geocoding response into a GeoPoint. */
export function googleToPoint(json: unknown): GeoPoint | null {
  const parsed = GoogleSchema.safeParse(json);
  if (!parsed.success || parsed.data.status !== "OK") return null;
  const r = parsed.data.results?.[0];
  if (!r || !Number.isFinite(r.geometry.location.lat) || !Number.isFinite(r.geometry.location.lng)) return null;
  return {
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    formatted: r.formatted_address ?? "",
    accuracy: null,
    source: "google",
  };
}

async function fetchGeocodio(address: string, key: string): Promise<GeoPoint | null> {
  const url = `${GEOCODIO_URL}?q=${encodeURIComponent(address)}&api_key=${encodeURIComponent(key)}&limit=1`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) {
      logApiError("geocoding:geocodio", new Error(`Geocodio HTTP ${res.status}`));
      return null;
    }
    return geocodioToPoint(await res.json().catch(() => null));
  } catch (e) {
    logApiError("geocoding:geocodio", e);
    return null;
  }
}

async function fetchGoogle(address: string, key: string): Promise<GeoPoint | null> {
  const url = `${GOOGLE_URL}?address=${encodeURIComponent(address)}&key=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) {
      logApiError("geocoding:google", new Error(`Google geocode HTTP ${res.status}`));
      return null;
    }
    const json = await res.json().catch(() => null);
    // Google returns HTTP 200 even on quota/billing/key failures — surface those
    // (status only, no PII) since they're operationally distinct from ZERO_RESULTS.
    const status = (json as { status?: string } | null)?.status;
    if (status && status !== "OK" && status !== "ZERO_RESULTS") {
      logApiError("geocoding:google", new Error(`Google geocode status ${status}`));
    }
    return googleToPoint(json);
  } catch (e) {
    logApiError("geocoding:google", e);
    return null;
  }
}

export type GeocodeResult =
  | { enabled: false; reason: "not-configured" | "error" }
  | { enabled: true; point: GeoPoint; cached: boolean };

/**
 * Geocode an address. Dormant (no fetch) when no provider key is set. Tries the
 * cache, then Geocodio, then a capped Google fallback. Fail-closed: any provider
 * error yields {enabled:false, reason:"error"} so the caller degrades gracefully.
 */
export async function geocode(address: string): Promise<GeocodeResult> {
  const geocodioKey = env("GEOCODIO_API_KEY");
  const googleKey = env("GOOGLE_MAPS_API_KEY");
  if (!geocodioKey && !googleKey) return { enabled: false, reason: "not-configured" };

  const norm = normalizeAddress(address);
  if (!norm) return { enabled: false, reason: "error" };

  const store = getStore();
  const cached = await store.get<GeoPoint>(CACHE_NS, norm).catch(() => null);
  if (cached) return { enabled: true, point: cached, cached: true };

  let point: GeoPoint | null = null;
  if (geocodioKey) point = await fetchGeocodio(norm, geocodioKey);

  // Capped Google fallback — only if Geocodio missed AND an ATOMIC reservation
  // under the monthly ceiling succeeds. The CAS reservation (mutate) serializes
  // concurrent callers so they can't all slip under the same count; any
  // reservation failure (cap reached OR store error) fails CLOSED — Google is not
  // called — so the HARD cost guardrail can never be raced past the free tier.
  if (!point && googleKey) {
    const monthKey = `google:${new Date().toISOString().slice(0, 7)}`; // YYYY-MM
    const cap = googleMonthlyCap();
    let reserved: number | null = null;
    try {
      reserved = await mutate<number>(store, USAGE_NS, monthKey, (cur) => {
        const used = cur ?? 0;
        return used < cap ? used + 1 : null; // null aborts the write → at/over cap
      });
    } catch (e) {
      logApiError("geocoding:google:usage", e);
      reserved = null; // fail closed: a broken counter must not let Google calls flow
    }
    if (reserved !== null) point = await fetchGoogle(norm, googleKey);
  }

  if (!point) return { enabled: false, reason: "error" };
  await store.put(CACHE_NS, norm, point).catch(() => {});
  return { enabled: true, point, cached: false };
}
