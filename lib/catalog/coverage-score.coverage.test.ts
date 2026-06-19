/**
 * Coverage tests for lib/catalog/coverage-score.ts.
 *
 * The sibling coverage-score.test.ts already exercises the pure `gradeSourcing`
 * and `bomSourcing` mappings. This file targets the previously-UNtested
 * `sourcingForProduct`, whose distinct-stocked-source counting / dedup logic
 * threads three catalog engines together. Those engines (the generated catalog,
 * the equivalence engine, and the verified-cross runtime) are mocked so each
 * stocked / unstocked / null-substitute / dedup branch can be driven
 * deterministically without loading the full synthetic catalog. A handful of
 * gradeSourcing/bomSourcing branches the existing test skips (blurb text, the
 * moderate-only BOM path, averageScore rounding) are filled in too.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import type { CatalogProduct } from "@/features/product-finder/types";
import type { VerifiedCrossResult } from "@/lib/catalog/verified-crosses";

// ── Mock the three engines sourcingForProduct composes. ─────────────────────
// functionalEquivalents(product, k, branchId) → CatalogProduct[]
const functionalEquivalentsMock = vi.fn<
  (product: CatalogProduct, k?: number, branchId?: string) => CatalogProduct[]
>(() => []);
vi.mock("@/lib/catalog/equivalence", () => ({
  functionalEquivalents: (p: CatalogProduct, k?: number, b?: string) =>
    functionalEquivalentsMock(p, k, b),
}));

// verifiedCrossesFor(product, entries, resolve) → VerifiedCrossResult[]
const verifiedCrossesForMock = vi.fn<() => VerifiedCrossResult[]>(() => []);
vi.mock("@/lib/catalog/verified-crosses", () => ({
  verifiedCrossesFor: () => verifiedCrossesForMock(),
}));

// cross-runtime supplies the entry list + resolver passed into verifiedCrossesFor;
// the values are irrelevant because verifiedCrossesForMock ignores them.
vi.mock("@/lib/catalog/cross-runtime", () => ({
  resolvedCrossEntries: () => [],
  resolveStocked: () => null,
}));

// Imported AFTER the mocks are registered so the module under test binds to them.
import { sourcingForProduct, gradeSourcing, bomSourcing } from "@/lib/catalog/coverage-score";

// ── Minimal CatalogProduct factory. Only the fields sourcingForProduct touches
// (id, branchStock, dcStock) carry meaning; the rest satisfy the type. ───────
function makeProduct(
  id: string,
  opts: { branchQty?: number; dcQty?: number } = {},
): CatalogProduct {
  const { branchQty = 0, dcQty = 0 } = opts;
  return {
    id,
    sku: id.toUpperCase(),
    name: `Product ${id}`,
    brand: "TestBrand",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 10,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock:
      branchQty > 0
        ? [{ branchId: "B1", branchName: "B1", city: "X", state: "TX", quantity: branchQty }]
        : [{ branchId: "B1", branchName: "B1", city: "X", state: "TX", quantity: 0 }],
    dcStock:
      dcQty > 0
        ? [{ dcId: "D1", dcName: "D1", location: "X", quantity: dcQty }]
        : [{ dcId: "D1", dcName: "D1", location: "X", quantity: 0 }],
    externalSources: [],
    imageIcon: "box",
  };
}

/** A VerifiedCrossResult is only consulted for `.substituteProduct`; stub the rest. */
function makeCross(substituteProduct: CatalogProduct | null): VerifiedCrossResult {
  return {
    originalSku: "ORIG",
    substituteSku: substituteProduct?.sku ?? "SUB",
    substituteBrand: "TestBrand",
    relation: "equivalent",
    substituteProduct,
    matchReason: "",
    matchingAttributes: [],
    missingAttributes: [],
    conflictingAttributes: [],
    sourceKind: "manufacturer-cross",
    sourceUrl: "https://example.com",
    confidence: 97,
    warnings: [],
    productionReady: true,
  };
}

afterEach(() => {
  functionalEquivalentsMock.mockReset();
  functionalEquivalentsMock.mockReturnValue([]);
  verifiedCrossesForMock.mockReset();
  verifiedCrossesForMock.mockReturnValue([]);
  vi.restoreAllMocks();
});

