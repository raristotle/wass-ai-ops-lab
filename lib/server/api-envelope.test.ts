import { describe, it, expect } from "vitest";
import { apiError, encodeCursor, decodeCursor, nextCursor } from "@/lib/server/api-envelope";

describe("B16 — typed error envelope", () => {
  it("keeps the human `error` string and adds a machine `code`", async () => {
    const res = apiError("invalid_request", "bad request", 400);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad request", code: "invalid_request" });
  });

  it("carries retryAfterMs on retryable errors", async () => {
    const res = apiError("rate_limited", "slow down", 429, { retryAfterMs: 3000 });
    const j = await res.json();
    expect(j.code).toBe("rate_limited");
    expect(j.retryAfterMs).toBe(3000);
  });
});

describe("B16 — opaque cursor pagination", () => {
  it("round-trips a page number through the opaque cursor", () => {
    expect(decodeCursor(encodeCursor(3))).toBe(3);
    expect(decodeCursor(encodeCursor(1))).toBe(1);
  });

  it("decodes absent/garbage cursors to page 1 (never throws)", () => {
    expect(decodeCursor(null)).toBe(1);
    expect(decodeCursor(undefined)).toBe(1);
    expect(decodeCursor("")).toBe(1);
    expect(decodeCursor("$$not valid$$")).toBe(1);
  });

  it("nextCursor points to the next page only while more results remain", () => {
    // 30 total, page 1 × size 12 → 12 < 30, more → cursor decodes to page 2
    expect(decodeCursor(nextCursor(1, 12, 30))).toBe(2);
    // page 3 × 12 = 36 ≥ 30 → last page → no cursor
    expect(nextCursor(3, 12, 30)).toBeUndefined();
    // pageSize 0 is guarded
    expect(nextCursor(1, 0, 30)).toBeUndefined();
  });
});
