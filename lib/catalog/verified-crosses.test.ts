import { describe, it, expect } from "vitest";
import {
  verifiedCrossesFor,
  validateCrossEntries,
  valuesCompatible,
  SOURCE_CONFIDENCE,
  type VerifiedCrossEntry,
} from "@/lib/catalog/verified-crosses";
import { VERIFIED_CROSS_ENTRIES } from "@/data/real/verified-crosses";
import { brandHierarchyFor, validateHierarchy, brandCoverage } from "@/lib/catalog/brand-hierarchy";
import { BRAND_HIERARCHY_ENTRIES } from "@/data/real/brand-hierarchy";
import type { CatalogProduct, ProductSpec } from "@/features/product-finder/types";

function product(sku: string, brand: string, specs: ProductSpec[]): CatalogProduct {
  return {
    id: `T-${sku}`,
    sku,
    name: `${brand} ${sku}`,
    brand,
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 10,
    uom: "EA",
    specs,
    preferred: true,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "⚡",
  };
}

const qo120 = product("QO120", "Square D", [
  { name: "Amperage", value: "20A", isNonNeg: true },
  { name: "Poles", value: "1-Pole", isNonNeg: true },
  { name: "Voltage", value: "120/240V", isNonNeg: true },
  { name: "Interrupt Rating", value: "10kA" },
]);
const thql1120 = product("THQL1120", "GE (ABB)", [
  { name: "Amperage", value: "20A", isNonNeg: true },
  { name: "Poles", value: "1-Pole", isNonNeg: true },
  { name: "Voltage", value: "120/240V", isNonNeg: true },
]);
const wrongAmp = product("BR130", "Eaton", [
  { name: "Amperage", value: "30A", isNonNeg: true },
  { name: "Poles", value: "1-Pole", isNonNeg: true },
]);

const cross = (over: Partial<VerifiedCrossEntry>): VerifiedCrossEntry => ({
  aBrand: "Square D",
  aMpn: "QO120",
  bBrand: "GE (ABB)",
  bMpn: "THQL1120",
  relation: "functional-substitute",
  sourceKind: "manufacturer-cross",
  sourceUrl: "https://example.com/cross.pdf",
  verifiedAt: "2026-06-11",
  ...over,
});

