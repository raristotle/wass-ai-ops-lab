/**
 * Tests for lib/analytics.ts — pure aggregation functions.
 * Run with: npx vitest run lib/analytics.test.ts
 *
 * Strategy: small, known fixtures so expected values are hand-calculable.
 * All functions are deterministic given the same inputs — no Date.now/Math.random.
 */

import { describe, it, expect } from "vitest";
import {
  salesKpis,
  topCategories,
  topProducts,
  ordersOverTime,
  customerMix,
  contractSavings,
  isInLocalMonth,
} from "@/lib/analytics";
import type { Order } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";
import type { Catalog } from "@/lib/catalog/index";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<CatalogProduct>): CatalogProduct {
  return {
    id: "p1",
    sku: "SKU-001",
    name: "Test Product",
    brand: "TestBrand",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "A test product",
    unitPrice: 10.0,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "⚡",
    ...overrides,
  };
}

const prodA = makeProduct({ id: "p-A", name: "Product A", category: "electrical", unitPrice: 10.0 });
const prodB = makeProduct({ id: "p-B", name: "Product B", category: "datacom", unitPrice: 20.0 });
const prodC = makeProduct({ id: "p-C", name: "Product C", category: "electrical", unitPrice: 5.0 });

// Order 1: CUST-001, two lines
const order1: Order = {
  id: "ord-1",
  placedAt: new Date("2026-01-15").getTime(),
  lines: [
    { product: prodA, qty: 2 }, // list = 20
    { product: prodB, qty: 1 }, // list = 20
  ],
  total: 35.0, // contract price (some discount)
  customerId: "CUST-001",
  customerName: "Acme Corp",
};

// Order 2: CUST-002, one line
const order2: Order = {
  id: "ord-2",
  placedAt: new Date("2026-02-10").getTime(),
  lines: [
    { product: prodC, qty: 4 }, // list = 20
  ],
  total: 16.0,
  customerId: "CUST-002",
  customerName: "Beta Inc",
};

// Order 3: CUST-001 again, one line (for customer mix / count)
const order3: Order = {
  id: "ord-3",
  placedAt: new Date("2026-03-05").getTime(),
  lines: [
    { product: prodA, qty: 3 }, // list = 30
  ],
  total: 27.0,
  customerId: "CUST-001",
  customerName: "Acme Corp",
};

const ALL_ORDERS = [order1, order2, order3];

// Minimal Catalog stub for topCategories
const mockCatalog: Pick<Catalog, "byId"> = {
  byId: new Map([
    ["p-A", prodA],
    ["p-B", prodB],
    ["p-C", prodC],
  ]),
};

// ─── salesKpis ────────────────────────────────────────────────────────────────

describe("salesKpis", () => {
  it("computes KPIs for a known set of orders", () => {
    const kpis = salesKpis(ALL_ORDERS);
    expect(kpis.orderCount).toBe(3);
    // totalValue = 35 + 16 + 27 = 78
    expect(kpis.totalValue).toBeCloseTo(78.0, 5);
    // avgOrderValue = 78 / 3 = 26
    expect(kpis.avgOrderValue).toBeCloseTo(26.0, 5);
    // activeCustomers: CUST-001 + CUST-002 = 2
    expect(kpis.activeCustomers).toBe(2);
  });

  it("returns zeros for empty orders — no NaN", () => {
    const kpis = salesKpis([]);
    expect(kpis.orderCount).toBe(0);
    expect(kpis.totalValue).toBe(0);
    expect(kpis.avgOrderValue).toBe(0);
    expect(kpis.activeCustomers).toBe(0);
    expect(Number.isNaN(kpis.avgOrderValue)).toBe(false);
  });

  it("counts walk-in orders (null customerId) correctly", () => {
    const walkIn: Order = {
      id: "ord-walk",
      placedAt: Date.now(),
      lines: [{ product: prodA, qty: 1 }],
      total: 9.0,
      customerId: null,
      customerName: null,
    };
    const kpis = salesKpis([walkIn]);
    expect(kpis.orderCount).toBe(1);
    // Walk-in orders have no named customer — activeCustomers should be 0
    expect(kpis.activeCustomers).toBe(0);
  });
});

// ─── topCategories ────────────────────────────────────────────────────────────

describe("topCategories", () => {
  it("sums list value (unitPrice*qty) per category correctly", () => {
    // electrical: prodA×2 (20) + prodA×3 (30) + prodC×4 (20) = 70
    // datacom:    prodB×1 (20) = 20
    const cats = topCategories(ALL_ORDERS, mockCatalog as Catalog, 6);
    const electrical = cats.find((c) => c.category === "electrical");
    const datacom = cats.find((c) => c.category === "datacom");
    expect(electrical).toBeDefined();
    expect(electrical!.value).toBeCloseTo(70, 5);
    expect(electrical!.qty).toBe(9); // 2+4+3
    expect(datacom!.value).toBeCloseTo(20, 5);
    expect(datacom!.qty).toBe(1);
  });

  it("returns at most k entries, sorted by value desc", () => {
    const cats = topCategories(ALL_ORDERS, mockCatalog as Catalog, 1);
    expect(cats).toHaveLength(1);
    expect(cats[0].category).toBe("electrical");
  });

  it("returns empty array for empty orders", () => {
    expect(topCategories([], mockCatalog as Catalog)).toHaveLength(0);
  });
});

