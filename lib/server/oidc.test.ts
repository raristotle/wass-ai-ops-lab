import { describe, it, expect } from "vitest";
import { generateKeyPairSync, createSign, type KeyObject } from "node:crypto";
import { verifyIdToken } from "@/lib/server/oidc";

const b64url = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString("base64url");

function makeToken(payload: Record<string, unknown>, privateKey: KeyObject, kid = "k1"): string {
  const signingInput = `${b64url({ alg: "RS256", kid })}.${b64url(payload)}`;
  const sig = createSign("RSA-SHA256").update(signingInput).end().sign(privateKey).toString("base64url");
  return `${signingInput}.${sig}`;
}

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwks = { keys: [{ ...publicKey.export({ format: "jwk" }), kid: "k1" }] };
const fetchImpl = (async () => ({ ok: true, json: async () => jwks })) as unknown as typeof fetch;

const NOW = 1_700_000_000_000;
const claims = {
  email: "u@corp.com",
  name: "U",
  iss: "https://idp",
  aud: "client-1",
  exp: Math.floor(NOW / 1000) + 3600,
  tid: "corp-tenant",
};
const opts = { issuer: "https://idp", audience: "client-1", jwksUrl: "https://idp/jwks", fetchImpl, nowMs: NOW };

describe("verifyIdToken (RS256 over JWKS)", () => {
  it("verifies a valid token and extracts claims + tenant", async () => {
    const out = await verifyIdToken(makeToken(claims, privateKey), opts);
    expect(out.email).toBe("u@corp.com");
    expect(out.tid).toBe("corp-tenant");
  });

  it("rejects a tampered signature", async () => {
    const bad = makeToken(claims, privateKey).slice(0, -6) + "AAAAAA";
    await expect(verifyIdToken(bad, opts)).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    const expired = makeToken({ ...claims, exp: Math.floor(NOW / 1000) - 10 }, privateKey);
    await expect(verifyIdToken(expired, opts)).rejects.toThrow(/expired/);
  });

  it("rejects an audience mismatch", async () => {
    await expect(verifyIdToken(makeToken(claims, privateKey), { ...opts, audience: "someone-else" })).rejects.toThrow(/audience/);
  });

  it("rejects an issuer mismatch", async () => {
    await expect(verifyIdToken(makeToken(claims, privateKey), { ...opts, issuer: "https://evil" })).rejects.toThrow(/issuer/);
  });

  it("rejects a non-RS256 alg", async () => {
    const hs = `${b64url({ alg: "HS256", kid: "k1" })}.${b64url(claims)}.x`;
    await expect(verifyIdToken(hs, opts)).rejects.toThrow(/unsupported alg/);
  });
});
