import { describe, it, expect, afterEach, vi } from "vitest";
import {
  checkRateLimit,
  rateLimit,
  rateLimiterConfigured,
  tooManyRequests,
} from "@/lib/server/rate-limit";

/**
 * Coverage companion for lib/server/rate-limit.ts. Targets the previously
 * untested Upstash REST path inside `rateLimit` (success, non-OK → throw →
 * in-memory fallback, network throw → fallback, and the data-parsing edge
 * cases inside `upstashCheck`), plus the Retry-After floor in
 * `tooManyRequests` and the `remaining` clamp in `checkRateLimit`.
 *
 * The Upstash backend is reached purely through the exported `rateLimit`
 * helper; the network is mocked via a stubbed global `fetch`.
 */

const UPSTASH_URL = "https://example.upstash.io";

function configureUpstash() {
  process.env.UPSTASH_REDIS_REST_URL = UPSTASH_URL;
  process.env.UPSTASH_REDIS_REST_TOKEN = "tok";
}

function upstashBody(count: number, pttl: number) {
  // Upstash REST pipeline returns one {result} object per command, in order:
  // [INCR, PEXPIRE, PTTL].
  return JSON.stringify([{ result: count }, { result: 1 }, { result: pttl }]);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
});

describe("rateLimit via Upstash (configured, network mocked)", () => {
  it("uses the shared store: parses INCR count + PTTL into an allowed result", async () => {
    configureUpstash();
    const fetchMock = vi.fn(
      async () => new Response(upstashBody(1, 45_000), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    expect(rateLimiterConfigured()).toBe(true);

    const before = Date.now();
    const res = await rateLimit(
      new Request("https://x/api/upstash-ok", {
        headers: { "x-forwarded-for": "198.51.100.5" },
      }),
      { limit: 10, windowMs: 60_000 }
    );

    expect(res.ok).toBe(true);
    expect(res.limit).toBe(10);
    expect(res.remaining).toBe(9); // limit - count
    // resetAt = now + pttl (pttl > 0), so it sits ~45s ahead of "before".
    expect(res.resetAt).toBeGreaterThanOrEqual(before + 45_000);
    expect(res.resetAt).toBeLessThanOrEqual(Date.now() + 45_000);

    // Confirm we actually hit the Upstash pipeline endpoint with auth + body.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(calledUrl).toBe(`${UPSTASH_URL}/pipeline`);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok"
    );
    const sent = JSON.parse(init.body as string);
    expect(sent[0]).toEqual(["INCR", expect.stringContaining("rl:")]);
    expect(sent[1]).toEqual([
      "PEXPIRE",
      expect.stringContaining("rl:"),
      "60000",
      "NX",
    ]);
    expect(sent[2][0]).toBe("PTTL");
  });

  it("blocks (ok=false) once the INCR count exceeds the limit, remaining clamped to 0", async () => {
    configureUpstash();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(upstashBody(7, 30_000), { status: 200 }))
    );

    const res = await rateLimit(
      new Request("https://x/api/upstash-over", {
        headers: { "x-forwarded-for": "198.51.100.6" },
      }),
      { limit: 5, windowMs: 60_000 }
    );

    expect(res.ok).toBe(false);
    expect(res.remaining).toBe(0); // Math.max(0, 5 - 7) clamps
    expect(res.limit).toBe(5);
  });

  it("falls back to windowMs for resetAt when PTTL is non-positive (-1 / -2)", async () => {
    configureUpstash();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(upstashBody(1, -2), { status: 200 }))
    );

    const before = Date.now();
    const res = await rateLimit(
      new Request("https://x/api/upstash-no-ttl", {
        headers: { "x-forwarded-for": "198.51.100.7" },
      }),
      { limit: 3, windowMs: 60_000 }
    );

    expect(res.ok).toBe(true);
    // pttl <= 0 → resetAt = now + windowMs (not now + (-2)).
    expect(res.resetAt).toBeGreaterThanOrEqual(before + 60_000);
  });

  it("defaults missing INCR/PTTL results (treats as first request)", async () => {
    configureUpstash();
    // Empty array → data[0]?.result undefined → count defaults to 1; pttl → windowMs.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }))
    );

    const before = Date.now();
    const res = await rateLimit(
      new Request("https://x/api/upstash-empty", {
        headers: { "x-forwarded-for": "198.51.100.8" },
      }),
      { limit: 4, windowMs: 60_000 }
    );

    expect(res.ok).toBe(true);
    expect(res.remaining).toBe(3); // 4 - 1
    expect(res.resetAt).toBeGreaterThanOrEqual(before + 60_000);
  });

  it("activates and parses through the legacy KV_REST_API_* names too", async () => {
    process.env.KV_REST_API_URL = UPSTASH_URL;
    process.env.KV_REST_API_TOKEN = "kvtok";
    const fetchMock = vi.fn(
      async () => new Response(upstashBody(2, 50_000), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await rateLimit(
      new Request("https://x/api/kv-names", {
        headers: { "x-forwarded-for": "198.51.100.9" },
      }),
      { limit: 10, windowMs: 60_000 }
    );

    expect(res.ok).toBe(true);
    expect(res.remaining).toBe(8); // 10 - 2
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer kvtok"
    );
  });
});

