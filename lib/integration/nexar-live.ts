/**
 * Live parts enrichment (REAL) — Nexar API (Octopart data via Nexar's GraphQL
 * "Supply" domain), env-gated exactly like the FRED commodity and Mouser/Digi-Key
 * seams: manufacturer-backed compliance docs, multi-distributor inventory depth +
 * price breaks, datasheets, and second-source/MPN discovery — ONLY when the Nexar
 * client credentials are set; otherwise the caller falls back to simulated data.
 *
 * Fetched per request, never stored (except the short-lived OAuth token, cached
 * in-process). $0 until the keys are added. Called with raw fetch — no SDK. The
 * JSON→enrichment transform is pure and unit-tested; only the thin fetch wrappers
 * touch the network. Server-only — the secret never reaches the client.
 *
 *   NEXAR_CLIENT_ID + NEXAR_CLIENT_SECRET — OAuth2 client-credentials (the gate).
 */

import { logApiError } from "@/lib/server/log";

const TOKEN_URL = "https://identity.nexar.com/connect/token";
const GRAPHQL_URL = "https://api.nexar.com/graphql";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True only when BOTH Nexar credentials are present. Single source of dormancy. */
export function nexarConfigured(): boolean {
  return Boolean(env("NEXAR_CLIENT_ID") && env("NEXAR_CLIENT_SECRET"));
}

// ── Our internal enrichment shape (what callers consume) ──
export interface PriceBreak {
  qty: number;
  price: number;
  currency: string;
}
export interface DistributorOffer {
  name: string;
  verified: boolean;
  stock: number;
  sku: string;
  clickUrl: string | null;
  priceBreaks: PriceBreak[];
}
export interface ComplianceDoc {
  name: string;
  url: string;
  mimeType: string | null;
}
export interface SecondSource {
  mpn: string;
  manufacturer: string;
  octopartUrl: string | null;
}
export interface ProductEnrichment {
  mpn: string;
  name: string;
  manufacturer: string;
  datasheetUrl: string | null;
  octopartUrl: string | null;
  compliance: ComplianceDoc[];
  distributors: DistributorOffer[];
  secondSources: SecondSource[];
}

// ── Nexar response shapes (only the fields we read) ──
export interface NexarPart {
  mpn: string;
  name?: string;
  octopartUrl?: string | null;
  manufacturer?: { name?: string } | null;
  bestDatasheet?: { url?: string } | null;
  documentCollections?: { name?: string; documents?: { name?: string; url?: string; mimeType?: string | null }[] }[];
  sellers?: {
    company?: { name?: string; isVerified?: boolean } | null;
    offers?: { sku?: string; inventoryLevel?: number; clickUrl?: string | null; prices?: { quantity?: number; price?: number; currency?: string }[] }[];
  }[];
}

/**
 * Pure: map a Nexar supSearchMpn `results[].part` list to our enrichment shape.
 * The first part is the primary; every part contributes a second-source row.
 * Returns null when there are no parts. Fully unit-testable, no I/O.
 */
export function nexarSearchToEnrichment(parts: (NexarPart | null | undefined)[]): ProductEnrichment | null {
  // Nexar's schema permits a null `results[].part`; drop them so a leading null
  // can't hide valid second-source parts and a trailing null can't throw.
  const valid = (parts ?? []).filter((p): p is NexarPart => Boolean(p));
  const part = valid[0];
  if (!part) return null;
  return {
    mpn: part.mpn,
    name: part.name ?? part.mpn,
    manufacturer: part.manufacturer?.name ?? "—",
    datasheetUrl: part.bestDatasheet?.url ?? null,
    octopartUrl: part.octopartUrl ?? null,
    compliance: (part.documentCollections ?? []).flatMap((c) =>
      (c.documents ?? [])
        .filter((d) => d.url)
        .map((d) => ({ name: d.name ?? c.name ?? "Document", url: d.url as string, mimeType: d.mimeType ?? null })),
    ),
    distributors: (part.sellers ?? []).map((s) => {
      const offer = (s.offers ?? [])[0];
      return {
        name: s.company?.name ?? "—",
        verified: Boolean(s.company?.isVerified),
        stock: offer?.inventoryLevel ?? 0,
        sku: offer?.sku ?? "",
        clickUrl: offer?.clickUrl ?? null,
        priceBreaks: (offer?.prices ?? [])
          .filter((p) => typeof p.price === "number" && typeof p.quantity === "number")
          .map((p) => ({ qty: p.quantity as number, price: p.price as number, currency: p.currency ?? "USD" })),
      };
    }),
    secondSources: valid.map((p) => ({ mpn: p.mpn, manufacturer: p.manufacturer?.name ?? "—", octopartUrl: p.octopartUrl ?? null })),
  };
}

