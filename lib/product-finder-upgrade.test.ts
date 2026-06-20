import { describe, it, expect } from "vitest";
import { upgradeDeltaCompanions, pickUpgrade, type UpgradeCompanion } from "@/lib/product-finder-upgrade";

function comp(id: string, subcategory: string, relation: UpgradeCompanion["relation"], score = 50): UpgradeCompanion {
  return { relation, attachScore: score, reasons: [], product: { id, sku: id, name: id, subcategory, unitPrice: 5 } };
}

describe("upgradeDeltaCompanions", () => {
  it("drops companions whose family is already in the compared set", () => {
    const companions = [comp("WP", "Wall Plates & Covers", "required"), comp("WR", "Weather-Resistant Covers", "required")];
    const delta = upgradeDeltaCompanions(companions, ["Wall Plates & Covers"]);
    expect(delta.map((c) => c.product.id)).toEqual(["WR"]); // WP already covered
  });

  it("required-first ordering and requiredOnly filter", () => {
    const companions = [comp("A", "Fa", "recommended", 90), comp("B", "Fb", "required", 10)];
    expect(upgradeDeltaCompanions(companions, []).map((c) => c.product.id)).toEqual(["B", "A"]);
    expect(upgradeDeltaCompanions(companions, [], true).map((c) => c.product.id)).toEqual(["B"]);
  });

  it("dedupes by product id", () => {
    const companions = [comp("X", "Fx", "required"), comp("X", "Fx", "required")];
    expect(upgradeDeltaCompanions(companions, [])).toHaveLength(1);
  });
});

describe("pickUpgrade", () => {
  it("picks the highest-priced product, preferred breaks ties", () => {
    const ps = [
      { id: "a", unitPrice: 10, preferred: false },
      { id: "b", unitPrice: 30, preferred: false },
      { id: "c", unitPrice: 30, preferred: true },
    ];
    expect(pickUpgrade(ps)!.id).toBe("c"); // tie at 30 → preferred
  });
  it("null for empty", () => {
    expect(pickUpgrade([])).toBeNull();
  });
});
