import { describe, it, expect } from "vitest";
import { toVectorLiteral, isValidEmbedding, vectorStoreConfigured } from "@/lib/server/vector-store";
import { EMBEDDING_DIM } from "@/lib/integration/embeddings-live";

describe("toVectorLiteral", () => {
  it("formats a number array as a pgvector literal", () => {
    expect(toVectorLiteral([0.1, 0.2, -0.3])).toBe("[0.1,0.2,-0.3]");
  });
  it("neutralizes NaN / Infinity to 0", () => {
    expect(toVectorLiteral([1, NaN, Infinity, -Infinity])).toBe("[1,0,0,0]");
  });
});

describe("isValidEmbedding", () => {
  it("accepts a vector of the fixed dimension", () => {
    expect(isValidEmbedding(new Array(EMBEDDING_DIM).fill(0))).toBe(true);
  });
  it("rejects wrong-length / non-array inputs", () => {
    expect(isValidEmbedding([1, 2, 3])).toBe(false);
    expect(isValidEmbedding([])).toBe(false);
    expect(isValidEmbedding(undefined as unknown as number[])).toBe(false);
  });
});

describe("vectorStoreConfigured", () => {
  it("is false without POSTGRES_URL (dormant default)", () => {
    expect(typeof vectorStoreConfigured()).toBe("boolean");
  });
});