export type NexarResult =
  | { enabled: true; source: "Nexar (Octopart)"; enrichment: ProductEnrichment; fetchedAt: string }
  | { enabled: false; reason: "no-keys" | "auth-failed" | "fetch-failed" | "no-data" };

// ── OAuth token cache (the one addition vs the FRED seam — tokens expire in 24h) ──
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(id: string, secret: string): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: id,
    client_secret: secret,
    scope: "supply.domain",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return null;
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  // Cache with a 60s safety margin before the 24h expiry.
  cachedToken = { token: json.access_token, expiresAt: Date.now() + ((json.expires_in ?? 86_400) - 60) * 1000 };
  return cachedToken.token;
}

const QUERY = `query EnrichByMpn($mpn: String!, $limit: Int!) {
  supSearchMpn(q: $mpn, limit: $limit, country: "US", currency: "USD") {
    hits
    results { part {
      mpn name octopartUrl
      manufacturer { name }
      bestDatasheet { url }
      documentCollections { name documents { name url mimeType } }
      sellers { company { name isVerified } offers { sku inventoryLevel clickUrl prices { quantity price currency } } }
    } }
  }
}`;

/**
 * Enrich a manufacturer part number via Nexar. Returns {enabled:false} when
 * dormant (no keys) or on any auth/fetch/empty error — callers fall back to
 * simulated enrichment and never see a throw. `limit` bounds the part count (each
 * returned part counts against the Nexar plan).
 */
export async function enrichByMpn(mpn: string, opts?: { limit?: number }): Promise<NexarResult> {
  const id = env("NEXAR_CLIENT_ID");
  const secret = env("NEXAR_CLIENT_SECRET");
  if (!id || !secret) return { enabled: false, reason: "no-keys" }; // ← dormant: no keys ⇒ no network

  try {
    const token = await getToken(id, secret);
    if (!token) return { enabled: false, reason: "auth-failed" };

    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { mpn, limit: Math.min(opts?.limit ?? 5, 10) } }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      logApiError("nexar:enrich", new Error(`Nexar GraphQL HTTP ${res.status}`));
      return { enabled: false, reason: "fetch-failed" };
    }
    const json = (await res.json().catch(() => ({}))) as {
      data?: { supSearchMpn?: { results?: { part: NexarPart }[] } };
      errors?: unknown[];
    };
    // GraphQL returns errors with HTTP 200 — must be checked.
    if (json.errors && json.errors.length > 0) {
      logApiError("nexar:enrich", new Error("Nexar GraphQL returned errors"));
      return { enabled: false, reason: "fetch-failed" };
    }
    const parts = (json.data?.supSearchMpn?.results ?? []).map((r) => r.part);
    const enrichment = nexarSearchToEnrichment(parts);
    if (!enrichment) return { enabled: false, reason: "no-data" };
    return { enabled: true, source: "Nexar (Octopart)", enrichment, fetchedAt: new Date().toISOString() };
  } catch (e) {
    logApiError("nexar:enrich", e);
    return { enabled: false, reason: "fetch-failed" };
  }
}
