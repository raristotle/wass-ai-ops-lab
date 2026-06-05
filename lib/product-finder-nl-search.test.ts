import { describe, it, expect } from "vitest";
import { parseQuery } from "@/lib/product-finder-nl-search";

describe("parseQuery", () => {
  it("returns raw text and no filters when nothing matches", () => {
    const r = parseQuery("circuit breaker");
    expect(r.text).toBe("circuit breaker");
    expect(r.filters).toHaveLength(0);
  });

  it("parses 'under $50' into a priceMax filter", () => {
    const r = parseQuery("breaker under $50");
    expect(r.text).toBe("breaker");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "priceMax", value: 50 }));
  });

  it("parses 'over 20' into a priceMin filter", () => {
    const r = parseQuery("cable over 20");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "priceMin", value: 20 }));
    expect(r.text).toBe("cable");
  });

  it("parses a '$10-$30' range into both bounds", () => {
    const r = parseQuery("wire $10-$30");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "priceMin", value: 10 }));
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "priceMax", value: 30 }));
  });

  it("parses 'in stock' into a branchStock filter", () => {
    const r = parseQuery("breaker in stock");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "branchStock", value: true }));
    expect(r.text).toBe("breaker");
  });

  it("parses 'preferred'", () => {
    const r = parseQuery("preferred breaker");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "preferred", value: true }));
  });

  it("parses a known brand keyword", () => {
    const r = parseQuery("square d breaker");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "brand", value: "Square D" }));
  });

  it("parses a combined query", () => {
    const r = parseQuery("20A breaker in stock under $50 preferred");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "branchStock" }));
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "priceMax", value: 50 }));
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "preferred" }));
    expect(r.text).toContain("20a");
    expect(r.text).toContain("breaker");
  });
});
