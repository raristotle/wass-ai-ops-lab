import { describe, it, expect } from "vitest";
import { pickActiveSuccessor } from "@/lib/catalog/successor";
import type { CatalogProduct, LifecycleStatus } from "@/features/product-finder/types";

function prod(id: string, lifecycleStatus?: LifecycleStatus): CatalogProduct {
  return {
    id,
    sku: id,
    name: id,
    brand: "Acme",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 10,
    uom: "ea",
    specs: [{ name: "Amperage", value: "20A", isNonNeg: true }],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "x",
    lifecycleStatus,
  };
}

describe("pickActiveSuccessor", () => {
  it("returns null for an active product", () => {
    const p = prod("A", "Active");
    expect(pickActiveSuccessor(p, [prod("B", "Active")])).toBeNull();
  });

  it("returns the first active equivalent for an obsolescent product", () => {
    const eol = prod("OLD", "EOL");
    const equivalents = [prod("ALSO-EOL", "Discontinued"), prod("NEW", "Active"), prod("NEWER", "Active")];
    expect(pickActiveSuccessor(eol, equivalents)?.id).toBe("NEW");
  });

  it("treats an equivalent with no status as active", () => {
    const eol = prod("OLD", "EOL");
    expect(pickActiveSuccessor(eol, [prod("CURATED", undefined)])?.id).toBe("CURATED");
  });

  it("skips the product itself and returns null when no active successor exists", () => {
    const eol = prod("OLD", "EOL");
    expect(pickActiveSuccessor(eol, [prod("OLD", "EOL"), prod("X", "NRND")])).toBeNull();
  });
});
