import { describe, it, expect } from "vitest";
import {
  COMPANION_RULES,
  companionRulesFor,
  requiredCompanionSubcategories,
  specValue,
} from "@/lib/catalog/companion-rules";
import { getCatalog } from "@/lib/catalog/index";
import type { CatalogProduct } from "@/features/product-finder/types";

function firstIn(subcategory: string): CatalogProduct {
  const p = getCatalog().products.find((x) => x.subcategory === subcategory);
  if (!p) throw new Error(`no catalog product in ${subcategory}`);
  return p;
}

describe("COMPANION_RULES dataset", () => {
  it("is non-empty and well-formed", () => {
    expect(COMPANION_RULES.length).toBeGreaterThan(40);
    for (const r of COMPANION_RULES) {
      expect(r.from.length).toBeGreaterThan(0);
      expect(r.to.length).toBeGreaterThan(0);
      expect(["required", "recommended"]).toContain(r.relation);
      expect(r.why.length).toBeGreaterThan(0);
      expect(r.from).not.toBe(r.to);
    }
  });

  it("marks genuinely-required edges (a switch/receptacle needs a wall plate)", () => {
    const reqSwitch = COMPANION_RULES.find((r) => r.from === "Switches" && r.to === "Wall Plates & Covers");
    expect(reqSwitch?.relation).toBe("required");
    const conduit = COMPANION_RULES.find((r) => r.from === "Conduit" && r.to === "Conduit Fittings");
    expect(conduit?.relation).toBe("required");
  });
});

describe("companionRulesFor", () => {
  it("returns rules whose source subcategory matches the product", () => {
    const sw = firstIn("Switches");
    const rules = companionRulesFor(sw);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.every((r) => r.from === "Switches")).toBe(true);
    expect(requiredCompanionSubcategories(sw)).toContain("Wall Plates & Covers");
  });

  it("returns [] for a subcategory with no rules", () => {
    const fake = { subcategory: "ZZZ Nonexistent" } as CatalogProduct;
    expect(companionRulesFor(fake)).toEqual([]);
    expect(requiredCompanionSubcategories(fake)).toEqual([]);
  });
});

describe("specValue", () => {
  it("reads a spec value case-insensitively, or null", () => {
    const p = { specs: [{ name: "Gang", value: "2-Gang" }] } as CatalogProduct;
    expect(specValue(p, "gang")).toBe("2-Gang");
    expect(specValue(p, "Color")).toBeNull();
    expect(specValue({ specs: [] } as unknown as CatalogProduct, "Gang")).toBeNull();
  });
});
