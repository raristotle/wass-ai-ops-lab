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

  it("parses a known brand keyword and strips it from the text", () => {
    const r = parseQuery("square d breaker");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "brand", value: "Square D" }));
    expect(r.text).toBe("breaker");
  });

  it("does NOT treat a hyphenated product spec like '12-2' as a price range", () => {
    const r = parseQuery("12-2 wire");
    expect(r.filters.some((f) => f.kind === "priceMin" || f.kind === "priceMax")).toBe(false);
    expect(r.text).toContain("12-2");
  });

  it("does NOT treat '10-32' (screw thread) as a price range", () => {
    const r = parseQuery("10-32 screw");
    expect(r.filters.some((f) => f.kind === "priceMin" || f.kind === "priceMax")).toBe(false);
  });

  it("normalizes an inverted price range", () => {
    const r = parseQuery("wire $30-$10");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "priceMin", value: 10 }));
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "priceMax", value: 30 }));
  });

  it("parses a combined query", () => {
    const r = parseQuery("20A breaker in stock under $50 preferred");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "branchStock" }));
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "priceMax", value: 50 }));
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "preferred" }));
    expect(r.text).toContain("20a");
    expect(r.text).toContain("breaker");
  });

  it("parses 'electrical' category", () => {
    const r = parseQuery("electrical breaker");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "category", value: "electrical" }));
    expect(r.text).toBe("breaker");
  });

  it("parses 'oem-electrical' category as a whole word", () => {
    const r = parseQuery("oem-electrical connector");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "category", value: "oem-electrical" }));
    expect(r.text).toBe("connector");
  });

  it("parses 'security' category", () => {
    const r = parseQuery("security camera");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "category", value: "security" }));
    expect(r.text).toBe("camera");
  });

  it("parses 'safety' category", () => {
    const r = parseQuery("safety equipment");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "category", value: "safety" }));
    expect(r.text).toBe("equipment");
  });

  it("parses 'av' category", () => {
    const r = parseQuery("av cable");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "category", value: "av" }));
    expect(r.text).toBe("cable");
  });

  it("does not confuse 'electrical' in 'oem-electrical'", () => {
    const r = parseQuery("electrical widget");
    expect(r.filters).toContainEqual(expect.objectContaining({ kind: "category", value: "electrical" }));
    expect(r.filters.filter((f) => f.kind === "category")).toHaveLength(1);
    expect(r.text).toBe("widget");
  });
});
