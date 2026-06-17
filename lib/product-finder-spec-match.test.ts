import { describe, it, expect } from "vitest";
import { parseSpecRequirements, specQuery, matchSpec, rankSpecMatches } from "@/lib/product-finder-spec-match";
import type { CatalogProduct, ProductSpec } from "@/features/product-finder/types";

function prod(id: string, specs: ProductSpec[], unitPrice = 100): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category: "electrical", subcategory: "Disconnects",
    description: "", unitPrice, uom: "ea", specs, preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

describe("parseSpecRequirements", () => {
  it("parses a NEC-style spec into structured requirements", () => {
    const reqs = parseSpecRequirements("NEMA 4X enclosure, 60A, 480V 3-phase, SCCR ≥ 65kA, 2-pole");
    const byAttr = Object.fromEntries(reqs.map((r) => [r.attr, r]));
    expect(byAttr.Enclosure).toMatchObject({ op: "=", value: "NEMA 4X" });
    expect(byAttr.Amperage).toMatchObject({ op: ">=", value: "60A", num: 60 });
    expect(byAttr.Voltage).toMatchObject({ op: "=", value: "480V" });
    expect(byAttr.Phase).toMatchObject({ op: "=", value: "3PH" });
    expect(byAttr.SCCR).toMatchObject({ op: ">=", value: "65KA", num: 65 });
    expect(byAttr.Poles).toMatchObject({ op: "=", value: "2" });
    expect(specQuery(reqs)).toContain("480V");
  });

  it("parses the rating-first SCCR/AIC forms (safety-critical, must not vanish)", () => {
    const a = Object.fromEntries(parseSpecRequirements("100kA AIC, 400A, 240V").map((r) => [r.attr, r]));
    expect(a.SCCR).toMatchObject({ value: "100KA", num: 100 });
    expect(Object.fromEntries(parseSpecRequirements("65kA SCCR rating").map((r) => [r.attr, r])).SCCR).toMatchObject({ num: 65 });
    expect(Object.fromEntries(parseSpecRequirements("22kAIC").map((r) => [r.attr, r])).SCCR).toMatchObject({ num: 22 });
  });

  it("parses a spelled-out 'volt' and medium-voltage 4-digit ratings", () => {
    const v = Object.fromEntries(parseSpecRequirements("30 amp 250 volt").map((r) => [r.attr, r]));
    expect(v.Voltage).toMatchObject({ value: "250V" });
    expect(Object.fromEntries(parseSpecRequirements("4160V switchgear").map((r) => [r.attr, r])).Voltage).toMatchObject({ value: "4160V" });
  });
});

describe("matchSpec", () => {
  const reqs = parseSpecRequirements("480V, 60A, SCCR ≥ 65kA");
  it("passes a product meeting every requirement (>= honored numerically)", () => {
    const p = prod("PASS", [
      { name: "Voltage", value: "480V" },
      { name: "Amperage", value: "100A" }, // 100 >= 60 → pass
      { name: "SCCR", value: "100kA" }, // 100 >= 65 → pass
    ]);
    const r = matchSpec(p, reqs);
    expect(r.allPass).toBe(true);
    expect(r.passCount).toBe(3);
  });
  it("fails the SCCR check when the rating is below the minimum", () => {
    const p = prod("FAIL", [
      { name: "Voltage", value: "480V" },
      { name: "Amperage", value: "60A" },
      { name: "SCCR", value: "22kA" }, // 22 < 65 → fail
    ]);
    const r = matchSpec(p, reqs);
    expect(r.allPass).toBe(false);
    expect(r.checks.find((c) => c.attr === "SCCR")?.pass).toBe(false);
  });
  it("marks a missing spec as a failed (not silently passed) check", () => {
    const r = matchSpec(prod("MISS", [{ name: "Voltage", value: "480V" }]), reqs);
    expect(r.checks.find((c) => c.attr === "SCCR")?.actual).toBeNull();
    expect(r.checks.find((c) => c.attr === "SCCR")?.pass).toBe(false);
  });
});

describe("rankSpecMatches", () => {
  it("ranks the fuller match first", () => {
    const reqs = parseSpecRequirements("480V, 60A");
    const good = prod("GOOD", [{ name: "Voltage", value: "480V" }, { name: "Amperage", value: "60A" }]);
    const partial = prod("PARTIAL", [{ name: "Voltage", value: "480V" }]);
    const ranked = rankSpecMatches([partial, good], reqs);
    expect(ranked[0].product.id).toBe("GOOD");
    expect(ranked[0].allPass).toBe(true);
  });
});
