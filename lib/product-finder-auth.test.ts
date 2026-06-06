/**
 * Unit tests for the auth slice of product-finder-store.
 * Covers login success/failure and hydrateAuth localStorage restore.
 * These run in a Node environment via Vitest.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the data layer so the store can be imported in a Node environment without loading the full product dataset.
vi.mock("@/data/mock/catalog-products", () => ({
  searchProducts: vi.fn(() => []),
  getAlternatives: vi.fn(() => []),
  getCrossSells: vi.fn(() => []),
  getUpsells: vi.fn(() => []),
  getTotalBranchStock: vi.fn(() => 0),
}));

// Provide a minimal localStorage mock for the Node environment.
const store: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; },
});

import { useProductFinder, hydrateAuth } from "@/lib/product-finder-store";

describe("product-finder auth slice", () => {
  beforeEach(() => {
    // Reset store and localStorage before each test.
    localStorage.clear();
    useProductFinder.setState({ user: null, authError: null });
  });

  describe("login()", () => {
    it("returns true and sets user on valid credentials", () => {
      const success = useProductFinder.getState().login("sales@meridiansupply.com", "meridian2024");
      expect(success).toBe(true);
      const { user } = useProductFinder.getState();
      expect(user).not.toBeNull();
      expect(user?.email).toBe("sales@meridiansupply.com");
      expect(user?.name).toBe("Sarah Chen");
      expect(user?.role).toBe("sales");
    });

    it("is case-insensitive for email", () => {
      const success = useProductFinder.getState().login("SALES@MERIDIANSUPPLY.COM", "meridian2024");
      expect(success).toBe(true);
      expect(useProductFinder.getState().user?.email).toBe("sales@meridiansupply.com");
    });

    it("returns false and sets authError on wrong password", () => {
      const success = useProductFinder.getState().login("sales@meridiansupply.com", "wrongpassword");
      expect(success).toBe(false);
      expect(useProductFinder.getState().user).toBeNull();
      expect(useProductFinder.getState().authError).toBe("Invalid email or password.");
    });

    it("returns false and sets authError on unknown email", () => {
      const success = useProductFinder.getState().login("unknown@meridiansupply.com", "meridian2024");
      expect(success).toBe(false);
      expect(useProductFinder.getState().user).toBeNull();
      expect(useProductFinder.getState().authError).toBe("Invalid email or password.");
    });

    it("persists user to localStorage on success", () => {
      useProductFinder.getState().login("manager@meridiansupply.com", "meridian2024");
      const stored = localStorage.getItem("pf_user");
      expect(stored).not.toBeNull();
      // stored is confirmed non-null by the assertion above
      const parsed = JSON.parse(stored!) as { email: string; role: string };
      expect(parsed.email).toBe("manager@meridiansupply.com");
      expect(parsed.role).toBe("manager");
    });

    it("does not store the password in localStorage", () => {
      useProductFinder.getState().login("admin@meridiansupply.com", "meridian2024");
      const stored = localStorage.getItem("pf_user");
      expect(stored).not.toBeNull();
      expect(stored).not.toContain("meridian2024");
    });
  });

  describe("logout()", () => {
    it("clears user and removes localStorage entry", () => {
      useProductFinder.getState().login("sales@meridiansupply.com", "meridian2024");
      expect(useProductFinder.getState().user).not.toBeNull();

      useProductFinder.getState().logout();
      expect(useProductFinder.getState().user).toBeNull();
      expect(localStorage.getItem("pf_user")).toBeNull();
    });
  });

  describe("hydrateAuth()", () => {
    it("restores user from localStorage if entry is present", () => {
      const fakeUser = {
        name: "Sarah Chen",
        email: "sales@meridiansupply.com",
        role: "sales",
        branch: "Houston Downtown",
        branchId: "B-HOU-01",
      };
      localStorage.setItem("pf_user", JSON.stringify(fakeUser));

      hydrateAuth();

      const { user } = useProductFinder.getState();
      expect(user).not.toBeNull();
      expect(user?.email).toBe("sales@meridiansupply.com");
    });

    it("does nothing when localStorage entry is absent", () => {
      hydrateAuth();
      expect(useProductFinder.getState().user).toBeNull();
    });

    it("removes corrupted localStorage entry without throwing", () => {
      localStorage.setItem("pf_user", "not-valid-json{{");
      expect(() => hydrateAuth()).not.toThrow();
      expect(localStorage.getItem("pf_user")).toBeNull();
      expect(useProductFinder.getState().user).toBeNull();
    });
  });
});
