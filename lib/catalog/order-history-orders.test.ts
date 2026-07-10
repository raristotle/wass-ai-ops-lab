import { describe, it, expect } from "vitest";
import { MemoryStore, forTenant } from "@/lib/server/persistence";
import type { CatalogProduct } from "@/features/product-finder/types";
import {
  buildDatedOrders,
  saveDatedOrders,
  getDatedOrders,
  getDatedOrdersManifest,
  clearDatedOrders,
  forecastReferenceNow,
  type ResolvedOrder,
} from "@/lib/catalog/order-history-orders";
import { demandForecast } from "@/lib/product-finder-forecast";

const DAY = 86_400_000;
const NOW = 1_781_400_000_000;

function product(id: string, subcategory: string, name = `P-${id}`): CatalogProduct {
  return {
    id,
    sku: id,
    name,
    brand: "Brand",
    category: "electrical",
    subcategory,
    description: "",
    unitPrice: 10,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "⚡",
  };
}

const breaker = product("CB-1", "Circuit Breakers");
const wire = product("W-1", "Building Wire");

function resolvedOrder(orderId: string, daysAgo: number | undefined, qty = 5): ResolvedOrder {
  return {
    orderId,
    date: daysAgo === undefined ? undefined : NOW - daysAgo * DAY,
    lines: [
      { product: breaker, qty },
      { product: wire, qty },
    ],
  };
}

describe("buildDatedOrders", () => {
  it("carries real parsed dates through as placedAt (allDatesReal:true)", () => {
    const { orders, allDatesReal } = buildDatedOrders([resolvedOrder("1001", 10), resolvedOrder("1002", 40)], NOW);
    expect(allDatesReal).toBe(true);
    expect(orders).toHaveLength(2);
    expect(orders[0].placedAt).toBe(NOW - 10 * DAY);
    expect(orders[1].placedAt).toBe(NOW - 40 * DAY);
    expect(orders[0].lines[0].product.id).toBe("CB-1");
    expect(orders[0].total).toBe(100); // 5×$10 + 5×$10
  });

  it("synthesizes a trailing-90-day spread ONLY when the file has no dates at all — and labels it", () => {
    const { orders, allDatesReal } = buildDatedOrders(
      [resolvedOrder("1", undefined), resolvedOrder("2", undefined), resolvedOrder("3", undefined)],
      NOW,
    );
    expect(allDatesReal).toBe(false); // honest label — never silently fabricated as real
    expect(orders).toHaveLength(3);
    for (const o of orders) {
      expect(o.placedAt).toBeLessThan(NOW);
      expect(o.placedAt).toBeGreaterThanOrEqual(NOW - 90 * DAY);
    }
  });

  it("in a PARTIALLY dated file, keeps only the truly dated orders (never fabricates for real data)", () => {
    const { orders, allDatesReal } = buildDatedOrders([resolvedOrder("dated", 5), resolvedOrder("undated", undefined)], NOW);
    expect(allDatesReal).toBe(true);
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe("oh-dated");
  });
});

