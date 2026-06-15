/**
 * Per-client rate limiting for the public API routes.
 *
 * A fixed-window counter keyed by client IP. The pure core (`checkRateLimit`)
 * takes an injected store + clock so it is fully unit-testable; the route helper
 * (`rateLimit`) picks the backend per request.
 *
 * Two backends: when UPSTASH_REDIS_REST_URL/_TOKEN are set, requests count
 * through Upstash Redis over REST — a true GLOBAL cap across serverless instances
 * (one INCR/PEXPIRE/PTTL pipeline per request). Otherwise an in-memory per-process
 * store (best-effort per-instance cap, which still matters most for the
 * cost-bearing assistant route). An Upstash error falls back to in-memory, so a
 * Redis blip never takes a route down.
 */

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Epoch ms when the current window resets. */
  resetAt: number;
  limit: number;
}

interface RateState {
  count: number;
  windowStart: number;
}

/** Pure fixed-window check over an injected store + clock. */
export function checkRateLimit(
  store: Map<string, RateState>,
  key: string,
  now: number,
  opts: RateLimitOptions
): RateLimitResult {
  const cur = store.get(key);
  if (!cur || now - cur.windowStart >= opts.windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { ok: true, remaining: opts.limit - 1, resetAt: now + opts.windowMs, limit: opts.limit };
  }
  cur.count += 1;
  return {
    ok: cur.count <= opts.limit,
    remaining: Math.max(0, opts.limit - cur.count),
    resetAt: cur.windowStart + opts.windowMs,
    limit: opts.limit,
  };
}

const g = globalThis as unknown as { __rateStore?: Map<string, RateState> };
function rateStore(): Map<string, RateState> {
  return (g.__rateStore ??= new Map());
}

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

function upstash(): { url: string; token: string } | null {
  const url = env("UPSTASH_REDIS_REST_URL");
  const token = env("UPSTASH_REDIS_REST_TOKEN");
  return url && token ? { url, token } : null;
}

/** True when a shared (global, cross-instance) Upstash rate-limit store is configured. */
export function rateLimiterConfigured(): boolean {
  return upstash() !== null;
}

/** Best-effort client key from proxy headers. */
export function clientKey(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anon";
}

/** Shared fixed-window via Upstash REST: INCR + (NX) PEXPIRE + PTTL in one pipeline. */
async function upstashCheck(cfg: { url: string; token: string }, key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  const res = await fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["PEXPIRE", key, String(opts.windowMs), "NX"],
      ["PTTL", key],
    ]),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const data = (await res.json()) as { result?: number }[];
  const count = Number(data[0]?.result ?? 1);
  const pttl = Number(data[2]?.result ?? opts.windowMs);
  return {
    ok: count <= opts.limit,
    remaining: Math.max(0, opts.limit - count),
    resetAt: Date.now() + (pttl > 0 ? pttl : opts.windowMs),
    limit: opts.limit,
  };
}

/**
 * Route helper: rate-limit this request. Uses the shared Upstash store when
 * configured (a true GLOBAL cap across serverless instances); otherwise the
 * per-instance in-memory store (best-effort). Falls back to in-memory if Upstash
 * errors, so a Redis blip never takes the route down.
 */
export async function rateLimit(req: Request, opts: RateLimitOptions): Promise<RateLimitResult> {
  const key = `rl:${new URL(req.url).pathname}:${clientKey(req)}`;
  const cfg = upstash();
  if (cfg) {
    try {
      return await upstashCheck(cfg, key, opts);
    } catch {
      // fall through to the in-memory limiter on any Upstash error
    }
  }
  return checkRateLimit(rateStore(), key, Date.now(), opts);
}

/** Build a 429 response with a Retry-After header from a limit result. */
export function tooManyRequests(result: RateLimitResult): Response {
  const retrySec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded — slow down and try again shortly." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retrySec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        // Epoch seconds when the current window resets (standard convention).
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}
