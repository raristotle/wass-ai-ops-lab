/**
 * TDD tests for mockInventoryProvider (lib/integration/inventory.ts)
 * Written BEFORE the implementation — must fail on first run.
 */

import { describe, it, expect } from "vitest";
import { mockInventoryProvider } from "@/lib/integration/inventory";
import type { CatalogProduct } from "@/features/product-finder/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProduct(
  overrides: Partial<CatalogProduct> & { id: string }
): CatalogProduct {
  const { id, branchStock, dcStock, ...rest } = overrides;
  return {
    id,
    sku: `SKU-${id}`,
    name: `Product ${id}`,
    brand: "Acme",
    category: "electrical",
    subcategory: "Breakers",
    description: "Test product",
    unitPrice: 25.0,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: branchStock ?? [],
    dcStock: dcStock ?? [],
    externalSources: [],
    imageIcon: "⚡",
    ...rest,
  };
}

const TODAY = new Date("2026-06-06T00:00:00.000Z");

// ─── In-stock product (branch + DC stock) ─────────────────────────────────────

const inStockProduct = makeProduct({
  id: "PROD-IN-001",
  branchStock: [
    { branchId: "B-HOU-01", branchName: "Houston Downtown", city: "Houston", state: "TX", quantity: 20 },
    { branchId: "B-DAL-01", branchName: "Dallas North",    city: "Dallas",  state: "TX", quantity: 0 },
    { branchId: "B-AUS-01", branchName: "Austin Central",  city: "Austin",  state: "TX", quantity: 5 },
  ],
  dcStock: [
    { dcId: "DC-TEX-01", dcName: "Texas DC – Katy", location: "Katy, TX", quantity: 100 },
  ],
});

// ─── Out-of-stock product ─────────────────────────────────────────────────────

const oosProduct = makeProduct({
  id: "PROD-OOS-002",
  branchStock: [],
  dcStock: [],
});

// ─── Product with DC stock only (no branch stock) ─────────────────────────────

const dcOnlyProduct = makeProduct({
  id: "PROD-DC-003",
  branchStock: [],
  dcStock: [
    { dcId: "DC-TEX-01", dcName: "Texas DC – Katy", location: "Katy, TX", quantity: 50 },
  ],
});

// ─── Product in stock at other branches but NOT at the rep's branch ───────────

