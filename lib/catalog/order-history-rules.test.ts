import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@/lib/server/persistence";
import { mineAssociationRules, type Basket } from "@/lib/catalog/market-basket";
import {
  saveOrderHistory,
  clearOrderHistory,
  getOrderHistoryManifest,
  loadImportedRulesIndex,
  _resetOrderHistoryCache,
  type OrderHistoryManifest,
} from "@/lib/catalog/order-history-rules";

function manifest(over: Partial<OrderHistoryManifest> = {}): OrderHistoryManifest {
  return {
    version: 1, customer: "Acme", orders: 10, lines: 30, resolved: 28, unresolved: 2,
    distinctSkus: 12, distinctSubcategories: 6, rulesMined: 4, topPairs: [], importedAtIso: "2026-06-20T00:00:00.000Z",
    ...over,
  };
}

// Baskets where Switches strongly co-occur with Wall Plates & Covers.
function baskets(): Basket[] {
  return Array.from({ length: 6 }, () => ({
    items: [
      { productId: "x", subcategory: "Switches" },
      { productId: "y", subcategory: "Wall Plates & Covers" },
    ],
  }));
}

describe("order-history-rules store", () => {
  beforeEach(() => _resetOrderHistoryCache());

  it("returns null index + null manifest before any import", async () => {
    const store = new MemoryStore();
    expect(await loadImportedRulesIndex(store, "global", 1000)).toBeNull();
    expect(await getOrderHistoryManifest(store)).toBeNull();
  });

  it("persists mined rules + manifest and serves them as an antecedent index", async () => {
    const store = new MemoryStore();
    const rules = mineAssociationRules(baskets(), { grain: "subcategory", minCount: 2, minLift: 0 });
    expect(rules.length).toBeGreaterThan(0);
    await saveOrderHistory(store, rules, manifest({ rulesMined: rules.length }));

    const idx = await loadImportedRulesIndex(store, "global", 2000);
    expect(idx).not.toBeNull();
    expect(idx!.get("Switches")?.some((r) => r.b === "Wall Plates & Covers")).toBe(true);

    const m = await getOrderHistoryManifest(store);
    expect(m?.customer).toBe("Acme");
    expect(m?.rulesMined).toBe(rules.length);
  });

  it("caches the index per scope within the TTL and refreshes after it", async () => {
    const store = new MemoryStore();
    _resetOrderHistoryCache();
    await saveOrderHistory(store, mineAssociationRules(baskets(), { minCount: 2, minLift: 0 }), manifest());
    const t = 50_000;
    expect(await loadImportedRulesIndex(store, "global", t)).not.toBeNull(); // populates the cache
    await store.delete("order-history", "rules");
    expect(await loadImportedRulesIndex(store, "global", t + 5_000)).not.toBeNull(); // within 20s TTL → cached
    expect(await loadImportedRulesIndex(store, "global", t + 25_000)).toBeNull(); // past TTL → re-read sees the deletion
  });

  it("keeps scopes isolated — tenant A's rules never serve tenant B", async () => {
    const store = new MemoryStore();
    _resetOrderHistoryCache();
    await saveOrderHistory(store, mineAssociationRules(baskets(), { minCount: 2, minLift: 0 }), manifest());
    // Same underlying store, different scope key → its own cache slot, read fresh.
    expect(await loadImportedRulesIndex(store, "tenant-A", 1000)).not.toBeNull();
    // A separate empty store under a different scope must not see A's cached index.
    const empty = new MemoryStore();
    expect(await loadImportedRulesIndex(empty, "tenant-B", 1000)).toBeNull();
  });

  it("clearOrderHistory removes rules + manifest", async () => {
    const store = new MemoryStore();
    await saveOrderHistory(store, mineAssociationRules(baskets(), { minCount: 2, minLift: 0 }), manifest());
    await clearOrderHistory(store);
    expect(await getOrderHistoryManifest(store)).toBeNull();
    expect(await loadImportedRulesIndex(store, "global", 99_000)).toBeNull();
  });
});
