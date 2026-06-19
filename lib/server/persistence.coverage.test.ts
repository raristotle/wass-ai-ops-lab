import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { NeonStore, getStore, mutate, postgresUrl, persistenceConfigured, MemoryStore, type KvStore } from "@/lib/server/persistence";

/**
 * Coverage for the previously-untested Postgres path (NeonStore) and the
 * mutate retry-exhaustion throw. The @neondatabase/serverless driver is mocked:
 * `neon(url)` returns a tagged-template SQL fn that we route by the SQL text it
 * receives, so each NeonStore method exercises its real query + parse logic
 * without standing up Postgres.
 */

// A hoisted "fake DB" the mocked neon() driver reads/writes. Each test installs
// a fresh handler so we control exactly what rows come back per query.
const neonState = vi.hoisted(() => ({
  // Receives the assembled SQL string + interpolated values; returns rows.
  handler: null as null | ((sql: string, values: unknown[]) => unknown[]),
  neonCalls: [] as string[],
  ddl: [] as string[],
}));

vi.mock("@neondatabase/serverless", () => ({
  neon: (url: string) => {
    neonState.neonCalls.push(url);
    // Tagged-template SQL fn: reassemble the query text from the template parts.
    return (strings: TemplateStringsArray, ...values: unknown[]) => {
      const text = strings.join("?").replace(/\s+/g, " ").trim();
      if (/^CREATE TABLE|^ALTER TABLE/i.test(text)) {
        neonState.ddl.push(text);
        return Promise.resolve([]);
      }
      if (!neonState.handler) return Promise.resolve([]);
      return Promise.resolve(neonState.handler(text, values));
    };
  },
}));

const PG_URL = "postgres://u:p@ep-x.neon.tech/db";

beforeEach(() => {
  neonState.handler = null;
  neonState.neonCalls = [];
  neonState.ddl = [];
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  // Reset the cached process store so getStore() re-resolves per test.
  delete (globalThis as { __kvStore?: KvStore }).__kvStore;
  delete process.env.POSTGRES_URL;
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL_NON_POOLING;
  delete process.env.POSTGRES_PRISMA_URL;
});

describe("NeonStore.init (lazy import + idempotent DDL)", () => {
  it("creates the table + adds the version column once, then caches the driver", async () => {
    neonState.handler = () => [];
    const store = new NeonStore(PG_URL);

    // Two operations; init() must only run the DDL + import the driver once.
    await store.get("ns", "a");
    await store.get("ns", "b");

    expect(neonState.neonCalls).toEqual([PG_URL]); // neon(url) called exactly once
    expect(neonState.ddl.some((d) => /CREATE TABLE IF NOT EXISTS "PersistedRecord"/i.test(d))).toBe(true);
    expect(neonState.ddl.some((d) => /ALTER TABLE "PersistedRecord" ADD COLUMN IF NOT EXISTS version/i.test(d))).toBe(true);
    expect(neonState.ddl.filter((d) => /CREATE TABLE/i.test(d))).toHaveLength(1);
  });
});

describe("NeonStore.get / getVersioned", () => {
  it("get parses the json column and returns the value, null when absent", async () => {
    const store = new NeonStore(PG_URL);
    neonState.handler = (sql, values) => {
      expect(sql).toMatch(/SELECT json FROM "PersistedRecord"/i);
      expect(values).toEqual(["ns", "k"]); // namespace + key interpolated
      return [{ json: JSON.stringify({ hello: "world" }) }];
    };
    expect(await store.get("ns", "k")).toEqual({ hello: "world" });

    neonState.handler = () => []; // no row
    expect(await store.get("ns", "missing")).toBeNull();
  });

  it("getVersioned returns value + numeric version, null when absent", async () => {
    const store = new NeonStore(PG_URL);
    neonState.handler = () => [{ json: JSON.stringify({ n: 5 }), version: "7" }]; // version as string -> Number()
    expect(await store.getVersioned("ns", "k")).toEqual({ value: { n: 5 }, version: 7 });

    neonState.handler = () => [];
    expect(await store.getVersioned("ns", "k")).toBeNull();
  });
});

