import { describe, it, expect } from "vitest";
import {
  tokenize,
  matchConfidence,
  confidenceTier,
} from "@/lib/product-finder-match-confidence";
import type { CatalogProduct } from "@/features/product-finder/types";

function product(over: Partial<CatalogProduct>): CatalogProduct {
  return {
    id: "p1",
    sku: "QO120",
    name: "QO 20A Single-Pole Circuit Breaker",
    brand: "Square D",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 12.5,
    uom: "ea",
    specs: [],
    preferred: true,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "🔌",
    ...over,
  };
}

describe("tokenize", () => {
  it("lowercases and splits on non-alphanumerics", () => {
    expect(tokenize("20A Single-Pole (QO120)")).toEqual(["20a", "single", "pole", "qo120"]);
  });
  it("returns empty for blank input", () => {
    expect(tokenize("  ")).toEqual([]);
  });
});

describe("matchConfidence", () => {
  const p = product({});

  it("exact SKU match scores 1.0 regardless of formatting", () => {
    expect(matchConfidence("qo-120", p)).toBe(1);
    expect(matchConfidence("QO120", p)).toBe(1);
  });

  it("full token coverage scores high", () => {
    const c = matchConfidence("20A circuit breaker", p);
    expect(c).toBeGreaterThanOrEqual(0.8);
  });

  it("numeric tokens must match exactly — 30A against a 20A part scores lower", () => {
    const c20 = matchConfidence("20a breaker", p);
    const c30 = matchConfidence("30a breaker", p);
    expect(c30).toBeLessThan(c20);
    // the missed amperage token gets zero credit: 1 of 2 tokens covered
    expect(c30).toBeCloseTo(0.5, 5);
  });

  it("alpha prefix matches earn partial credit", () => {
    // "break" should partially cover "breaker"
    const c = matchConfidence("break", p);
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThan(1);
  });

  it("brand and subcategory tokens count toward coverage", () => {
    expect(matchConfidence("square d breaker", p)).toBeGreaterThanOrEqual(0.8);
  });

  it("unrelated query scores low", () => {
    expect(matchConfidence("cat6 ethernet cable", p)).toBeLessThan(0.5);
  });

  it("stop words are ignored", () => {
    const bare = matchConfidence("20a breaker", p);
    const wordy = matchConfidence("a 20a breaker for the panel", p);
    // "panel" misses but stop words don't dilute; wordy ≤ bare but stays sane
    expect(wordy).toBeGreaterThan(0.4);
    expect(bare).toBeGreaterThanOrEqual(wordy);
  });

  it("blank query scores 0", () => {
    expect(matchConfidence("", p)).toBe(0);
    expect(matchConfidence("   ", p)).toBe(0);
  });

  it("is deterministic", () => {
    expect(matchConfidence("20a breaker", p)).toBe(matchConfidence("20a breaker", p));
  });
});

describe("confidenceTier", () => {
  it("maps scores to tiers at the documented thresholds", () => {
    expect(confidenceTier(1)).toBe("high");
    expect(confidenceTier(0.8)).toBe("high");
    expect(confidenceTier(0.79)).toBe("medium");
    expect(confidenceTier(0.5)).toBe("medium");
    expect(confidenceTier(0.49)).toBe("low");
    expect(confidenceTier(0)).toBe("low");
  });
});
