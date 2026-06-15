import { describe, it, expect } from "vitest";
import { MemoryStore, getStore, mutate, forTenant, persistenceConfigured, postgresUrl } from "@/lib/server/persistence";
import { InlineQueue } from "@/lib/server/queue";

describe("MemoryStore", () => {
  it("puts, gets, lists, and deletes within a namespace", async () => {
    const s = new MemoryStore();
    await s.put("rfq", "a", { id: "a", n: 1 });
    await s.put("rfq", "b", { id: "b", n: 2 });
    expect(await s.get<{ n: number }>("rfq", "a")).toEqual({ id: "a", n: 1 });
    expect((await s.list("rfq")).length).toBe(2);
    await s.delete("rfq", "a");
    expect(await s.get("rfq", "a")).toBeNull();
    expect((await s.list("rfq")).length).toBe(1);
  });

  it("isolates namespaces", async () => {
    const s = new MemoryStore();
    await s.put("orders", "x", { v: 1 });
    expect(await s.get("rma", "x")).toBeNull();
    expect((await s.list("rma")).length).toBe(0);
  });

  it("stores a deep copy — external mutation does not change the stored value", async () => {
    const s = new MemoryStore();
    const obj = { id: "a", nested: { q: 1 } };
    await s.put("ns", "a", obj);
    obj.nested.q = 999;
    expect((await s.get<typeof obj>("ns", "a"))!.nested.q).toBe(1);
  });

  it("returns null for a missing key", async () => {
    const s = new MemoryStore();
    expect(await s.get("ns", "nope")).toBeNull();
  });
});

describe("getStore", () => {
  it("returns the in-memory store when POSTGRES_URL is unset (dormant default)", () => {
    expect(persistenceConfigured()).toBe(false);
    expect(getStore().backend).toBe("memory");
  });

  it("round-trips an RFQ intake through the process store", async () => {
    const store = getStore();
    const rec = { id: "Q-TEST-1", customer: "Acme", lines: 5, matched: 4, at: 1 };
    await store.put("rfq-intake", rec.id, rec);
    expect(await store.get("rfq-intake", "Q-TEST-1")).toEqual(rec);
    await store.delete("rfq-intake", "Q-TEST-1");
  });
});

describe("postgresUrl resolution", () => {
  it("only accepts a Postgres-scheme URL — a SQLite file: DATABASE_URL is ignored", () => {
    const prev = { ...process.env };
    try {
      delete process.env.POSTGRES_URL;
      delete process.env.POSTGRES_URL_NON_POOLING;
      delete process.env.POSTGRES_PRISMA_URL;
      process.env.DATABASE_URL = "file:./dev.db"; // this repo's local default
      expect(postgresUrl()).toBeNull();
      expect(persistenceConfigured()).toBe(false);
    } finally {
      process.env = prev;
    }
  });

  it("resolves POSTGRES_URL, or a Postgres-scheme DATABASE_URL as fallback", () => {
    const prev = { ...process.env };
    try {
      delete process.env.DATABASE_URL;
      process.env.POSTGRES_URL = "postgresql://u:p@ep-x-pooler.neon.tech/db?sslmode=require";
      expect(postgresUrl()).toContain("neon.tech");
      delete process.env.POSTGRES_URL;
      process.env.DATABASE_URL = "postgres://u:p@host/db";
      expect(postgresUrl()).toBe("postgres://u:p@host/db");
    } finally {
      process.env = prev;
    }
  });
});

