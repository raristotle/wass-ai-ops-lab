import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@/lib/server/persistence";
import {
  parseCrosswalkCsv,
  crosswalkIndex,
  resolveCustomerNumber,
  saveCrosswalk,
  clearCrosswalk,
  getCrosswalkManifest,
  _resetCrosswalkCache,
  type CrosswalkEntry,
  type CrosswalkManifest,
} from "@/lib/catalog/crosswalk";

function manifest(over: Partial<CrosswalkManifest> = {}): CrosswalkManifest {
  return { version: 1, customer: "Acme", entries: 2, resolved: 2, unresolved: 0, importedAtIso: "2026-06-20T00:00:00.000Z", ...over };
}

describe("parseCrosswalkCsv", () => {
  it("maps customer-number + sku columns and drops incomplete rows", () => {
    const csv = ["your number,our_sku", "WX-1,CB-SQU-28", "WX-2,QO115", "WX-3,"].join("\n");
    const { entries, stats } = parseCrosswalkCsv(csv);
    expect(stats.mapping).toEqual({ customerNumber: "your number", sku: "our_sku" });
    expect(stats.dropped).toBe(1);
    expect(entries).toEqual([
      { customerNumber: "WX-1", sku: "CB-SQU-28" },
      { customerNumber: "WX-2", sku: "QO115" },
    ]);
  });

  it("maps a WESCO stock-number file (wesco # → mfr part) for part-number resolution", () => {
    // A rep imports their Wesco PIM export; reps then resolve/quote by Wesco stock number.
    const csv = ["wesco_sku,manufacturer_part", "78456410461,461", "78456410451,451", "78456410201,"].join("\n");
    const { entries, stats } = parseCrosswalkCsv(csv);
    expect(stats.mapping).toEqual({ customerNumber: "wesco_sku", sku: "manufacturer_part" });
    expect(stats.dropped).toBe(1);
    expect(entries).toEqual([
      { customerNumber: "78456410461", sku: "461" },
      { customerNumber: "78456410451", sku: "451" },
    ]);
  });

  it("returns no entries when a side is missing or both map to one column", () => {
    expect(parseCrosswalkCsv("foo,bar\n1,2").entries).toEqual([]);
    // 'part' matches the sku synonym; with no distinct customer column → nulled.
    expect(parseCrosswalkCsv("part\nX").stats.mapping.customerNumber).toBeNull();
  });
});

describe("crosswalkIndex + resolveCustomerNumber", () => {
  beforeEach(() => _resetCrosswalkCache());

  it("includes a deterministic demo seed that resolves to real SKUs", async () => {
    const idx = await crosswalkIndex(new MemoryStore(), "test", 1000);
    const hit = resolveCustomerNumber(idx, "WX-100000");
    expect(hit).not.toBeNull();
    expect(hit!.source).toBe("demo");
    expect(hit!.sku.length).toBeGreaterThan(0);
    // case/separator-insensitive normalization
    expect(resolveCustomerNumber(idx, "wx100000")).not.toBeNull();
    expect(resolveCustomerNumber(idx, "NOPE-999")).toBeNull();
  });

  it("imported entries override the demo seed on a key collision", async () => {
    const store = new MemoryStore();
    const entries: CrosswalkEntry[] = [{ customerNumber: "WX-100000", sku: "OVERRIDE-SKU", source: "import" }];
    await saveCrosswalk(store, entries, manifest({ entries: 1 }));
    const idx = await crosswalkIndex(store, "test", 2000);
    const hit = resolveCustomerNumber(idx, "WX-100000");
    expect(hit!.sku).toBe("OVERRIDE-SKU");
    expect(hit!.source).toBe("import");
  });

  it("persists + clears the manifest", async () => {
    const store = new MemoryStore();
    await saveCrosswalk(store, [{ customerNumber: "A", sku: "B", source: "import" }], manifest());
    expect((await getCrosswalkManifest(store))?.customer).toBe("Acme");
    await clearCrosswalk(store);
    expect(await getCrosswalkManifest(store)).toBeNull();
    // After clear, the index falls back to the demo seed only.
    const idx = await crosswalkIndex(store, "test", 9000);
    expect(resolveCustomerNumber(idx, "A")).toBeNull();
    expect(resolveCustomerNumber(idx, "WX-100000")).not.toBeNull();
  });
});
