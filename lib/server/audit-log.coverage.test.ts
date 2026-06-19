import { describe, it, expect, afterEach } from "vitest";
import {
  auditSecret,
  auditSigned,
  recordAuditEvent,
  recordAuditEventSafe,
  readAuditChain,
  verifyTenantChain,
} from "@/lib/server/audit-log";
import { AUDIT_NAMESPACE, AUDIT_CHAIN_KEY, type AuditEntry } from "@/lib/product-finder-audit";
import { MemoryStore, type KvStore } from "@/lib/server/persistence";

/**
 * Coverage companion for lib/server/audit-log.ts. The module talks to the process
 * KV store via getStore(), which is a per-instance MemoryStore when POSTGRES_URL is
 * unset (the dormant default in test). So we exercise the REAL append/read/verify
 * branches end-to-end against memory, plus the env-driven secret resolution and the
 * never-throw swallow path of recordAuditEventSafe (by injecting a store that forces
 * write contention). No network is involved on the memory path.
 *
 * Each test uses a unique tenantId so the per-tenant namespace prefix isolates it
 * from every other test sharing this process's global store.
 */

const g = globalThis as unknown as { __kvStore?: KvStore };

afterEach(() => {
  delete process.env.AUDIT_SECRET;
  delete process.env.SESSION_SECRET;
  // Drop any store we may have swapped in so the next test gets a clean MemoryStore.
  delete g.__kvStore;
});

const input = (over: Partial<Parameters<typeof recordAuditEvent>[1]> = {}) => ({
  actor: "rep-1",
  action: "quote.sent",
  target: "Q-1001",
  detail: "sent to customer",
  at: 1_700_000_000_000,
  ...over,
});

describe("auditSecret — HMAC key resolution (env fallback chain)", () => {
  it("prefers AUDIT_SECRET, trimmed", () => {
    process.env.AUDIT_SECRET = "  prod-audit-key  ";
    process.env.SESSION_SECRET = "session-key";
    expect(auditSecret()).toBe("prod-audit-key");
  });

  it("falls back to SESSION_SECRET when AUDIT_SECRET is unset", () => {
    process.env.SESSION_SECRET = "  sso-session  ";
    expect(auditSecret()).toBe("sso-session");
  });

  it("falls back to SESSION_SECRET when AUDIT_SECRET is blank/whitespace-only", () => {
    process.env.AUDIT_SECRET = "   ";
    process.env.SESSION_SECRET = "sso-session";
    expect(auditSecret()).toBe("sso-session");
  });

  it("falls back to the dev constant when neither is set", () => {
    expect(auditSecret()).toBe("meridian-audit-dev");
  });
});

describe("auditSigned — is a real (non-dev) key configured", () => {
  it("false when neither secret is set (dev constant in use)", () => {
    expect(auditSigned()).toBe(false);
  });

  it("false when both secrets are blank/whitespace-only", () => {
    process.env.AUDIT_SECRET = "  ";
    process.env.SESSION_SECRET = "\t";
    expect(auditSigned()).toBe(false);
  });

  it("true when AUDIT_SECRET is set", () => {
    process.env.AUDIT_SECRET = "k";
    expect(auditSigned()).toBe(true);
  });

  it("true when only SESSION_SECRET is set", () => {
    process.env.SESSION_SECRET = "s";
    expect(auditSigned()).toBe(true);
  });
});

describe("recordAuditEvent — appends to the tenant chain (CAS via mutate)", () => {
  it("creates the genesis entry (seq 0, empty prevHash) on the first append", async () => {
    const tenant = "t-genesis";
    const entry = await recordAuditEvent(tenant, input());
    expect(entry).not.toBeNull();
    expect(entry!.seq).toBe(0);
    expect(entry!.prevHash).toBe("");
    expect(entry!.actor).toBe("rep-1");
    expect(entry!.action).toBe("quote.sent");
    expect(entry!.hash).toMatch(/^[0-9a-f]{64}$/);
    // Returned entry is the last (and only) one persisted.
    const chain = await readAuditChain(tenant);
    expect(chain).toHaveLength(1);
    expect(chain[0]).toEqual(entry);
  });

  it("chains a second entry — seq increments and prevHash links to the prior hash", async () => {
    const tenant = "t-chain";
    const first = await recordAuditEvent(tenant, input({ at: 1 }));
    const second = await recordAuditEvent(tenant, input({ action: "quote.accepted", at: 2 }));
    expect(second!.seq).toBe(1);
    expect(second!.prevHash).toBe(first!.hash);
    // The full chain verifies under the same (dev) secret.
    expect((await verifyTenantChain(tenant)).valid).toBe(true);
  });

  it("works with a null tenant (pre-tenancy / pilot) — store is used unwrapped", async () => {
    // Use a distinct action/target so it doesn't collide assertions; the global
    // chain key is shared for null-tenant, so assert on the returned entry only.
    const entry = await recordAuditEvent(null, input({ target: "Q-NULL-TENANT" }));
    expect(entry).not.toBeNull();
    expect(entry!.target).toBe("Q-NULL-TENANT");
    expect(typeof entry!.hash).toBe("string");
  });
});