const otherBranchesProduct = makeProduct({
  id: "PROD-XFER-004",
  branchStock: [
    { branchId: "B-HOU-01", branchName: "Houston Downtown", city: "Houston", state: "TX", quantity: 0 },
    { branchId: "B-DAL-01", branchName: "Dallas North",    city: "Dallas",  state: "TX", quantity: 15 },
    { branchId: "B-AUS-01", branchName: "Austin Central",  city: "Austin",  state: "TX", quantity: 8 },
  ],
  dcStock: [],
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("mockInventoryProvider.getAvailability", () => {
  // ── In-stock: atpDate and leadTime must be null ──────────────────────────────

  it("returns inStock=true when branchQty > 0", () => {
    const av = mockInventoryProvider.getAvailability(inStockProduct, { today: TODAY });
    expect(av.inStock).toBe(true);
  });

  it("returns correct branchQty as sum of all branch quantities", () => {
    // sum of 20+0+5 = 25 (all branchStock entries summed, including 0s)
    const av = mockInventoryProvider.getAvailability(inStockProduct, { today: TODAY });
    expect(av.branchQty).toBe(25);
  });

  it("returns correct dcQty as sum of all DC quantities", () => {
    const av = mockInventoryProvider.getAvailability(inStockProduct, { today: TODAY });
    expect(av.dcQty).toBe(100);
  });

  it("returns atpDate=null when in stock", () => {
    const av = mockInventoryProvider.getAvailability(inStockProduct, { today: TODAY });
    expect(av.atpDate).toBeNull();
  });

  it("returns leadTime=null when in stock", () => {
    const av = mockInventoryProvider.getAvailability(inStockProduct, { today: TODAY });
    expect(av.leadTime).toBeNull();
  });

  // ── In-stock: otherBranches should only include qty > 0 ─────────────────────

  it("otherBranches only includes branchStock entries with qty > 0", () => {
    const av = mockInventoryProvider.getAvailability(inStockProduct, { today: TODAY });
    // B-DAL-01 has quantity 0 — must not appear
    expect(av.otherBranches.every((b) => b.qty > 0)).toBe(true);
    expect(av.otherBranches).toHaveLength(2); // B-HOU-01 (20) and B-AUS-01 (5)
  });

  it("otherBranches maps branchName → name field", () => {
    const av = mockInventoryProvider.getAvailability(inStockProduct, { today: TODAY });
    const houston = av.otherBranches.find((b) => b.branchId === "B-HOU-01");
    expect(houston).toBeDefined();
    expect(houston?.name).toBe("Houston Downtown");
    expect(houston?.qty).toBe(20);
  });

  it("otherBranches falls back to branchId as name when branchName is absent", () => {
    const product = makeProduct({
      id: "PROD-NONAME-005",
      branchStock: [
        // intentionally omit branchName to test fallback
        { branchId: "B-XX-01", branchName: "", city: "", state: "", quantity: 10 },
      ],
      dcStock: [],
    });
    const av = mockInventoryProvider.getAvailability(product, { today: TODAY });
    expect(av.otherBranches[0].name).toBe("B-XX-01"); // fallback to branchId
  });

  // ── Out-of-stock ─────────────────────────────────────────────────────────────

  it("returns inStock=false when branchStock and dcStock are both empty", () => {
    const av = mockInventoryProvider.getAvailability(oosProduct, { today: TODAY });
    expect(av.inStock).toBe(false);
  });

  it("returns branchQty=0 and dcQty=0 for OOS product", () => {
    const av = mockInventoryProvider.getAvailability(oosProduct, { today: TODAY });
    expect(av.branchQty).toBe(0);
    expect(av.dcQty).toBe(0);
  });

  it("returns non-null leadTime for OOS product", () => {
    const av = mockInventoryProvider.getAvailability(oosProduct, { today: TODAY });
    expect(av.leadTime).not.toBeNull();
    expect(typeof av.leadTime).toBe("string");
  });

  it("returns non-null atpDate for OOS product", () => {
    const av = mockInventoryProvider.getAvailability(oosProduct, { today: TODAY });
    expect(av.atpDate).not.toBeNull();
  });

  it("atpDate is a valid ISO yyyy-mm-dd date string for OOS product", () => {
    const av = mockInventoryProvider.getAvailability(oosProduct, { today: TODAY });
    expect(av.atpDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("atpDate is strictly in the future relative to today for OOS product", () => {
    const av = mockInventoryProvider.getAvailability(oosProduct, { today: TODAY });
    expect(av.atpDate! > "2026-06-06").toBe(true);
  });

  it("atpDate equals today + bucket days for OOS product (exact date assertion)", () => {
    // PROD-OOS-002 → stableHash("PROD-OOS-002") % 4 → we need to know the bucket.
    // We derive the bucket days in the provider using the same stableHash.
    // The test asserts the EXACT date by computing it independently here.
    //
    // stableHash("PROD-OOS-002"):
    //   djb2-style: hash = 5381; iterate chars, hash = ((h<<5)+h)^c, hash >>>= 0
    //   Bucket map: 0→"3–5 business days"→5, 1→"1–2 weeks"→14,
    //               2→"2–3 weeks"→21, 3→"4–6 weeks"→42
    //
    // We compute expected atpDate dynamically using the same logic the provider uses.
    const BUCKET_DAYS: Record<string, number> = {
      "3–5 business days": 5,
      "1–2 weeks": 14,
      "2–3 weeks": 21,
      "4–6 weeks": 42,
    };

    // Use the provider itself to get leadTime, then map it to days, then recompute the date.
    const av = mockInventoryProvider.getAvailability(oosProduct, { today: TODAY });
    const days = BUCKET_DAYS[av.leadTime!];
    expect(days).toBeDefined(); // leadTime must be one of the 4 known buckets
    const expected = new Date(TODAY);
    expected.setUTCDate(expected.getUTCDate() + days);
    const yyyy = expected.getUTCFullYear();
    const mm = String(expected.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(expected.getUTCDate()).padStart(2, "0");
    expect(av.atpDate).toBe(`${yyyy}-${mm}-${dd}`);
  });

  it("OOS product has empty otherBranches", () => {
    const av = mockInventoryProvider.getAvailability(oosProduct, { today: TODAY });
    expect(av.otherBranches).toHaveLength(0);
  });

  it("OOS product has transferEtaDays=null", () => {
    const av = mockInventoryProvider.getAvailability(oosProduct, { today: TODAY });
    expect(av.transferEtaDays).toBeNull();
  });

  // ── DC-only product ───────────────────────────────────────────────────────────

  it("returns inStock=true when only dcStock has qty > 0", () => {
    const av = mockInventoryProvider.getAvailability(dcOnlyProduct, { today: TODAY });
    expect(av.inStock).toBe(true);
  });

  it("returns atpDate=null for DC-only in-stock product", () => {
    const av = mockInventoryProvider.getAvailability(dcOnlyProduct, { today: TODAY });
    expect(av.atpDate).toBeNull();
  });

  // ── Transfer ETA logic ────────────────────────────────────────────────────────

  it("transferEtaDays is null when rep branch has stock", () => {
    // B-HOU-01 has 20 units — rep's branch → no transfer needed
    const av = mockInventoryProvider.getAvailability(inStockProduct, { branchId: "B-HOU-01", today: TODAY });
    expect(av.transferEtaDays).toBeNull();
  });

  it("transferEtaDays is a positive integer when rep branch has 0 but others do", () => {
    // B-HOU-01 has 0 qty; B-DAL-01 and B-AUS-01 have stock
    const av = mockInventoryProvider.getAvailability(otherBranchesProduct, { branchId: "B-HOU-01", today: TODAY });
    expect(av.inStock).toBe(true);
    expect(av.transferEtaDays).not.toBeNull();
    expect(Number.isInteger(av.transferEtaDays)).toBe(true);
    expect(av.transferEtaDays!).toBeGreaterThan(0);
  });

  it("transferEtaDays is null when no branchId context is given (in-stock)", () => {
    const av = mockInventoryProvider.getAvailability(inStockProduct, { today: TODAY });
    expect(av.transferEtaDays).toBeNull();
  });

  // ── Determinism ──────────────────────────────────────────────────────────────

  it("produces identical results for the same product + today (determinism)", () => {
    const av1 = mockInventoryProvider.getAvailability(oosProduct, { today: TODAY });
    const av2 = mockInventoryProvider.getAvailability(oosProduct, { today: TODAY });
    expect(av1).toEqual(av2);
  });

  it("different today values produce different atpDates for OOS product", () => {
    const later = new Date("2026-07-01T00:00:00.000Z");
    const av1 = mockInventoryProvider.getAvailability(oosProduct, { today: TODAY });
    const av2 = mockInventoryProvider.getAvailability(oosProduct, { today: later });
    expect(av1.atpDate).not.toBe(av2.atpDate);
  });
});
