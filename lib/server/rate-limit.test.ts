import { describe, it, expect } from "vitest";
import { checkRateLimit, clientKey, tooManyRequests } from "@/lib/server/rate-limit";

describe("checkRateLimit", () => {
  it("allows up to the limit, then blocks within the window", () => {
    const store = new Map();
    const opts = { limit: 3, windowMs: 1000 };
    expect(checkRateLimit(store, "k", 0, opts).ok).toBe(true); // 1
    expect(checkRateLimit(store, "k", 100, opts).ok).toBe(true); // 2
    const third = checkRateLimit(store, "k", 200, opts);
    expect(third.ok).toBe(true); // 3
    expect(third.remaining).toBe(0);
    expect(checkRateLimit(store, "k", 300, opts).ok).toBe(false); // 4 → blocked
  });

  it("resets after the window elapses", () => {
    const store = new Map();
    const opts = { limit: 1, windowMs: 1000 };
    expect(checkRateLimit(store, "k", 0, opts).ok).toBe(true);
    expect(checkRateLimit(store, "k", 500, opts).ok).toBe(false);
    expect(checkRateLimit(store, "k", 1000, opts).ok).toBe(true); // new window
  });

  it("tracks keys independently", () => {
    const store = new Map();
    const opts = { limit: 1, windowMs: 1000 };
    expect(checkRateLimit(store, "a", 0, opts).ok).toBe(true);
    expect(checkRateLimit(store, "b", 0, opts).ok).toBe(true);
    expect(checkRateLimit(store, "a", 0, opts).ok).toBe(false);
  });
});

describe("clientKey", () => {
  it("prefers the first x-forwarded-for hop", () => {
    const req = new Request("https://x/api", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(clientKey(req)).toBe("1.2.3.4");
  });
  it("falls back to x-real-ip then anon", () => {
    expect(clientKey(new Request("https://x/api", { headers: { "x-real-ip": "9.9.9.9" } }))).toBe("9.9.9.9");
    expect(clientKey(new Request("https://x/api"))).toBe("anon");
  });
});

describe("tooManyRequests", () => {
  it("is a 429 with Retry-After and rate-limit headers", () => {
    const resetAt = Date.now() + 5000;
    const res = tooManyRequests({ ok: false, remaining: 0, resetAt, limit: 10 });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    // Reset is epoch SECONDS, not ms.
    expect(res.headers.get("X-RateLimit-Reset")).toBe(String(Math.ceil(resetAt / 1000)));
  });
});
