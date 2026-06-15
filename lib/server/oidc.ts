import { createPublicKey, createVerify, type JsonWebKey } from "node:crypto";
import type { IdpClaims } from "@/lib/auth/sso";

/**
 * Minimal OIDC ID-token verification for the SSO callback — RS256 signature
 * against the IdP's JWKS, plus issuer / audience / expiry checks. Uses only
 * node:crypto (`createPublicKey({ format: "jwk" })`, Node 18+), so no JWT
 * dependency. Server-only.
 */

interface JwtHeader {
  alg: string;
  kid?: string;
}

function decodeSegment<T>(seg: string): T {
  return JSON.parse(Buffer.from(seg, "base64url").toString()) as T;
}

export interface VerifyOptions {
  issuer?: string;
  audience?: string;
  jwksUrl: string;
  /** Injected for testing; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  nowMs?: number;
}

/**
 * Verify an OIDC id_token and return the (claims) payload. Throws on any failure
 * (bad signature, wrong issuer/audience, expired, unsupported alg).
 */
export async function verifyIdToken(token: string, opts: VerifyOptions): Promise<IdpClaims & Record<string, unknown>> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("malformed id_token");
  const [h, p, s] = parts;
  const header = decodeSegment<JwtHeader>(h);
  if (header.alg !== "RS256") throw new Error(`unsupported alg ${header.alg}`);

  const doFetch = opts.fetchImpl ?? fetch;
  const jwksRes = await doFetch(opts.jwksUrl);
  if (!jwksRes.ok) throw new Error(`jwks fetch HTTP ${jwksRes.status}`);
  const jwks = (await jwksRes.json()) as { keys: (JsonWebKey & { kid?: string })[] };
  const jwk = jwks.keys.find((k) => k.kid === header.kid) ?? jwks.keys[0];
  if (!jwk) throw new Error("no matching JWK");

  const key = createPublicKey({ key: jwk, format: "jwk" });
  const ok = createVerify("RSA-SHA256").update(`${h}.${p}`).end().verify(key, Buffer.from(s, "base64url"));
  if (!ok) throw new Error("bad id_token signature");

  const payload = decodeSegment<Record<string, unknown>>(p);
  const now = Math.floor((opts.nowMs ?? Date.now()) / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) throw new Error("id_token expired");
  if (opts.issuer && payload.iss !== opts.issuer) throw new Error("issuer mismatch");
  if (opts.audience) {
    const aud = payload.aud;
    const matches = aud === opts.audience || (Array.isArray(aud) && aud.includes(opts.audience));
    if (!matches) throw new Error("audience mismatch");
  }

  return {
    email: typeof payload.email === "string" ? payload.email : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    groups: Array.isArray(payload.groups) ? (payload.groups as string[]) : undefined,
    roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : undefined,
    branch: typeof payload.branch === "string" ? payload.branch : undefined,
    branchId: typeof payload.branchId === "string" ? payload.branchId : undefined,
    tid:
      (typeof payload.tid === "string" && payload.tid) ||
      (typeof payload.hd === "string" && payload.hd) ||
      (typeof payload.tenant === "string" && payload.tenant) ||
      undefined,
    ...payload,
  };
}
