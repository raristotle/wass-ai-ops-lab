import { describe, it, expect, afterEach } from "vitest";
import { requireApiAuth, tenantForRequest } from "@/lib/server/api-auth";
import { signSession, SESSION_COOKIE } from "@/lib/server/session";

function req(headers: Record<string, string>): Request {
  return new Request("https://app.raristotle.com/api/jobs", { method: "POST", headers });
}

describe("requireApiAuth — sessions OFF (pilot same-origin/token gate)", () => {
  afterEach(() => {
    delete process.env.WRITE_API_TOKEN;
    delete process.env.SESSION_SECRET;
  });

  it("allows a same-origin request (Origin host === deployment host)", () => {
    expect(requireApiAuth(req({ origin: "https://app.raristotle.com" }))).toBeNull();
  });

  it("rejects a cross-origin request with 401", () => {
    expect(requireApiAuth(req({ origin: "https://evil.example" }))?.status).toBe(401);
  });

  it("rejects an anonymous request (no Origin, no token) with 401", () => {
    expect(requireApiAuth(req({}))?.status).toBe(401);
  });

  it("allows a valid bearer token when WRITE_API_TOKEN is configured", () => {
    process.env.WRITE_API_TOKEN = "s3cret";
    expect(requireApiAuth(req({ authorization: "Bearer s3cret" }))).toBeNull();
  });

  it("rejects a wrong bearer token", () => {
    process.env.WRITE_API_TOKEN = "s3cret";
    expect(requireApiAuth(req({ authorization: "Bearer nope" }))?.status).toBe(401);
  });

  it("ignores the bearer path entirely when WRITE_API_TOKEN is unset", () => {
    // A 'Bearer' header without server config must not grant access.
    expect(requireApiAuth(req({ authorization: "Bearer anything" }))?.status).toBe(401);
  });

  it("resolves no tenant (single shared space) when sessions are off", () => {
    expect(tenantForRequest(req({ origin: "https://app.raristotle.com" }))).toBeNull();
  });
});

describe("requireApiAuth — sessions ON (per-tenant SSO)", () => {
  afterEach(() => {
    delete process.env.SESSION_SECRET;
    delete process.env.WRITE_API_TOKEN;
  });

  function cookieReq(value: string, extra: Record<string, string> = {}): Request {
    return req({ cookie: `${SESSION_COOKIE}=${encodeURIComponent(value)}`, ...extra });
  }

  it("allows a valid session cookie and resolves its tenant", () => {
    process.env.SESSION_SECRET = "s";
    const v = signSession(
      { sub: "a@acme.com", email: "a@acme.com", name: "A", role: "sales", tenantId: "acme-com", tenantName: "acme.com" },
      Date.now(),
    )!;
    const r = cookieReq(v);
    expect(requireApiAuth(r)).toBeNull();
    expect(tenantForRequest(r)).toBe("acme-com");
  });

  it("REJECTS a same-origin request with no session (same-origin alone is not enough once sessions are on)", () => {
    process.env.SESSION_SECRET = "s";
    expect(requireApiAuth(req({ origin: "https://app.raristotle.com" }))?.status).toBe(401);
  });

  it("accepts the service token and maps it to the 'service' tenant", () => {
    process.env.SESSION_SECRET = "s";
    process.env.WRITE_API_TOKEN = "tok";
    const r = req({ authorization: "Bearer tok" });
    expect(requireApiAuth(r)).toBeNull();
    expect(tenantForRequest(r)).toBe("service");
  });

  it("isolates tenants — two sessions resolve to different tenant ids", () => {
    process.env.SESSION_SECRET = "s";
    const a = signSession({ sub: "x@acme.com", email: "x@acme.com", name: "X", role: "sales", tenantId: "acme-com", tenantName: "acme.com" }, Date.now())!;
    const b = signSession({ sub: "y@globex.com", email: "y@globex.com", name: "Y", role: "sales", tenantId: "globex-com", tenantName: "globex.com" }, Date.now())!;
    expect(tenantForRequest(cookieReq(a))).toBe("acme-com");
    expect(tenantForRequest(cookieReq(b))).toBe("globex-com");
  });
});
