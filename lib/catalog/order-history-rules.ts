/**
 * Order-history rules store (pilot data onboarding) — the bridge between an imported
 * order file and the always-on cross-sell rail.
 *
 * At import time the route mines the customer's real baskets into subcategory-grain
 * association rules (lift/confidence/support) and persists them here, plus a manifest
 * of what was imported. The companion endpoints then load these rules and pass them
 * as `ctx.rulesBySubcat`, so REAL co-purchase lift drives the cross-sell everywhere —
 * not only when a client happens to pass baskets on the request.
 *
 * Scope is APP-GLOBAL for the pilot (one distributor catalog → one co-purchase model),
 * stored untenanted via getStore(). Per-customer behavioral models are a documented
 * future enhancement. $0: reuses the existing durable store (Neon when configured,
 * in-memory otherwise); the hot read is cached in-memory with a short TTL.
 */

import type { KvStore } from "@/lib/server/persistence";
import { indexByAntecedent, type AssocRule } from "@/lib/catalog/market-basket";

export const ORDER_HISTORY_NS = "order-history";
const RULES_KEY = "rules";
const MANIFEST_KEY = "manifest";

/** A top co-purchase pair, for the import summary / status card. */
export interface TopPair {
  a: string;
  b: string;
  lift: number;
  count: number;
}

export interface OrderHistoryManifest {
  /** Bumped on every import so a reader can tell its cache is stale. */
  version: number;
  /** Optional label the operator gave the import (e.g. the customer/account name). */
  customer: string | null;
  orders: number;
  lines: number;
  resolved: number;
  unresolved: number;
  distinctSkus: number;
  distinctSubcategories: number;
  rulesMined: number;
  topPairs: TopPair[];
  importedAtIso: string;
}

/** Persist mined rules + manifest. Replaces the prior import (single global model). */
export async function saveOrderHistory(store: KvStore, rules: AssocRule[], manifest: OrderHistoryManifest): Promise<void> {
  await store.put(ORDER_HISTORY_NS, RULES_KEY, rules);
  await store.put(ORDER_HISTORY_NS, MANIFEST_KEY, manifest);
  _resetOrderHistoryCache(); // reflect immediately on the importing instance
}

/** Clear all imported order history (back to the deterministic-only rail). */
export async function clearOrderHistory(store: KvStore): Promise<void> {
  await store.delete(ORDER_HISTORY_NS, RULES_KEY);
  await store.delete(ORDER_HISTORY_NS, MANIFEST_KEY);
  _resetOrderHistoryCache();
}

/** The import manifest (counts + top pairs), or null when nothing has been imported. */
export async function getOrderHistoryManifest(store: KvStore): Promise<OrderHistoryManifest | null> {
  try {
    return await store.get<OrderHistoryManifest>(ORDER_HISTORY_NS, MANIFEST_KEY);
  } catch {
    return null;
  }
}

// ── Hot-path cache ───────────────────────────────────────────────────────────
// The companion rail reads the imported rules on every request, so cache the built
// index in-memory and only re-read the store every TTL_MS. Cached PER SCOPE (tenant
// id, or "global" when sessions are off) so one tenant's rules never serve another's.
// An import on the same instance resets all scopes; other instances refresh within
// the TTL.
const TTL_MS = 20_000;
const _cache = new Map<string, { index: Map<string, AssocRule[]> | null; at: number }>();

export function _resetOrderHistoryCache(): void {
  _cache.clear();
}

/**
 * The imported co-purchase rules indexed by antecedent subcategory, for
 * `CompanionContext.rulesBySubcat`. Returns null when no order history is imported
 * for this scope (the rail falls back to the deterministic spec-rule + affinity view).
 * Fails closed to null on any store error — a behavioral overlay must never break the
 * rail.
 *
 * @param store     a tenant-scoped store (forTenant(getStore(), tenantForRequest(req))).
 * @param scopeKey  a stable cache key for the scope — the tenant id, or "global".
 * @param nowMs     injectable clock; defaults to Date.now() in the request path.
 */
export async function loadImportedRulesIndex(
  store: KvStore,
  scopeKey: string,
  nowMs: number = Date.now(),
): Promise<Map<string, AssocRule[]> | null> {
  const cached = _cache.get(scopeKey);
  if (cached && nowMs - cached.at < TTL_MS) return cached.index;
  try {
    const rules = await store.get<AssocRule[]>(ORDER_HISTORY_NS, RULES_KEY);
    const index = rules && rules.length > 0 ? indexByAntecedent(rules) : null;
    _cache.set(scopeKey, { index, at: nowMs });
    return index;
  } catch {
    _cache.set(scopeKey, { index: null, at: nowMs });
    return null;
  }
}
