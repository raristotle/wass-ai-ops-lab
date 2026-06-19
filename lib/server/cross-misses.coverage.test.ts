import { describe, it, expect, afterEach, vi } from "vitest";
import { MemoryStore } from "@/lib/server/persistence";

// We mock the persistence seam so we can drive BOTH the happy path (a real
// in-memory store) and the fail-closed catch paths (a store whose methods
// throw) deterministically, without standing up Neon/Postgres.
const stubs = vi.hoisted(() => ({
  getStore: vi.fn(),
  // mutate is re-exported from persistence; default to the real behavior by
  // delegating to the store the test installed via getStore().
  mutate: vi.fn(),
}));

vi.mock("@/lib/server/persistence", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/server/persistence")>();
  return {
    ...real,
    getStore: stubs.getStore,
    mutate: stubs.mutate,
  };
});

import { recordCrossMiss, topCrossGaps, type CrossMiss } from "@/lib/server/cross-misses";

const NS = "cross-misses";

afterEach(() => {
  vi.restoreAllMocks();
  stubs.getStore.mockReset();
  stubs.mutate.mockReset();
});

/** Install a real MemoryStore behind getStore() and a mutate that uses it. */
function useMemoryStore(): MemoryStore {
  const store = new MemoryStore();
  stubs.getStore.mockReturnValue(store);
  // Faithful re-implementation of the real mutate over the same store, so
  // recordCrossMiss exercises its real updater (count++/hint/lastMissAt).
  stubs.mutate.mockImplementation(
    async (
      s: MemoryStore,
      namespace: string,
      key: string,
      updater: (cur: unknown) => unknown,
    ) => {
      const cur = await s.getVersioned<unknown>(namespace, key);
      const next = updater(cur?.value ?? null);
      if (next === null) return null;
      await s.compareAndPut(namespace, key, next, cur?.version ?? 0);
      return next;
    },
  );
  return store;
}

describe("recordCrossMiss", () => {
  it("normalizes the SKU (trim + uppercase) and creates a count=1 record", async () => {
    const store = useMemoryStore();
    vi.spyOn(Date, "now").mockReturnValue(1_000);

    await recordCrossMiss("  ab-123  ", "Hubbell");

    const rec = await store.get<CrossMiss>(NS, "AB-123");
    expect(rec).toEqual({ sku: "AB-123", count: 1, lastMissAt: 1_000, hint: "Hubbell" });
  });

  it("increments the count on a repeat miss and refreshes lastMissAt", async () => {
    const store = useMemoryStore();
    const now = vi.spyOn(Date, "now");

    now.mockReturnValue(1_000);
    await recordCrossMiss("X1");
    now.mockReturnValue(2_000);
    await recordCrossMiss("x1"); // same key after uppercase

    const rec = await store.get<CrossMiss>(NS, "X1");
    expect(rec).toEqual({ sku: "X1", count: 2, lastMissAt: 2_000, hint: undefined });
  });

  it("keeps the prior hint when a later miss omits one (hint fallback to cur.hint)", async () => {
    const store = useMemoryStore();
    vi.spyOn(Date, "now").mockReturnValue(5);

    await recordCrossMiss("Y1", "Eaton");
    await recordCrossMiss("Y1"); // no hint → should retain "Eaton"

    expect((await store.get<CrossMiss>(NS, "Y1"))?.hint).toBe("Eaton");
  });

  it("overwrites the hint when a later miss supplies a new one", async () => {
    const store = useMemoryStore();
    vi.spyOn(Date, "now").mockReturnValue(5);

    await recordCrossMiss("Z1", "Eaton");
    await recordCrossMiss("Z1", "Siemens");

    expect((await store.get<CrossMiss>(NS, "Z1"))?.hint).toBe("Siemens");
  });

  it("is a no-op for an empty / whitespace-only SKU (never touches the store)", async () => {
    useMemoryStore();
    await recordCrossMiss("   ");
    await recordCrossMiss("");
    expect(stubs.mutate).not.toHaveBeenCalled();
  });

  it("swallows a store error — best-effort, never surfaces into the request path", async () => {
    stubs.getStore.mockReturnValue(new MemoryStore());
    stubs.mutate.mockRejectedValue(new Error("kv down"));
    await expect(recordCrossMiss("BOOM")).resolves.toBeUndefined();
  });

  it("swallows even a synchronous getStore() failure", async () => {
    stubs.getStore.mockImplementation(() => {
      throw new Error("store init failed");
    });
    await expect(recordCrossMiss("SKU")).resolves.toBeUndefined();
  });
});