describe("recordAuditEventSafe — best-effort, never throws", () => {
  it("appends on the happy path just like recordAuditEvent", async () => {
    const tenant = "t-safe-ok";
    await expect(recordAuditEventSafe(tenant, input())).resolves.toBeUndefined();
    expect(await readAuditChain(tenant)).toHaveLength(1);
  });

  it("swallows an error from the underlying store (mutate write-contention) and resolves", async () => {
    // Inject a store whose compareAndPut never succeeds; mutate exhausts its retries
    // and throws "too much write contention" — recordAuditEvent propagates it, and
    // recordAuditEventSafe must swallow it (the primary op must not break).
    const failing: KvStore = {
      backend: "memory",
      put: async () => {},
      get: async () => null,
      list: async () => [],
      delete: async () => {},
      getVersioned: async () => null,
      compareAndPut: async () => false, // forces every CAS to miss -> mutate throws
    };
    g.__kvStore = failing;

    // Sanity: the un-safe variant does throw under this store.
    await expect(recordAuditEvent("t-safe-throw", input())).rejects.toThrow(/contention/i);

    // The safe variant must NOT throw.
    await expect(recordAuditEventSafe("t-safe-throw", input())).resolves.toBeUndefined();
  });
});

describe("readAuditChain — bounded oldest-first read", () => {
  it("returns [] for a tenant with no chain yet", async () => {
    expect(await readAuditChain("t-empty")).toEqual([]);
  });

  it("returns the whole chain (oldest-first) when no limit is given", async () => {
    const tenant = "t-read-all";
    for (let i = 0; i < 4; i++) await recordAuditEvent(tenant, input({ at: i, target: `Q-${i}` }));
    const chain = await readAuditChain(tenant);
    expect(chain.map((e) => e.seq)).toEqual([0, 1, 2, 3]);
  });

  it("slices to the most-recent N when limit < length", async () => {
    const tenant = "t-read-limit";
    for (let i = 0; i < 5; i++) await recordAuditEvent(tenant, input({ at: i, target: `Q-${i}` }));
    const chain = await readAuditChain(tenant, 2);
    expect(chain.map((e) => e.seq)).toEqual([3, 4]); // last two, oldest-first
  });

  it("returns the full chain unchanged when limit >= length", async () => {
    const tenant = "t-read-limit-big";
    for (let i = 0; i < 3; i++) await recordAuditEvent(tenant, input({ at: i }));
    expect((await readAuditChain(tenant, 10)).map((e) => e.seq)).toEqual([0, 1, 2]);
  });

  it("limit of 0 is falsy -> returns the full chain (documents the && short-circuit)", async () => {
    const tenant = "t-read-limit-zero";
    for (let i = 0; i < 3; i++) await recordAuditEvent(tenant, input({ at: i }));
    // `limit && chain.length > limit` is false when limit===0, so no slice.
    expect((await readAuditChain(tenant, 0)).length).toBe(3);
  });
});

describe("verifyTenantChain — full-chain integrity under the resolved secret", () => {
  it("reports valid=true for an empty chain", async () => {
    const res = await verifyTenantChain("t-verify-empty");
    expect(res).toEqual({ valid: true, brokenAt: null, length: 0 });
  });

  it("reports valid=true for an intact populated chain", async () => {
    const tenant = "t-verify-ok";
    for (let i = 0; i < 3; i++) await recordAuditEvent(tenant, input({ at: i, target: `Q-${i}` }));
    const res = await verifyTenantChain(tenant);
    expect(res.valid).toBe(true);
    expect(res.brokenAt).toBeNull();
    expect(res.length).toBe(3);
  });

  it("detects tampering — an edited detail field breaks the chain at that seq", async () => {
    const tenant = "t-verify-tampered";
    await recordAuditEvent(tenant, input({ at: 1 }));
    await recordAuditEvent(tenant, input({ at: 2, detail: "original" }));
    // Reach under the seam and corrupt the persisted entry's signed field without
    // recomputing its hash — exactly the edit verifyAuditChain must catch.
    const store = g.__kvStore as MemoryStore;
    const chain = (await store.get<AuditEntry[]>(`t:${tenant}::${AUDIT_NAMESPACE}`, AUDIT_CHAIN_KEY))!;
    chain[1].detail = "TAMPERED";
    await store.put(`t:${tenant}::${AUDIT_NAMESPACE}`, AUDIT_CHAIN_KEY, chain);

    const res = await verifyTenantChain(tenant);
    expect(res.valid).toBe(false);
    expect(res.brokenAt).toBe(1);
    expect(res.length).toBe(2);
  });

  it("a chain valid under the dev secret is INVALID once a real AUDIT_SECRET is set (key binding)", async () => {
    const tenant = "t-verify-keybind";
    await recordAuditEvent(tenant, input()); // signed with dev constant
    expect((await verifyTenantChain(tenant)).valid).toBe(true);
    process.env.AUDIT_SECRET = "a-different-real-key";
    const res = await verifyTenantChain(tenant);
    expect(res.valid).toBe(false);
    expect(res.brokenAt).toBe(0);
  });
});