describe("NeonStore.put", () => {
  it("upserts with namespace, key, and serialized json", async () => {
    const store = new NeonStore(PG_URL);
    let seen: { sql: string; values: unknown[] } | null = null;
    neonState.handler = (sql, values) => {
      seen = { sql, values };
      return [];
    };
    await store.put("rfq", "Q1", { id: "Q1", lines: 3 });
    expect(seen!.sql).toMatch(/INSERT INTO "PersistedRecord"[\s\S]*ON CONFLICT \(namespace, key\) DO UPDATE/i);
    expect(seen!.values).toContain("rfq");
    expect(seen!.values).toContain("Q1");
    expect(seen!.values).toContain(JSON.stringify({ id: "Q1", lines: 3 }));
  });
});

describe("NeonStore.compareAndPut", () => {
  it("create-only (expected 0): true when the INSERT returns a row", async () => {
    const store = new NeonStore(PG_URL);
    neonState.handler = (sql) => {
      expect(sql).toMatch(/INSERT INTO[\s\S]*ON CONFLICT[\s\S]*DO NOTHING RETURNING version/i);
      return [{ version: 1 }]; // inserted
    };
    expect(await store.compareAndPut("ns", "k", { n: 1 }, 0)).toBe(true);
  });

  it("create-only (expected 0): false when ON CONFLICT DO NOTHING returns no row", async () => {
    const store = new NeonStore(PG_URL);
    neonState.handler = () => []; // conflict -> nothing inserted
    expect(await store.compareAndPut("ns", "k", { n: 1 }, 0)).toBe(false);
  });

  it("update-only (expected > 0): true when the version still matches", async () => {
    const store = new NeonStore(PG_URL);
    neonState.handler = (sql, values) => {
      expect(sql).toMatch(/UPDATE "PersistedRecord"[\s\S]*WHERE namespace = [\s\S]* AND key = [\s\S]* AND version =/i);
      expect(values).toContain(3); // expectedVersion interpolated
      return [{ version: 4 }]; // matched + bumped
    };
    expect(await store.compareAndPut("ns", "k", { n: 2 }, 3)).toBe(true);
  });

  it("update-only (expected > 0): false when the version no longer matches (stale writer)", async () => {
    const store = new NeonStore(PG_URL);
    neonState.handler = () => []; // WHERE version = expected matched nothing
    expect(await store.compareAndPut("ns", "k", { n: 2 }, 3)).toBe(false);
  });
});

describe("NeonStore.list", () => {
  it("orders most-recent first and parses each row (no limit)", async () => {
    const store = new NeonStore(PG_URL);
    neonState.handler = (sql) => {
      expect(sql).toMatch(/SELECT json FROM "PersistedRecord" WHERE namespace = [\s\S]* ORDER BY "updatedAt" DESC$/i);
      return [{ json: JSON.stringify({ id: "a" }) }, { json: JSON.stringify({ id: "b" }) }];
    };
    expect(await store.list("ns")).toEqual([{ id: "a" }, { id: "b" }]);
  });

  it("applies the LIMIT branch when a limit is given", async () => {
    const store = new NeonStore(PG_URL);
    neonState.handler = (sql, values) => {
      expect(sql).toMatch(/ORDER BY "updatedAt" DESC LIMIT/i);
      expect(values).toContain(2); // limit interpolated
      return [{ json: JSON.stringify({ id: "x" }) }];
    };
    expect(await store.list("ns", { limit: 2 })).toEqual([{ id: "x" }]);
  });

  it("skips a corrupt/unparseable row instead of throwing (one bad record can't blank the list)", async () => {
    const store = new NeonStore(PG_URL);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    neonState.handler = () => [
      { json: JSON.stringify({ id: "good1" }) },
      { json: "{not valid json" }, // corrupt -> skipped
      { json: JSON.stringify({ id: "good2" }) },
    ];
    const out = await store.list("ns");
    expect(out).toEqual([{ id: "good1" }, { id: "good2" }]);
    expect(errSpy).toHaveBeenCalledTimes(1);
    expect(errSpy.mock.calls[0][0]).toContain("skipped unparseable row");
  });
});

