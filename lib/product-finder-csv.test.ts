import { describe, it, expect } from "vitest";
import { csvField, toCsv, searchResultsCsv, basketCsv } from "@/lib/product-finder-csv";
import type { CatalogProduct } from "@/features/product-finder/types";

function makeProduct(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "p1",
    sku: "CB-TST-001",
    name: "Test Breaker 15A",
    brand: "TestBrand",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "test",
    unitPrice: 8.5,
    uom: "EA",
    specs: [],
    preferred: true,
    branchStock: [{ branchId: "B1", branchName: "Branch 1", city: "Houston", state: "TX", quantity: 12 }],
    dcStock: [{ dcId: "DC1", dcName: "DC 1", location: "Dallas", quantity: 88 }],
    externalSources: [],
    imageIcon: "⚡",
    ...overrides,
  };
}

describe("csvField", () => {
  it("passes plain values through", () => {
    expect(csvField("hello")).toBe("hello");
    expect(csvField(42)).toBe("42");
  });

  it("quotes values containing commas", () => {
    expect(csvField("a,b")).toBe('"a,b"');
  });

  it("doubles embedded quotes", () => {
    expect(csvField('15" conduit')).toBe('"15"" conduit"');
  });

  it("quotes values containing newlines", () => {
    expect(csvField("a\nb")).toBe('"a\nb"');
  });

  it("guards formula injection with a leading apostrophe", () => {
    expect(csvField("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvField("+1")).toBe("'+1");
    expect(csvField("@cmd")).toBe("'@cmd");
  });
});

describe("toCsv", () => {
  it("joins rows with CRLF and ends with a trailing newline", () => {
    expect(toCsv([["a", "b"], ["c", "d"]])).toBe("a,b\r\nc,d\r\n");
  });
});

describe("searchResultsCsv", () => {
  it("emits a header plus one row per product with stock totals", () => {
    const csv = searchResultsCsv([makeProduct()]);
    const lines = csv.trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("SKU,Name,Brand");
    expect(lines[1]).toBe(
      "CB-TST-001,Test Breaker 15A,TestBrand,electrical,Circuit Breakers,8.50,EA,12,88,Yes",
    );
  });

  it("escapes product names containing commas", () => {
    const csv = searchResultsCsv([makeProduct({ name: "Lugs, Copper" })]);
    expect(csv).toContain('"Lugs, Copper"');
  });
});

describe("basketCsv", () => {
  it("emits header, line rows with effective pricing, and a total row", () => {
    const csv = basketCsv([
      { product: makeProduct(), qty: 10, effectiveUnitPrice: 6.95 },
      { product: makeProduct({ sku: "CB-TST-002", id: "p2" }), qty: 2, effectiveUnitPrice: 8.5 },
    ]);
    const lines = csv.trim().split("\r\n");
    expect(lines).toHaveLength(4);
    expect(lines[1]).toBe("CB-TST-001,Test Breaker 15A,TestBrand,10,EA,8.50,6.95,69.50");
    expect(lines[3]).toContain("Total,86.50");
  });

  it("handles an empty basket with just header and zero total", () => {
    const lines = basketCsv([]).trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("Total,0.00");
  });
});
