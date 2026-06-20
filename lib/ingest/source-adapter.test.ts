import { describe, it, expect } from "vitest";
import {
  gateRecords,
  recordKey,
  recordIdentity,
  diffSnapshots,
  runAdapter,
  type AdapterContext,
  type IngestRecord,
  type SourceAdapter,
  type SourceSnapshot,
} from "@/lib/ingest/source-adapter";

// A check-digit-VALID GTIN-13 and an INVALID one, used to prove gate validation.
const VALID_GTIN = "0712345678904";
const INVALID_GTIN = "0712345678901";

const rec = (over: Partial<IngestRecord> = {}): IngestRecord => ({
  sourceUrl: "https://example.com/p/1",
  confidence: 96,
  mpn: "EX-1",
  ...over,
});

describe("gateRecords", () => {
  it("keeps records with identity + source + confidence ≥ floor, drops the rest", () => {
    const records = [
      rec({ mpn: "EX-1", confidence: 96 }), // kept
      rec({ mpn: "EX-2", confidence: 94 }), // below floor → dropped
      rec({ mpn: undefined, sku: undefined, gtin: undefined, confidence: 99 }), // no identity → dropped
      rec({ sourceUrl: "", confidence: 99 }), // no source → dropped
      rec({ gtin: VALID_GTIN, mpn: undefined, confidence: 95 }), // kept (valid gtin identity)
    ];
    const { kept, dropped } = gateRecords(records);
    expect(kept.map((r) => r.mpn ?? r.gtin)).toEqual(["EX-1", VALID_GTIN]);
    expect(dropped).toHaveLength(3);
  });

  it("drops a record whose ONLY identity is a check-digit-invalid gtin (never authoritative)", () => {
    const { kept, dropped } = gateRecords([rec({ gtin: INVALID_GTIN, mpn: undefined, sku: undefined })]);
    expect(kept).toHaveLength(0);
    expect(dropped).toHaveLength(1);
  });

  it("strips an invalid gtin from a kept record but keeps it on its sku/mpn identity", () => {
    const { kept } = gateRecords([rec({ mpn: "EX-9", gtin: INVALID_GTIN })]);
    expect(kept).toHaveLength(1);
    expect(kept[0].gtin).toBeUndefined(); // unverifiable code never persisted
    expect(kept[0].mpn).toBe("EX-9");
  });

  it("normalizes a valid gtin (strips separators) on the kept record", () => {
    const { kept } = gateRecords([rec({ mpn: undefined, gtin: "07123-4567-8904" })]);
    expect(kept[0].gtin).toBe(VALID_GTIN);
  });

  it("honors a custom confidence floor", () => {
    const { kept } = gateRecords([rec({ confidence: 80 })], 75);
    expect(kept).toHaveLength(1);
  });
});

describe("recordKey", () => {
  it("keys a valid gtin globally (G:), brand-namespaces mpn (M:) and sku (S:)", () => {
    expect(recordKey(rec({ gtin: VALID_GTIN, mpn: "m", sku: "s", brand: "Acme" }))).toBe(`G:${VALID_GTIN}`);
    expect(recordKey(rec({ gtin: undefined, mpn: "mp-1", sku: "s", brand: "Acme" }))).toBe("M:ACME|MP-1");
    expect(recordKey(rec({ gtin: undefined, mpn: undefined, sku: "sk-9", brand: "Acme" }))).toBe("S:ACME|SK-9");
  });

  it("does not collide across brands sharing an mpn (the H2 bug)", () => {
    const a = recordKey(rec({ gtin: undefined, mpn: "BR-120", brand: "Eaton" }));
    const b = recordKey(rec({ gtin: undefined, mpn: "BR-120", brand: "Square D" }));
    expect(a).not.toBe(b);
  });

  it("ignores an invalid gtin for keying (falls through to mpn)", () => {
    expect(recordKey(rec({ gtin: INVALID_GTIN, mpn: "MP-2", brand: "Acme" }))).toBe("M:ACME|MP-2");
  });
});

