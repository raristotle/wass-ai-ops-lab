/**
 * Server-side persistence seam (env-gated, dormant by default).
 *
 * In-memory (per-instance) namespaced KV by default; a Postgres-backed store
 * (via Prisma's PersistedRecord model) is the drop-in when POSTGRES_URL is set.
 * A namespaced JSON KV lets any entity (RFQ intakes, RMAs, shipment overrides)
 * persist without bespoke tables during the dormant phase. `persistenceConfigured()`
 * reports infra readiness (POSTGRES_URL present); wiring the Prisma adapter +
 * `prisma migrate` is the activation step.
 *
 * The interface + MemoryStore are pure and fully testable; the Postgres adapter
 * is a documented lazy drop-in (not imported until configured, so the build
 * never depends on a generated Prisma client).
 */

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** True when a Postgres URL is configured (the Prisma adapter can be activated). */
export function persistenceConfigured(): boolean {
  return Boolean(env("POSTGRES_URL"));
}

export interface KvStore {
  readonly backend: "memory" | "postgres";
  put<T>(namespace: string, key: string, value: T): Promise<void>;
  get<T>(namespace: string, key: string): Promise<T | null>;
  list<T>(namespace: string): Promise<T[]>;
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

  async list<T>(namespace: string): Promise<T[]> {
    return [...this.ns(namespace).values()].map((v) => JSON.parse(JSON.stringify(v)) as T);
  }

  async delete(namespace: string, key: string): Promise<void> {
    this.ns(namespace).delete(key);
  }
}

const g = globalThis as unknown as { __kvStore?: KvStore };

/**
 * The process persistence store. Memory today; with POSTGRES_URL set, swap this
 * factory to return the Prisma-backed adapter (same KvStore interface over the
 * PersistedRecord table). Cached on globalThis so warm invocations reuse it.
 */
export function getStore(): KvStore {
  return (g.__kvStore ??= new MemoryStore());
}
