import { describe, it, expect } from "vitest";
import { assessRecord, assessCatalog, PRODUCTION_CONFIDENCE } from "@/lib/catalog/provenance";
import { parseSalesRank, SALES_RANK_PATH } from "@/lib/catalog/sales-rank";
import { REAL_PRODUCT_ENTRIES } from "@/data/real/real-products";
import type { RealProductEntry } from "@/lib/catalog/real";

function entry(over: Partial<RealProductEntry>): RealProductEntry {
  return {
    mpn: "TEST-100",
    brand: "TestBrand",
    name: "Test Product",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "x",
    uom: "EA",
    estListPrice: 10,
    priceSource: "example.com",
    specs: [{ name: "Amperage", value: "20A", isNonNeg: true }],
    specSheetUrl: "https://example.com/datasheet.pdf",
    verifiedAt: "2026-06-11",
    ...over,
  };
}

describe("assessRecord — confidence tiers", () => {
  it("link-verified datasheet → verified (≥95), production-ready", () => {
    const a = assessRecord(entry({}));
    expect(a.confidence).toBeGreaterThanOrEqual(PRODUCTION_CONFIDENCE);
    expect(a.status).toBe("verified");
    expect(a.productionReady).toBe(true);
    expect(a.reasons.join(" ")).toContain("datasheet");
  });

  it("extra identity fields raise confidence within the verified band (cap 99)", () => {
    const base = assessRecord(entry({})).confidence;
    const rich = assessRecord(
      entry({ productUrl: "https://mfr.com/p/TEST-100", wescoSku: "WES100", gtin: "036000291452", catalogNumber: "T100" })
    );
    expect(rich.confidence).toBeGreaterThan(base);
    expect(rich.confidence).toBeLessThanOrEqual(99);
  });

  it("no datasheet but product page + price source → cross-checked (85–94), NOT production", () => {
    const a = assessRecord(entry({ specSheetUrl: "", productUrl: "https://mfr.com/p/x" }));
    expect(a.status).toBe("cross-checked");
    expect(a.confidence).toBeGreaterThanOrEqual(85);
    expect(a.confidence).toBeLessThan(95);
    expect(a.productionReady).toBe(false);
  });

  it("single weak source → partial (70–84)", () => {
    const a = assessRecord(entry({ specSheetUrl: "", priceSource: "example.com" }));
    expect(a.status).toBe("partial");
    expect(a.productionReady).toBe(false);
  });

  it("no provenance at all → quarantined (<70) — dummy data is rejected", () => {
    const a = assessRecord(entry({ specSheetUrl: "", priceSource: "" }));
    expect(a.status).toBe("quarantined");
    expect(a.confidence).toBeLessThan(70);
    expect(a.productionReady).toBe(false);
  });

  it("an invalid GTIN check digit forces quarantine even with a datasheet", () => {
    const a = assessRecord(entry({ gtin: "036000291453" }));
    expect(a.status).toBe("quarantined");
    expect(a.reasons.join(" ")).toContain("GTIN");
  });

  it("missing optional fields are reported, not penalized below the verified band", () => {
    const a = assessRecord(entry({}));
    expect(a.missingFields).toContain("wescoSku");
    expect(a.missingFields).toContain("gtin");
    expect(a.productionReady).toBe(true);
  });
});

describe("assessCatalog — the production gate", () => {
  it("splits production-ready from below-threshold", () => {
    const good = entry({});
    const bad = entry({ mpn: "BAD-1", specSheetUrl: "", priceSource: "" });
    const result = assessCatalog([good, bad]);
    expect(result.total).toBe(2);
    expect(result.productionReady).toEqual([good]);
    expect(result.belowThreshold).toHaveLength(1);
    expect(result.belowThreshold[0].assessment.status).toBe("quarantined");
  });

  it("the entire shipped real dataset is production-ready (no silent regressions)", () => {
    const result = assessCatalog(REAL_PRODUCT_ENTRIES);
    expect(result.total).toBeGreaterThanOrEqual(600);
    expect(result.belowThreshold).toEqual([]);
  });
});

describe("sales-rank ingestion — missing input is reported, never guessed", () => {
  it("absent file → unavailable with the expected path and schema", () => {
    const r = parseSalesRank(null);
    expect(r.available).toBe(false);
    if (!r.available) {
      expect(r.expectedPath).toBe(SALES_RANK_PATH);
      expect(r.reason).toContain("not guessing");
      expect(r.expectedSchema).toContain("mpn");
    }
  });

  it("corrupt or empty files → unavailable with a reason", () => {
    expect(parseSalesRank("not json").available).toBe(false);
    expect(parseSalesRank("{}").available).toBe(false);
    expect(parseSalesRank("[]").available).toBe(false);
  });

  it("valid rows parse with an MPN-key index; junk rows are counted", () => {
    const r = parseSalesRank(
      JSON.stringify([
        { mpn: "QO115", brand: "Square D", rank: 1 },
        { mpn: "", brand: "x", rank: 2 },
        { brand: "no-mpn", rank: 3 },
      ])
    );
    expect(r.available).toBe(true);
    if (r.available) {
      expect(r.rows).toHaveLength(1);
      expect(r.invalidRows).toBe(2);
      expect(r.byMpnKey.get("QO115")?.brand).toBe("Square D");
    }
  });
});
