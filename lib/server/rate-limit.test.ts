import { describe, it, expect } from "vitest";
import { checkRateLimit, clientKey, tooManyRequests, rateLimiterConfigured, rateLimit } from "@/lib/server/rate-limit";

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

describe("rateLimiterConfigured", () => {
  it("is false when Upstash env vars are unset (dormant default)", () => {
    expect(rateLimiterConfigured()).toBe(false);
  });

  it("activates on the Upstash-native names", () => {
    const prev = { ...process.env };
    try {
      process.env.UPSTASH_REDIS_REST_URL = "https://x.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "tok";
      expect(rateLimiterConfigured()).toBe(true);
    } finally {
      process.env = prev;
    }
  });

  it("also activates on the legacy KV_REST_API_* names", () => {
    const prev = { ...process.env };
    try {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      process.env.KV_REST_API_URL = "https://x.upstash.io";
      process.env.KV_REST_API_TOKEN = "tok";
      expect(rateLimiterConfigured()).toBe(true);
    } finally {
      process.env = prev;
    }
  });
});

describe("rateLimit (route helper, Upstash unconfigured)", () => {
  it("falls back to the in-memory limiter and enforces the limit per client", async () => {
    const headers = { "x-forwarded-for": "203.0.113.7" };
    const url = "https://x/api/unique-test-path";
    const opts = { limit: 2, windowMs: 60_000 };
    expect((await rateLimit(new Request(url, { headers }), opts)).ok).toBe(true); // 1
    expect((await rateLimit(new Request(url, { headers }), opts)).ok).toBe(true); // 2
    expect((await rateLimit(new Request(url, { headers }), opts)).ok).toBe(false); // 3 → blocked
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
