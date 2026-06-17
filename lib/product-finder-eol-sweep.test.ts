import { describe, it, expect } from "vitest";
import { sweepForRisks, riskRationaleTemplate, type SweepDeps } from "@/lib/product-finder-eol-sweep";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(id: string): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 20, uom: "ea", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

const eol = prod("EOL1");
const single = prod("SINGLE1");
const fine = prod("FINE1");

const deps: SweepDeps = {
  lifecycleSeverityOf: (p) => (p.id === "EOL1" ? 3 : 0),
  lifecycleLabelOf: () => "End of life",
  isSingleSource: (p) => p.id === "SINGLE1",
  replacementFor: (p) => (p.id === "EOL1" ? "ALT-EOL1" : null),
};

describe("sweepForRisks", () => {
  it("flags EOL and single-source lines, sorted by severity, EOL first", () => {
    const findings = sweepForRisks(
      [
        { product: single, qty: 2, source: "Cart" },
        { product: eol, qty: 1, source: "Quote Q-1" },
        { product: fine, qty: 5, source: "Cart" },
      ],
      deps,
    );
    expect(findings).toHaveLength(2);
    expect(findings[0].product.id).toBe("EOL1"); // higher severity first
    expect(findings[0].riskKind).toBe("eol");
    expect(findings[0].suggestionSku).toBe("ALT-EOL1");
    expect(findings[1].riskKind).toBe("single-source");
  });

  it("dedupes the same product within the same source and emits no finding for healthy lines", () => {
    expect(sweepForRisks([{ product: fine, qty: 1, source: "Cart" }], deps)).toHaveLength(0);
    const dup = sweepForRisks(
      [
        { product: eol, qty: 1, source: "Quote Q-1" },
        { product: eol, qty: 9, source: "Quote Q-1" },
      ],
      deps,
    );
    expect(dup).toHaveLength(1);
  });

  it("templates a deterministic rationale with the suggested replacement", () => {
    const f = sweepForRisks([{ product: eol, qty: 1, source: "Quote Q-1" }], deps)[0];
    expect(riskRationaleTemplate(f)).toContain("ALT-EOL1");
  });
});
