import { describe, it, expect } from "vitest";
import { totalStock, pickInStockSubstitute } from "@/lib/product-finder-substitute";
import type { CatalogProduct, ProductSpec } from "@/features/product-finder/types";

function makeProduct(
  id: string,
  opts: {
    branchQty?: number;
    dcQty?: number;
    specs?: ProductSpec[];
    preferred?: boolean;
    unitPrice?: number;
    subcategory?: string;
  } = {},
): CatalogProduct {
  return {
    id,
    sku: id.toUpperCase(),
    name: `Product ${id}`,
    brand: "TestBrand",
    category: "electrical",
    subcategory: opts.subcategory ?? "Circuit Breakers",
    description: "test",
    unitPrice: opts.unitPrice ?? 10,
    uom: "EA",
    specs: opts.specs ?? [],
    preferred: opts.preferred ?? false,
    branchStock: opts.branchQty
      ? [{ branchId: "B1", branchName: "Branch 1", city: "Houston", state: "TX", quantity: opts.branchQty }]
      : [],
    dcStock: opts.dcQty
      ? [{ dcId: "DC1", dcName: "DC 1", location: "Dallas", quantity: opts.dcQty }]
      : [],
    externalSources: [],
    imageIcon: "⚡",
  };
}

describe("totalStock", () => {
  it("sums branch and DC quantities", () => {
    expect(totalStock(makeProduct("a", { branchQty: 3, dcQty: 7 }))).toBe(10);
  });

  it("returns 0 for fully out-of-stock products", () => {
    expect(totalStock(makeProduct("a"))).toBe(0);
  });
});

describe("pickInStockSubstitute", () => {
  const oos = makeProduct("ref", {
    specs: [{ name: "Amperage", value: "15A", isNonNeg: true }],
  });

  it("returns null when no candidate is in stock", () => {
    expect(pickInStockSubstitute(oos, [makeProduct("x"), makeProduct("y")])).toBeNull();
  });

  it("returns null for an empty pool", () => {
    expect(pickInStockSubstitute(oos, [])).toBeNull();
  });

  it("never returns the reference product itself", () => {
    const self = makeProduct("ref", { branchQty: 5 });
    expect(pickInStockSubstitute(oos, [self])).toBeNull();
  });

  it("skips out-of-stock candidates in favor of in-stock ones", () => {
    const outOfStock = makeProduct("a", { specs: oos.specs });
    const inStock = makeProduct("b", { dcQty: 4 });
    expect(pickInStockSubstitute(oos, [outOfStock, inStock])?.id).toBe("b");
  });

  it("prefers a spec-matching candidate over a non-matching one", () => {
    const wrongSpec = makeProduct("a", {
      dcQty: 100,
      specs: [{ name: "Amperage", value: "20A", isNonNeg: true }],
    });
    const rightSpec = makeProduct("b", {
      dcQty: 5,
      specs: [{ name: "Amperage", value: "15A", isNonNeg: true }],
    });
    expect(pickInStockSubstitute(oos, [wrongSpec, rightSpec])?.id).toBe("b");
  });

  it("breaks score ties by higher total stock", () => {
    const low = makeProduct("a", { dcQty: 2, specs: oos.specs });
    const high = makeProduct("b", { dcQty: 50, specs: oos.specs });
    expect(pickInStockSubstitute(oos, [low, high])?.id).toBe("b");
  });

  it("breaks full ties deterministically by id", () => {
    const a = makeProduct("a", { dcQty: 5, specs: oos.specs });
    const b = makeProduct("b", { dcQty: 5, specs: oos.specs });
    expect(pickInStockSubstitute(oos, [b, a])?.id).toBe("a");
    expect(pickInStockSubstitute(oos, [a, b])?.id).toBe("a");
  });
});
