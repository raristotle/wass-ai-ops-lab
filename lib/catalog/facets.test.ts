import { describe, it, expect } from "vitest";
import { computeFacets } from "@/lib/catalog/facets";
import type { CatalogProduct, EnumFacet, RangeFacet } from "@/features/product-finder/types";

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
      makeProduct("p1", [{ name: "Color", value: "Red" }]),
      makeProduct("p2", [{ name: "Color", value: "Blue" }]),
      makeProduct("p3", [{ name: "Color", value: "Red" }]),
    ];

    const facets = computeFacets(products);
    const color = facets.find((f) => f.name === "Color");
    expect(color).toBeDefined();
    expect(color!.type).toBe("enum");
    const colorEnum = color as EnumFacet;
    const red = colorEnum.values.find((v) => v.value === "Red");
    const blue = colorEnum.values.find((v) => v.value === "Blue");
    expect(red?.count).toBe(2);
    expect(blue?.count).toBe(1);
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
    expect(color!.type).toBe("enum");
    expect(size!.type).toBe("enum");
    const colorEnum = color as EnumFacet;
    const sizeEnum = size as EnumFacet;
    expect(colorEnum.values.find((v) => v.value === "Red")?.count).toBe(2);
    expect(colorEnum.values.find((v) => v.value === "Blue")?.count).toBe(1);
    expect(sizeEnum.values.find((v) => v.value === "Large")?.count).toBe(1);
    expect(sizeEnum.values.find((v) => v.value === "Small")?.count).toBe(1);
  });

  it("returns empty array for empty product list", () => {
    expect(computeFacets([])).toEqual([]);
  });
});

// ─── computeFacets – single-value exclusion ───────────────────────────────────

