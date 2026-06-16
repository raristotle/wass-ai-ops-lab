import { describe, it, expect } from "vitest";
import { COLUMNS, defaultVisibility, visibleColumns } from "@/lib/product-finder-columns";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(over: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "X", sku: "QO115", name: "20A Breaker", brand: "Square D", category: "electrical",
    subcategory: "Circuit Breakers", description: "", unitPrice: 12.5, uom: "ea", specs: [],
    preferred: true, imageIcon: "x", externalSources: [],
    branchStock: [{ branchId: "b", branchName: "H", city: "H", state: "TX", quantity: 7 }],
    dcStock: [{ dcId: "d", dcName: "DC", location: "TX", quantity: 40 }],
    verifiedCrossCount: 3, lifecycleStatus: "NRND", ...over,
  };
}

const col = (id: string) => COLUMNS.find((c) => c.id === id)!;

describe("column value accessors", () => {
  it("formats price, sums stock, defaults lifecycle, and reads crosses", () => {
    const p = prod();
    expect(col("price").value(p)).toBe("$12.50");
    expect(col("branchStock").value(p)).toBe("7");
    expect(col("dcStock").value(p)).toBe("40");
    expect(col("lifecycle").value(p)).toBe("NRND");
    expect(col("lifecycle").value(prod({ lifecycleStatus: undefined }))).toBe("Active");
    expect(col("crosses").value(p)).toBe("3");
    expect(col("preferred").value(prod({ preferred: false }))).toBe("—");
  });
});

describe("visibility", () => {
  it("defaultVisibility matches each column's defaultVisible", () => {
    const vis = defaultVisibility();
    expect(vis.price).toBe(true);
    expect(vis.dcStock).toBe(false);
    expect(visibleColumns(vis).map((c) => c.id)).toEqual(
      COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id),
    );
  });

  it("respects overrides and falls back to the column default for absent keys", () => {
    // Hide a default-on column, show a default-off one; omit the rest.
    const cols = visibleColumns({ price: false, dcStock: true });
    const ids = cols.map((c) => c.id);
    expect(ids).not.toContain("price");
    expect(ids).toContain("dcStock");
    expect(ids).toContain("sku"); // absent key → default (true)
  });
});
