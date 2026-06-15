import { describe, it, expect } from "vitest";
import { searchCatalog } from "@/lib/catalog/search";
import { getCatalog } from "@/lib/catalog/index";
import { isActiveLifecycle, isObsolescent } from "@/lib/catalog/lifecycle";

describe("lifecycle in the generated catalog", () => {
  it("assigns a lifecycle status to synthetic products and keeps a realistic obsolescent minority", () => {
    const { products } = getCatalog();
    const synthetic = products.filter((p) => p.dataSource === "simulated");
    expect(synthetic.length).toBeGreaterThan(1000);
    // Every synthetic product carries a status.
    expect(synthetic.every((p) => p.lifecycleStatus !== undefined)).toBe(true);
    const obsolete = synthetic.filter((p) => isObsolescent(p.lifecycleStatus));
    const pct = obsolete.length / synthetic.length;
    expect(pct).toBeGreaterThan(0.05);
    expect(pct).toBeLessThan(0.25);
  });

  it("keeps verified/curated real products Active (they are the live-priced demo parts)", () => {
    const { products } = getCatalog();
    const real = products.filter((p) => p.dataSource === "verified" || p.dataSource === "curated");
    expect(real.length).toBeGreaterThan(0);
    expect(real.every((p) => isActiveLifecycle(p.lifecycleStatus))).toBe(true);
  });
});

describe("onlyActive search filter", () => {
  it("drops obsolescent parts and returns only active ones", () => {
    const all = searchCatalog({ filters: {}, pageSize: 100 });
    const activeOnly = searchCatalog({ filters: { onlyActive: true }, pageSize: 100 });
    // Filtering can only shrink (or hold) the result count.
    expect(activeOnly.total).toBeLessThanOrEqual(all.total);
    // There ARE obsolescent parts in the catalog, so it strictly shrinks overall.
    expect(activeOnly.total).toBeLessThan(all.total);
    // Every returned item is active.
    expect(activeOnly.items.every((p) => isActiveLifecycle(p.lifecycleStatus))).toBe(true);
  });
});
