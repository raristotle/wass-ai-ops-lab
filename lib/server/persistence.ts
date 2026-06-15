/**
 * Server-side persistence seam (env-gated, dormant by default).
 *
 * In-memory (per-instance) namespaced KV by default; a Postgres-backed store
 * (NeonStore, over the PersistedRecord table) activates when POSTGRES_URL is set.
 * A namespaced JSON KV lets any entity (RFQ intakes, RMAs, shipment overrides)
 * persist without bespoke tables. `persistenceConfigured()` reports infra
 * readiness (POSTGRES_URL present); setting that one env var IS the activation —
 * the table is created on first write (CREATE TABLE IF NOT EXISTS), no migration.
 *
 * The interface + MemoryStore are pure and fully testable; the Neon adapter uses
 * the @neondatabase/serverless HTTP driver, lazily imported so it is never pulled
 * into the memory path or any client bundle, and the build never depends on it.
 */

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/**
 * Candidate env vars that may carry a Postgres connection string, in priority
 * order. The Vercel↔Neon Marketplace integration injects `POSTGRES_URL` (pooled)
 * among several names; a hand setup may set only `POSTGRES_URL`. `DATABASE_URL`
 * is accepted too, but only when it is a real Postgres URL — in this repo it
 * defaults to a SQLite `file:` URL, so the scheme guard skips that automatically.
 */
const POSTGRES_URL_VARS = ["POSTGRES_URL", "DATABASE_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_PRISMA_URL"];

/** First configured env var that holds a Postgres-scheme connection string, else null. */
export function postgresUrl(): string | null {
  for (const name of POSTGRES_URL_VARS) {
    const v = env(name);
    if (v && /^postgres(ql)?:\/\//i.test(v)) return v;
  }
  return null;
}

/** True when a Postgres URL is configured (the Neon store is active). */
export function persistenceConfigured(): boolean {
  return postgresUrl() !== null;
}

export interface ListOptions {
  /** Cap the number of records returned (most-recent first on the Postgres path). */
  limit?: number;
}

export interface KvStore {
  readonly backend: "memory" | "postgres";
  put<T>(namespace: string, key: string, value: T): Promise<void>;
  get<T>(namespace: string, key: string): Promise<T | null>;
  list<T>(namespace: string, opts?: ListOptions): Promise<T[]>;
  delete(namespace: string, key: string): Promise<void>;
}

/** Per-instance in-memory store — the dormant default. */
export class MemoryStore implements KvStore {
  readonly backend = "memory" as const;
  private readonly data = new Map<string, Map<string, unknown>>();

  private ns(namespace: string): Map<string, unknown> {
    let m = this.data.get(namespace);
    if (!m) {
      m = new Map();
      this.data.set(namespace, m);
    }
    return m;
  }

  async put<T>(namespace: string, key: string, value: T): Promise<void> {
    // Clone through JSON so callers can't mutate the stored copy by reference
    // (mirrors the round-trip a real DB would do).
    this.ns(namespace).set(key, JSON.parse(JSON.stringify(value)));
  }

  async get<T>(namespace: string, key: string): Promise<T | null> {
    const v = this.ns(namespace).get(key);
    return v === undefined ? null : (JSON.parse(JSON.stringify(v)) as T);
  }

  async list<T>(namespace: string, opts?: ListOptions): Promise<T[]> {
    const all = [...this.ns(namespace).values()].map((v) => JSON.parse(JSON.stringify(v)) as T);
    return opts?.limit ? all.slice(0, opts.limit) : all;
  }

  async delete(namespace: string, key: string): Promise<void> {
    this.ns(namespace).delete(key);
  }
}

/** Minimal structural type for the Neon tagged-template SQL function. */
type NeonSql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

/**
 * Postgres-backed store over the PersistedRecord table, using Neon's serverless
 * driver (HTTP — works on Vercel functions, no connection pool). The driver is
 * lazily imported so the memory path (and any client bundle) never pulls it in.
 */
export class NeonStore implements KvStore {
  readonly backend = "postgres" as const;
  private sql: NeonSql | null = null;
  private ready: Promise<void> | null = null;

  constructor(private readonly url: string) {}

  private async init(): Promise<NeonSql> {
    if (!this.ready) {
      this.ready = (async () => {
        const { neon } = await import("@neondatabase/serverless");
        this.sql = neon(this.url) as unknown as NeonSql;
        await this.sql`CREATE TABLE IF NOT EXISTS "PersistedRecord" (
          namespace text NOT NULL,
          key text NOT NULL,
          json text NOT NULL,
          "updatedAt" timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (namespace, key)
        )`;
      })();
    }
    await this.ready;
    return this.sql as NeonSql;
  }

  async put<T>(namespace: string, key: string, value: T): Promise<void> {
    const sql = await this.init();
    const json = JSON.stringify(value);
    await sql`INSERT INTO "PersistedRecord" (namespace, key, json, "updatedAt")
      VALUES (${namespace}, ${key}, ${json}, now())
      ON CONFLICT (namespace, key) DO UPDATE SET json = ${json}, "updatedAt" = now()`;
  }

  async get<T>(namespace: string, key: string): Promise<T | null> {
    const sql = await this.init();
    const rows = await sql`SELECT json FROM "PersistedRecord" WHERE namespace = ${namespace} AND key = ${key} LIMIT 1`;
    return rows[0] ? (JSON.parse(rows[0].json as string) as T) : null;
  }

  async list<T>(namespace: string, opts?: ListOptions): Promise<T[]> {
    const sql = await this.init();
    // Bound the scan when a limit is given (returns the most-recent N) so a large
    // namespace can't be fetched in full on every request.
    const rows = opts?.limit
      ? await sql`SELECT json FROM "PersistedRecord" WHERE namespace = ${namespace} ORDER BY "updatedAt" DESC LIMIT ${opts.limit}`
      : await sql`SELECT json FROM "PersistedRecord" WHERE namespace = ${namespace} ORDER BY "updatedAt" DESC`;
    // Skip (don't throw on) a corrupt row, so one bad record can't blank the
    // entire namespace listing.
    const out: T[] = [];
    for (const r of rows) {
      try {
        out.push(JSON.parse(r.json as string) as T);
      } catch {
        console.error(JSON.stringify({ level: "error", scope: "NeonStore.list", namespace, message: "skipped unparseable row" }));
      }
    }
    return out;
  }

  async delete(namespace: string, key: string): Promise<void> {
    const sql = await this.init();
    await sql`DELETE FROM "PersistedRecord" WHERE namespace = ${namespace} AND key = ${key}`;
  }
}

const g = globalThis as unknown as { __kvStore?: KvStore };

/**
 * The process persistence store: Neon Postgres when POSTGRES_URL is set,
 * per-instance memory otherwise. Cached on globalThis so warm invocations reuse it.
 */
export function getStore(): KvStore {
  if (g.__kvStore) return g.__kvStore;
  const url = postgresUrl();
  g.__kvStore = url ? new NeonStore(url) : new MemoryStore();
  return g.__kvStore;
}
