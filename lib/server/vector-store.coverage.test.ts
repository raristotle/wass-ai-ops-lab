import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

/**
 * Coverage companion for lib/server/vector-store.ts.
 *
 * The store is dormant unless POSTGRES_URL is set, and the live path lazily
 * imports @neondatabase/serverless (`neon(url)` → a tagged-template `sql`
 * function). To exercise the live branches (DDL bootstrap, upsert, KNN, count)
 * without a real database, we mock that module so `neon()` returns a fake `sql`
 * we fully control: it records every query and returns whatever rows the test
 * stages. We make it throw to drive the fail-closed catch paths.
 *
 * The real module caches `_sql`/`_ready` at module scope, so each test resets
 * the module registry (vi.resetModules) and re-imports a fresh copy with the
 * mock and env in place. The pure helpers (toVectorLiteral / isValidEmbedding /
 * vectorStoreConfigured) are covered alongside via the same fresh import.
 */

const PG_URL = "postgresql://u:p@ep-x-pooler.neon.tech/db?sslmode=require";

// One shared spy object the mock factory reads from. vi.hoisted so it exists
// before the (hoisted) vi.mock factory runs.
const neonState = vi.hoisted(() => ({
  // The fake `sql` tagged-template. Tests reassign `impl` to stage rows / throw.
  impl: null as null | ((strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>),
  calls: [] as { text: string; values: unknown[] }[],
  // When set, neon(url) itself throws (driver-construction failure).
  neonThrows: false,
}));

vi.mock("@neondatabase/serverless", () => ({
  neon: (..._args: unknown[]) => {
    if (neonState.neonThrows) throw new Error("neon ctor boom");
    const sql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
      neonState.calls.push({ text: strings.join("?"), values });
      if (!neonState.impl) return [];
      return neonState.impl(strings, ...values);
    };
    return sql;
  },
}));

/** Stage the rows returned for queries matching `match` (a substring of the SQL). */
function stageRows(rowsFor: (text: string) => unknown[] | "throw") {
  neonState.impl = async (strings: TemplateStringsArray) => {
    const text = strings.join("?");
    const out = rowsFor(text);
    if (out === "throw") throw new Error(`query failed: ${text.slice(0, 40)}`);
    return out;
  };
}

/** Fresh import of the module under test with current env + mock in place. */
async function freshModule() {
  vi.resetModules();
  return import("@/lib/server/vector-store");
}

const DIM = 1024;
const goodVec = (fill = 0.01) => new Array(DIM).fill(fill);

beforeEach(() => {
  neonState.impl = null;
  neonState.calls = [];
  neonState.neonThrows = false;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.POSTGRES_URL;
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL_NON_POOLING;
  delete process.env.POSTGRES_PRISMA_URL;
});

describe("pure helpers", () => {
  it("toVectorLiteral formats and neutralizes non-finite values to 0", async () => {
    const { toVectorLiteral } = await freshModule();
    expect(toVectorLiteral([0.5, -0.25])).toBe("[0.5,-0.25]");
    expect(toVectorLiteral([1, NaN, Infinity, -Infinity])).toBe("[1,0,0,0]");
    expect(toVectorLiteral([])).toBe("[]");
  });

  it("isValidEmbedding accepts only a 1024-dim array", async () => {
    const { isValidEmbedding } = await freshModule();
    expect(isValidEmbedding(goodVec())).toBe(true);
    expect(isValidEmbedding([1, 2, 3])).toBe(false);
    expect(isValidEmbedding(undefined as unknown as number[])).toBe(false);
    expect(isValidEmbedding("nope" as unknown as number[])).toBe(false);
  });

  it("vectorStoreConfigured tracks POSTGRES_URL", async () => {
    delete process.env.POSTGRES_URL;
    const dormant = await freshModule();
    expect(dormant.vectorStoreConfigured()).toBe(false);

    process.env.POSTGRES_URL = PG_URL;
    const live = await freshModule();
    expect(live.vectorStoreConfigured()).toBe(true);
  });
});

describe("dormant (no POSTGRES_URL) — every async fn fails closed, no driver import", () => {
  it("upsertVectors returns 0, knnSearch returns [], vectorCount returns 0", async () => {
    delete process.env.POSTGRES_URL;
    const m = await freshModule();
    expect(await m.upsertVectors([{ productId: "p1", embedding: goodVec() }])).toBe(0);
    expect(await m.knnSearch(goodVec())).toEqual([]);
    expect(await m.vectorCount()).toBe(0);
    // Driver was never reached → no SQL ever executed.
    expect(neonState.calls).toHaveLength(0);
  });
});

describe("getSql bootstrap (live)", () => {
  beforeEach(() => {
    process.env.POSTGRES_URL = PG_URL;
  });

  it("runs the extension/table/index DDL on first use, then caches (no re-DDL)", async () => {
    stageRows((text) => (text.includes("COUNT(*)") ? [{ n: 3 }] : []));
    const m = await freshModule();

    await m.vectorCount();
    const ddl = neonState.calls.map((c) => c.text);
    expect(ddl.some((t) => t.includes("CREATE EXTENSION IF NOT EXISTS vector"))).toBe(true);
    expect(ddl.some((t) => t.includes('CREATE TABLE IF NOT EXISTS "ProductVector"'))).toBe(true);
    expect(ddl.some((t) => t.includes("hnsw"))).toBe(true);

    const afterFirst = neonState.calls.length;
    // Second call reuses the cached _ready/_sql — only the COUNT query runs again.
    await m.vectorCount();
    const newCalls = neonState.calls.slice(afterFirst);
    expect(newCalls).toHaveLength(1);
    expect(newCalls[0].text).toContain("COUNT(*)");
  });
});

