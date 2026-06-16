import { describe, it, expect } from "vitest";
import {
  parseQuickOrderLines,
  resolveQuickOrder,
  exactSkuResolver,
  QUICK_ORDER_CAP,
} from "@/lib/product-finder-quick-order";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(sku: string): CatalogProduct {
  return {
    id: sku, sku, name: `Product ${sku}`, brand: "Acme", category: "electrical",
    subcategory: "Circuit Breakers", description: "", unitPrice: 20, uom: "ea", specs: [],
    preferred: false, branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

describe("parseQuickOrderLines", () => {
  it("parses sku + qty across space / comma / tab / x separators", () => {
    const out = parseQuickOrderLines("QO115 10\nCAT6,4\nEKL\tx\t3\nREL-5 x 2");
    expect(out).toEqual([
      { raw: "QO115 10", sku: "QO115", qty: 10 },
      { raw: "CAT6,4", sku: "CAT6", qty: 4 },
      { raw: "EKL\tx\t3", sku: "EKL", qty: 3 },
      { raw: "REL-5 x 2", sku: "REL-5", qty: 2 },
    ]);
  });

  it("defaults qty to 1 and never mis-reads a SKU's own trailing digits as a quantity", () => {
    const out = parseQuickOrderLines("BX10\nQO115");
    expect(out).toEqual([
      { raw: "BX10", sku: "BX10", qty: 1 },
      { raw: "QO115", sku: "QO115", qty: 1 },
    ]);
  });

  it("skips blank lines and caps at QUICK_ORDER_CAP", () => {
    expect(parseQuickOrderLines("\n  \nQO1\n\n")).toEqual([{ raw: "QO1", sku: "QO1", qty: 1 }]);
    const many = Array.from({ length: QUICK_ORDER_CAP + 50 }, (_, i) => `SKU${i} 2`).join("\n");
    expect(parseQuickOrderLines(many).length).toBe(QUICK_ORDER_CAP);
  });

  it("clamps an absurd quantity to the order ceiling", () => {
    expect(parseQuickOrderLines("QO1 999999999")[0].qty).toBe(100_000);
  });
});

describe("exactSkuResolver + resolveQuickOrder", () => {
  const catalog = [prod("QO115"), prod("CAT6-PL")];
  const resolve = exactSkuResolver(catalog);

  it("resolves case-insensitively and flags unmatched SKUs as null", () => {
    const lines = resolveQuickOrder(
      [
        { raw: "qo115 5", sku: "qo115", qty: 5 },
        { raw: "NOPE", sku: "NOPE", qty: 1 },
      ],
      resolve,
    );
    expect(lines[0].product?.sku).toBe("QO115");
    expect(lines[0].qty).toBe(5);
    expect(lines[1].product).toBeNull();
  });
});