describe("saveDatedOrders / getDatedOrders (persistence + idempotency + scoping)", () => {
  it("persists dated orders + manifest with a date range", async () => {
    const store = new MemoryStore();
    const m = await saveDatedOrders(store, [resolvedOrder("1001", 10), resolvedOrder("1002", 40)], "Acme", NOW);
    expect(m.ordersPersisted).toBe(2);
    expect(m.datedOrders).toBe(2);
    expect(m.synthesizedOrders).toBe(0);
    expect(m.allDatesReal).toBe(true);
    expect(m.dateRangeStart).toBe(NOW - 40 * DAY);
    expect(m.dateRangeEnd).toBe(NOW - 10 * DAY);
    expect(m.version).toBe(1);

    const orders = await getDatedOrders(store);
    expect(orders).toHaveLength(2);
    expect(await getDatedOrdersManifest(store)).toEqual(m);
  });

  it("is idempotent: re-importing the same file is a no-op (same manifest, no version bump)", async () => {
    const store = new MemoryStore();
    const input = [resolvedOrder("1001", 10), resolvedOrder("1002", 40)];
    const first = await saveDatedOrders(store, input, "Acme", NOW);
    const second = await saveDatedOrders(store, input, "Acme", NOW + DAY);
    expect(second.version).toBe(first.version); // no double-count
    expect(second.contentHash).toBe(first.contentHash);
    expect(await getDatedOrders(store)).toHaveLength(2);
  });

  // Regression (2026-07-10 audit fix): the content hash previously keyed on
  // (customer + orderId set) only, so a corrected re-import — same order ids,
  // dates fixed — hashed identically to the first (undated) import and was
  // silently dropped as a "duplicate": the co-purchase rules store updates
  // unconditionally on every import, but this store kept the stale
  // synthesized dates, leaving the forecast half-applied with no error.
  it("a corrected re-import (same order ids, dates fixed) is NOT a duplicate — it fully re-applies", async () => {
    const store = new MemoryStore();

    // First import: the export's date column was unparseable → no real dates
    // → a synthesized 90-day spread, honestly demo-labeled.
    const undated = [resolvedOrder("1001", undefined, 2), resolvedOrder("1002", undefined, 10)];
    const first = await saveDatedOrders(store, undated, "Acme", NOW);
    expect(first.allDatesReal).toBe(false);

    // Operator fixes the export's date column and re-imports the SAME order ids.
    const corrected = [resolvedOrder("1001", 80, 2), resolvedOrder("1002", 10, 10)];
    const second = await saveDatedOrders(store, corrected, "Acme", NOW + DAY);

    expect(second.contentHash).not.toBe(first.contentHash); // dates are part of the identity now
    expect(second.version).toBe(first.version + 1); // re-applied, not short-circuited
    expect(second.allDatesReal).toBe(true);
    expect(second.datedOrders).toBe(2);
    expect(second.synthesizedOrders).toBe(0);
    expect(second.dateRangeStart).toBe(NOW - 80 * DAY);
    expect(second.dateRangeEnd).toBe(NOW - 10 * DAY);

    const orders = await getDatedOrders(store);
    expect(orders).toHaveLength(2);
    expect(orders.every((o) => o.placedAt < NOW)).toBe(true); // real dates persisted, not synthesized
  });

  it("a DIFFERENT file (new order-id set) replaces the prior import and bumps the version", async () => {
    const store = new MemoryStore();
    await saveDatedOrders(store, [resolvedOrder("1001", 10)], "Acme", NOW);
    const m2 = await saveDatedOrders(store, [resolvedOrder("2001", 5), resolvedOrder("2002", 6)], "Acme", NOW);
    expect(m2.version).toBe(2);
    expect(m2.ordersPersisted).toBe(2);
    expect(await getDatedOrders(store)).toHaveLength(2);
  });

  it("scopes per tenant via forTenant — tenant A's orders are invisible to tenant B", async () => {
    const base = new MemoryStore();
    const a = forTenant(base, "tenant-a");
    const b = forTenant(base, "tenant-b");
    await saveDatedOrders(a, [resolvedOrder("1001", 10)], "Acme", NOW);
    expect(await getDatedOrders(a)).toHaveLength(1);
    expect(await getDatedOrders(b)).toHaveLength(0);
    expect(await getDatedOrdersManifest(b)).toBeNull();
  });

  it("clearDatedOrders removes orders + manifest", async () => {
    const store = new MemoryStore();
    await saveDatedOrders(store, [resolvedOrder("1001", 10)], "Acme", NOW);
    await clearDatedOrders(store);
    expect(await getDatedOrders(store)).toEqual([]);
    expect(await getDatedOrdersManifest(store)).toBeNull();
  });

  it("fails closed: getDatedOrders/getDatedOrdersManifest degrade to empty on a broken store", async () => {
    const broken = new MemoryStore();
    broken.get = async () => {
      throw new Error("store down");
    };
    expect(await getDatedOrders(broken)).toEqual([]);
    expect(await getDatedOrdersManifest(broken)).toBeNull();
  });
});

