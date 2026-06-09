import { describe, it, expect } from "vitest";
import { stockWarning } from "@/lib/product-finder-stock-warning";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(id: string, opts: { myBranch?: number; otherBranch?: number; dc?: number } = {}): CatalogProduct {
  const branchStock = [];
  if (opts.myBranch) branchStock.push({ branchId: "B-HOU-01", branchName: "Houston", city: "Houston", state: "TX", quantity: opts.myBranch });
  if (opts.otherBranch) branchStock.push({ branchId: "B-DAL-01", branchName: "Dallas", city: "Dallas", state: "TX", quantity: opts.otherBranch });
  return {
    id, sku: id.toUpperCase(), name: `P ${id}`, brand: "B", category: "electrical",
    subcategory: "Circuit Breakers", description: "", unitPrice: 10, uom: "EA", specs: [],
    preferred: false, branchStock,
    dcStock: opts.dc ? [{ dcId: "DC1", dcName: "DC", location: "Dallas", quantity: opts.dc }] : [],
    externalSources: [], imageIcon: "⚡",
  };
}

describe("stockWarning", () => {
  it("returns null when qty is within available stock", () => {
    expect(stockWarning(prod("a", { myBranch: 10, dc: 5 }), 12)).toBeNull();
  });

  it("warns with the correct shortfall when qty exceeds stock", () => {
    const w = stockWarning(prod("a", { myBranch: 10, dc: 20 }), 50);
    expect(w).not.toBeNull();
    expect(w!.available).toBe(30);
    expect(w!.ordered).toBe(50);
    expect(w!.shortfall).toBe(20);
  });

  it("supplies a backorder ETA label and days", () => {
    const w = stockWarning(prod("a"), 5)!;
    expect(["3–5 business days", "1–2 weeks", "2–3 weeks", "4–6 weeks"]).toContain(w.backorderEtaLabel);
    expect(w.backorderEtaDays).toBeGreaterThan(0);
  });

  it("restricts availability to the rep's branch when branchId is given", () => {
    // Stock sits at another branch; from B-HOU-01 only DC counts.
    const p = prod("a", { otherBranch: 100, dc: 5 });
    const w = stockWarning(p, 10, "B-HOU-01");
    expect(w).not.toBeNull();
    expect(w!.available).toBe(5); // DC only
  });

  it("is deterministic for the same product", () => {
    const p = prod("a");
    expect(stockWarning(p, 5)!.backorderEtaDays).toBe(stockWarning(p, 9)!.backorderEtaDays);
  });
});
