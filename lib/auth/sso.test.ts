import { describe, it, expect } from "vitest";
import {
  readSsoConfig,
  buildAuthorizeUrl,
  roleFromClaims,
  mapClaimsToUser,
  demoSsoUser,
  type SsoConfig,
} from "@/lib/auth/sso";

describe("readSsoConfig", () => {
  it("is disabled until issuer + client id + authorize url are all present", () => {
    expect(readSsoConfig({}).enabled).toBe(false);
    expect(readSsoConfig({ SSO_ISSUER: "https://idp", SSO_CLIENT_ID: "abc" }).enabled).toBe(false);
    const cfg = readSsoConfig({
      SSO_ISSUER: "https://login.microsoftonline.com/tenant/v2.0",
      SSO_CLIENT_ID: "abc",
      SSO_AUTHORIZE_URL: "https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize",
      SSO_PROVIDER_NAME: "Azure AD",
    });
    expect(cfg.enabled).toBe(true);
    expect(cfg.providerName).toBe("Azure AD");
    expect(cfg.scope).toContain("openid");
  });
});

describe("buildAuthorizeUrl", () => {
  const cfg: SsoConfig = {
    enabled: true,
    providerName: "Okta",
    clientId: "client123",
    authorizeUrl: "https://acme.okta.com/oauth2/v1/authorize",
    redirectUri: "https://app.example.com/product-finder/sso-callback",
    scope: "openid email profile",
  };
  it("builds an OIDC authorization-code URL with state", () => {
    const url = new URL(buildAuthorizeUrl(cfg, "xyz-state"));
    expect(url.origin + url.pathname).toBe("https://acme.okta.com/oauth2/v1/authorize");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("client123");
    expect(url.searchParams.get("state")).toBe("xyz-state");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("redirect_uri")).toContain("sso-callback");
  });
  it("throws when SSO is not configured", () => {
    expect(() => buildAuthorizeUrl({ ...cfg, enabled: false }, "s")).toThrow();
  });
});

describe("roleFromClaims", () => {
  it("maps groups/roles to app roles, defaulting to sales", () => {
    expect(roleFromClaims({ groups: ["IT-Admin"] })).toBe("admin");
    expect(roleFromClaims({ roles: ["Branch-Manager"] })).toBe("manager");
    expect(roleFromClaims({ groups: ["sales-rep"] })).toBe("sales");
    expect(roleFromClaims({})).toBe("sales");
  });
});

describe("mapClaimsToUser", () => {
  it("maps claims to an app user; null without an email", () => {
    const u = mapClaimsToUser({ email: "a.b@corp.com", name: "Alex B", groups: ["manager"] });
    expect(u).toEqual({ name: "Alex B", email: "a.b@corp.com", role: "manager", branch: "Corporate", branchId: "B-CORP" });
    expect(mapClaimsToUser({ name: "no email" })).toBeNull();
  });
  it("falls back name to the email local-part", () => {
    expect(mapClaimsToUser({ email: "jdoe@corp.com" })?.name).toBe("jdoe");
  });
});

describe("demoSsoUser", () => {
  it("is a manager mapped from a group claim (proves the claims path)", () => {
    const u = demoSsoUser();
    expect(u.role).toBe("manager");
    expect(u.email).toContain("@");
    expect(u.branchId).toBe("B-SSO");
  });
});