describe("B20 — persisted imported orders WAKE the dormant demandForecast engine", () => {
  it("a previously-dormant forecast produces output from an imported dated fixture", async () => {
    const store = new MemoryStore();
    // Dormant before import: no orders → empty forecast.
    expect(demandForecast(await getDatedOrders(store), [], NOW, 6)).toEqual([]);

    // Import a dated fixture: heavier volume in the recent half-window → trend "up".
    await saveDatedOrders(
      store,
      [
        resolvedOrder("1001", 80, 2),
        resolvedOrder("1002", 30, 10),
        resolvedOrder("1003", 10, 12),
      ],
      "Acme",
      NOW,
    );

    const forecast = demandForecast(await getDatedOrders(store), [], NOW, 6);
    expect(forecast.length).toBeGreaterThan(0);
    const breakers = forecast.find((f) => f.subcategory === "Circuit Breakers");
    expect(breakers).toBeDefined();
    expect(breakers!.qty90d).toBe(24); // 2 + 10 + 12
    expect(breakers!.trend).toBe("up"); // second half (22) ≥ first half (2) × 1.25
    expect(breakers!.projected30d).toBeGreaterThan(0);
  });

  it("orders older than the forecast window do not produce demand (date-windowing is real)", async () => {
    const store = new MemoryStore();
    await saveDatedOrders(store, [resolvedOrder("old", 120)], "Acme", NOW);
    expect(demandForecast(await getDatedOrders(store), [], NOW, 6)).toEqual([]);
  });

  // Regression (2026-07-10 audit fix): a real distributor "order history"
  // export is virtually always months old by the time it's uploaded.
  // Windowing the forecast off wall-clock Date.now() (the pre-fix behavior)
  // filtered out every order and silently reported demo:true/empty — the
  // headline "wake the forecast" feature no-op'd for exactly the historical
  // exports it targets.
  it("a historical export (every order >90 days before wall-clock 'now') still wakes the forecast when windowed off the import's own latest date", async () => {
    const store = new MemoryStore();
    // "Today" the operator uploads is long after the historical order dates.
    const wallClockToday = NOW + 400 * DAY;

    await saveDatedOrders(
      store,
      [resolvedOrder("1001", 480, 2), resolvedOrder("1002", 430, 10), resolvedOrder("1003", 410, 12)],
      "Acme",
      NOW,
    );
    const orders = await getDatedOrders(store);
    const manifest = await getDatedOrdersManifest(store);

    // Pre-fix behavior — windowing off wall-clock "now" — sees nothing: every
    // order is ~300+ days outside the trailing-90-day window.
    expect(demandForecast(orders, [], wallClockToday, 6)).toEqual([]);

    // Fix: window off the import's own latest date instead.
    const referenceNow = forecastReferenceNow(manifest, wallClockToday);
    const forecast = demandForecast(orders, [], referenceNow, 6);
    expect(forecast.length).toBeGreaterThan(0);
    const breakers = forecast.find((f) => f.subcategory === "Circuit Breakers");
    expect(breakers).toBeDefined();
    expect(breakers!.qty90d).toBe(24); // 2 + 10 + 12, all within 90d of the import's own latest date
  });
});

describe("forecastReferenceNow — B20 fix: window off the import's latest date, not wall-clock now", () => {
  it("anchors on the import's latest order date when a manifest exists", async () => {
    const store = new MemoryStore();
    await saveDatedOrders(store, [resolvedOrder("1001", 10), resolvedOrder("1002", 40)], "Acme", NOW);
    const manifest = await getDatedOrdersManifest(store);
    expect(forecastReferenceNow(manifest, NOW + 999 * DAY)).toBe(NOW - 10 * DAY); // manifest.dateRangeEnd
  });

  it("falls back to the supplied fallback when there is no manifest yet", () => {
    expect(forecastReferenceNow(null, NOW)).toBe(NOW);
  });
});