describe("verifiedCrossesFor — explainable, source-backed results", () => {
  const catalog = new Map([
    ["GE (ABB)|THQL1120", thql1120],
    ["Eaton|BR130", wrongAmp],
  ]);
  const resolve = (brand: string, mpn: string) => catalog.get(`${brand}|${mpn}`) ?? null;

  it("returns the full explainable shape for a matching pair", () => {
    const [r] = verifiedCrossesFor(qo120, [cross({})], resolve);
    expect(r.originalSku).toBe("QO120");
    expect(r.substituteSku).toBe("THQL1120");
    expect(r.substituteProduct).toBe(thql1120);
    expect(r.matchReason).toContain("manufacturer cross-reference");
    expect(r.matchingAttributes).toEqual(["Amperage", "Poles", "Voltage"]);
    expect(r.missingAttributes).toEqual([]); // Interrupt Rating is negotiable
    expect(r.conflictingAttributes).toEqual([]);
    expect(r.sourceUrl).toContain("https://");
    expect(r.confidence).toBe(SOURCE_CONFIDENCE["manufacturer-cross"]);
    expect(r.productionReady).toBe(true);
  });

  it("matches from either side of the pair (bMpn → aMpn)", () => {
    const [r] = verifiedCrossesFor(thql1120, [cross({})], () => qo120 as CatalogProduct | null);
    expect(r.substituteSku).toBe("QO120");
  });

  it("genuine non-negotiable conflicts cut confidence and add warnings", () => {
    const e = cross({ bBrand: "Eaton", bMpn: "BR130" });
    const [r] = verifiedCrossesFor(qo120, [e], resolve, { includeReview: true });
    expect(r.conflictingAttributes).toContainEqual({ name: "Amperage", original: "20A", substitute: "30A" });
    // one hard conflict (Amperage, non-negotiable) → −4
    expect(r.confidence).toBe(SOURCE_CONFIDENCE["manufacturer-cross"] - 4);
    expect(r.warnings.join(" ")).toContain("Attribute differences");
    expect(r.missingAttributes).toContain("Voltage");
    expect(r.productionReady).toBe(false);
  });

  it("domain-aware compatibility: token supersets and numeric-range containment are NOT conflicts", () => {
    expect(valuesCompatible("9A AC-3", "9A AC-3 / 25A AC-1")).toBe(true);
    expect(valuesCompatible("1 NO", "1 NO + 1 NC")).toBe(true);
    expect(valuesCompatible("120VAC 50/60Hz", "100-250V AC/DC")).toBe(true); // 120 within 100–250
    expect(valuesCompatible("20A", "30A")).toBe(false);
    expect(valuesCompatible("277VAC", "100-250V AC/DC")).toBe(false); // outside the range
  });

  it("source qualifiers from the entry's notes surface as warnings", () => {
    const e = cross({ notes: "UL Classified for listed panels only" });
    const [r] = verifiedCrossesFor(qo120, [e], resolve);
    expect(r.warnings.join(" ")).toContain("UL Classified for listed panels only");
    expect(r.productionReady).toBe(true); // notes warn, they don't disqualify
  });

  it("suppresses below-threshold results from the production path (no includeReview)", () => {
    const weak = cross({ sourceKind: "industry-table" }); // 86 < 95
    expect(verifiedCrossesFor(qo120, [weak], resolve)).toEqual([]);
    expect(verifiedCrossesFor(qo120, [weak], resolve, { includeReview: true })).toHaveLength(1);
  });

  it("flags substitutes not stocked in the catalog", () => {
    const [r] = verifiedCrossesFor(qo120, [cross({})], () => null);
    expect(r.substituteProduct).toBeNull();
    expect(r.warnings.join(" ")).toContain("not in the stocked catalog");
  });

  it("ignores unrelated products and sorts by confidence", () => {
    const other = product("LC1D09G7", "Schneider Electric", []);
    expect(verifiedCrossesFor(other, [cross({})], resolve)).toEqual([]);
    const both = [cross({}), cross({ aMpn: "QO 120", bBrand: "X", bMpn: "Y1", sourceKind: "datasheet" })];
    const results = verifiedCrossesFor(qo120, both, resolve, { includeReview: true });
    expect(results.map((r) => r.confidence)).toEqual([...results.map((r) => r.confidence)].sort((a, b) => b - a));
  });
});

describe("validateCrossEntries", () => {
  it("accepts clean entries and flags structural problems", () => {
    expect(validateCrossEntries([cross({})])).toEqual([]);
    const bad = [
      cross({ sourceUrl: "http://insecure.com" }),
      cross({ aMpn: "QO120", bMpn: "QO-120", bBrand: "Square D" }),
      cross({ verifiedAt: "june 11" }),
    ];
    const problems = validateCrossEntries(bad);
    expect(problems.some((p) => p.includes("https"))).toBe(true);
    expect(problems.some((p) => p.includes("self-cross"))).toBe(true);
    expect(problems.some((p) => p.includes("verifiedAt"))).toBe(true);
  });

  it("the shipped cross dataset is structurally valid", () => {
    expect(validateCrossEntries(VERIFIED_CROSS_ENTRIES)).toEqual([]);
  });
});

describe("brand hierarchy", () => {
  it("the shipped registry is structurally valid (sourced, deduped)", () => {
    expect(validateHierarchy(BRAND_HIERARCHY_ENTRIES)).toEqual([]);
  });

  it("resolver matches case-insensitively and via aliases; unmodeled brands → null", () => {
    if (BRAND_HIERARCHY_ENTRIES.length > 0) {
      const first = BRAND_HIERARCHY_ENTRIES[0];
      expect(brandHierarchyFor(first.brand.toUpperCase())?.parentCompany).toBe(first.parentCompany);
    }
    expect(brandHierarchyFor("Definitely Not A Brand 123")).toBeNull();
  });

  it("brandCoverage splits covered vs missing", () => {
    const { covered, missing } = brandCoverage(["Definitely Not A Brand 123"]);
    expect(covered).toEqual([]);
    expect(missing).toEqual(["Definitely Not A Brand 123"]);
  });
});