describe("NeonStore.delete", () => {
  it("issues a DELETE scoped to namespace + key", async () => {
    const store = new NeonStore(PG_URL);
    let seen: { sql: string; values: unknown[] } | null = null;
    neonState.handler = (sql, values) => {
      seen = { sql, values };
      return [];
    };
    await store.delete("ns", "k");
    expect(seen!.sql).toMatch(/DELETE FROM "PersistedRecord" WHERE namespace = [\s\S]* AND key =/i);
    expect(seen!.values).toEqual(["ns", "k"]);
  });
});

describe("NeonStore CAS round-trip via mutate (Postgres path)", () => {
  it("mutate drives getVersioned -> updater -> compareAndPut on the Neon store", async () => {
    const store = new NeonStore(PG_URL);
    let casExpected: number | null = null;
    neonState.handler = (sql, values) => {
      if (/SELECT json, version/i.test(sql)) return [{ json: JSON.stringify({ items: ["x"] }), version: "2" }];
      if (/UPDATE "PersistedRecord"/i.test(sql)) {
        casExpected = values.find((v) => typeof v === "number") as number;
        return [{ version: 3 }];
      }
      return [];
    };
    const out = await mutate<{ items: string[] }>(store, "jobs", "j", (cur) =>
      cur ? { items: [...cur.items, "y"] } : null,
    );
    expect(out).toEqual({ items: ["x", "y"] });
    expect(casExpected).toBe(2); // CAS used the version that getVersioned returned
  });
});

describe("getStore (Postgres activation)", () => {
  it("returns a NeonStore (backend=postgres) when POSTGRES_URL is set", () => {
    process.env.POSTGRES_URL = PG_URL;
    expect(postgresUrl()).toBe(PG_URL);
    expect(persistenceConfigured()).toBe(true);
    const store = getStore();
    expect(store).toBeInstanceOf(NeonStore);
    expect(store.backend).toBe("postgres");
    // Cached on globalThis: a second call returns the same instance.
    expect(getStore()).toBe(store);
  });

  it("falls back to MemoryStore when no Postgres URL is configured", () => {
    expect(getStore()).toBeInstanceOf(MemoryStore);
  });
});

describe("mutate retry exhaustion", () => {
  it("throws after exhausting retries when CAS never succeeds (persistent contention)", async () => {
    const store = new MemoryStore();
    await store.put("jobs", "j", { items: [] as string[] });
    // compareAndPut always reports a conflict -> mutate retries then gives up.
    vi.spyOn(store, "compareAndPut").mockResolvedValue(false);

    await expect(
      mutate<{ items: string[] }>(store, "jobs", "j", (cur) => (cur ? { items: [...cur.items, "x"] } : null), 2),
    ).rejects.toThrow(/too much write contention on jobs\/j/);
  });

  it("succeeds on a later attempt if CAS eventually wins (within the retry budget)", async () => {
    const store = new MemoryStore();
    await store.put("ns", "k", { n: 0 });
    const cas = vi.spyOn(store, "compareAndPut");
    cas.mockResolvedValueOnce(false).mockResolvedValueOnce(false); // first two attempts fail
    // 3rd+ attempts use the real implementation again.
    cas.mockImplementation(MemoryStore.prototype.compareAndPut.bind(store) as typeof store.compareAndPut);

    const out = await mutate<{ n: number }>(store, "ns", "k", (cur) => ({ n: (cur?.n ?? 0) + 1 }), 5);
    expect(out).toEqual({ n: 1 });
  });
});
