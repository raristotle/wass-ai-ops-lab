import { describe, it, expect } from "vitest";
import {
  suggestCompletions,
  completeTheJob,
} from "@/lib/product-finder-complete-job";
import { getCatalog } from "@/lib/catalog/index";
import { AFFINITY } from "@/lib/catalog/goeswith";
import type { CatalogProduct } from "@/features/product-finder/types";

function p(id: string, subcategory: string): CatalogProduct {
  return {
    id,
    sku: id.toUpperCase(),
    name: `Product ${id}`,
    brand: "B",
    category: "electrical",
    subcategory,
    description: "",
    unitPrice: 10,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "⚡",
  };
}

describe("suggestCompletions — remaining branches", () => {
  it("returns [] when no basket item yields any complement (loop body never pushes)", () => {
    const basket = [
      { product: p("x1", "Circuit Breakers") },
      { product: p("x2", "Conduit") },
    ];
    // resolver yields nothing for every product → reaches the final `return out`
    const out = suggestCompletions(basket, () => []);
    expect(out).toEqual([]);
  });

  it("hits the in-loop cap mid-stream while later complements remain unseen", () => {
    // First basket item alone produces 3 distinct, gap-filling complements.
    // With k=2 the function must `return out` from INSIDE the loop (line 36)
    // before ever examining the second complement of the second basket item.
    const resolver = (prod: CatalogProduct): CatalogProduct[] => {
      if (prod.subcategory === "Circuit Breakers") {
        return [
          p("c-a", "Load Centers"),
          p("c-b", "Panelboards"),
          p("c-c", "Lugs & Wire Connectors"),
        ];
      }
      // A complement that would be added if the loop continued past the cap.
      return [p("never", "Fuses")];
    };
    const basket = [
      { product: p("b1", "Circuit Breakers") },
      { product: p("b2", "Conduit") },
    ];
    const out = suggestCompletions(basket, resolver, 2);
    expect(out).toHaveLength(2);
    expect(out.map((s) => s.product.id)).toEqual(["c-a", "c-b"]);
    // The would-be third / second-item complements were never reached.
    expect(out.find((s) => s.product.id === "never")).toBeUndefined();
  });

  it("priority follows basket order across multiple items", () => {
    const resolver = (prod: CatalogProduct): CatalogProduct[] => {
      if (prod.subcategory === "Conduit") return [p("first", "Conduit Fittings")];
      if (prod.subcategory === "Switches") return [p("second", "Wall Plates & Covers")];
      return [];
    };
    const basket = [
      { product: p("a", "Conduit") },
      { product: p("b", "Switches") },
    ];
    const out = suggestCompletions(basket, resolver);
    expect(out.map((s) => s.product.id)).toEqual(["first", "second"]);
    expect(out[0].reason).toBe("Pairs with Product a");
    expect(out[1].reason).toBe("Pairs with Product b");
  });

  it("dedups a complement that two DIFFERENT basket subcats both surface", () => {
    // "Lugs & Wire Connectors" is an affinity of both Circuit Breakers and Conduit.
    const lug = p("shared-lug", "Lugs & Wire Connectors");
    const resolver = (prod: CatalogProduct): CatalogProduct[] => {
      if (prod.subcategory === "Circuit Breakers") return [lug];
      if (prod.subcategory === "Conduit") return [lug];
      return [];
    };
    const basket = [
      { product: p("b1", "Circuit Breakers") },
      { product: p("b2", "Conduit") },
    ];
    const out = suggestCompletions(basket, resolver);
    expect(out).toHaveLength(1);
    expect(out[0].product.id).toBe("shared-lug");
    // Reason attributes it to the FIRST basket item that surfaced it.
    expect(out[0].reason).toBe("Pairs with Product b1");
  });
});

describe("completeTheJob — convenience wrapper over the real catalog", () => {
  // Pick a real catalog product whose subcategory has an affinity list, so
  // goesWith() returns genuine complements and the wrapper produces output.
  const { products } = getCatalog();

  function realProductInSubcat(subcat: string): CatalogProduct | undefined {
    return products.find((pr) => pr.subcategory === subcat);
  }

  it("surfaces real complements for a single-line basket and respects default k=4", () => {
    // Find any subcategory present in the catalog that also has an affinity map.
    const seed = products.find(
      (pr) => (AFFINITY[pr.subcategory]?.length ?? 0) > 0,
    );
    expect(seed).toBeDefined();
    if (!seed) return;

    const out = completeTheJob([{ product: seed }]);
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBeLessThanOrEqual(4);

    // Every suggestion is a well-formed CompletionSuggestion.
    for (const s of out) {
      expect(typeof s.product.id).toBe("string");
      expect(s.reason).toBe(`Pairs with ${seed.name}`);
      // Never the seed itself…
      expect(s.product.id).not.toBe(seed.id);
      // …and never something sharing the basket's covered subcategory.
      expect(s.product.subcategory).not.toBe(seed.subcategory);
    }
  });

  it("honours an explicit, smaller k", () => {
    const seed = products.find(
      (pr) => (AFFINITY[pr.subcategory]?.length ?? 0) > 0,
    );
    expect(seed).toBeDefined();
    if (!seed) return;

    const full = completeTheJob([{ product: seed }]);
    // Only meaningful if the seed actually has >1 complement available.
    if (full.length > 1) {
      const capped = completeTheJob([{ product: seed }], 1);
      expect(capped).toHaveLength(1);
      expect(capped[0].product.id).toBe(full[0].product.id);
    } else {
      expect(completeTheJob([{ product: seed }], 1).length).toBeLessThanOrEqual(1);
    }
  });

  it("returns no duplicate product ids across the whole result", () => {
    const seed = products.find(
      (pr) => (AFFINITY[pr.subcategory]?.length ?? 0) > 0,
    );
    if (!seed) return;
    const out = completeTheJob([{ product: seed }], 8);
    const ids = out.map((s) => s.product.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns [] for an empty basket", () => {
    expect(completeTheJob([])).toEqual([]);
  });

  it("does not re-suggest a subcategory the basket already covers", () => {
    // Build a 2-line basket from two real, different subcategories so the
    // wrapper's gap-filter has covered subcats to exclude.
    const a = realProductInSubcat("Circuit Breakers");
    const b = realProductInSubcat("Load Centers");
    if (!a || !b) return; // catalog may not include these exact subcats
    const basket = [{ product: a }, { product: b }];
    const out = completeTheJob(basket, 8);
    const coveredSubcats = new Set(basket.map((l) => l.product.subcategory));
    for (const s of out) {
      expect(coveredSubcats.has(s.product.subcategory)).toBe(false);
    }
  });
});
