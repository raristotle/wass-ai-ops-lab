import { describe, it, expect } from "vitest";
import { computeFacets } from "@/lib/catalog/facets";
import type { CatalogProduct } from "@/features/product-finder/types";

// ─── Minimal fixture builder ──────────────────────────────────────────────────

function makeProduct(id: string, specs: { name: string; value: string }[]): CatalogProduct {
  return {
    id,
    sku: id,
    name: `Product ${id}`,
    brand: "TestBrand",
    category: "electrical",
    subcategory: "sub",
    description: "",
    unitPrice: 10,
    uom: "EA",
    specs,
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "⚡",
  };
}

// ─── computeFacets – count correctness ───────────────────────────────────────

describe("computeFacets – count correctness", () => {
  it("counts spec values across products correctly", () => {
    const products = [
      makeProduct("p1", [{ name: "Voltage", value: "120V" }]),
      makeProduct("p2", [{ name: "Voltage", value: "240V" }]),
      makeProduct("p3", [{ name: "Voltage", value: "120V" }]),
    ];

    const facets = computeFacets(products);
    const voltage = facets.find((f) => f.name === "Voltage");
    expect(voltage).toBeDefined();
    const v120 = voltage!.values.find((v) => v.value === "120V");
    const v240 = voltage!.values.find((v) => v.value === "240V");
    expect(v120?.count).toBe(2);
    expect(v240?.count).toBe(1);
  });

  it("aggregates multiple spec names independently", () => {
    const products = [
      makeProduct("p1", [{ name: "Color", value: "Red" }, { name: "Size", value: "Large" }]),
      makeProduct("p2", [{ name: "Color", value: "Blue" }, { name: "Size", value: "Small" }]),
      makeProduct("p3", [{ name: "Color", value: "Red" }]),
    ];

    const facets = computeFacets(products);
    const color = facets.find((f) => f.name === "Color");
    const size = facets.find((f) => f.name === "Size");

    expect(color).toBeDefined();
    expect(size).toBeDefined();
    expect(color!.values.find((v) => v.value === "Red")?.count).toBe(2);
    expect(color!.values.find((v) => v.value === "Blue")?.count).toBe(1);
    expect(size!.values.find((v) => v.value === "Large")?.count).toBe(1);
    expect(size!.values.find((v) => v.value === "Small")?.count).toBe(1);
  });

  it("returns empty array for empty product list", () => {
    expect(computeFacets([])).toEqual([]);
  });
});

// ─── computeFacets – single-value exclusion ───────────────────────────────────

describe("computeFacets – single-value specs excluded", () => {
  it("excludes a spec that has only one distinct value across all products", () => {
    const products = [
      makeProduct("p1", [{ name: "Material", value: "Steel" }, { name: "Voltage", value: "120V" }]),
      makeProduct("p2", [{ name: "Material", value: "Steel" }, { name: "Voltage", value: "240V" }]),
      makeProduct("p3", [{ name: "Material", value: "Steel" }]),
    ];

    const facets = computeFacets(products);
    // Material has only 1 distinct value "Steel" — must be excluded
    expect(facets.find((f) => f.name === "Material")).toBeUndefined();
    // Voltage has 2 distinct values — must be included
    expect(facets.find((f) => f.name === "Voltage")).toBeDefined();
  });

  it("excludes ALL specs when each has only one distinct value", () => {
    const products = [
      makeProduct("p1", [{ name: "A", value: "X" }]),
      makeProduct("p2", [{ name: "A", value: "X" }]),
    ];
    expect(computeFacets(products)).toEqual([]);
  });
});

// ─── computeFacets – ordering ─────────────────────────────────────────────────

