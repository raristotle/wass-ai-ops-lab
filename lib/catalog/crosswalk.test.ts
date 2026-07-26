import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStore } from "@/lib/server/persistence";
import {
  parseCrosswalkCsv,
  resolveCrosswalkRows,
  crosswalkIndex,
  resolveCustomerNumber,
  saveCrosswalk,
  clearCrosswalk,
  getCrosswalkManifest,
  saveCrosswalkRejects,
  getCrosswalkRejects,
  buildCrosswalkRejectReport,
  captureCrosswalkEntry,
  _resetCrosswalkCache,
  type CrosswalkEntry,
  type CrosswalkManifest,
} from "@/lib/catalog/crosswalk";
import { MAX_STORED_CROSSWALK_REJECTS, type CrosswalkReject } from "@/lib/catalog/crosswalk-reject";

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
      { customerNumber: "WX-1", sku: "CB-SQU-28", line: 2 },
      { customerNumber: "WX-2", sku: "QO115", line: 3 },
    ]);
    // PF-5: the dropped row is reported, not just counted.
    expect(stats.rejects).toEqual([
      { line: 4, customerNumber: "WX-3", sku: "", reason: "missing_sku", lookupKey: "", nearMatch: "" },
    ]);
  });

  it("maps a WESCO stock-number file (wesco # → mfr part) for part-number resolution", () => {
    // A rep imports their Wesco PIM export; reps then resolve/quote by Wesco stock number.
    const csv = ["wesco_sku,manufacturer_part", "78456410461,461", "78456410451,451", "78456410201,"].join("\n");
    const { entries, stats } = parseCrosswalkCsv(csv);
    expect(stats.mapping).toEqual({ customerNumber: "wesco_sku", sku: "manufacturer_part" });
    expect(stats.dropped).toBe(1);
    expect(entries).toEqual([
      { customerNumber: "78456410461", sku: "461", line: 2 },
      { customerNumber: "78456410451", sku: "451", line: 3 },
    ]);
  });

  it("returns no entries when a side is missing or both map to one column", () => {
    expect(parseCrosswalkCsv("foo,bar\n1,2").entries).toEqual([]);
    // 'part' matches the sku synonym; with no distinct customer column → nulled.
    expect(parseCrosswalkCsv("part\nX").stats.mapping.customerNumber).toBeNull();
  });

  // ── PF-5: unresolved-row triage ────────────────────────────────────────────
  it("reports a blank customer-number cell separately from a blank sku cell", () => {
    const csv = ["your number,our_sku", ",CB-SQU-28", "WX-2,", ",", "WX-4,QO115"].join("\n");
    const { entries, stats } = parseCrosswalkCsv(csv);
    expect(entries).toHaveLength(1);
    expect(stats.dropped).toBe(3);
    expect(stats.rejects.map((r) => [r.line, r.reason])).toEqual([
      [2, "missing_customer_number"],
      [3, "missing_sku"],
      // Both blank → reported on the customer-number side (the lookup key is the row's
      // reason to exist), so the operator gets one unambiguous instruction per row.
      [4, "missing_customer_number"],
    ]);
    // The cells are carried through exactly as supplied — never normalized or invented.
    expect(stats.rejects[0].sku).toBe("CB-SQU-28");
    expect(stats.rejects[1].customerNumber).toBe("WX-2");
  });

  it("numbers rejected rows by their ORIGINAL file line, counting blank lines", () => {
    // Blank lines are skipped for parsing but must still consume a line number, or every
    // row number in the triage export is off by one for the rest of the file.
    const csv = ["your number,our_sku", "", "WX-1,CB-SQU-28", "", "", "WX-BAD,"].join("\n");
    const { entries, stats } = parseCrosswalkCsv(csv);
    expect(entries).toEqual([{ customerNumber: "WX-1", sku: "CB-SQU-28", line: 3 }]);
    expect(stats.rejects).toHaveLength(1);
    expect(stats.rejects[0].line).toBe(6);
  });

  it("emits no per-row rejects when the header itself is unmappable (whole-file failure)", () => {
    const { stats } = parseCrosswalkCsv("foo,bar\n1,2\n3,4");
    expect(stats.dropped).toBe(2);
    expect(stats.rejects).toEqual([]);
  });
});

