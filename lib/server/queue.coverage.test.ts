import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { queueConfigured, getJobQueue, InlineQueue, type JobQueue } from "@/lib/server/queue";

// The module caches the process queue on globalThis (like the catalog), so we
// scrub that cache and the gate env between tests for determinism.
const g = globalThis as unknown as { __jobQueue?: unknown };

beforeEach(() => {
  delete g.__jobQueue;
  delete process.env.REDIS_URL;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete g.__jobQueue;
  delete process.env.REDIS_URL;
});

describe("queueConfigured", () => {
  it("is false when REDIS_URL is unset (dormant default)", () => {
    expect(queueConfigured()).toBe(false);
  });

  it("is true when REDIS_URL holds a non-empty value", () => {
    process.env.REDIS_URL = "redis://default:pw@host:6379";
    expect(queueConfigured()).toBe(true);
  });

  it("treats a whitespace-only REDIS_URL as unset (env() trims to null)", () => {
    process.env.REDIS_URL = "   ";
    expect(queueConfigured()).toBe(false);
  });

  it("trims surrounding whitespace before reporting configured", () => {
    process.env.REDIS_URL = "  redis://host:6379  ";
    expect(queueConfigured()).toBe(true);
  });
});

describe("getJobQueue", () => {
  it("returns an InlineQueue by default (dormant, mode=inline)", () => {
    const q = getJobQueue();
    expect(q).toBeInstanceOf(InlineQueue);
    expect(q.mode).toBe("inline");
  });

  it("caches the instance on globalThis (same reference across calls)", () => {
    const first = getJobQueue();
    const second = getJobQueue();
    expect(second).toBe(first);
  });

  it("reuses a pre-seeded globalThis queue instead of constructing a new one", () => {
    const seeded = new InlineQueue();
    g.__jobQueue = seeded;
    expect(getJobQueue()).toBe(seeded);
  });
});

describe("InlineQueue.enqueue", () => {
  it("runs the handler inline and resolves to undefined", async () => {
    const q = new InlineQueue();
    let seen: number | null = null;
    const result = await q.enqueue("compute", { n: 42 }, async (d: { n: number }) => {
      seen = d.n;
    });
    expect(seen).toBe(42);
    expect(result).toBeUndefined();
  });

  it("awaits a synchronous (void-returning) handler too", async () => {
    const q = new InlineQueue();
    let ran = false;
    // Handler returns void, not a Promise — the `await` must still work.
    await q.enqueue("sync", { x: 1 }, (_d: { x: number }) => {
      ran = true;
    });
    expect(ran).toBe(true);
  });

  it("routes a thrown handler error to logApiError and never throws into the caller", async () => {
    const q = new InlineQueue();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      q.enqueue("boom", { id: "abc" }, async () => {
        throw new Error("handler exploded");
      }),
    ).resolves.toBeUndefined();

    // logApiError emits one JSON line tagged with the namespaced route.
    expect(errSpy).toHaveBeenCalledTimes(1);
    const line = JSON.parse(errSpy.mock.calls[0][0] as string);
    expect(line.route).toBe("queue:boom");
    expect(line.message).toBe("handler exploded");
    expect(line.level).toBe("error");
  });

  it("catches a synchronously-thrown handler error as well", async () => {
    const q = new InlineQueue();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      q.enqueue("syncthrow", {}, () => {
        throw new Error("sync boom");
      }),
    ).resolves.toBeUndefined();

    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(errSpy.mock.calls[0][0] as string).route).toBe("queue:syncthrow");
  });

  it("accepts (and harmlessly ignores) EnqueueOptions inline — delayMs/jobId do not affect execution", async () => {
    // The JobQueue contract declares opts; InlineQueue ignores it inline.
    const q: JobQueue = new InlineQueue();
    let seen: string | null = null;
    await q.enqueue(
      "with-opts",
      { v: "hi" },
      async (d: { v: string }) => {
        seen = d.v;
      },
      { delayMs: 5000, jobId: "fixed-id" },
    );
    expect(seen).toBe("hi");
  });

  it("exposes mode='inline' as a readonly discriminant", () => {
    expect(new InlineQueue().mode).toBe("inline");
  });
});