describe("sourcingForProduct", () => {
  it("counts the part itself when it is stocked at a branch", () => {
    const grade = sourcingForProduct(makeProduct("p1", { branchQty: 5 }));
    expect(grade.sources).toBe(1);
    expect(grade.score).toBe(1);
    expect(grade.risk).toBe("high"); // single-source
  });

  it("counts the part itself when stocked only at a DC (no branch stock)", () => {
    const grade = sourcingForProduct(makeProduct("p1", { dcQty: 3 }));
    expect(grade.sources).toBe(1);
  });

  it("does NOT count an unstocked part itself (zero branch + zero DC)", () => {
    const grade = sourcingForProduct(makeProduct("p1"));
    expect(grade.sources).toBe(0);
    expect(grade.score).toBe(1); // 0 sources still grades 1 (clamped)
    expect(grade.label).toBe("Single-source");
  });

  it("adds stocked functional equivalents and skips unstocked ones", () => {
    functionalEquivalentsMock.mockReturnValue([
      makeProduct("eq-stocked", { branchQty: 2 }),
      makeProduct("eq-empty"), // unstocked → skipped
      makeProduct("eq-dc", { dcQty: 1 }),
    ]);
    // Part itself stocked + 2 stocked equivalents = 3 distinct sources.
    const grade = sourcingForProduct(makeProduct("p1", { branchQty: 1 }));
    expect(grade.sources).toBe(3);
    expect(grade.score).toBe(3);
    expect(grade.risk).toBe("low");
  });

  it("passes the branchId through to the equivalence engine", () => {
    functionalEquivalentsMock.mockReturnValue([]);
    sourcingForProduct(makeProduct("p1", { branchQty: 1 }), "B-HOU-01");
    expect(functionalEquivalentsMock).toHaveBeenCalledTimes(1);
    const [, , branchId] = functionalEquivalentsMock.mock.calls[0];
    expect(branchId).toBe("B-HOU-01");
  });

  it("adds stocked verified-cross substitutes", () => {
    verifiedCrossesForMock.mockReturnValue([
      makeCross(makeProduct("x-stocked", { branchQty: 4 })),
    ]);
    // unstocked part (0) + 1 stocked cross substitute = 1 source.
    const grade = sourcingForProduct(makeProduct("p1"));
    expect(grade.sources).toBe(1);
  });

  it("skips a cross whose substitute is null (not in catalog)", () => {
    verifiedCrossesForMock.mockReturnValue([makeCross(null)]);
    const grade = sourcingForProduct(makeProduct("p1", { branchQty: 1 }));
    expect(grade.sources).toBe(1); // only the part itself
  });

  it("skips a cross whose substitute exists but is out of stock", () => {
    verifiedCrossesForMock.mockReturnValue([makeCross(makeProduct("x-empty"))]);
    const grade = sourcingForProduct(makeProduct("p1", { branchQty: 1 }));
    expect(grade.sources).toBe(1); // only the part itself
  });

  it("dedupes a source that appears as both an equivalent and a verified cross", () => {
    const shared = makeProduct("shared", { branchQty: 9 });
    functionalEquivalentsMock.mockReturnValue([shared]);
    verifiedCrossesForMock.mockReturnValue([makeCross(shared)]);
    // part itself (stocked) + shared (counted once across both engines) = 2.
    const grade = sourcingForProduct(makeProduct("p1", { branchQty: 1 }));
    expect(grade.sources).toBe(2);
    expect(grade.score).toBe(2);
    expect(grade.risk).toBe("moderate");
  });

  it("dedupes the part itself if it also surfaces as an equivalent (same id)", () => {
    // Same id as the product → Set collapses it; still 1 source.
    functionalEquivalentsMock.mockReturnValue([makeProduct("p1", { branchQty: 7 })]);
    const grade = sourcingForProduct(makeProduct("p1", { branchQty: 1 }));
    expect(grade.sources).toBe(1);
  });

  it("counts a broadly-sourced part (5+ distinct stocked sources) as score 5", () => {
    functionalEquivalentsMock.mockReturnValue([
      makeProduct("eq1", { branchQty: 1 }),
      makeProduct("eq2", { branchQty: 1 }),
      makeProduct("eq3", { branchQty: 1 }),
    ]);
    verifiedCrossesForMock.mockReturnValue([
      makeCross(makeProduct("x1", { dcQty: 1 })),
      makeCross(makeProduct("x2", { dcQty: 1 })),
    ]);
    // part + 3 equivalents + 2 crosses = 6 distinct → grade 5.
    const grade = sourcingForProduct(makeProduct("p1", { branchQty: 1 }));
    expect(grade.sources).toBe(6);
    expect(grade.score).toBe(5);
    expect(grade.label).toBe("Broadly sourced");
  });
});

// ── Fill the few gradeSourcing / bomSourcing branches the sibling test skips. ─
describe("gradeSourcing blurbs (uncovered branches)", () => {
  it("uses the single-source blurb for 0–1 sources", () => {
    expect(gradeSourcing(1).blurb).toContain("single-source risk");
    expect(gradeSourcing(0).blurb).toContain("Only one stocked source");
  });

  it("uses a moderate-risk blurb for a dual-source part", () => {
    expect(gradeSourcing(2).blurb).toBe(
      "2 interchangeable stocked sources — moderate single-source risk.",
    );
  });

  it("uses a low-risk blurb for a multi-source part", () => {
    expect(gradeSourcing(3).blurb).toBe(
      "3 interchangeable stocked sources — low single-source risk.",
    );
  });

  it("labels grade 3 Multi-source", () => {
    expect(gradeSourcing(3).label).toBe("Multi-source");
  });

  it("labels grade 4 Well-sourced", () => {
    expect(gradeSourcing(4).label).toBe("Well-sourced");
  });
});

describe("bomSourcing (uncovered branches)", () => {
  it("reports moderate when the worst line is dual-source (no high)", () => {
    const roll = bomSourcing([gradeSourcing(2), gradeSourcing(4)]);
    expect(roll.worst).toBe("moderate");
    expect(roll.singleSourced).toBe(0);
  });

  it("rounds averageScore to one decimal place", () => {
    // scores 1, 2, 2 → mean 1.666… → rounded to 1.7
    const roll = bomSourcing([gradeSourcing(1), gradeSourcing(2), gradeSourcing(2)]);
    expect(roll.averageScore).toBe(1.7);
    expect(roll.lines).toBe(3);
    expect(roll.singleSourced).toBe(1);
  });
});