describe("resolveCrosswalkRows (PF-5 — sku_not_carried branch)", () => {
  // Injected resolver: only these two identifiers are "carried". Keeps the branch test
  // independent of the real 200k-product catalog.
  const CARRIED: Record<string, string> = { "CB-SQU-28": "CB-SQU-28", "WX-100023": "WX-100023" };
  const resolve = (id: string) => CARRIED[id] ?? null;

  it("keeps carried rows (storing the CANONICAL sku) and rejects the rest", () => {
    const { entries, rejects } = resolveCrosswalkRows(
      [
        { customerNumber: "A-1", sku: "CB-SQU-28", line: 2 },
        { customerNumber: "A-2", sku: "NOT-A-PART", line: 3 },
      ],
      resolve,
    );
    expect(entries).toEqual([{ customerNumber: "A-1", sku: "CB-SQU-28", source: "import" }]);
    expect(rejects).toHaveLength(1);
    expect(rejects[0]).toEqual({
      line: 3,
      customerNumber: "A-2",
      sku: "NOT-A-PART",
      reason: "sku_not_carried",
      // The normalized key the matcher actually tried — separators/case stripped.
      lookupKey: "NOTAPART",
      nearMatch: "",
    });
  });

  it("reports the normalized lookup key, explaining invisible normalization", () => {
    const { rejects } = resolveCrosswalkRows([{ customerNumber: "A", sku: "qo 115-x", line: 7 }], resolve);
    expect(rejects[0].lookupKey).toBe("QO115X");
  });

  it("proves a swapped-column file via an exact reverse lookup (never a fuzzy guess)", () => {
    const { entries, rejects } = resolveCrosswalkRows(
      [{ customerNumber: "WX-100023", sku: "THEIR-OWN-NUMBER", line: 2 }],
      resolve,
    );
    expect(entries).toEqual([]);
    expect(rejects[0].reason).toBe("sku_not_carried");
    expect(rejects[0].nearMatch).toBe("WX-100023");
  });

  it("produces nothing to triage when every row resolves (the empty case)", () => {
    const { entries, rejects } = resolveCrosswalkRows(
      [{ customerNumber: "A-1", sku: "CB-SQU-28", line: 2 }],
      resolve,
    );
    expect(entries).toHaveLength(1);
    expect(rejects).toEqual([]);
  });
});

describe("crosswalk reject report persistence (PF-5)", () => {
  beforeEach(() => _resetCrosswalkCache());

  function rej(line: number): CrosswalkReject {
    return { line, customerNumber: `WX-${line}`, sku: "", reason: "missing_sku", lookupKey: "", nearMatch: "" };
  }

  it("round-trips the report so the export survives a reload", async () => {
    const store = new MemoryStore();
    const report = buildCrosswalkRejectReport([rej(2), rej(3)], "2026-06-20T00:00:00.000Z");
    expect(report).toEqual({ rows: [rej(2), rej(3)], total: 2, truncated: false, importedAtIso: "2026-06-20T00:00:00.000Z" });
    await saveCrosswalkRejects(store, report);
    expect(await getCrosswalkRejects(store)).toEqual(report);
  });

  it("caps stored rows but keeps the honest total", () => {
    const many = Array.from({ length: MAX_STORED_CROSSWALK_REJECTS + 5 }, (_, i) => rej(i + 2));
    const report = buildCrosswalkRejectReport(many, "2026-06-20T00:00:00.000Z");
    expect(report.rows).toHaveLength(MAX_STORED_CROSSWALK_REJECTS);
    expect(report.total).toBe(MAX_STORED_CROSSWALK_REJECTS + 5);
    expect(report.truncated).toBe(true);
  });

  it("an import with nothing unresolved clears any previous report", async () => {
    const store = new MemoryStore();
    await saveCrosswalkRejects(store, buildCrosswalkRejectReport([rej(2)], "2026-06-20T00:00:00.000Z"));
    expect(await getCrosswalkRejects(store)).not.toBeNull();
    // A stale report from an earlier file would be actively misleading.
    await saveCrosswalkRejects(store, buildCrosswalkRejectReport([], "2026-06-21T00:00:00.000Z"));
    expect(await getCrosswalkRejects(store)).toBeNull();
  });

  it("clearing the crosswalk also drops its triage report", async () => {
    const store = new MemoryStore();
    await saveCrosswalk(store, [{ customerNumber: "A", sku: "B", source: "import" }], manifest());
    await saveCrosswalkRejects(store, buildCrosswalkRejectReport([rej(2)], "2026-06-20T00:00:00.000Z"));
    await clearCrosswalk(store);
    expect(await getCrosswalkRejects(store)).toBeNull();
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

describe("captureCrosswalkEntry (B17 — Wesco stock-# capture)", () => {
  beforeEach(() => _resetCrosswalkCache());

  it("appends a captured mapping, dedups by normalized number, and resolves as source 'captured'", async () => {
    const store = new MemoryStore();
    const a = await captureCrosswalkEntry(store, "WX 123", "CB-1");
    expect(a).toEqual({ entries: 1, added: true });
    // Re-capturing the same number (different separators/case) updates in place — no duplicate.
    const b = await captureCrosswalkEntry(store, "wx-123", "CB-2");
    expect(b).toEqual({ entries: 1, added: false });

    const idx = await crosswalkIndex(store, "test", 3000);
    const hit = resolveCustomerNumber(idx, "WX123");
    expect(hit?.sku).toBe("CB-2");
    expect(hit?.source).toBe("captured");
  });

  it("preserves an existing import's manifest customer label while bumping the count", async () => {
    const store = new MemoryStore();
    await saveCrosswalk(store, [{ customerNumber: "X1", sku: "S1", source: "import" }], manifest({ customer: "Gulf Coast", entries: 1 }));
    await captureCrosswalkEntry(store, "X2", "S2");
    const m = await getCrosswalkManifest(store);
    expect(m?.customer).toBe("Gulf Coast");
    expect(m?.entries).toBe(2);
  });
});
