import { describe, it, expect } from "vitest";
import {
  substancesForProduct,
  complianceListsForProduct,
  htsChapterInfo,
  SUBSTANCES,
  HTS_CHAPTERS,
} from "@/lib/catalog/compliance-substances";
import type { CatalogProduct } from "@/features/product-finder/types";

function product(name: string, specs: { name: string; value: string }[] = [], description = ""): CatalogProduct {
  return {
    id: "p1", sku: "SKU1", name, brand: "Southwire", category: "electrical",
    subcategory: "Wire & Cable", description, unitPrice: 10, uom: "ft",
    specs, preferred: false, branchStock: [], dcStock: [], externalSources: [], imageIcon: "🔌",
  } as unknown as CatalogProduct;
}

describe("substance dataset", () => {
  it("has real substances with CAS + valid lists", () => {
    expect(SUBSTANCES.length).toBeGreaterThan(0);
    for (const s of SUBSTANCES) {
      expect(s.cas, s.name).toMatch(/^\d{2,7}-\d{2}-\d$/);
      for (const l of s.lists) expect(["REACH-SVHC", "RoHS", "Prop65"]).toContain(l);
    }
  });
  it("has the key electrical HTS chapters", () => {
    const chapters = HTS_CHAPTERS.map((h) => h.chapter);
    expect(chapters).toContain("85");
  });
});

describe("substancesForProduct (spec-driven, CAS-anchored)", () => {
  it("flags PVC cable for phthalates + lead", () => {
    const subs = substancesForProduct(product("12/2 NM-B cable", [{ name: "Insulation", value: "PVC" }]));
    const cas = subs.map((s) => s.cas);
    expect(cas).toContain("117-81-7"); // DEHP
    expect(cas).toContain("7439-92-1"); // Lead (PVC stabilizer)
    const lists = complianceListsForProduct(product("PVC cable", [{ name: "Insulation", value: "PVC" }]));
    expect(lists).toContain("REACH-SVHC");
    expect(lists).toContain("Prop65");
  });

  it("flags brass connectors for lead", () => {
    const subs = substancesForProduct(product("Brass compression lug", [{ name: "Material", value: "Brass" }]));
    expect(subs.map((s) => s.cas)).toContain("7439-92-1");
  });

  it("returns nothing for a product with no triggering materials", () => {
    expect(substancesForProduct(product("Aluminum bracket", [{ name: "Material", value: "Aluminum" }]))).toEqual([]);
    expect(complianceListsForProduct(product("Steel strut", [{ name: "Material", value: "Steel" }]))).toEqual([]);
  });

  it("does NOT flag substances a product advertises it is free of (negation)", () => {
    // A material named "<substance>-free" must not flag that substance.
    expect(substancesForProduct(product("Mercury-free LED lamp"))).toEqual([]);
    expect(substancesForProduct(product("100% PVC-free jacket cable"))).toEqual([]);
    expect(substancesForProduct(product("Phthalate-free flexible cord"))).toEqual([]);
    expect(substancesForProduct(product("Cadmium-free plating bracket"))).toEqual([]);
    // Implication keyword still present ("solder") but lead is explicitly negated.
    expect(substancesForProduct(product("Lead-free solder wire")).map((s) => s.cas)).not.toContain("7439-92-1");
    expect(substancesForProduct(product("RoHS lead-free brass-free terminal"))).toEqual([]);
  });

  it("still flags real positives even when an unrelated 'free' claim is present", () => {
    // PVC-free does not negate lead from brass — the brass lead must remain.
    const subs = substancesForProduct(product("PVC-free brass lug", [{ name: "Material", value: "Brass" }]));
    expect(subs.map((s) => s.cas)).toContain("7439-92-1");
  });
});

describe("htsChapterInfo", () => {
  it("resolves an HTS code to its chapter detail", () => {
    const info = htsChapterInfo("8536411000");
    expect(info).not.toBeNull();
    expect(info!.chapter).toBe("85");
    expect(info!.section301Note.length).toBeGreaterThan(0);
  });
  it("returns null for an uncovered chapter", () => {
    expect(htsChapterInfo("0101000000")).toBeNull();
  });
});
