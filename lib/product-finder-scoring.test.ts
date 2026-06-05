import { describe, it, expect } from "vitest";
import { scoreProduct, tierForScore, topReasons, SCORE_WEIGHTS } from "@/lib/product-finder-scoring";
import type { WescoProduct, ProductSpec } from "@/features/product-finder/types";

function makeProduct(overrides: Partial<WescoProduct> = {}): WescoProduct {
  return {
    id: "p", sku: "P", name: "Prod", brand: "BrandA",
    category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 10, uom: "EA",
    specs: [], preferred: false,
    branchStock: [], dcStock: [],
    alternativeIds: [], crossSellIds: [], upsellIds: [],
    externalSources: [], imageIcon: "x",
    ...overrides,
  };
}

const nonNeg = (name: string, value: string): ProductSpec => ({ name, value, isNonNeg: true });

const reference = makeProduct({
  id: "ref", unitPrice: 10, subcategory: "Circuit Breakers",
  specs: [nonNeg("Amperage", "15A"), nonNeg("Voltage", "120/240V")],
});

describe("tierForScore", () => {
  it("maps thresholds: 85+ excellent, 70-84 good, <70 partial", () => {
    expect(tierForScore(85)).toBe("excellent");
    expect(tierForScore(84)).toBe("good");
    expect(tierForScore(70)).toBe("good");
    expect(tierForScore(69)).toBe("partial");
  });
});

describe("scoreProduct", () => {
  it("a fully-matching, preferred, in-branch, same-subcat product scores excellent", () => {
    const cand = makeProduct({
      preferred: true, unitPrice: 10, subcategory: "Circuit Breakers",
      specs: [nonNeg("Amperage", "15A"), nonNeg("Voltage", "120/240V")],
      branchStock: [{ branchId: "B-HOU-01", branchName: "Houston", city: "Houston", state: "TX", quantity: 5 }],
    });
    const s = scoreProduct(cand, reference, "B-HOU-01");
    expect(s.total).toBe(SCORE_WEIGHTS.spec + SCORE_WEIGHTS.branchStock + SCORE_WEIGHTS.preferred + SCORE_WEIGHTS.subcategory);
    expect(s.tier).toBe("excellent");
  });

  it("partial spec match scales proportionally and adds a mismatch note", () => {
    const cand = makeProduct({
      specs: [nonNeg("Amperage", "15A"), nonNeg("Voltage", "240V")], // 1 of 2
    });
    const s = scoreProduct(cand, reference);
    const specFactor = s.factors.find((f) => f.label.includes("non-negotiable"));
    expect(specFactor?.points).toBe(Math.round((1 / 2) * SCORE_WEIGHTS.spec)); // 23
    expect(s.factors.some((f) => !f.positive && f.label.includes("Voltage"))).toBe(true);
  });

  it("awards DC points when not in the user's branch but in a DC", () => {
    const cand = makeProduct({
      dcStock: [{ dcId: "DC-TEX-01", dcName: "Texas DC", location: "Katy", quantity: 9 }],
    });
    const s = scoreProduct(cand, reference, "B-HOU-01");
    expect(s.factors.some((f) => f.label.includes("distribution center") && f.points === SCORE_WEIGHTS.dcStock)).toBe(true);
  });

  it("gives full spec points when reference has no non-negotiable specs", () => {
    const ref = makeProduct({ specs: [] });
    const cand = makeProduct({});
    const s = scoreProduct(cand, ref);
    expect(s.factors.find((f) => f.label.includes("No spec constraints"))?.points).toBe(SCORE_WEIGHTS.spec);
  });

  it("scores 20% cheaper as +4 and labels it", () => {
    const cand = makeProduct({ unitPrice: 8 }); // 20% cheaper than 10
    const s = scoreProduct(cand, reference);
    const f = s.factors.find((x) => x.label.includes("cheaper"));
    expect(f?.points).toBe(4); // round(0.20 * 20)
  });

  it("clamps total to 0–100 and orders positive factors before notes", () => {
    const cand = makeProduct({
      preferred: true, unitPrice: 1, subcategory: "Circuit Breakers",
      specs: [nonNeg("Amperage", "15A"), nonNeg("Voltage", "120/240V")],
      branchStock: [{ branchId: "B-HOU-01", branchName: "H", city: "H", state: "TX", quantity: 5 }],
    });
    const s = scoreProduct(cand, reference, "B-HOU-01");
    expect(s.total).toBeLessThanOrEqual(100);
    const firstNoteIdx = s.factors.findIndex((f) => !f.positive);
    const lastPosIdx = s.factors.map((f) => f.positive).lastIndexOf(true);
    if (firstNoteIdx >= 0) expect(lastPosIdx).toBeLessThan(firstNoteIdx);
  });

  it("topReasons returns the highest-point positive factors only", () => {
    const cand = makeProduct({
      preferred: true,
      specs: [nonNeg("Amperage", "15A"), nonNeg("Voltage", "120/240V")],
      branchStock: [{ branchId: "B-HOU-01", branchName: "H", city: "H", state: "TX", quantity: 5 }],
    });
    const s = scoreProduct(cand, reference, "B-HOU-01");
    const top = topReasons(s, 2);
    expect(top).toHaveLength(2);
    expect(top.every((f) => f.positive && f.points > 0)).toBe(true);
    expect(top[0].points).toBeGreaterThanOrEqual(top[1].points);
  });
});
