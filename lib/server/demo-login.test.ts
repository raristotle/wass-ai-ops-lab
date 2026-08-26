import { describe, it, expect } from "vitest";
import {
  demoLoginPassword,
  passwordsMatch,
  loginRoleMap,
  roleForLoginEmail,
  evaluateDemoLogin,
} from "@/lib/server/demo-login";

const TEST_PASSWORD = "unit-test-login-secret";

describe("demoLoginPassword", () => {
  it("returns null when unset or whitespace (no fallback)", () => {
    expect(demoLoginPassword({})).toBeNull();
    expect(demoLoginPassword({ DEMO_LOGIN_PASSWORD: "" })).toBeNull();
    expect(demoLoginPassword({ DEMO_LOGIN_PASSWORD: "   " })).toBeNull();
  });

  it("returns the trimmed env value when set", () => {
    expect(demoLoginPassword({ DEMO_LOGIN_PASSWORD: `  ${TEST_PASSWORD}  ` })).toBe(TEST_PASSWORD);
  });
});

describe("passwordsMatch", () => {
  it("accepts an exact match", () => {
    expect(passwordsMatch(TEST_PASSWORD, TEST_PASSWORD)).toBe(true);
  });

  it("rejects a different value of the same length", () => {
    expect(passwordsMatch("unit-test-login-secreX", TEST_PASSWORD)).toBe(false);
  });

  it("rejects a different length without throwing", () => {
    expect(passwordsMatch("short", TEST_PASSWORD)).toBe(false);
    expect(passwordsMatch(TEST_PASSWORD, "short")).toBe(false);
  });
});

describe("loginRoleMap / roleForLoginEmail", () => {
  it("uses the built-in allowlist when DEMO_LOGIN_ROLES is unset", () => {
    const map = loginRoleMap({});
    expect(map.get("sales@meridiansupply.com")).toBe("sales");
    expect(map.get("manager@meridiansupply.com")).toBe("manager");
    expect(map.get("admin@meridiansupply.com")).toBe("admin");
    expect(roleForLoginEmail("admin@meridiansupply.com", {})).toBe("admin");
  });

  it("does not grant a role from the email local-part", () => {
    expect(roleForLoginEmail("admin@evil.example", {})).toBeNull();
    expect(roleForLoginEmail("manager@other.com", {})).toBeNull();
    expect(roleForLoginEmail("not-on-the-list@meridiansupply.com", {})).toBeNull();
  });

  it("replaces the built-in map when DEMO_LOGIN_ROLES is set", () => {
    const env = { DEMO_LOGIN_ROLES: "rep@acme.com:sales,lead@acme.com=manager" };
    expect(roleForLoginEmail("rep@acme.com", env)).toBe("sales");
    expect(roleForLoginEmail("lead@acme.com", env)).toBe("manager");
    expect(roleForLoginEmail("admin@meridiansupply.com", env)).toBeNull();
  });

  it("treats a blank DEMO_LOGIN_ROLES as an empty allowlist", () => {
    expect(loginRoleMap({ DEMO_LOGIN_ROLES: "  " }).size).toBe(0);
    expect(roleForLoginEmail("admin@meridiansupply.com", { DEMO_LOGIN_ROLES: "" })).toBeNull();
  });

  it("ignores invalid roles and entries without an email", () => {
    const env = { DEMO_LOGIN_ROLES: "nope,not-an-email:admin,ok@x.com:wizard,ok@x.com:sales" };
    expect(roleForLoginEmail("ok@x.com", env)).toBe("sales");
    expect(loginRoleMap(env).size).toBe(1);
  });
});

describe("evaluateDemoLogin", () => {
  const configured = { DEMO_LOGIN_PASSWORD: TEST_PASSWORD };

  it("fails closed with 503 when the password env is unset", () => {
    expect(evaluateDemoLogin("sales@meridiansupply.com", TEST_PASSWORD, {})).toEqual({
      ok: false,
      status: 503,
      error: "Login is not configured.",
    });
  });

  it("rejects an unknown email with the same 401 as a bad password", () => {
    expect(evaluateDemoLogin("admin@evil.example", TEST_PASSWORD, configured)).toEqual({
      ok: false,
      status: 401,
      error: "Invalid credentials.",
    });
    expect(evaluateDemoLogin("sales@meridiansupply.com", "wrong-password-value", configured)).toEqual({
      ok: false,
      status: 401,
      error: "Invalid credentials.",
    });
  });

  it("accepts an allowlisted email with the configured password", () => {
    expect(evaluateDemoLogin("Admin@meridiansupply.com", TEST_PASSWORD, configured)).toEqual({
      ok: true,
      email: "admin@meridiansupply.com",
      role: "admin",
    });
  });

  it("uses the env allowlist role, not the address local-part", () => {
    const env = {
      DEMO_LOGIN_PASSWORD: TEST_PASSWORD,
      DEMO_LOGIN_ROLES: "admin@meridiansupply.com:sales",
    };
    expect(evaluateDemoLogin("admin@meridiansupply.com", TEST_PASSWORD, env)).toEqual({
      ok: true,
      email: "admin@meridiansupply.com",
      role: "sales",
    });
  });
});
