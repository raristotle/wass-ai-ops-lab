import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  signSession,
  verifySession,
  readSession,
  sessionsEnabled,
  tenantFromEmail,
  assertProductionSessionSecret,
  SESSION_COOKIE,
} from "@/lib/server/session";

const base = {
  sub: "a@x.com",
  email: "a@x.com",
  name: "A",
  role: "sales" as const,
  tenantId: "x-com",
  tenantName: "x.com",
};
const NOW = 1_700_000_000_000;

describe("session signing", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret";
  });
  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  it("sessionsEnabled reflects SESSION_SECRET", () => {
    expect(sessionsEnabled()).toBe(true);
    delete process.env.SESSION_SECRET;
    expect(sessionsEnabled()).toBe(false);
  });

  it("signs and verifies a round-trip with iat < exp", () => {
    const s = verifySession(signSession(base, NOW)!, NOW);
    expect(s?.email).toBe("a@x.com");
    expect(s?.tenantId).toBe("x-com");
    expect(s!.exp).toBeGreaterThan(s!.iat);
  });

  it("rejects a tampered payload (signature no longer matches)", () => {
    const sig = signSession(base, NOW)!.split(".")[1];
    const forged = Buffer.from(JSON.stringify({ ...base, tenantId: "evil", iat: 1, exp: 9_999_999_999 })).toString("base64url") + "." + sig;
    expect(verifySession(forged, NOW)).toBeNull();
  });

  it("rejects an expired session (>12h later)", () => {
    const v = signSession(base, NOW)!;
    expect(verifySession(v, NOW + 13 * 60 * 60 * 1000)).toBeNull();
  });

  it("returns null when SESSION_SECRET is unset", () => {
    delete process.env.SESSION_SECRET;
    expect(signSession(base, NOW)).toBeNull();
    expect(verifySession("anything.here", NOW)).toBeNull();
  });

  it("readSession parses the session cookie out of the header", () => {
    const v = signSession(base, NOW)!;
    const req = new Request("https://x/api/jobs", { headers: { cookie: `foo=1; ${SESSION_COOKIE}=${encodeURIComponent(v)}; bar=2` } });
    expect(readSession(req, NOW)?.email).toBe("a@x.com");
  });
});

describe("tenant derivation", () => {
  it("tenantFromEmail uses the email domain", () => {
    expect(tenantFromEmail("rep@acme-corp.com")).toEqual({ tenantId: "acme-corp-com", tenantName: "acme-corp.com" });
    expect(tenantFromEmail("noatsign").tenantId).toBe("demo");
  });
});

describe("assertProductionSessionSecret", () => {
  const prevVercel = process.env.VERCEL_ENV;
  const prevSecret = process.env.SESSION_SECRET;

  afterEach(() => {
    if (prevVercel === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevVercel;
    if (prevSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = prevSecret;
  });

  it("does not throw outside production", () => {
    expect(() => assertProductionSessionSecret({ SESSION_SECRET: undefined })).not.toThrow();
    expect(() => assertProductionSessionSecret({ VERCEL_ENV: "preview" })).not.toThrow();
  });

  it("throws in production when SESSION_SECRET is unset or blank", () => {
    expect(() => assertProductionSessionSecret({ VERCEL_ENV: "production" })).toThrow(/SESSION_SECRET/);
    expect(() => assertProductionSessionSecret({ VERCEL_ENV: "production", SESSION_SECRET: "  " })).toThrow(
      /SESSION_SECRET/,
    );
  });

  it("passes in production when SESSION_SECRET is set", () => {
    expect(() =>
      assertProductionSessionSecret({ VERCEL_ENV: "production", SESSION_SECRET: "set-in-prod" }),
    ).not.toThrow();
  });
});
