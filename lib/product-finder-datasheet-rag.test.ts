import { describe, it, expect } from "vitest";
import { retrieveSpecChunks, buildRagUserContent, extractiveAnswer, productSpecText } from "@/lib/product-finder-datasheet-rag";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(id: string, name: string, specs: [string, string][]): CatalogProduct {
  return {
    id, sku: id, name, brand: "Square D", category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 20, uom: "ea", specs: specs.map(([n, v]) => ({ name: n, value: v })),
    preferred: false, branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

const PRODUCTS = [
  prod("A", "QO 20A Breaker", [["Amperage", "20A"], ["Voltage", "120/240V"], ["Poles", "1"]]),
  prod("B", "QO 30A Breaker", [["Amperage", "30A"], ["Voltage", "120/240V"], ["Poles", "2"]]),
  prod("C", "Cat6 Plenum Cable", [["Gauge", "23 AWG"], ["Jacket", "Plenum"]]),
];

describe("retrieveSpecChunks (lexical, no embeddings)", () => {
  it("ranks products by distinct query-term coverage and drops non-matches", () => {
    const chunks = retrieveSpecChunks("20A breaker voltage", PRODUCTS, 6);
    expect(chunks[0].sku).toBe("A"); // matches 20a + breaker + voltage
    expect(chunks.map((c) => c.sku)).not.toContain("C"); // cable — no overlap
    expect(chunks[0].score).toBeGreaterThan(chunks[chunks.length - 1].score - 0.0001);
  });

  it("returns nothing for an all-stopword query and respects k", () => {
    expect(retrieveSpecChunks("what is the", PRODUCTS)).toEqual([]);
    expect(retrieveSpecChunks("breaker", PRODUCTS, 1).length).toBe(1);
  });
});

describe("productSpecText", () => {
  it("includes name, subcategory, and specs", () => {
    const t = productSpecText(PRODUCTS[0]);
    expect(t).toContain("QO 20A Breaker");
    expect(t).toContain("Amperage: 20A");
  });
});

describe("buildRagUserContent + extractiveAnswer", () => {
  it("grounds the prompt in the question and chunk context", () => {
    const chunks = retrieveSpecChunks("20A breaker", PRODUCTS, 2);
    const u = buildRagUserContent("Is the 20A breaker single pole?", chunks);
    expect(u).toContain("Question: Is the 20A breaker single pole?");
    expect(u).toContain("SKU A");
  });

  it("extractiveAnswer surfaces the top chunk and notes the dormant state", () => {
    const chunks = retrieveSpecChunks("20A breaker", PRODUCTS, 2);
    const a = extractiveAnswer(chunks);
    expect(a).toContain("QO 20A Breaker");
    expect(a).toContain("ANTHROPIC_API_KEY");
    expect(extractiveAnswer([])).toContain("No products matched");
  });
});
