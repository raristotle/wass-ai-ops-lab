import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIntentPrefetch } from "@/features/product-finder/useIntentPrefetch";
import { __resetPrefetchCache, fetchProductDetailCached } from "@/lib/product-finder-prefetch";

/**
 * useIntentPrefetch returns DOM handlers (onMouseEnter / onFocus / onTouchStart)
 * that warm the product-detail cache via prefetchProductDetail. These tests
 * exercise its returned API with renderHook, drive the handlers, and assert the
 * underlying fetch is warmed with the right URL (incl. branchId encoding), plus
 * the useMemo stability/recompute branches.
 */

function fetchMock() {
  return vi.fn(async () => ({ ok: true, json: async () => ({ product: { id: "x" } }) }));
}

function fetchUrls(fn: ReturnType<typeof fetchMock>): string[] {
  return (fn.mock.calls as unknown as [string][]).map((c) => c[0]);
}

describe("useIntentPrefetch (hook)", () => {
  beforeEach(() => {
    __resetPrefetchCache();
    vi.stubGlobal("fetch", fetchMock());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    __resetPrefetchCache();
  });

  it("returns the three intent handlers as functions", () => {
    const { result } = renderHook(() => useIntentPrefetch("P-1", "BR-9"));
    expect(typeof result.current.onMouseEnter).toBe("function");
    expect(typeof result.current.onFocus).toBe("function");
    expect(typeof result.current.onTouchStart).toBe("function");
    // All three share the same warm() reference.
    expect(result.current.onMouseEnter).toBe(result.current.onFocus);
    expect(result.current.onFocus).toBe(result.current.onTouchStart);
  });

  it("onMouseEnter warms the detail endpoint with the encoded branchId", () => {
    const fetch = globalThis.fetch as unknown as ReturnType<typeof fetchMock>;
    const { result } = renderHook(() => useIntentPrefetch("ABC 1", "BR/9"));
    act(() => {
      result.current.onMouseEnter();
    });
    const urls = fetchUrls(fetch);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe("/api/products/ABC%201?branchId=BR%2F9");
  });

  it("onFocus warms with no branch query when branchId is omitted", () => {
    const fetch = globalThis.fetch as unknown as ReturnType<typeof fetchMock>;
    const { result } = renderHook(() => useIntentPrefetch("P-2"));
    act(() => {
      result.current.onFocus();
    });
    const urls = fetchUrls(fetch);
    expect(urls).toEqual(["/api/products/P-2"]);
  });

  it("dedupes repeat intents through the shared module cache", () => {
    const fetch = globalThis.fetch as unknown as ReturnType<typeof fetchMock>;
    const { result } = renderHook(() => useIntentPrefetch("DUP", "BR-1"));
    act(() => {
      result.current.onMouseEnter();
      result.current.onFocus();
      result.current.onTouchStart();
    });
    // Three intents, one in-flight fetch (cache dedupe).
    expect(fetchUrls(fetch)).toHaveLength(1);
    // A subsequent real click reuses the warmed promise — still no new fetch.
    void fetchProductDetailCached("DUP", "BR-1");
    expect(fetchUrls(fetch)).toHaveLength(1);
  });

  it("is a no-op for an empty id (no fetch issued)", () => {
    const fetch = globalThis.fetch as unknown as ReturnType<typeof fetchMock>;
    const { result } = renderHook(() => useIntentPrefetch(""));
    act(() => {
      result.current.onMouseEnter();
    });
    expect(fetchUrls(fetch)).toHaveLength(0);
  });

  it("memoizes the handler object across re-renders with unchanged props", () => {
    const { result, rerender } = renderHook(
      ({ id, branchId }: { id: string; branchId?: string }) => useIntentPrefetch(id, branchId),
      { initialProps: { id: "P-1", branchId: "BR-1" } },
    );
    const first = result.current;
    rerender({ id: "P-1", branchId: "BR-1" });
    expect(result.current).toBe(first); // same object identity (useMemo deps unchanged)
  });

  it("recomputes the handlers when id or branchId changes, warming each distinctly", () => {
    const fetch = globalThis.fetch as unknown as ReturnType<typeof fetchMock>;
    const { result, rerender } = renderHook(
      ({ id, branchId }: { id: string; branchId?: string }) => useIntentPrefetch(id, branchId),
      { initialProps: { id: "P-1", branchId: "BR-1" } },
    );
    const first = result.current;
    act(() => {
      result.current.onMouseEnter();
    });

    rerender({ id: "P-2", branchId: "BR-1" }); // id changed → new memo object
    expect(result.current).not.toBe(first);
    act(() => {
      result.current.onMouseEnter();
    });

    const urls = fetchUrls(fetch).sort();
    expect(urls).toEqual(["/api/products/P-1?branchId=BR-1", "/api/products/P-2?branchId=BR-1"]);
  });
});