// ─── topProducts ──────────────────────────────────────────────────────────────

describe("topProducts", () => {
  it("sums list value (unitPrice*qty) per product and sorts desc", () => {
    // prodA: 2×10 + 3×10 = 50, qty 5
    // prodB: 1×20      = 20, qty 1
    // prodC: 4×5       = 20, qty 4
    const products = topProducts(ALL_ORDERS, 8);
    expect(products[0].id).toBe("p-A");
    expect(products[0].value).toBeCloseTo(50, 5);
    expect(products[0].qty).toBe(5);
    // prodB and prodC both 20 — order between them may vary; just check totals
    const ids = products.map((p) => p.id);
    expect(ids).toContain("p-B");
    expect(ids).toContain("p-C");
  });

  it("respects k limit", () => {
    const products = topProducts(ALL_ORDERS, 1);
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe("p-A");
  });

  it("returns empty for empty orders", () => {
    expect(topProducts([])).toHaveLength(0);
  });
});

// ─── ordersOverTime ───────────────────────────────────────────────────────────

describe("ordersOverTime", () => {
  // now = 2026-04-01 — 6 months back covers: Nov 2025, Dec 2025, Jan 2026, Feb 2026, Mar 2026, Apr 2026
  const now = new Date("2026-04-01").getTime();

  it("returns exactly `buckets` entries", () => {
    const buckets = ordersOverTime(ALL_ORDERS, now, 6);
    expect(buckets).toHaveLength(6);
  });

  it("assigns orders to the correct month bucket", () => {
    const buckets = ordersOverTime(ALL_ORDERS, now, 6);
    // Jan 2026 → order1 (total 35), Feb 2026 → order2 (total 16), Mar 2026 → order3 (total 27)
    const jan = buckets.find((b) => b.label === "Jan 26");
    const feb = buckets.find((b) => b.label === "Feb 26");
    const mar = buckets.find((b) => b.label === "Mar 26");
    expect(jan).toBeDefined();
    expect(jan!.value).toBeCloseTo(35, 5);
    expect(jan!.count).toBe(1);
    expect(feb!.value).toBeCloseTo(16, 5);
    expect(feb!.count).toBe(1);
    expect(mar!.value).toBeCloseTo(27, 5);
    expect(mar!.count).toBe(1);
  });

  it("empty buckets have value 0 and count 0", () => {
    const buckets = ordersOverTime(ALL_ORDERS, now, 6);
    const emptyBuckets = buckets.filter((b) => b.count === 0);
    emptyBuckets.forEach((b) => {
      expect(b.value).toBe(0);
      expect(Number.isNaN(b.value)).toBe(false);
    });
  });

  it("returns all-zero buckets for empty orders", () => {
    const buckets = ordersOverTime([], now, 6);
    expect(buckets).toHaveLength(6);
    buckets.forEach((b) => {
      expect(b.value).toBe(0);
      expect(b.count).toBe(0);
    });
  });

  it("is deterministic: same args → same result", () => {
    const a = ordersOverTime(ALL_ORDERS, now, 6);
    const b = ordersOverTime(ALL_ORDERS, now, 6);
    expect(a).toEqual(b);
  });

  it("buckets carry year and month (0-indexed, local)", () => {
    const buckets = ordersOverTime(ALL_ORDERS, now, 6);
    const jan = buckets.find((b) => b.label === "Jan 26")!;
    expect(jan.year).toBe(2026);
    expect(jan.month).toBe(0);
    const mar = buckets.find((b) => b.label === "Mar 26")!;
    expect(mar.year).toBe(2026);
    expect(mar.month).toBe(2);
  });

  it("year/month fields are correct across a year boundary", () => {
    // now = local Feb 1 2026 → 6 buckets: Sep 25 … Feb 26
    const boundaryNow = new Date(2026, 1, 1).getTime();
    const buckets = ordersOverTime([], boundaryNow, 6);
    expect(buckets.map((b) => [b.year, b.month])).toEqual([
      [2025, 8],
      [2025, 9],
      [2025, 10],
      [2025, 11],
      [2026, 0],
      [2026, 1],
    ]);
  });
});

// ─── isInLocalMonth ──────────────────────────────────────────────────────────

