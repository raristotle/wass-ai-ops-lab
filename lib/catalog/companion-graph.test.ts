import { describe, it, expect, beforeEach } from "vitest";
import {
  companionsFor,
  completeAssembly,
  attachSuggestionsForCart,
  _resetCompanionCache,
} from "@/lib/catalog/companion-graph";
import { indexByAntecedent, mineAssociationRules, type Basket } from "@/lib/catalog/market-basket";
import { getCatalog } from "@/lib/catalog/index";
import type { CatalogProduct } from "@/features/product-finder/types";

function firstIn(subcategory: string): CatalogProduct {
  const p = getCatalog().products.find((x) => x.subcategory === subcategory);
  if (!p) throw new Error(`no catalog product in ${subcategory}`);
  return p;
}

beforeEach(() => _resetCompanionCache());

describe("companionsFor", () => {
  it("surfaces a required companion first, scored above recommended", () => {
    const sw = firstIn("Switches");
    const companions = companionsFor(sw, 8);
    expect(companions.length).toBeGreaterThan(0);
    const plate = companions.find((c) => c.product.subcategory === "Wall Plates & Covers");
    expect(plate).toBeDefined();
    expect(plate!.relation).toBe("required");
    expect(plate!.reasons.some((r) => /Required/.test(r))).toBe(true);
    // required edges sort ahead of recommended.
    const firstRecIdx = companions.findIndex((c) => c.relation === "recommended");
    const lastReqIdx = companions.map((c) => c.relation).lastIndexOf("required");
    if (firstRecIdx !== -1 && lastReqIdx !== -1) expect(lastReqIdx).toBeLessThan(firstRecIdx);
    // never recommends the seed itself.
    expect(companions.every((c) => c.product.id !== sw.id)).toBe(true);
    // attach scores are 0-100.
    for (const c of companions) expect(c.attachScore).toBeGreaterThanOrEqual(0), expect(c.attachScore).toBeLessThanOrEqual(100);
  });

  it("applies market-basket lift as an overlay (source + reason)", () => {
    const breaker = firstIn("Circuit Breakers");
    // Synthesize baskets where Circuit Breakers strongly co-occur with Surge Protective Devices.
    const baskets: Basket[] = Array.from({ length: 6 }, () => ({
      items: [
        { productId: "x", subcategory: "Circuit Breakers" },
        { productId: "y", subcategory: "Surge Protective Devices" },
      ],
    }));
    const rules = indexByAntecedent(mineAssociationRules(baskets, { minCount: 2, minLift: 0 }));
    const companions = companionsFor(breaker, 12, { rulesBySubcat: rules });
    const spd = companions.find((c) => c.product.subcategory === "Surge Protective Devices");
    expect(spd).toBeDefined();
    expect(spd!.sources).toContain("market-basket");
    expect(spd!.reasons.some((r) => /lift/.test(r))).toBe(true);
  });

  it("memoizes the deterministic (no-rules) result", () => {
    const sw = firstIn("Switches");
    const a = companionsFor(sw, 6);
    const b = companionsFor(sw, 6);
    expect(b).toEqual(a);
  });
});

describe("completeAssembly", () => {
  it("flags a missing REQUIRED companion (a switch with no wall plate)", () => {
    const sw = firstIn("Switches");
    const res = completeAssembly([sw]);
    expect(res.missingRequired.some((c) => c.product.subcategory === "Wall Plates & Covers")).toBe(true);
  });

  it("does NOT flag a requirement that is already in the set", () => {
    const sw = firstIn("Switches");
    const plate = firstIn("Wall Plates & Covers");
    const res = completeAssembly([sw, plate]);
    expect(res.missingRequired.some((c) => c.product.subcategory === "Wall Plates & Covers")).toBe(false);
  });

  it("recommended never overlaps missingRequired", () => {
    const res = completeAssembly([firstIn("Conduit"), firstIn("Wire & Cable")]);
    const reqIds = new Set(res.missingRequired.map((c) => c.product.id));
    expect(res.recommended.every((c) => !reqIds.has(c.product.id))).toBe(true);
  });
});

describe("attachSuggestionsForCart", () => {
  it("aggregates + dedups companions across the cart", () => {
    const cart = [firstIn("Switches"), firstIn("Receptacles & Outlets")];
    const out = attachSuggestionsForCart(cart, {}, 6);
    expect(out.length).toBeGreaterThan(0);
    const ids = out.map((c) => c.product.id);
    expect(new Set(ids).size).toBe(ids.length); // deduped
    const cartIds = new Set(cart.map((p) => p.id));
    expect(out.every((c) => !cartIds.has(c.product.id))).toBe(true); // not already in cart
  });
});
