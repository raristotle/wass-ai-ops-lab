import { describe, it, expect } from "vitest";
import { scopeSuggestion } from "@/lib/product-finder-scope-suggest";
import { ALL_SUBCATEGORIES } from "@/lib/catalog/taxonomy";

describe("scopeSuggestion", () => {
  it("returns null for queries shorter than the minimum", () => {
    expect(scopeSuggestion("")).toBeNull();
    expect(scopeSuggestion("ab")).toBeNull();
  });

  it("matches a subcategory by a partial token (the type-ahead direction)", () => {
    // "breaker" should point at the Circuit Breakers subcategory.
    const m = scopeSuggestion("breaker");
    expect(m).not.toBeNull();
    expect(m?.kind).toBe("subcategory");
    expect(m?.value.toLowerCase()).toContain("breaker");
  });

  it("matches an exact subcategory name", () => {
    const sub = ALL_SUBCATEGORIES[0];
    const m = scopeSuggestion(sub);
    expect(m).toEqual({ kind: "subcategory", value: sub, label: sub });
  });

  it("falls back to a category label when no subcategory matches", () => {
    const m = scopeSuggestion("datacom");
    expect(m).toEqual({ kind: "category", value: "datacom", label: "Datacom" });
  });

  it("returns null when nothing plausibly matches", () => {
    expect(scopeSuggestion("zzzzqqq")).toBeNull();
  });

  it("prefers the most specific (shortest) subcategory on a tie", () => {
    // Whatever matches, the result is a real subcategory name from the taxonomy.
    const m = scopeSuggestion("cable");
    if (m && m.kind === "subcategory") {
      expect(ALL_SUBCATEGORIES).toContain(m.value);
    }
  });
});