describe("isInLocalMonth", () => {
  it("last millisecond of a local month is inside; the next ms is not", () => {
    // Local-time month edge: Jan 31 2026 23:59:59.999 vs Feb 1 2026 00:00:00.000
    const lastMs = new Date(2026, 1, 1).getTime() - 1;
    const firstMsNext = new Date(2026, 1, 1).getTime();
    expect(isInLocalMonth(lastMs, 2026, 0)).toBe(true);
    expect(isInLocalMonth(lastMs, 2026, 1)).toBe(false);
    expect(isInLocalMonth(firstMsNext, 2026, 1)).toBe(true);
    expect(isInLocalMonth(firstMsNext, 2026, 0)).toBe(false);
  });

  it("agrees with ordersOverTime bucket assignment at boundary timestamps", () => {
    const boundaryNow = new Date(2026, 3, 15).getTime();
    const edgeTimestamps = [
      new Date(2026, 0, 1).getTime(), // first ms of Jan (local)
      new Date(2026, 1, 1).getTime() - 1, // last ms of Jan (local)
      new Date(2026, 1, 1).getTime(), // first ms of Feb (local)
      new Date(2026, 2, 31, 23, 59, 59, 999).getTime(), // last ms of Mar (local)
    ];
    const orders: Order[] = edgeTimestamps.map((t, i) => ({
      id: `edge-${i}`,
      placedAt: t,
      lines: [{ product: prodA, qty: 1 }],
      total: 1,
      customerId: null,
      customerName: null,
    }));
    const buckets = ordersOverTime(orders, boundaryNow, 6);
    for (const bucket of buckets) {
      const expectedCount = edgeTimestamps.filter((t) =>
        isInLocalMonth(t, bucket.year, bucket.month),
      ).length;
      expect(bucket.count, bucket.label).toBe(expectedCount);
    }
    // All four edge orders land in exactly one bucket each
    expect(buckets.reduce((s, b) => s + b.count, 0)).toBe(edgeTimestamps.length);
  });
});

// ─── customerMix ─────────────────────────────────────────────────────────────

describe("customerMix", () => {
  it("sums order totals per named customer", () => {
    const mix = customerMix(ALL_ORDERS);
    const acme = mix.find((m) => m.customerName === "Acme Corp");
    const beta = mix.find((m) => m.customerName === "Beta Inc");
    expect(acme).toBeDefined();
    expect(acme!.value).toBeCloseTo(62, 5); // 35 + 27
    expect(acme!.count).toBe(2);
    expect(beta!.value).toBeCloseTo(16, 5);
    expect(beta!.count).toBe(1);
  });

  it("groups walk-in (null) orders under a Walk-in label", () => {
    const walkIn: Order = {
      id: "ord-walk",
      placedAt: Date.now(),
      lines: [{ product: prodA, qty: 1 }],
      total: 9.0,
      customerId: null,
      customerName: null,
    };
    const mix = customerMix([walkIn]);
    expect(mix).toHaveLength(1);
    expect(mix[0].customerName).toBe("Walk-in");
  });

  it("entries carry the expected customerId (null for walk-in)", () => {
    const walkIn: Order = {
      id: "ord-walk-2",
      placedAt: Date.now(),
      lines: [{ product: prodA, qty: 1 }],
      total: 9.0,
      customerId: null,
      customerName: null,
    };
    const mix = customerMix([...ALL_ORDERS, walkIn]);
    expect(mix.find((m) => m.customerName === "Acme Corp")!.customerId).toBe("CUST-001");
    expect(mix.find((m) => m.customerName === "Beta Inc")!.customerId).toBe("CUST-002");
    expect(mix.find((m) => m.customerName === "Walk-in")!.customerId).toBeNull();
  });

  it("returns empty for empty orders", () => {
    expect(customerMix([])).toHaveLength(0);
  });
});

// ─── contractSavings ──────────────────────────────────────────────────────────

describe("contractSavings", () => {
  it("computes list total vs contract total correctly", () => {
    // listTotal = unitPrice*qty for each line (not order.total)
    // ord1: 10×2 + 20×1 = 40; ord2: 5×4 = 20; ord3: 10×3 = 30 → listTotal = 90
    // effectiveTotal = sum(order.total) = 35 + 16 + 27 = 78
    // savings = 90 - 78 = 12
    // savingsPct = 12/90 * 100 ≈ 13.33
    const result = contractSavings(ALL_ORDERS);
    expect(result.listTotal).toBeCloseTo(90, 5);
    expect(result.effectiveTotal).toBeCloseTo(78, 5);
    expect(result.savings).toBeCloseTo(12, 5);
    expect(result.savingsPct).toBeCloseTo((12 / 90) * 100, 3);
    expect(Number.isNaN(result.savingsPct)).toBe(false);
  });

  it("returns zeros for empty orders — no NaN", () => {
    const result = contractSavings([]);
    expect(result.listTotal).toBe(0);
    expect(result.effectiveTotal).toBe(0);
    expect(result.savings).toBe(0);
    expect(result.savingsPct).toBe(0);
    expect(Number.isNaN(result.savingsPct)).toBe(false);
  });

  it("savingsPct is 0 when list equals effective (no discount)", () => {
    const noDiscount: Order = {
      id: "ord-nd",
      placedAt: Date.now(),
      lines: [{ product: prodA, qty: 1 }],
      total: 10.0, // same as unitPrice
      customerId: null,
      customerName: null,
    };
    const result = contractSavings([noDiscount]);
    expect(result.savingsPct).toBeCloseTo(0, 5);
  });
});
