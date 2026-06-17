/**
 * Address verification + standardization (REAL) — env-gated DORMANT. USPS
 * Addresses v3 (free, OAuth2 client-credentials, no card) standardizes a ship-to
 * / jobsite / will-call address and returns ZIP+4 — cutting failed deliveries and
 * sharpening the destination fed to the (already integrated) Shippo rate seam.
 *
 *  - Dormant until USPS_CLIENT_ID + USPS_CLIENT_SECRET are set: no creds ⇒ no
 *    network, $0.
 *  - The OAuth bearer token is cached in-process until shortly before expiry
 *    (mirrors the Nexar token-cache pattern), so most verifies skip the token hop.
 *  - Server-only secrets; the route never echoes anything but the standardized
 *    address it computed.
 *
 *   USPS_CLIENT_ID / USPS_CLIENT_SECRET — USPS Developer Portal app credentials.
 */

import { z } from "zod";
import { logApiError } from "@/lib/server/log";

const USPS_TOKEN_URL = "https://apis.usps.com/oauth2/v3/token";
const USPS_ADDRESS_URL = "https://apis.usps.com/addresses/v3/address";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

export function addressVerifyConfigured(): boolean {
  return Boolean(env("USPS_CLIENT_ID") && env("USPS_CLIENT_SECRET"));
}

export interface AddressInput {
  street: string;
  secondary?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface VerifiedAddress {
  streetAddress: string;
  city: string;
  state: string;
  zip5: string;
  zip4: string | null;
  source: "usps";
}

const UspsAddressSchema = z.object({
  address: z.object({
    streetAddress: z.string(),
    secondaryAddress: z.string().optional(),
    city: z.string(),
    state: z.string(),
    ZIPCode: z.string(),
    ZIPPlus4: z.string().optional(),
  }),
});

/** Pure: shape a USPS Addresses v3 response into a VerifiedAddress. */
export function uspsToVerified(json: unknown): VerifiedAddress | null {
  const parsed = UspsAddressSchema.safeParse(json);
  if (!parsed.success) return null;
  const a = parsed.data.address;
  return {
    streetAddress: a.streetAddress,
    city: a.city,
    state: a.state,
    zip5: a.ZIPCode,
    zip4: a.ZIPPlus4 ?? null,
    source: "usps",
  };
}

const TokenSchema = z.object({ access_token: z.string(), expires_in: z.number().optional() });

// In-process OAuth token cache (mirrors the Nexar 24h pattern).
const g = globalThis as unknown as { __uspsToken?: { token: string; exp: number } };

async function uspsToken(id: string, secret: string): Promise<string | null> {
  const cached = g.__uspsToken;
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  try {
    const res = await fetch(USPS_TOKEN_URL, {
      method: "POST",
      // OAuth2 token endpoints require form-urlencoded (RFC 6749 §4.4 / USPS v3),
      // NOT JSON — JSON yields HTTP 400 unsupported_grant_type at activation.
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret }).toString(),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      logApiError("address-verify:token", new Error(`USPS token HTTP ${res.status}`));
      return null;
    }
    const parsed = TokenSchema.safeParse(await res.json().catch(() => null));
    if (!parsed.success) return null;
    const ttl = (parsed.data.expires_in ?? 3600) * 1000;
    g.__uspsToken = { token: parsed.data.access_token, exp: Date.now() + ttl };
    return parsed.data.access_token;
  } catch (e) {
    logApiError("address-verify:token", e);
    return null;
  }
}

export type AddressVerifyResult =
  | { enabled: false; reason: "not-configured" | "error" }
  | { enabled: true; verified: VerifiedAddress };

/**
 * Verify + standardize an address. Dormant (no network) when the USPS creds are
 * unset. Fail-closed: a token or upstream error yields {enabled:false} so the
 * caller keeps the user-entered address.
 */
export async function verifyAddress(input: AddressInput): Promise<AddressVerifyResult> {
  const id = env("USPS_CLIENT_ID");
  const secret = env("USPS_CLIENT_SECRET");
  if (!id || !secret) return { enabled: false, reason: "not-configured" };

  const token = await uspsToken(id, secret);
  if (!token) return { enabled: false, reason: "error" };

  const params = new URLSearchParams({ streetAddress: input.street });
  if (input.secondary) params.set("secondaryAddress", input.secondary);
  if (input.city) params.set("city", input.city);
  if (input.state) params.set("state", input.state);
  if (input.zip) params.set("ZIPCode", input.zip);

  try {
    const res = await fetch(`${USPS_ADDRESS_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      logApiError("address-verify:address", new Error(`USPS address HTTP ${res.status}`));
      return { enabled: false, reason: "error" };
    }
    const verified = uspsToVerified(await res.json().catch(() => null));
    return verified ? { enabled: true, verified } : { enabled: false, reason: "error" };
  } catch (e) {
    logApiError("address-verify:address", e);
    return { enabled: false, reason: "error" };
  }
}
