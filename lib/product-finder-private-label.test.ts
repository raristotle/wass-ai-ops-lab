import { describe, it, expect } from "vitest";
import {
  cartPenetration,
  preferredSwaps,
  penetrationAfterSwaps,
} from "@/lib/product-finder-private-label";
import type { CatalogProduct } from "@/features/product-finder/types";

function p(id: string, unitPrice: number, preferred: boolean, subcategory = "Circuit Breakers"): CatalogProduct {
  return {
    id, sku: id, name: id, brand: preferred ? "Meridian" : "Commodity", category: "electrical", subcategory,
    description: "", unitPrice, uom: "EA", specs: [], preferred,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}
const line = (product: CatalogProduct, qty = 1) => ({ product, qty });

describe("cartPenetration", () => {
  it("measures line and value penetration", () => {
    const stat = cartPenetration([
      line(p("A", 100, true), 1),
      line(p("B", 300, false), 1),
    ]);
    expect(stat.preferredLines).toBe(1);
    expect(stat.totalLines).toBe(2);
    expect(stat.linePenetrationPct).toBe(50);
    expect(stat.valuePenetrationPct).toBe(25); // 100 / 400
  });

  it("handles an empty cart", () => {
    const stat = cartPenetration([]);
    expect(stat.linePenetrationPct).toBe(0);
    expect(stat.valuePenetrationPct).toBe(0);
  });
});

describe("preferredSwaps", () => {
  // Preferred equivalent priced AT or BELOW the commodity, with higher margin.
  const pref = p("PREF", 95, true);
  const commodity = p("COM", 100, false);
  const lookup = (x: CatalogProduct) => (x.id === "COM" ? pref : null);

  it("proposes a swap that doesn't cost the customer more and lifts margin", () => {
    const swaps = preferredSwaps([line(commodity, 10)], lookup);
    expect(swaps).toHaveLength(1);
    expect(swaps[0].to.id).toBe("PREF");
    expect(swaps[0].unitPriceDelta).toBe(-5); // cheaper for the customer
    expect(swaps[0].lineMarginGain).toBeGreaterThan(0);
  });

  it("skips a swap that would raise the customer's price beyond tolerance", () => {
    const pricier = p("PREF2", 130, true);
    const swaps = preferredSwaps([line(commodity, 1)], (x) => (x.id === "COM" ? pricier : null));
    expect(swaps).toEqual([]);
  });

  it("never swaps an already-preferred line and ignores a null equivalent", () => {
    expect(preferredSwaps([line(p("X", 50, true), 1)], () => pref)).toEqual([]);
    expect(preferredSwaps([line(commodity, 1)], () => null)).toEqual([]);
  });

  it("dedupes by target when several commodity lines cross to the same preferred SKU", () => {
    const comA = p("COM-A", 100, false);
    const comB = p("COM-B", 120, false);
    // Both commodity lines cross to the SAME preferred equivalent.
    const swaps = preferredSwaps(
      [line(comA, 1), line(comB, 1)],
      () => pref, // PREF for both
    );
    expect(swaps).toHaveLength(1); // not two rows pointing at the same target
    expect(swaps[0].to.id).toBe("PREF");
  });
});

describe("penetrationAfterSwaps", () => {
  it("reflects the lift if every swap is taken", () => {
    const pref = p("PREF", 95, true);
    const commodity = p("COM", 100, false);
    const lines = [line(commodity, 1)];
    const swaps = preferredSwaps(lines, (x) => (x.id === "COM" ? pref : null));
    const before = cartPenetration(lines);
    const after = penetrationAfterSwaps(lines, swaps);
    expect(before.linePenetrationPct).toBe(0);
    expect(after.linePenetrationPct).toBe(100);
  });
});