describe("computeFacets – ordering", () => {
  it("facets ordered by total coverage (most products having the spec) desc", () => {
    // Voltage appears in 3 products; Color appears in 2 products
    const products = [
      makeProduct("p1", [{ name: "Voltage", value: "120V" }, { name: "Color", value: "Red" }]),
      makeProduct("p2", [{ name: "Voltage", value: "240V" }, { name: "Color", value: "Blue" }]),
      makeProduct("p3", [{ name: "Voltage", value: "120V" }]), // only Voltage
    ];

    const facets = computeFacets(products);
    expect(facets[0].name).toBe("Voltage"); // 3 products
    expect(facets[1].name).toBe("Color");   // 2 products
  });

  it("within a facet, values ordered by count desc", () => {
    const products = [
      makeProduct("p1", [{ name: "Voltage", value: "120V" }]),
      makeProduct("p2", [{ name: "Voltage", value: "120V" }]),
      makeProduct("p3", [{ name: "Voltage", value: "240V" }]),
    ];

    const facets = computeFacets(products);
    const voltage = facets.find((f) => f.name === "Voltage")!;
    expect(voltage.values[0].value).toBe("120V"); // count 2
    expect(voltage.values[1].value).toBe("240V"); // count 1
  });

  it("tiebreak by name alphabetical (facets)", () => {
    // Both specs appear in exactly 2 products each
    const products = [
      makeProduct("p1", [{ name: "Zebra", value: "A" }, { name: "Apple", value: "B" }]),
      makeProduct("p2", [{ name: "Zebra", value: "C" }, { name: "Apple", value: "D" }]),
    ];

    const facets = computeFacets(products);
    expect(facets[0].name).toBe("Apple");
    expect(facets[1].name).toBe("Zebra");
  });

  it("tiebreak by value alphabetical (values within a facet)", () => {
    const products = [
      makeProduct("p1", [{ name: "Phase", value: "Three-Phase" }]),
      makeProduct("p2", [{ name: "Phase", value: "Single-Phase" }]),
      makeProduct("p3", [{ name: "Phase", value: "Two-Phase" }]),
    ];

    const facets = computeFacets(products);
    const phase = facets.find((f) => f.name === "Phase")!;
    // All values have count 1 — alphabetical tiebreak
    expect(phase.values.map((v) => v.value)).toEqual(["Single-Phase", "Three-Phase", "Two-Phase"]);
  });
});

// ─── computeFacets – caps ──────────────────────────────────────────────────────

describe("computeFacets – caps", () => {
  it("respects maxFacets cap", () => {
    // Create 10 distinct spec names, each with 2 distinct values
    const products = Array.from({ length: 20 }, (_, i) =>
      makeProduct(`p${i}`, [{ name: `Spec${Math.floor(i / 2)}`, value: i % 2 === 0 ? "X" : "Y" }])
    );

    const facets = computeFacets(products, 5);
    expect(facets.length).toBeLessThanOrEqual(5);
  });

  it("respects maxValuesPerFacet cap", () => {
    // A single spec with 20 distinct values
    const products = Array.from({ length: 20 }, (_, i) =>
      makeProduct(`p${i}`, [{ name: "Rating", value: `${i}A` }])
    );

    const facets = computeFacets(products, 8, 5);
    const rating = facets.find((f) => f.name === "Rating");
    expect(rating).toBeDefined();
    expect(rating!.values.length).toBeLessThanOrEqual(5);
  });

  it("default caps: maxFacets=8, maxValuesPerFacet=12", () => {
    // 12 distinct spec names, each with 13 distinct values (1 product per value)
    const specs = Array.from({ length: 12 }, (_, si) =>
      Array.from({ length: 13 }, (_, vi) => ({ name: `Spec${si}`, value: `V${vi}` }))
    );
    const products = specs.flatMap((specGroup) =>
      specGroup.map((spec, vi) => makeProduct(`p${spec.name}v${vi}`, [spec]))
    );

    const facets = computeFacets(products);
    expect(facets.length).toBeLessThanOrEqual(8);
    for (const f of facets) {
      expect(f.values.length).toBeLessThanOrEqual(12);
    }
  });
});

// ─── computeFacets – deterministic ────────────────────────────────────────────

describe("computeFacets – deterministic", () => {
  it("returns the same result on repeated calls with the same input", () => {
    const products = [
      makeProduct("p1", [{ name: "Voltage", value: "120V" }, { name: "Color", value: "Red" }]),
      makeProduct("p2", [{ name: "Voltage", value: "240V" }, { name: "Color", value: "Blue" }]),
      makeProduct("p3", [{ name: "Voltage", value: "120V" }]),
    ];

    const r1 = computeFacets(products);
    const r2 = computeFacets(products);
    expect(r1).toEqual(r2);
  });
});
