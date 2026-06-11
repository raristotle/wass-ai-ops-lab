import { describe, it, expect } from "vitest";
import {
  NEAR_ZERO_RESULTS,
  COMMON_TERMS,
  buildVocabulary,
  getVocabulary,
  editDistance,
  maxDistanceFor,
  suggestCorrection,
} from "@/lib/product-finder-suggest-correction";

describe("NEAR_ZERO_RESULTS", () => {
  it("is 3", () => {
    expect(NEAR_ZERO_RESULTS).toBe(3);
  });
});

describe("buildVocabulary", () => {
  it("is deterministic — two calls deep-equal", () => {
    expect(buildVocabulary()).toEqual(buildVocabulary());
  });

  it("contains trade terms, brand tokens, and category words", () => {
    const vocab = buildVocabulary();
    expect(vocab).toContain("breaker"); // COMMON_TERMS
    expect(vocab).toContain("southwire"); // brand token
    expect(vocab).toContain("datacom"); // category display name
    expect(vocab).toContain("receptacles"); // subcategory token
  });

  it("only contains lowercase tokens of length ≥ 3", () => {
    for (const w of buildVocabulary()) {
      expect(w).toBe(w.toLowerCase());
      expect(w.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("getVocabulary memoizes and matches buildVocabulary", () => {
    expect(getVocabulary()).toBe(getVocabulary());
    expect([...getVocabulary()]).toEqual(buildVocabulary());
  });

  it("COMMON_TERMS has roughly 30 entries", () => {
    expect(COMMON_TERMS.length).toBeGreaterThanOrEqual(25);
    expect(COMMON_TERMS.length).toBeLessThanOrEqual(40);
  });
});

describe("editDistance", () => {
  it("identical strings → 0", () => {
    expect(editDistance("breaker", "breaker")).toBe(0);
  });

  it("single substitution → 1", () => {
    expect(editDistance("breaker", "breaket")).toBe(1);
  });

  it("single insertion / deletion → 1", () => {
    expect(editDistance("breakr", "breaker")).toBe(1);
    expect(editDistance("breaker", "breakers")).toBe(1);
  });

  it("two edits → 2", () => {
    expect(editDistance("brekaer", "breaker")).toBe(2); // transposition = 2 edits
  });

  it("far-apart strings → greater than 2 (early exit allowed)", () => {
    expect(editDistance("breaker", "camera")).toBeGreaterThan(2);
    expect(editDistance("abc", "xyzxyz")).toBeGreaterThan(2);
  });

  it("empty-string edge cases", () => {
    expect(editDistance("", "")).toBe(0);
    expect(editDistance("", "ab")).toBe(2);
    expect(editDistance("ab", "")).toBe(2);
  });
});

describe("maxDistanceFor", () => {
  it("boundary table", () => {
    expect(maxDistanceFor("ab")).toBe(0); // len 2
    expect(maxDistanceFor("abc")).toBe(0); // len 3
    expect(maxDistanceFor("abcd")).toBe(1); // len 4
    expect(maxDistanceFor("abcdef")).toBe(1); // len 6
    expect(maxDistanceFor("abcdefg")).toBe(2); // len 7
    expect(maxDistanceFor("abcdefghij")).toBe(2); // len 10
  });
});

describe("suggestCorrection", () => {
  it('"breakr" → { corrected: "breaker", confident: true }', () => {
    const r = suggestCorrection("breakr");
    expect(r).toEqual({ corrected: "breaker", confident: true });
  });

  it("a valid vocabulary term returns null", () => {
    expect(suggestCorrection("breaker")).toBeNull();
    expect(suggestCorrection("conduit")).toBeNull();
  });

  it('digit tokens are untouched: "20A brekaer" corrects only brekaer', () => {
    const r = suggestCorrection("20A brekaer");
    expect(r).not.toBeNull();
    expect(r!.corrected).toBe("20A breaker");
  });

  it("a tie at the best distance picks the lexicographically-first word, non-confident", () => {
    const vocab = ["aaab", "aaad"] as const;
    const r = suggestCorrection("aaac", vocab);
    expect(r).toEqual({ corrected: "aaab", confident: false });
  });

  it("tokens of length ≤ 3 are never corrected", () => {
    const r = suggestCorrection("cot", ["cut", "cat"]);
    expect(r).toBeNull();
  });

  it("4–6 character tokens reject distance-2 matches", () => {
    // "abcd" vs "abxx" is distance 2 — over the limit of 1 for a 4-char token
    expect(suggestCorrection("abcd", ["abxx"])).toBeNull();
    // distance 1 is accepted
    expect(suggestCorrection("abcd", ["abcx"])).toEqual({ corrected: "abcx", confident: true });
  });

  it("returns null when no token qualifies", () => {
    expect(suggestCorrection("zzzzzzzzzzzz")).toBeNull();
    expect(suggestCorrection("")).toBeNull();
    expect(suggestCorrection("   ")).toBeNull();
  });

  it("overall confident only when ALL corrected tokens are confident", () => {
    const vocab = ["aaab", "aaad", "breaker"];
    // "aaac" ties (non-confident), "breakr" is unique (confident) → overall non-confident
    const r = suggestCorrection("aaac breakr", vocab);
    expect(r).not.toBeNull();
    expect(r!.corrected).toBe("aaab breaker");
    expect(r!.confident).toBe(false);
  });

  it("is deterministic", () => {
    expect(suggestCorrection("brekaer condiut")).toEqual(suggestCorrection("brekaer condiut"));
  });
});
