import { describe, it, expect, afterEach, vi } from "vitest";
import { embedTexts, embedQuery, EMBEDDING_DIM } from "@/lib/integration/embeddings-live";

// Silence the structured logApiError stderr noise on the error paths and keep
// assertions deterministic. fetch is stubbed per-test; the dormant paths never
// touch the network at all.
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.EMBEDDINGS_API_KEY;
  delete process.env.EMBEDDINGS_PROVIDER;
  delete process.env.EMBEDDINGS_MODEL;
});

function voyageBody(vecs: number[][]) {
  return JSON.stringify({ data: vecs.map((embedding) => ({ embedding })) });
}

describe("embedTexts — dormant gate (no network)", () => {
  it("returns null with no key set, and never calls fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await embedTexts(["hello"], "query")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns null for an empty input array even with a key, and never calls fetch", async () => {
    process.env.EMBEDDINGS_API_KEY = "k";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await embedTexts([], "document")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("embedTexts — live success path", () => {
  it("voyage: parses data[].embedding and returns the vectors", async () => {
    process.env.EMBEDDINGS_API_KEY = "vk";
    const vecs = [[1, 2, 3], [4, 5, 6]];
    const fetchSpy = vi.fn(async () => new Response(voyageBody(vecs), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    const out = await embedTexts(["a", "b"], "document");
    expect(out).toEqual(vecs);

    // Sanity-check the request the live path actually issued.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("voyageai.com");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer vk");
    const sent = JSON.parse(init.body as string);
    expect(sent.input).toEqual(["a", "b"]);
    expect(sent.input_type).toBe("document");
    expect(sent.output_dimension).toBe(EMBEDDING_DIM);
  });

  it("openai: parses data[].embedding via EMBEDDINGS_PROVIDER override", async () => {
    process.env.EMBEDDINGS_API_KEY = "ok";
    process.env.EMBEDDINGS_PROVIDER = "openai";
    const vecs = [[7, 8]];
    const fetchSpy = vi.fn(async () => new Response(voyageBody(vecs), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    expect(await embedTexts(["x"], "query")).toEqual(vecs);
    const [url] = fetchSpy.mock.calls[0] as unknown as [string];
    expect(url).toContain("openai.com");
  });

  it("cohere: parses embeddings.float", async () => {
    process.env.EMBEDDINGS_API_KEY = "ck";
    process.env.EMBEDDINGS_PROVIDER = "cohere";
    const vecs = [[9, 10], [11, 12]];
    const body = JSON.stringify({ embeddings: { float: vecs } });
    const fetchSpy = vi.fn(async () => new Response(body, { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    expect(await embedTexts(["a", "b"], "document")).toEqual(vecs);
    const [url] = fetchSpy.mock.calls[0] as unknown as [string];
    expect(url).toContain("cohere.com");
  });
});

describe("embedTexts — fail-soft to null", () => {
  it("non-OK HTTP status ⇒ null (logged, not thrown)", async () => {
    process.env.EMBEDDINGS_API_KEY = "vk";
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    expect(await embedTexts(["a"], "query")).toBeNull();
    expect(errSpy).toHaveBeenCalled();
  });

  it("fetch rejects (network/timeout) ⇒ null", async () => {
    process.env.EMBEDDINGS_API_KEY = "vk";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("net");
    }));
    expect(await embedTexts(["a"], "query")).toBeNull();
  });

  it("malformed JSON body ⇒ null (res.json() rejects, caught to null)", async () => {
    process.env.EMBEDDINGS_API_KEY = "vk";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not json", { status: 200 })));
    expect(await embedTexts(["a"], "query")).toBeNull();
  });

  it("parse returns null on a bad shape ⇒ null", async () => {
    process.env.EMBEDDINGS_API_KEY = "vk";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ nope: true }), { status: 200 })));
    expect(await embedTexts(["a"], "query")).toBeNull();
  });

  it("vector count != input count ⇒ null (length-mismatch guard)", async () => {
    process.env.EMBEDDINGS_API_KEY = "vk";
    // Ask for two texts but the provider returns one vector.
    const fetchSpy = vi.fn(async () => new Response(voyageBody([[1, 2]]), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    expect(await embedTexts(["a", "b"], "document")).toBeNull();
  });
});

describe("embedQuery", () => {
  it("returns the first vector on success", async () => {
    process.env.EMBEDDINGS_API_KEY = "vk";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(voyageBody([[0.1, 0.2, 0.3]]), { status: 200 })));
    expect(await embedQuery("router")).toEqual([0.1, 0.2, 0.3]);
  });

  it("returns null when dormant (no key)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await embedQuery("router")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns null when the underlying embedTexts fails", async () => {
    process.env.EMBEDDINGS_API_KEY = "vk";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    expect(await embedQuery("router")).toBeNull();
  });
});
