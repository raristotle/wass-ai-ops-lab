import { describe, it, expect, beforeEach } from "vitest";
import { useProductFinder, DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/product-finder-store";
import { CUSTOMER_ACCOUNTS } from "@/lib/integration/customers";

/**
 * Regression tests for the coverage-audit medium fixes in the store
 * (docs/test-coverage-audit.md): a persona switch must not let the next rep
 * inherit the previous rep's "Quoting for" customer (wrong pricing tier / contract
 * attribution on a shared workstation) — the same hazard logout() already guards.
 */
beforeEach(() => {
  useProductFinder.setState({ user: null, activeCustomerId: null });
});

describe("login clears the previous identity's active customer (cross-persona bleed)", () => {
  it("login() resets activeCustomerId", () => {
    const s = useProductFinder.getState();
    s.setActiveCustomer(CUSTOMER_ACCOUNTS[0].id);
    expect(useProductFinder.getState().activeCustomerId).toBe(CUSTOMER_ACCOUNTS[0].id);

    // Switch persona via the one-click role switcher (login under the hood).
    const ok = useProductFinder.getState().login(DEMO_ACCOUNTS[0].email, DEMO_PASSWORD);
    expect(ok).toBe(true);
    expect(useProductFinder.getState().activeCustomerId).toBeNull();
  });

  it("loginWithSso() resets activeCustomerId", () => {
    const s = useProductFinder.getState();
    s.setActiveCustomer(CUSTOMER_ACCOUNTS[0].id);
    s.loginWithSso({ email: "sso@acme.com", name: "SSO User", role: "sales", branch: "Houston Downtown", branchId: "houston-downtown" });
    expect(useProductFinder.getState().activeCustomerId).toBeNull();
  });
});
