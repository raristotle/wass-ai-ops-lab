import { describe, it, expect, afterEach, vi } from "vitest";
import {
  prefetchProductDetail,
  fetchProductDetailCached,
  __resetPrefetchCache,
} from "@/lib/product-finder-prefetch";

afterEach(() => {
  __resetPrefetchCache();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubFetch(impl: (url: string) => Response | Promise<Response>) {
  const spy = vi.fn(async (url: string) => impl(url));
  vi.stubGlobal("fetch", spy);
  return spy;
}

describe("intent-prefetch cache", () => {
  it("dedupes repeat intents for the same product (one network call)", async () => {
    const spy = stubFetch(() => new Response(JSON.stringify({ equivalents: [] }), { status: 200 }));
    prefetchProductDetail("CB-1", "BR-1");
    prefetchProductDetail("CB-1", "BR-1");
    prefetchProductDetail("CB-1", "BR-1");
    await Promise.resolve();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain("/api/products/CB-1");
    expect(spy.mock.calls[0][0]).toContain("branchId=BR-1");
  });

  it("a click (fetchProductDetailCached) reuses the prefetched promise — no second call", async () => {
    const spy = stubFetch(() => new Response(JSON.stringify({ coverage: "A" }), { status: 200 }));
    prefetchProductDetail("CB-2");
    const data = await fetchProductDetailCached("CB-2");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(data).toEqual({ coverage: "A" });
  });

  it("branchId is part of the cache key (different branch → separate fetch)", async () => {
    const spy = stubFetch(() => new Response(JSON.stringify({ equivalents: [] }), { status: 200 }));
    prefetchProductDetail("CB-3", "BR-1");
    prefetchProductDetail("CB-3", "BR-2");
    await Promise.resolve();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("resolves null on a non-OK response without throwing", async () => {
    stubFetch(() => new Response(null, { status: 500 }));
    expect(await fetchProductDetailCached("CB-4")).toBeNull();
  });

  it("resolves null on a network error without throwing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    expect(await fetchProductDetailCached("CB-5")).toBeNull();
  });

  it("respects the in-flight concurrency cap, then proceeds once requests drain", async () => {
    const releases: Array<() => void> = [];
    const spy = vi.fn(
      () => new Promise<Response>((res) => releases.push(() => res(new Response(JSON.stringify({}), { status: 200 })))),
    );
    vi.stubGlobal("fetch", spy);

    // 9 distinct intents, but only MAX_INFLIGHT (6) may be in flight at once.
    for (let i = 0; i < 9; i += 1) prefetchProductDetail(`P-${i}`);
    expect(spy).toHaveBeenCalledTimes(6);

    // Drain the in-flight requests; the cap frees up once their .finally runs.
    releases.forEach((r) => r());
    await new Promise((r) => setTimeout(r, 0)); // flush all pending microtasks

    prefetchProductDetail("P-after");
    expect(spy).toHaveBeenCalledTimes(7);
  });

  it("bounds the cache and evicts the oldest entries (MAX_CACHE)", async () => {
    const spy = stubFetch(() => new Response(JSON.stringify({}), { status: 200 }));
    for (let i = 0; i < 85; i += 1) await fetchProductDetailCached(`E-${i}`);
    const afterFill = spy.mock.calls.length; // 85 distinct fetches

    // E-0 was evicted (cache holds the most recent 80) → re-requesting refetches.
    await fetchProductDetailCached("E-0");
    expect(spy.mock.calls.length).toBe(afterFill + 1);

    // A recent entry is still cached → no new fetch.
    const mid = spy.mock.calls.length;
    await fetchProductDetailCached("E-84");
    expect(spy.mock.calls.length).toBe(mid);
  });
});