describe("compare-and-set (MemoryStore)", () => {
  it("getVersioned returns value + a version that bumps on every put", async () => {
    const s = new MemoryStore();
    expect(await s.getVersioned("ns", "k")).toBeNull();
    await s.put("ns", "k", { n: 1 });
    expect(await s.getVersioned<{ n: number }>("ns", "k")).toEqual({ value: { n: 1 }, version: 1 });
    await s.put("ns", "k", { n: 2 });
    expect((await s.getVersioned<{ n: number }>("ns", "k"))?.version).toBe(2);
  });

  it("create-only (expected 0) succeeds when absent, fails when present", async () => {
    const s = new MemoryStore();
    expect(await s.compareAndPut("ns", "k", { n: 1 }, 0)).toBe(true);
    expect(await s.compareAndPut("ns", "k", { n: 9 }, 0)).toBe(false);
    expect(await s.get("ns", "k")).toEqual({ n: 1 });
  });

  it("update succeeds on a matching version and rejects a stale one", async () => {
    const s = new MemoryStore();
    await s.put("ns", "k", { n: 1 }); // version 1
    expect(await s.compareAndPut("ns", "k", { n: 2 }, 1)).toBe(true); // -> version 2
    expect(await s.compareAndPut("ns", "k", { n: 3 }, 1)).toBe(false); // stale
    expect(await s.get("ns", "k")).toEqual({ n: 2 });
  });
});

describe("mutate (atomic read-modify-write)", () => {
  it("applies the updater and persists", async () => {
    const s = new MemoryStore();
    await s.put("jobs", "j", { items: [] as string[] });
    const out = await mutate<{ items: string[] }>(s, "jobs", "j", (j) => (j ? { items: [...j.items, "a"] } : null));
    expect(out).toEqual({ items: ["a"] });
    expect(await s.get("jobs", "j")).toEqual({ items: ["a"] });
  });

  it("aborts (returns null, no write) when the updater returns null", async () => {
    const s = new MemoryStore();
    const out = await mutate<{ x: number }>(s, "jobs", "missing", (j) => (j ? j : null));
    expect(out).toBeNull();
    expect(await s.get("jobs", "missing")).toBeNull();
  });

  it("retries on a concurrent write and preserves BOTH updates (no lost update)", async () => {
    const s = new MemoryStore();
    await s.put("jobs", "j", { items: [] as string[] });
    let injected = false;
    const out = await mutate<{ items: string[] }>(s, "jobs", "j", (j) => {
      // First pass only: simulate another writer committing between our read and CAS,
      // which bumps the version so our compare-and-set misses and we retry.
      if (!injected) {
        injected = true;
        void s.put("jobs", "j", { items: ["concurrent"] });
      }
      return j ? { items: [...j.items, "mine"] } : null;
    });
    expect(out).toEqual({ items: ["concurrent", "mine"] });
    expect(await s.get("jobs", "j")).toEqual({ items: ["concurrent", "mine"] });
  });
});

describe("forTenant (per-tenant isolation)", () => {
  it("scopes a store so tenants cannot see each other's records (same key, different tenant)", async () => {
    const base = new MemoryStore();
    const a = forTenant(base, "acme");
    const b = forTenant(base, "globex");
    await a.put("jobs", "j1", { who: "acme" });
    await b.put("jobs", "j1", { who: "globex" });
    expect(await a.get("jobs", "j1")).toEqual({ who: "acme" });
    expect(await b.get("jobs", "j1")).toEqual({ who: "globex" });
    expect((await a.list("jobs")).length).toBe(1);
    expect((await b.list("jobs")).length).toBe(1);
    await a.delete("jobs", "j1");
    expect(await a.get("jobs", "j1")).toBeNull();
    expect(await b.get("jobs", "j1")).toEqual({ who: "globex" }); // b unaffected
  });

  it("forTenant(store, null) returns the store unwrapped (pilot behavior)", () => {
    const base = new MemoryStore();
    expect(forTenant(base, null)).toBe(base);
  });
});

describe("InlineQueue", () => {
  it("runs the handler inline", async () => {
    const q = new InlineQueue();
    let seen: number | null = null;
    await q.enqueue("test", { n: 7 }, async (d: { n: number }) => {
      seen = d.n;
    });
    expect(seen).toBe(7);
    expect(q.mode).toBe("inline");
  });

  it("never throws into the caller when a handler fails", async () => {
    const q = new InlineQueue();
    await expect(
      q.enqueue("boom", {}, async () => {
        throw new Error("handler exploded");
      }),
    ).resolves.toBeUndefined();
  });
});