describe("computeFacets – single-value specs excluded", () => {
  it("excludes a spec that has only one distinct value across all products", () => {
    const products = [
      makeProduct("p1", [{ name: "Material", value: "Steel" }, { name: "Color", value: "Red" }]),
      makeProduct("p2", [{ name: "Material", value: "Steel" }, { name: "Color", value: "Blue" }]),
      makeProduct("p3", [{ name: "Material", value: "Steel" }]),
    ];

    const facets = computeFacets(products);
    // Material has only 1 distinct value "Steel" — must be excluded
    expect(facets.find((f) => f.name === "Material")).toBeUndefined();
    // Color has 2 distinct values — must be included
    expect(facets.find((f) => f.name === "Color")).toBeDefined();
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
    // Color appears in 3 products; Size appears in 2 products
    const products = [
      makeProduct("p1", [{ name: "Color", value: "Red" }, { name: "Size", value: "Large" }]),
      makeProduct("p2", [{ name: "Color", value: "Blue" }, { name: "Size", value: "Small" }]),
      makeProduct("p3", [{ name: "Color", value: "Red" }]), // only Color
    ];

    const facets = computeFacets(products);
    expect(facets[0].name).toBe("Color"); // 3 products
    expect(facets[1].name).toBe("Size");  // 2 products
  });

  it("within an enum facet, values ordered by count desc", () => {
    const products = [
      makeProduct("p1", [{ name: "Color", value: "Red" }]),
      makeProduct("p2", [{ name: "Color", value: "Red" }]),
      makeProduct("p3", [{ name: "Color", value: "Blue" }]),
    ];

    const facets = computeFacets(products);
    const color = facets.find((f) => f.name === "Color") as EnumFacet;
    expect(color.type).toBe("enum");
    expect(color.values[0].value).toBe("Red");  // count 2
    expect(color.values[1].value).toBe("Blue"); // count 1
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

  it("tiebreak by value alphabetical (values within an enum facet)", () => {
    const products = [
      makeProduct("p1", [{ name: "Phase", value: "Three-Phase" }]),
      makeProduct("p2", [{ name: "Phase", value: "Single-Phase" }]),
      makeProduct("p3", [{ name: "Phase", value: "Two-Phase" }]),
    ];

    const facets = computeFacets(products);
    const phase = facets.find((f) => f.name === "Phase") as EnumFacet;
    expect(phase.type).toBe("enum");
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

  it("respects maxValuesPerFacet cap for enum facets", () => {
    // A single non-numeric spec with 20 distinct values
    const products = Array.from({ length: 20 }, (_, i) =>
      makeProduct(`p${i}`, [{ name: "Rating", value: `Level${i}` }])
    );

    const facets = computeFacets(products, 8, 5);
    const rating = facets.find((f) => f.name === "Rating") as EnumFacet | undefined;
    expect(rating).toBeDefined();
    expect(rating!.type).toBe("enum");
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
      if (f.type === "enum") {
        expect(f.values.length).toBeLessThanOrEqual(12);
      }
    }
  });
});

// ─── computeFacets – deterministic ────────────────────────────────────────────

describe("computeFacets – deterministic", () => {
  it("returns the same result on repeated calls with the same input", () => {
    const products = [
      makeProduct("p1", [{ name: "Color", value: "Red" }, { name: "Size", value: "Large" }]),
      makeProduct("p2", [{ name: "Color", value: "Blue" }, { name: "Size", value: "Small" }]),
      makeProduct("p3", [{ name: "Color", value: "Red" }]),
    ];

    const r1 = computeFacets(products);
    const r2 = computeFacets(products);
    expect(r1).toEqual(r2);
  });
});

// ─── computeFacets – type discriminant ───────────────────────────────────────

describe("computeFacets – type discriminant", () => {
  it("all facets have a type field ('enum' or 'range')", () => {
    const products = [
      makeProduct("p1", [{ name: "Color", value: "Red" }, { name: "Amperage", value: "15A" }]),
      makeProduct("p2", [{ name: "Color", value: "Blue" }, { name: "Amperage", value: "20A" }]),
    ];
    const facets = computeFacets(products);
    for (const f of facets) {
      expect(["enum", "range"]).toContain(f.type);
    }
  });

  it("non-numeric spec name yields enum facet with type:'enum'", () => {
    const products = [
      makeProduct("p1", [{ name: "Color", value: "Red" }]),
      makeProduct("p2", [{ name: "Color", value: "Blue" }]),
    ];
    const facets = computeFacets(products);
    const color = facets.find((f) => f.name === "Color");
    expect(color).toBeDefined();
    expect(color!.type).toBe("enum");
  });
});

// ─── computeFacets – numeric (range) facets ───────────────────────────────────

describe("computeFacets – numeric range facets", () => {
  it("emits a range facet for Amperage with correct min/max", () => {
    const products = [
      makeProduct("p1", [{ name: "Amperage", value: "15A" }]),
      makeProduct("p2", [{ name: "Amperage", value: "20A" }]),
      makeProduct("p3", [{ name: "Amperage", value: "30A" }]),
    ];
    const facets = computeFacets(products);
    const amp = facets.find((f) => f.name === "Amperage");
    expect(amp).toBeDefined();
    expect(amp!.type).toBe("range");
    const rangeFacet = amp as RangeFacet;
    expect(rangeFacet.unit).toBe("A");
    expect(rangeFacet.min).toBe(15);
    expect(rangeFacet.max).toBe(30);
  });

  it("emits a range facet for Lumens with correct min/max", () => {
    const products = [
      makeProduct("p1", [{ name: "Lumens", value: "3300 lm" }]),
      makeProduct("p2", [{ name: "Lumens", value: "4400 lm" }]),
      makeProduct("p3", [{ name: "Lumens", value: "5300 lm" }]),
    ];
    const facets = computeFacets(products);
    const lum = facets.find((f) => f.name === "Lumens") as RangeFacet;
    expect(lum).toBeDefined();
    expect(lum.type).toBe("range");
    expect(lum.unit).toBe("lm");
    expect(lum.min).toBe(3300);
    expect(lum.max).toBe(5300);
  });

  it("emits a range facet for Height (U) with correct min/max", () => {
    const products = [
      makeProduct("p1", [{ name: "Height", value: "12U" }]),
      makeProduct("p2", [{ name: "Height", value: "24U" }]),
      makeProduct("p3", [{ name: "Height", value: "42U" }]),
    ];
    const facets = computeFacets(products);
    const height = facets.find((f) => f.name === "Height") as RangeFacet;
    expect(height).toBeDefined();
    expect(height.type).toBe("range");
    expect(height.unit).toBe("U");
    expect(height.min).toBe(12);
    expect(height.max).toBe(42);
  });

  it("emits a range facet for Ports", () => {
    const products = [
      makeProduct("p1", [{ name: "Ports", value: "24-Port" }]),
      makeProduct("p2", [{ name: "Ports", value: "48-Port" }]),
    ];
    const facets = computeFacets(products);
    const ports = facets.find((f) => f.name === "Ports") as RangeFacet;
    expect(ports).toBeDefined();
    expect(ports.type).toBe("range");
    expect(ports.unit).toBe("ports");
    expect(ports.min).toBe(24);
    expect(ports.max).toBe(48);
  });

  it("emits a range facet for kVA with decimal support", () => {
    const products = [
      makeProduct("p1", [{ name: "kVA", value: "15 kVA" }]),
      makeProduct("p2", [{ name: "kVA", value: "30 kVA" }]),
      makeProduct("p3", [{ name: "kVA", value: "112.5 kVA" }]),
    ];
    const facets = computeFacets(products);
    const kva = facets.find((f) => f.name === "kVA") as RangeFacet;
    expect(kva).toBeDefined();
    expect(kva.type).toBe("range");
    expect(kva.unit).toBe("kVA");
    expect(kva.min).toBe(15);
    expect(kva.max).toBe(112.5);
  });

  it("skips range facet when fewer than 2 distinct numeric values parse successfully", () => {
    // Only one distinct numeric — falls back to enum or is excluded
    const products = [
      makeProduct("p1", [{ name: "Amperage", value: "15A" }]),
      makeProduct("p2", [{ name: "Amperage", value: "15A" }]),
      makeProduct("p3", [{ name: "Amperage", value: "no-number" }]),
    ];
    const facets = computeFacets(products);
    const amp = facets.find((f) => f.name === "Amperage");
    // Either excluded (single distinct parseable value "15") or enum fallback
    // Spec says: skip range if <2 distinct numerics — so it's either enum or absent
    if (amp) {
      // If present it must be enum (fell through to enum path or excluded)
      // In this case values: "15A" (×2) and "no-number" (×1) → 2 distinct string values
      // so it becomes enum
      expect(amp.type).toBe("enum");
    }
  });

  it("range facet min equals max is excluded (only 1 distinct numeric across all products)", () => {
    // All products have exactly the same parseable value — only 1 distinct numeric
    const products = [
      makeProduct("p1", [{ name: "Amperage", value: "15A" }]),
      makeProduct("p2", [{ name: "Amperage", value: "15A" }]),
    ];
    const facets = computeFacets(products);
    const amp = facets.find((f) => f.name === "Amperage");
    // 1 distinct numeric → should NOT become a range facet (falls to enum, but only 1 enum value → excluded)
    expect(amp).toBeUndefined();
  });

  it("CCT values produce range facet", () => {
    const products = [
      makeProduct("p1", [{ name: "CCT", value: "3500K" }]),
      makeProduct("p2", [{ name: "CCT", value: "4000K" }]),
      makeProduct("p3", [{ name: "CCT", value: "5000K" }]),
    ];
    const facets = computeFacets(products);
    const cct = facets.find((f) => f.name === "CCT") as RangeFacet;
    expect(cct).toBeDefined();
    expect(cct.type).toBe("range");
    expect(cct.min).toBe(3500);
    expect(cct.max).toBe(5000);
  });

  it("range facet does not include 'values' property (no enum shape)", () => {
    const products = [
      makeProduct("p1", [{ name: "Amperage", value: "15A" }]),
      makeProduct("p2", [{ name: "Amperage", value: "20A" }]),
    ];
    const facets = computeFacets(products);
    const amp = facets.find((f) => f.name === "Amperage")!;
    expect(amp.type).toBe("range");
    expect("values" in amp).toBe(false);
  });

  it("enum facet does not include 'min', 'max', or 'unit' properties", () => {
    const products = [
      makeProduct("p1", [{ name: "Color", value: "Red" }]),
      makeProduct("p2", [{ name: "Color", value: "Blue" }]),
    ];
    const facets = computeFacets(products);
    const color = facets.find((f) => f.name === "Color")!;
    expect(color.type).toBe("enum");
    expect("min" in color).toBe(false);
    expect("max" in color).toBe(false);
    expect("unit" in color).toBe(false);
  });
});