describe("topCrossGaps", () => {
  function seed(records: CrossMiss[]): MemoryStore {
    const store = new MemoryStore();
    stubs.getStore.mockReturnValue(store);
    return store;
  }

  async function put(store: MemoryStore, m: CrossMiss) {
    await store.put(NS, m.sku, m);
  }

  it("ranks by count descending", async () => {
    const store = seed([]);
    await put(store, { sku: "A", count: 1, lastMissAt: 100 });
    await put(store, { sku: "B", count: 9, lastMissAt: 100 });
    await put(store, { sku: "C", count: 5, lastMissAt: 100 });

    const top = await topCrossGaps();
    expect(top.map((m) => m.sku)).toEqual(["B", "C", "A"]);
  });

  it("breaks count ties by most-recent lastMissAt", async () => {
    const store = seed([]);
    await put(store, { sku: "OLD", count: 3, lastMissAt: 100 });
    await put(store, { sku: "NEW", count: 3, lastMissAt: 900 });

    const top = await topCrossGaps();
    expect(top.map((m) => m.sku)).toEqual(["NEW", "OLD"]);
  });

  it("filters out null and malformed records (non-numeric count)", async () => {
    const store = seed([]);
    await put(store, { sku: "GOOD", count: 2, lastMissAt: 1 });
    // Malformed shapes that the type-guard must drop.
    await store.put(NS, "BADNULL", null);
    await store.put(NS, "NOCOUNT", { sku: "NOCOUNT", lastMissAt: 1 });
    await store.put(NS, "STRCOUNT", { sku: "STRCOUNT", count: "5", lastMissAt: 1 });

    const top = await topCrossGaps();
    expect(top.map((m) => m.sku)).toEqual(["GOOD"]);
  });

  it("honors the limit (slices to the requested size)", async () => {
    const store = seed([]);
    for (let i = 0; i < 5; i++) {
      await put(store, { sku: `S${i}`, count: i, lastMissAt: 0 });
    }
    const top = await topCrossGaps(2);
    expect(top.map((m) => m.sku)).toEqual(["S4", "S3"]);
  });

  it("clamps a limit of 0 up to 1 (Math.max(1, limit))", async () => {
    const store = seed([]);
    await put(store, { sku: "A", count: 5, lastMissAt: 0 });
    await put(store, { sku: "B", count: 1, lastMissAt: 0 });

    const top = await topCrossGaps(0);
    expect(top).toHaveLength(1);
    expect(top[0].sku).toBe("A");
  });

  it("returns an empty array (fail-closed) when the store list throws", async () => {
    const store = new MemoryStore();
    vi.spyOn(store, "list").mockRejectedValue(new Error("list failed"));
    stubs.getStore.mockReturnValue(store);

    await expect(topCrossGaps()).resolves.toEqual([]);
  });

  it("returns an empty array (fail-closed) when getStore() itself throws", async () => {
    stubs.getStore.mockImplementation(() => {
      throw new Error("store init failed");
    });
    await expect(topCrossGaps()).resolves.toEqual([]);
  });

  it("returns [] on an empty namespace", async () => {
    seed([]);
    expect(await topCrossGaps()).toEqual([]);
  });
});