describe("rateLimit Upstash error → in-memory fallback (never takes the route down)", () => {
  it("falls back to the in-memory limiter on a non-OK Upstash response", async () => {
    configureUpstash();
    // 500 → upstashCheck throws → rateLimit catches → in-memory limiter runs.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 }))
    );

    const headers = { "x-forwarded-for": "192.0.2.50" };
    const url = "https://x/api/upstash-500-fallback";
    const opts = { limit: 2, windowMs: 60_000 };

    // In-memory store enforces the limit per client even though Upstash is "down".
    expect((await rateLimit(new Request(url, { headers }), opts)).ok).toBe(true); // 1
    expect((await rateLimit(new Request(url, { headers }), opts)).ok).toBe(true); // 2
    expect((await rateLimit(new Request(url, { headers }), opts)).ok).toBe(false); // 3
  });

  it("falls back to the in-memory limiter when fetch throws (network blip)", async () => {
    configureUpstash();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      })
    );

    const headers = { "x-forwarded-for": "192.0.2.51" };
    const url = "https://x/api/upstash-throw-fallback";
    const opts = { limit: 1, windowMs: 60_000 };

    const first = await rateLimit(new Request(url, { headers }), opts);
    expect(first.ok).toBe(true);
    expect(first.limit).toBe(1);
    // Second hit on the same key is blocked by the in-memory limiter.
    expect((await rateLimit(new Request(url, { headers }), opts)).ok).toBe(false);
  });
});

describe("checkRateLimit remaining clamp on the existing-window branch", () => {
  it("never reports negative remaining once well over the limit", () => {
    const store = new Map();
    const opts = { limit: 1, windowMs: 1000 };
    expect(checkRateLimit(store, "k", 0, opts).remaining).toBe(0); // count 1
    expect(checkRateLimit(store, "k", 10, opts).remaining).toBe(0); // count 2 → clamp
    const third = checkRateLimit(store, "k", 20, opts);
    expect(third.ok).toBe(false);
    expect(third.remaining).toBe(0); // count 3 → still clamped, not -2
  });
});

describe("tooManyRequests Retry-After floor", () => {
  it("never emits a Retry-After below 1 even when resetAt is already past", () => {
    const res = tooManyRequests({
      ok: false,
      remaining: 0,
      resetAt: Date.now() - 10_000, // window already elapsed
      limit: 7,
    });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("Retry-After"))).toBe(1); // Math.max(1, …)
    expect(res.headers.get("X-RateLimit-Limit")).toBe("7");
  });
});
