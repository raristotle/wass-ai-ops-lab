/**
 * Per-client rate limiting for the public API routes.
 *
 * A fixed-window counter keyed by client IP. The pure core (`checkRateLimit`)
 * takes an injected store + clock so it is fully unit-testable; the route helper
 * (`rateLimit`) wires it to a per-process store and the request headers.
 *
 * The store is in-memory, so on serverless it is per-instance (best-effort) —
 * still a meaningful cap on per-instance abuse, which matters most for the
 * cost-bearing assistant route. A shared store (Upstash/Redis) is the drop-in
 * upgrade for a strict global limit.
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

/** Best-effort client key from proxy headers. */
export function clientKey(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anon";
}

/** Route helper: rate-limit this request against the per-process store. */
export function rateLimit(req: Request, opts: RateLimitOptions): RateLimitResult {
  return checkRateLimit(rateStore(), `${new URL(req.url).pathname}:${clientKey(req)}`, Date.now(), opts);
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
