import { describe, it, expect, afterEach } from "vitest";
import {
  embeddingsConfigured,
  embeddingProvider,
  embeddingModel,
  buildEmbeddingRequest,
  parseEmbeddingResponse,
  productEmbeddingText,
  EMBEDDING_DIM,
} from "@/lib/integration/embeddings-live";

afterEach(() => {
  delete process.env.EMBEDDINGS_API_KEY;
  delete process.env.EMBEDDINGS_PROVIDER;
  delete process.env.EMBEDDINGS_MODEL;
});

describe("embeddings dormancy + config", () => {
  it("is dormant without a key", () => {
    expect(embeddingsConfigured()).toBe(false);
  });
  it("configures once the key is set", () => {
    process.env.EMBEDDINGS_API_KEY = "k";
    expect(embeddingsConfigured()).toBe(true);
  });
  it("defaults to voyage / voyage-4-lite", () => {
    expect(embeddingProvider()).toBe("voyage");
    expect(embeddingModel()).toBe("voyage-4-lite");
  });
  it("honors provider + model overrides", () => {
    process.env.EMBEDDINGS_PROVIDER = "openai";
    expect(embeddingProvider()).toBe("openai");
    expect(embeddingModel()).toBe("text-embedding-3-small");
    process.env.EMBEDDINGS_MODEL = "text-embedding-3-large";
    expect(embeddingModel()).toBe("text-embedding-3-large");
  });
  it("falls back to voyage for an unknown provider", () => {
    process.env.EMBEDDINGS_PROVIDER = "bogus";
    expect(embeddingProvider()).toBe("voyage");
  });
});

describe("buildEmbeddingRequest", () => {
  it("voyage uses input + input_type + output_dimension", () => {
    const r = buildEmbeddingRequest("voyage", "voyage-4-lite", ["a", "b"], "query", "KEY");
    expect(r.url).toContain("voyageai.com");
    expect(r.headers.Authorization).toBe("Bearer KEY");
    expect(r.body.input).toEqual(["a", "b"]);
    expect(r.body.input_type).toBe("query");
    expect(r.body.output_dimension).toBe(EMBEDDING_DIM);
  });
  it("openai uses input + dimensions", () => {
    const r = buildEmbeddingRequest("openai", "text-embedding-3-small", ["a"], "document", "KEY");
    expect(r.url).toContain("openai.com");
    expect(r.body.dimensions).toBe(EMBEDDING_DIM);
  });
  it("cohere maps input_type to search_query/search_document", () => {
    const q = buildEmbeddingRequest("cohere", "embed-v4.0", ["a"], "query", "KEY");
    expect(q.body.input_type).toBe("search_query");
    const d = buildEmbeddingRequest("cohere", "embed-v4.0", ["a"], "document", "KEY");
    expect(d.body.input_type).toBe("search_document");
    expect(d.body.output_dimension).toBe(EMBEDDING_DIM);
  });
});

describe("parseEmbeddingResponse", () => {
  it("parses voyage/openai data[].embedding", () => {
    const v = parseEmbeddingResponse("voyage", { data: [{ embedding: [1, 2] }, { embedding: [3, 4] }] });
    expect(v).toEqual([[1, 2], [3, 4]]);
  });
  it("parses cohere embeddings.float", () => {
    expect(parseEmbeddingResponse("cohere", { embeddings: { float: [[1, 2]] } })).toEqual([[1, 2]]);
  });
  it("returns null on a bad shape", () => {
    expect(parseEmbeddingResponse("voyage", {})).toBeNull();
    expect(parseEmbeddingResponse("voyage", { data: [{ embedding: "x" }] })).toBeNull();
    expect(parseEmbeddingResponse("cohere", { embeddings: {} })).toBeNull();
    expect(parseEmbeddingResponse("voyage", null)).toBeNull();
  });
});

describe("productEmbeddingText", () => {
  it("concatenates name, brand, subcategory, and spec values", () => {
    const t = productEmbeddingText({
      name: "QO 20A Breaker",
      brand: "Square D",
      subcategory: "Circuit Breakers",
      specs: [{ name: "Amperage", value: "20A" }, { name: "Poles", value: "1" }],
    });
    expect(t).toBe("QO 20A Breaker Square D Circuit Breakers Amperage 20A Poles 1");
  });
  it("handles missing specs", () => {
    expect(productEmbeddingText({ name: "X", brand: "Y", subcategory: "Z" })).toBe("X Y Z");
  });
});
