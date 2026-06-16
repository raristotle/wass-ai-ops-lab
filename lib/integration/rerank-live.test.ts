import { describe, it, expect, afterEach, vi } from "vitest";
import { rerankConfigured, applyRerank, rerankCandidates } from "@/lib/integration/rerank-live";

type Cand = { id: string; text: string };
const CANDS: Cand[] = [
  { id: "a", text: "Bridgeport 250-DC2 3/4 EMT compression connector, die-cast" },
  { id: "b", text: "Appleton TWC75 3/4 EMT raintight compression connector, steel" },
  { id: "c", text: "T&B 5123 1/2 EMT set-screw connector" },
];

afterEach(() => {
  delete process.env.COHERE_API_KEY;
  delete process.env.COHERE_RERANK_MODEL;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("rerankConfigured", () => {
  it("is false when the key is unset (dormant)", () => {
    expect(rerankConfigured()).toBe(false);
  });
  it("is true when the key is set", () => {
    process.env.COHERE_API_KEY = "co-test";
    expect(rerankConfigured()).toBe(true);
  });
});

describe("applyRerank (pure merge-back)", () => {
  it("reorders candidates by results and attaches the relevance score", () => {
    const out = applyRerank(CANDS, [
      { index: 1, relevance_score: 0.98 },
      { index: 0, relevance_score: 0.71 },
      { index: 2, relevance_score: 0.04 },
    ]);
    expect(out.map((o) => o.id)).toEqual(["b", "a", "c"]);
    expect(out[0].rerankScore).toBe(0.98);
  });

  it("appends candidates the API did not return (top_n) in original order, score 0", () => {
    const out = applyRerank(CANDS, [{ index: 2, relevance_score: 0.9 }]);
    expect(out.map((o) => o.id)).toEqual(["c", "a", "b"]);
    expect(out[1].rerankScore).toBe(0);
    expect(out[2].rerankScore).toBe(0);
  });

  it("ignores out-of-range and duplicate indices (never shrinks or throws)", () => {
    const out = applyRerank(CANDS, [
      { index: 5, relevance_score: 0.9 }, // out of range
      { index: 1, relevance_score: 0.8 },
      { index: 1, relevance_score: 0.7 }, // duplicate
    ]);
    expect(out.map((o) => o.id)).toEqual(["b", "a", "c"]);
    expect(out.length).toBe(CANDS.length);
  });
});

describe("rerankCandidates", () => {
  it("returns no-keys and makes NO network call when dormant", async () => {
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await rerankCandidates("emt connector", CANDS, (c) => c.text);
    expect(r).toEqual({ enabled: false, reason: "no-keys" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to v2/rerank with a Bearer key and returns the reranked items when configured", async () => {
    process.env.COHERE_API_KEY = "co-test";
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchSpy = vi.fn(async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify({ results: [{ index: 1, relevance_score: 0.99 }, { index: 0, relevance_score: 0.5 }] }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchSpy);

    const r = await rerankCandidates("emt connector", CANDS, (c) => c.text, { topN: 2 });
    expect(r.enabled).toBe(true);
    if (r.enabled) {
      expect(r.items[0].id).toBe("b");
      expect(r.items[0].rerankScore).toBe(0.99);
      expect(r.model).toBe("rerank-v4.0-pro");
    }
    expect(calls[0].url).toContain("/v2/rerank");
    expect(new Headers(calls[0].init?.headers).get("authorization")).toBe("Bearer co-test");
  });

  it("falls back to no-network error (never throws) on a Cohere error", async () => {
    process.env.COHERE_API_KEY = "co-test";
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi.fn(async (): Promise<Response> => new Response("nope", { status: 429 }));
    vi.stubGlobal("fetch", fetchSpy);
    const r = await rerankCandidates("x", CANDS, (c) => c.text);
    expect(r).toEqual({ enabled: false, reason: "error" });
  });
});
