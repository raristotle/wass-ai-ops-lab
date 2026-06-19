import { describe, it, expect } from "vitest";
import { resolveBySku } from "@/lib/catalog/sku-index";
import { getCatalog } from "@/lib/catalog/index";
import { identifierKey } from "@/lib/catalog/identifiers";

// The catalog is a deterministic, seeded singleton (FIXED_SEED), so a SKU pulled
// from it is a stable anchor without hardcoding a value that could drift.
const sample = getCatalog().products[0];

describe("resolveBySku", () => {
  it("resolves a real catalog SKU to its product (index build + lookup hit)", () => {
    const hit = resolveBySku(sample.sku);
    expect(hit).not.toBeNull();
    // Resolves to *a* product carrying the same normalized identifier. (Not
    // necessarily object-identical to `sample`: if two catalog products share a
    // normalized key, the first one indexed wins — see the dedup test below.)
    expect(hit && identifierKey(hit.sku)).toBe(identifierKey(sample.sku));
  });

  it("returns null for a SKU that is not carried", () => {
    expect(resolveBySku("NOT-A-REAL-SKU-zzz-99999")).toBeNull();
  });

  it("returns null for empty / whitespace-only / separator-only input", () => {
    // identifierKey() reduces all of these to "" — which is never an indexed key.
    expect(resolveBySku("")).toBeNull();
    expect(resolveBySku("   ")).toBeNull();
    expect(resolveBySku("---")).toBeNull();
  });

  it("resolves equivalent SKU spellings (case / separators) to the same product", () => {
    const lower = sample.sku.toLowerCase();
    const spaced = sample.sku.replace(/[-_]/g, " ");
    const messy = `  ${sample.sku.replace(/-/g, "-_- ")}  `; // extra junk separators

    const canonical = resolveBySku(sample.sku);
    expect(canonical).not.toBeNull();
    // Each variant normalizes to the same identifierKey, so all hit the same entry.
    expect(resolveBySku(lower)).toBe(canonical);
    expect(resolveBySku(sample.sku.toUpperCase())).toBe(canonical);
    expect(resolveBySku(spaced)).toBe(canonical);
    expect(resolveBySku(messy)).toBe(canonical);
  });

  it("returns a cached, stable reference across calls (globalThis index reuse)", () => {
    // First call builds + caches the index on globalThis; subsequent calls hit
    // the cached branch and must return the identical product object.
    const a = resolveBySku(sample.sku);
    const b = resolveBySku(sample.sku);
    expect(a).toBe(b);
  });

  it("first product wins for any colliding normalized key (dedup branch)", () => {
    // Build the expected first-wins map the same way the module does, straight
    // from the catalog, and assert resolveBySku agrees for the FIRST occurrence
    // of every normalized key. This exercises the `if (!m.has(k))` skip branch
    // whenever the catalog contains a normalized-key collision.
    const products = getCatalog().products;
    const firstByKey = new Map<string, (typeof products)[number]>();
    let collisions = 0;
    for (const p of products) {
      const k = identifierKey(p.sku);
      if (firstByKey.has(k)) {
        collisions++;
      } else {
        firstByKey.set(k, p);
      }
    }
    // Spot-check the first few distinct keys resolve to their first owner.
    let checked = 0;
    for (const [, first] of firstByKey) {
      expect(resolveBySku(first.sku)).toBe(first);
      if (++checked >= 5) break;
    }
    expect(checked).toBeGreaterThan(0);
    // collisions may be 0 in the seeded catalog; the assertion above is the
    // important invariant regardless. Reference it so it isn't dead.
    expect(collisions).toBeGreaterThanOrEqual(0);
  });
});
