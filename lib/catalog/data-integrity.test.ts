import { describe, it, expect } from "vitest";
import { REAL_PRODUCT_ENTRIES } from "@/data/real/real-products";
import { VERIFIED_CROSS_ENTRIES } from "@/data/real/verified-crosses";
import { BOM_CROSS_ENTRIES } from "@/data/real/bom-crosses";
import { APPLETON_TOOL_CROSS_ENTRIES } from "@/data/real/appleton-tool-crosses";

/**
 * Real-data-layer integrity guardrail ("review every SKU" as a permanent test).
 *
 * Runs the deterministic validation pass over EVERY real product and EVERY
 * source-cited cross on every CI run: no duplicate SKUs, required fields present,
 * crosses well-formed and sourced, and a cross-coverage floor so a regression that
 * silently drops crosses is caught. Matching is brand-aware — two manufacturers can
 * legitimately share a catalog number (e.g. P&S CR20W ↔ Cooper CR20W), so identity
 * is (brand + MPN), never MPN alone.
 */

const norm = (s: string) => String(s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const idKey = (brand: string, mpn: string) => `${norm(brand)}::${norm(mpn)}`;
const ALL_CROSSES = [...VERIFIED_CROSS_ENTRIES, ...BOM_CROSS_ENTRIES, ...APPLETON_TOOL_CROSS_ENTRIES];
const ALLOWED_RELATIONS = new Set(["equivalent", "functional-substitute"]);

describe("real product data integrity", () => {
  it("has no duplicate (brand + MPN) products", () => {
    const seen = new Map<string, string>();
    const dups: string[] = [];
    for (const p of REAL_PRODUCT_ENTRIES) {
      const k = idKey(p.brand, p.mpn);
      if (seen.has(k)) dups.push(`${p.brand} ${p.mpn} (dup of ${seen.get(k)})`);
      else seen.set(k, `${p.brand} ${p.mpn}`);
    }
    expect(dups, `duplicate SKUs found:\n${dups.join("\n")}`).toEqual([]);
  });

  it("every product has the required identity + provenance fields", () => {
    const bad: string[] = [];
    for (const p of REAL_PRODUCT_ENTRIES) {
      if (!p.mpn?.trim()) bad.push("missing mpn");
      if (!p.brand?.trim()) bad.push(`${p.mpn}: missing brand`);
      if (!p.name?.trim()) bad.push(`${p.mpn}: missing name`);
      if (!p.category?.trim()) bad.push(`${p.mpn}: missing category`);
      if (!Array.isArray(p.specs) || p.specs.length === 0) bad.push(`${p.mpn}: no specs`);
      if (!p.specSheetUrl || !/^https?:\/\//.test(p.specSheetUrl)) bad.push(`${p.mpn}: bad datasheet URL`);
      if (!(Number(p.estListPrice) > 0)) bad.push(`${p.mpn}: no price`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(p.verifiedAt)) bad.push(`${p.mpn}: bad verifiedAt`);
    }
    expect(bad, `field issues:\n${bad.join("\n")}`).toEqual([]);
  });
});

describe("cross-reference data integrity", () => {
  it("every cross is well-formed, sourced, and has an allowed relation", () => {
    const bad: string[] = [];
    for (const c of ALL_CROSSES) {
      if (!c.aBrand?.trim() || !c.aMpn?.trim() || !c.bBrand?.trim() || !c.bMpn?.trim())
        bad.push(`incomplete: ${JSON.stringify([c.aBrand, c.aMpn, c.bBrand, c.bMpn])}`);
      if (!c.sourceUrl?.trim()) bad.push(`${c.aMpn}↔${c.bMpn}: no source`);
      if (!ALLOWED_RELATIONS.has(c.relation)) bad.push(`${c.aMpn}↔${c.bMpn}: relation ${c.relation}`);
    }
    expect(bad, `cross issues:\n${bad.join("\n")}`).toEqual([]);
  });

  it("has no self-cross (a part crossed to itself, same brand)", () => {
    const self = ALL_CROSSES.filter((c) => idKey(c.aBrand, c.aMpn) === idKey(c.bBrand, c.bMpn));
    expect(self.map((c) => `${c.aBrand} ${c.aMpn}`)).toEqual([]);
  });

  it("has no duplicate cross pairs (brand+MPN, unordered)", () => {
    const seen = new Set<string>();
    const dups: string[] = [];
    for (const c of ALL_CROSSES) {
      const pk = [idKey(c.aBrand, c.aMpn), idKey(c.bBrand, c.bMpn)].sort().join("|");
      if (seen.has(pk)) dups.push(`${c.aMpn}↔${c.bMpn}`);
      else seen.add(pk);
    }
    expect(dups, `duplicate pairs:\n${dups.join("\n")}`).toEqual([]);
  });

  it("holds the cross-coverage floor (regression guard for dropped crosses)", () => {
    const crossed = new Set<string>();
    for (const c of ALL_CROSSES) {
      crossed.add(norm(c.aMpn));
      crossed.add(norm(c.bMpn));
    }
    const covered = REAL_PRODUCT_ENTRIES.filter((p) => crossed.has(norm(p.mpn))).length;
    // Source-cited authoritative coverage (manufacturer cross tools + verified tables).
    // Floor, not exact — adding sourced crosses must never make this test fail.
    expect(covered).toBeGreaterThanOrEqual(80);
  });
});