describe("upsertVectors (live)", () => {
  beforeEach(() => {
    process.env.POSTGRES_URL = PG_URL;
  });

  it("writes each valid row and returns the count, binding id + ::vector literal", async () => {
    stageRows(() => []);
    const m = await freshModule();

    const written = await m.upsertVectors([
      { productId: "p1", embedding: goodVec(0.1) },
      { productId: "p2", embedding: goodVec(0.2) },
    ]);
    expect(written).toBe(2);

    const inserts = neonState.calls.filter((c) => c.text.includes("INSERT INTO"));
    expect(inserts).toHaveLength(2);
    // First interpolated value is the productId; the vector literal is also bound.
    expect(inserts[0].values[0]).toBe("p1");
    expect(inserts[0].values.some((v) => typeof v === "string" && (v as string).startsWith("[0.1"))).toBe(true);
  });

  it("skips + logs an invalid-dim row but still writes the valid ones", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    stageRows(() => []);
    const m = await freshModule();

    const written = await m.upsertVectors([
      { productId: "bad", embedding: [1, 2, 3] }, // wrong dim → skipped
      { productId: "good", embedding: goodVec() },
    ]);
    expect(written).toBe(1);
    expect(neonState.calls.filter((c) => c.text.includes("INSERT INTO"))).toHaveLength(1);
    const logged = errSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(logged).toContain("vector:upsert");
    expect(logged).toContain("bad embedding dim 3");
  });

  it("swallows a per-row INSERT failure (logs, keeps going) and counts only the successes", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let insertN = 0;
    neonState.impl = async (strings: TemplateStringsArray) => {
      const text = strings.join("?");
      if (text.includes("INSERT INTO")) {
        insertN += 1;
        if (insertN === 1) throw new Error("duplicate key / row boom");
        return [];
      }
      return [];
    };
    const m = await freshModule();

    const written = await m.upsertVectors([
      { productId: "p1", embedding: goodVec() }, // throws
      { productId: "p2", embedding: goodVec() }, // ok
    ]);
    expect(written).toBe(1);
    expect(errSpy.mock.calls.map((c) => String(c[0])).join("\n")).toContain("vector:upsert");
  });

  it("swallows an init-time failure (bootstrap throws) and returns 0", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Make the very first DDL (CREATE EXTENSION) throw → getSql() rejects.
    stageRows((text) => (text.includes("CREATE EXTENSION") ? "throw" : []));
    const m = await freshModule();

    const written = await m.upsertVectors([{ productId: "p1", embedding: goodVec() }]);
    expect(written).toBe(0);
    expect(errSpy.mock.calls.map((c) => String(c[0])).join("\n")).toContain("vector:upsert-init");
  });

  it("returns 0 for an empty row set without touching INSERT", async () => {
    stageRows(() => []);
    const m = await freshModule();
    expect(await m.upsertVectors([])).toBe(0);
    expect(neonState.calls.some((c) => c.text.includes("INSERT INTO"))).toBe(false);
  });
});

describe("knnSearch (live)", () => {
  beforeEach(() => {
    process.env.POSTGRES_URL = PG_URL;
  });

  it("returns product ids (stringified) ordered as the driver returns them", async () => {
    stageRows((text) => (text.includes("ORDER BY embedding") ? [{ product_id: "a" }, { product_id: 7 }] : []));
    const m = await freshModule();

    const ids = await m.knnSearch(goodVec(), 5);
    expect(ids).toEqual(["a", "7"]); // 7 coerced via String()
    const knn = neonState.calls.find((c) => c.text.includes("ORDER BY embedding"));
    expect(knn).toBeDefined();
    // The limit is bound as a value.
    expect(knn!.values).toContain(5);
  });

  it("short-circuits to [] for a wrong-dimension query (no driver import / no SQL)", async () => {
    const m = await freshModule();
    expect(await m.knnSearch([0.1, 0.2])).toEqual([]);
    expect(neonState.calls).toHaveLength(0);
  });

  it("fails closed to [] and logs when the KNN query throws", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    stageRows((text) => (text.includes("ORDER BY embedding") ? "throw" : []));
    const m = await freshModule();

    expect(await m.knnSearch(goodVec())).toEqual([]);
    expect(errSpy.mock.calls.map((c) => String(c[0])).join("\n")).toContain("vector:knn");
  });

  it("defaults the limit to 200 when not supplied", async () => {
    stageRows((text) => (text.includes("ORDER BY embedding") ? [] : []));
    const m = await freshModule();
    await m.knnSearch(goodVec());
    const knn = neonState.calls.find((c) => c.text.includes("ORDER BY embedding"));
    expect(knn!.values).toContain(200);
  });
});

describe("vectorCount (live)", () => {
  beforeEach(() => {
    process.env.POSTGRES_URL = PG_URL;
  });

  it("parses COUNT(*) into a number", async () => {
    stageRows((text) => (text.includes("COUNT(*)") ? [{ n: 42 }] : []));
    const m = await freshModule();
    expect(await m.vectorCount()).toBe(42);
  });

  it("returns 0 when the count row is missing / has no n field", async () => {
    stageRows((text) => (text.includes("COUNT(*)") ? [{}] : []));
    const m = await freshModule();
    expect(await m.vectorCount()).toBe(0);
  });

  it("returns 0 (fail-closed) when the count query throws", async () => {
    stageRows((text) => (text.includes("COUNT(*)") ? "throw" : []));
    const m = await freshModule();
    expect(await m.vectorCount()).toBe(0);
  });

  it("returns 0 when neon() construction itself throws", async () => {
    neonState.neonThrows = true;
    const m = await freshModule();
    expect(await m.vectorCount()).toBe(0);
  });
});
