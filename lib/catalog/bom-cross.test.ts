import { describe, it, expect } from "vitest";
import { extractMpnCandidates, findCrossSuggestion } from "@/lib/catalog/bom-cross";
import type { VerifiedCrossEntry } from "@/lib/catalog/verified-crosses";
import type { CatalogProduct } from "@/features/product-finder/types";

const product = (sku: string, brand: string): CatalogProduct => ({
  id: `T-${sku}`,
  sku,
  name: `${brand} ${sku}`,
  brand,
  category: "electrical",
  subcategory: "Fuses",
  description: "",
  unitPrice: 10,
  uom: "EA",
  specs: [],
  preferred: true,
  branchStock: [],
  dcStock: [],
  externalSources: [],
  imageIcon: "⚡",
});

const entry = (over: Partial<VerifiedCrossEntry>): VerifiedCrossEntry => ({
  aBrand: "Bussmann",
  aMpn: "FRN-R-30",
  bBrand: "Mersen",
  bMpn: "TR30R",
  relation: "equivalent",
  sourceKind: "manufacturer-cross",
  sourceUrl: "https://example.com/guide.pdf",
  verifiedAt: "2026-06-11",
  ...over,
});

describe("extractMpnCandidates", () => {
  it("pulls part-number-shaped tokens, longest first", () => {
    expect(extractMpnCandidates("12 Bussmann FRN-R-30 fuses")).toEqual(["FRN-R-30"]);
    expect(extractMpnCandidates("100-C09D10 contactor 120V")).toEqual(["100-C09D10", "120V"]);
  });
  it("ignores plain words, short tokens, quantities, and dimensions", () => {
    expect(extractMpnCandidates("20A breaker")).toEqual([]);
    expect(extractMpnCandidates("12x12 enclosure")).toEqual([]);
    expect(extractMpnCandidates("gfci receptacle white")).toEqual([]);
  });
});

describe("findCrossSuggestion", () => {
  const tr30r = product("TR30R", "Mersen");
  const resolve = (brand: string, mpn: string) =>
    brand === "Mersen" && mpn === "TR30R" ? tr30r : null;

  it("crosses a competitor MPN in the line to the stocked equivalent with citation", () => {
    const s = findCrossSuggestion("12x Bussmann FRN-R-30", [entry({})], resolve);
    expect(s).not.toBeNull();
    expect(s?.fromBrand).toBe("Bussmann");
    expect(s?.fromMpn).toBe("FRN-R-30");
    expect(s?.product.sku).toBe("TR30R");
    expect(s?.matchReason).toContain("manufacturer cross-reference");
    expect(s?.sourceUrl).toContain("https://");
    expect(s?.confidence).toBeGreaterThanOrEqual(95);
  });

  it("matches from either side of the pair", () => {
    const frnr = product("FRN-R-30", "Bussmann");
    const s = findCrossSuggestion("TR30R fuse", [entry({})], (b, m) =>
      b === "Bussmann" && m === "FRN-R-30" ? frnr : null
    );
    expect(s?.product.sku).toBe("FRN-R-30");
    expect(s?.fromBrand).toBe("Mersen");
  });

  it("suppresses below-production sources (industry tables)", () => {
    const weak = entry({ sourceKind: "industry-table" });
    expect(findCrossSuggestion("FRN-R-30", [weak], resolve)).toBeNull();
  });

  it("returns null when the cross target is not stocked or nothing matches", () => {
    expect(findCrossSuggestion("FRN-R-30", [entry({})], () => null)).toBeNull();
    expect(findCrossSuggestion("totally different part 99ZZ99", [entry({})], resolve)).toBeNull();
  });

  it("prefers an equivalent over a functional substitute for the same origin", () => {
    const sub = entry({ bMpn: "A2D30R", relation: "functional-substitute" });
    const a2d = product("A2D30R", "Mersen");
    const both = findCrossSuggestion("FRN-R-30", [sub, entry({})], (b, m) =>
      m === "TR30R" ? tr30r : m === "A2D30R" ? a2d : null
    );
    expect(both?.product.sku).toBe("TR30R");
    expect(both?.relation).toBe("equivalent");
  });

  it("flags when the named part itself is stocked", () => {
    const s = findCrossSuggestion("FRN-R-30", [entry({})], resolve, () => true);
    expect(s?.originStocked).toBe(true);
  });
});
