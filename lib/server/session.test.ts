import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  signSession,
  verifySession,
  readSession,
  sessionsEnabled,
  tenantFromEmail,
  roleFromEmail,
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

describe("tenant + role derivation", () => {
  it("tenantFromEmail uses the email domain", () => {
    expect(tenantFromEmail("rep@acme-corp.com")).toEqual({ tenantId: "acme-corp-com", tenantName: "acme-corp.com" });
    expect(tenantFromEmail("noatsign").tenantId).toBe("demo");
  });
  it("roleFromEmail maps admin / manager / sales", () => {
    expect(roleFromEmail("admin@x.com")).toBe("admin");
    expect(roleFromEmail("manager@x.com")).toBe("manager");
    expect(roleFromEmail("sales@x.com")).toBe("sales");
    expect(roleFromEmail("jdoe@x.com")).toBe("sales");
  });
});
