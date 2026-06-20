import { describe, it, expect } from "vitest";
import { deriveCartShape, servicesForCart } from "@/lib/product-finder-services-attach";
import type { CatalogProduct } from "@/features/product-finder/types";

function p(id: string, subcategory: string, unitPrice: number, uom = "EA"): CatalogProduct {
  return {
    id, sku: id, name: id, brand: "Acme", category: "electrical", subcategory,
    description: "", unitPrice, uom, specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}
const line = (product: CatalogProduct, qty = 1) => ({ product, qty });

describe("deriveCartShape", () => {
  it("counts families, consumables, cut-to-length, gear, and value", () => {
    const shape = deriveCartShape([
      line(p("W1", "Wire & Cable", 2, "FT"), 500),
      line(p("F1", "Conduit Fittings", 1), 50),
      line(p("L1", "Lugs & Wire Connectors", 1), 20),
      line(p("B1", "Boxes & Covers", 3), 10),
      line(p("PB", "Panelboards", 1200), 1),
    ]);
    expect(shape.lineCount).toBe(5);
    expect(shape.familyCount).toBe(5);
    expect(shape.cutToLengthLines).toBe(1); // the FT wire
    expect(shape.consumableLines).toBe(3); // fittings + lugs + boxes
    expect(shape.hasDistributionGear).toBe(true); // panelboard
    expect(shape.totalValue).toBe(2 * 500 + 50 + 20 + 30 + 1200);
  });
});

describe("servicesForCart", () => {
  it("offers cut-to-length when a sold-by-foot line exists", () => {
    const offers = servicesForCart(deriveCartShape([line(p("W1", "Wire & Cable", 2, "FT"), 250)]));
    expect(offers.map((o) => o.id)).toContain("cut-to-length");
  });

  it("offers VMI for several consumable lines and labeling for distribution gear", () => {
    const offers = servicesForCart(
      deriveCartShape([
        line(p("F1", "Conduit Fittings", 1)),
        line(p("L1", "Lugs & Wire Connectors", 1)),
        line(p("G1", "Grounding & Bonding", 1)),
        line(p("CB", "Circuit Breakers", 40)),
      ]),
    );
    const ids = offers.map((o) => o.id);
    expect(ids).toContain("vmi");
    expect(ids).toContain("labeling");
  });

  it("offers kitting + staging only when the cart is big enough", () => {
    const big = servicesForCart(
      deriveCartShape([
        line(p("a", "Switches", 6000), 1), // pushes value over $10k
        line(p("b", "Receptacles & Outlets", 5), 1),
        line(p("c", "Wall Plates & Covers", 5), 1),
        line(p("d", "Boxes & Covers", 5), 1),
        line(p("e", "Wire & Cable", 5000, "FT"), 1),
        line(p("f", "Conduit", 5, "FT"), 1),
      ]),
    );
    const ids = big.map((o) => o.id);
    expect(ids).toContain("kitting"); // 6 lines, 6 families
    expect(ids).toContain("staging"); // > $10k
  });

  it("a tiny cart only gets the always-on delivery offer", () => {
    const offers = servicesForCart(deriveCartShape([line(p("x", "Switches", 3))]));
    expect(offers.map((o) => o.id)).toEqual(["logistics"]);
  });

  it("an empty cart yields no offers", () => {
    expect(servicesForCart(deriveCartShape([]))).toEqual([]);
  });
});
