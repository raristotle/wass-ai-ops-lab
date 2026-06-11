import { describe, it, expect } from "vitest";
import { ALL_SUBCATEGORIES } from "@/lib/catalog/taxonomy";
import { SYNONYMS, applySynonyms } from "@/lib/product-finder-synonyms";

describe("SYNONYMS data", () => {
  it("has between 25 and 40 entries", () => {
    expect(SYNONYMS.length).toBeGreaterThanOrEqual(25);
    expect(SYNONYMS.length).toBeLessThanOrEqual(40);
  });

  it("terms are lowercase and unique", () => {
    const terms = SYNONYMS.map((s) => s.term);
    expect(new Set(terms).size).toBe(terms.length);
    for (const term of terms) {
      expect(term, term).toBe(term.toLowerCase());
      expect(term.trim().length).toBeGreaterThan(0);
    }
  });

  it("every subcategory value exists verbatim in ALL_SUBCATEGORIES", () => {
    const known = new Set(ALL_SUBCATEGORIES);
    for (const s of SYNONYMS) {
      if (s.subcategory !== undefined) {
        expect(known.has(s.subcategory), `"${s.term}" → unknown subcategory "${s.subcategory}"`).toBe(true);
      }
    }
  });

  it("includes the required core entries", () => {
    const byTerm = new Map(SYNONYMS.map((s) => [s.term, s]));
    expect(byTerm.get("romex")).toMatchObject({ text: "NM-B", subcategory: "Wire & Cable" });
    expect(byTerm.get("gfi")).toMatchObject({ text: "GFCI" });
    expect(byTerm.get("cat 6")).toMatchObject({ text: "Cat6" });
    expect(byTerm.get("cat6")).toMatchObject({ text: "Cat6" });
    expect(byTerm.get("emt")).toMatchObject({ text: "EMT", subcategory: "Conduit" });
  });
});

describe("applySynonyms", () => {
  it('replaces "ROMEX 12-2" case-insensitively and tags Wire & Cable', () => {
    const r = applySynonyms("ROMEX 12-2");
    expect(r.text).toContain("NM-B");
    expect(r.text).toContain("12-2");
    expect(r.applied.some((a) => a.subcategory === "Wire & Cable")).toBe(true);
  });

  it('replaces "Gfi outlet" with GFCI', () => {
    const r = applySynonyms("Gfi outlet");
    expect(r.text).toBe("GFCI outlet");
    expect(r.applied).toHaveLength(1);
    expect(r.applied[0].term).toBe("gfi");
  });

  it('matches the multi-token "cat 6" term in "cat 6 plenum"', () => {
    const r = applySynonyms("cat 6 plenum");
    expect(r.text).toBe("Cat6 plenum");
    expect(r.applied).toHaveLength(1);
    expect(r.applied[0].term).toBe("cat 6");
  });

  it('tags Conduit for "emt fittings"', () => {
    const r = applySynonyms("emt fittings");
    expect(r.text).toBe("EMT fittings");
    expect(r.applied.some((a) => a.subcategory === "Conduit")).toBe(true);
  });

  it('leaves "circuit breaker" unchanged with empty applied', () => {
    const r = applySynonyms("circuit breaker");
    expect(r.text).toBe("circuit breaker");
    expect(r.applied).toHaveLength(0);
  });

  it("does not re-scan replacement tokens (no chains)", () => {
    // "cat 6" → "Cat6"; the single-token "cat6" entry must NOT then re-match
    // the freshly inserted "Cat6" token.
    const r = applySynonyms("cat 6");
    expect(r.text).toBe("Cat6");
    expect(r.applied).toHaveLength(1);
    expect(r.applied[0].term).toBe("cat 6");
  });

  it("only matches whole tokens, not substrings", () => {
    const r = applySynonyms("emts category");
    expect(r.text).toBe("emts category");
    expect(r.applied).toHaveLength(0);
  });

  it("normalizes whitespace and is deterministic", () => {
    const a = applySynonyms("  romex   in   stock ");
    const b = applySynonyms("  romex   in   stock ");
    expect(a).toEqual(b);
    expect(a.text).toBe("NM-B in stock");
  });

  it("applies each entry at most once", () => {
    const r = applySynonyms("gfi and gfi");
    expect(r.applied.filter((x) => x.term === "gfi")).toHaveLength(1);
    // only the first occurrence is replaced
    expect(r.text).toBe("GFCI and gfi");
  });
});
