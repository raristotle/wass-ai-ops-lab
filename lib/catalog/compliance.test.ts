import { describe, it, expect } from "vitest";
import { complianceForProduct, complianceFlags, rollupCompliance } from "@/lib/catalog/compliance";
import { getCatalog } from "@/lib/catalog/index";
import { isActiveLifecycle } from "@/lib/catalog/lifecycle";
import type { ProductCategory } from "@/features/product-finder/types";

// Synthetic (no dataSource) — derives. Asserts non-null for the derive path.
function derive(id: string, category: ProductCategory = "electrical") {
  const c = complianceForProduct({ id, category });
  expect(c).not.toBeNull();
  return c!;
}

describe("complianceForProduct — real-parts carve-out", () => {
  it("returns null for verified and curated real parts (never fabricates claims)", () => {
    expect(complianceForProduct({ id: "REAL-BUSS-FRN-R-30", category: "electrical", dataSource: "verified" })).toBeNull();
    expect(complianceForProduct({ id: "CB-SQD-QO115", category: "electrical", dataSource: "curated" })).toBeNull();
  });

  it("derives for synthetic/simulated products", () => {
    expect(complianceForProduct({ id: "GEN-CB001", category: "electrical", dataSource: "simulated" })).not.toBeNull();
    expect(complianceForProduct({ id: "GEN-CB001", category: "electrical" })).not.toBeNull();
  });
});

describe("complianceForProduct (synthetic derivation)", () => {
  it("is deterministic for the same id", () => {
    expect(derive("GEN-A")).toEqual(derive("GEN-A"));
  });

  it("ties Section 301 exposure to a China country-of-origin", () => {
    let cn = 0, nonCn = 0;
    for (let i = 0; i < 500 && (cn === 0 || nonCn === 0); i++) {
      const c = derive(`GEN-S${i}`);
      if (c.countryOfOrigin === "CN") { expect(c.section301).toBe(true); cn++; }
      else { expect(c.section301).toBe(false); nonCn++; }
    }
    expect(cn).toBeGreaterThan(0);
    expect(nonCn).toBeGreaterThan(0);
  });

  it("emits a valid 10-digit HTS code", () => {
    expect(derive("GEN-A").htsCode).toMatch(/^\d{10}$/);
  });

  it("keeps most products UL-listed and RoHS-compliant (realistic majority)", () => {
    let ul = 0, rohs = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      const c = derive(`GEN-U${i}`);
      if (c.ulListed) ul++;
      if (c.rohs === "compliant") rohs++;
    }
    expect(ul / N).toBeGreaterThan(0.85);
    expect(rohs / N).toBeGreaterThan(0.8);
  });
});

describe("complianceFlags", () => {
  it("flags a non-UL, tariff-exposed, Prop-65 part", () => {
    const flags = complianceFlags({
      ulListed: false, rohs: "compliant", reachSvhc: false, prop65: true,
      countryOfOrigin: "CN", htsCode: "8536100012", section301: true,
    });
    expect(flags).toContain("Not UL listed");
    expect(flags).toContain("Prop 65");
    expect(flags).toContain("Section 301 tariff");
  });

  it("returns no flags for a clean part", () => {
    expect(complianceFlags({
      ulListed: true, rohs: "compliant", reachSvhc: false, prop65: false,
      countryOfOrigin: "US", htsCode: "8536100099", section301: false,
    })).toEqual([]);
  });
});

describe("rollupCompliance", () => {
  it("counts UL gaps, tariff exposure, and flagged lines", () => {
    const items = [
      derive("GEN-A"),
      { ulListed: false, rohs: "compliant" as const, reachSvhc: false, prop65: false, countryOfOrigin: "CN", htsCode: "8536100012", section301: true },
    ];
    const r = rollupCompliance(items);
    expect(r.lines).toBe(2);
    expect(r.notUlListed).toBeGreaterThanOrEqual(1);
    expect(r.tariffExposed).toBeGreaterThanOrEqual(1);
    expect(r.flagged).toBeGreaterThanOrEqual(1);
  });
});

describe("catalog-wide compliance", () => {
  it("real parts get null compliance; synthetic parts get valid derived data", () => {
    const { products } = getCatalog();
    const step = Math.max(1, Math.floor(products.length / 1500));
    let checkedReal = 0;
    for (let i = 0; i < products.length; i += step) {
      const p = products[i];
      const c = complianceForProduct(p);
      if (p.dataSource === "verified" || p.dataSource === "curated") {
        expect(c).toBeNull(); // never fabricate compliance on real parts
        // ...and real parts also stay Active lifecycle (consistency with the carve-out)
        expect(isActiveLifecycle(p.lifecycleStatus)).toBe(true);
        checkedReal++;
      } else {
        expect(c).not.toBeNull();
        expect(c!.htsCode).toMatch(/^\d{10}$/);
        expect(c!.countryOfOrigin.length).toBe(2);
      }
    }
    expect(checkedReal).toBeGreaterThan(0);
  });
});