describe("recordIdentity", () => {
  it("returns the raw best identifier for display", () => {
    expect(recordIdentity(rec({ gtin: VALID_GTIN }))).toBe(VALID_GTIN);
    expect(recordIdentity(rec({ gtin: undefined, mpn: "M1" }))).toBe("M1");
  });
});

describe("diffSnapshots", () => {
  const snap = (records: IngestRecord[]): SourceSnapshot => ({
    adapterId: "a",
    fetchedAtIso: "2026-06-20T00:00:00.000Z",
    records,
  });

  it("treats everything as added on a first run (prev null)", () => {
    const next = snap([rec({ mpn: "A" }), rec({ mpn: "B" })]);
    const d = diffSnapshots(null, next);
    expect(d.added).toHaveLength(2);
    expect(d.changed).toHaveLength(0);
    expect(d.removed).toHaveLength(0);
  });

  it("detects added, changed (by content signature), and removed", () => {
    const prev = snap([
      rec({ mpn: "KEEP", attributes: [{ name: "A", value: "1" }] }),
      rec({ mpn: "GONE" }),
    ]);
    const next = snap([
      rec({ mpn: "KEEP", attributes: [{ name: "A", value: "2" }] }), // changed value
      rec({ mpn: "NEW" }),
    ]);
    const d = diffSnapshots(prev, next);
    expect(d.added.map((r) => r.mpn)).toEqual(["NEW"]);
    expect(d.removed.map((r) => r.mpn)).toEqual(["GONE"]);
    expect(d.changed.map((c) => c.key)).toEqual(["M:|KEEP"]);
  });

  it("does not flag an unchanged record (attribute order independent)", () => {
    const prev = snap([rec({ mpn: "X", attributes: [{ name: "A", value: "1" }, { name: "B", value: "2" }] })]);
    const next = snap([rec({ mpn: "X", attributes: [{ name: "B", value: "2" }, { name: "A", value: "1" }] })]);
    expect(diffSnapshots(prev, next).changed).toHaveLength(0);
  });
});

describe("runAdapter", () => {
  const ctx: AdapterContext = {
    get: async (url) => ({ url, contentType: "text/html", body: "" }),
    nowIso: () => "2026-06-20T12:00:00.000Z",
  };

  const okAdapter: SourceAdapter = {
    id: "test:ok",
    label: "Test OK",
    segment: "EES",
    dataTypes: ["attributes"],
    license: "test",
    async fetch() {
      return [{ url: "https://example.com", contentType: "text/html", body: "x" }];
    },
    parse() {
      return [rec({ mpn: "A", confidence: 96 }), rec({ mpn: "B", confidence: 50 })];
    },
  };

  it("runs fetch→parse→gate→diff and reports counts + sample keys", async () => {
    const { report, snapshot, diff } = await runAdapter(okAdapter, ctx, null);
    expect(report.fetched).toBe(1);
    expect(report.parsed).toBe(2);
    expect(report.kept).toBe(1); // B gated out at confidence 50
    expect(report.dropped).toBe(1);
    expect(report.diff.added).toBe(1);
    expect(report.sampleAdded).toEqual(["A"]);
    expect(snapshot?.records).toHaveLength(1);
    expect(diff?.added).toHaveLength(1);
    expect(report.runAtIso).toBe("2026-06-20T12:00:00.000Z");
  });

  it("captures a thrown adapter in the report and yields no snapshot", async () => {
    const boom: SourceAdapter = {
      ...okAdapter,
      id: "test:boom",
      async fetch() {
        throw new Error("network down");
      },
    };
    const { report, snapshot } = await runAdapter(boom, ctx, null);
    expect(report.error).toBe("network down");
    expect(snapshot).toBeNull();
    expect(report.kept).toBe(0);
  });
});
