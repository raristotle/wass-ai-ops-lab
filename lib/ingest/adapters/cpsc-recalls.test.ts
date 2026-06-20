import { describe, it, expect } from "vitest";
import {
  cpscRecallsToRecords,
  makeCpscRecallAdapter,
  cpscRecallsEnabled,
  MAX_RECALL_RECORDS,
  type CpscRecall,
} from "@/lib/ingest/adapters/cpsc-recalls";
import { gateRecords } from "@/lib/ingest/source-adapter";

const recall = (over: Partial<CpscRecall> = {}): CpscRecall => ({
  RecallNumber: "24-001",
  Title: "Acme breakers recalled for fire hazard",
  URL: "https://www.cpsc.gov/recalls/24-001",
  Manufacturers: [{ Name: "Acme Electric" }],
  Products: [{ Name: "Circuit breaker", Model: "BR-120", Type: "Breaker" }],
  ...over,
});

describe("cpscRecallsToRecords", () => {
  it("emits one record per distinct product MODEL with a safety-recall attribute, gated-ready", () => {
    const records = cpscRecallsToRecords([recall()]);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      mpn: "BR-120",
      brand: "Acme Electric",
      sourceUrl: "https://www.cpsc.gov/recalls/24-001",
      confidence: 96,
    });
    expect(records[0].attributes).toEqual([{ name: "Safety recall", value: "Acme breakers recalled for fire hazard" }]);
    expect(gateRecords(records).kept).toHaveLength(1);
  });

  it("skips products without a model (no identity → never invented)", () => {
    expect(cpscRecallsToRecords([recall({ Products: [{ Name: "Unknown", Type: "x" }] })])).toEqual([]);
  });

  it("skips recalls missing a URL or title", () => {
    expect(cpscRecallsToRecords([recall({ URL: undefined })])).toEqual([]);
    expect(cpscRecallsToRecords([recall({ Title: undefined, RecallNumber: undefined })])).toEqual([]);
  });

  it("dedupes the same model across recalls (first wins) and bounds the output", () => {
    const dup = cpscRecallsToRecords([recall(), recall({ Title: "Later recall", Products: [{ Model: "br 120" }] })]);
    expect(dup).toHaveLength(1);
    expect(dup[0].attributes?.[0].value).toBe("Acme breakers recalled for fire hazard"); // first wins

    const many = Array.from({ length: MAX_RECALL_RECORDS + 50 }, (_, i) => recall({ Products: [{ Model: `M-${i}` }] }));
    expect(cpscRecallsToRecords(many)).toHaveLength(MAX_RECALL_RECORDS);
  });
});

describe("cpscRecallsEnabled", () => {
  it("requires an explicit truthy flag (zero network until enabled)", () => {
    expect(cpscRecallsEnabled({})).toBe(false);
    expect(cpscRecallsEnabled({ INGEST_CPSC_RECALLS: "" })).toBe(false);
    expect(cpscRecallsEnabled({ INGEST_CPSC_RECALLS: "1" })).toBe(true);
    expect(cpscRecallsEnabled({ INGEST_CPSC_RECALLS: "true" })).toBe(true);
    expect(cpscRecallsEnabled({ INGEST_CPSC_RECALLS: "yes" })).toBe(true);
  });
});

describe("makeCpscRecallAdapter", () => {
  const adapter = makeCpscRecallAdapter();

  it("fetches the CPSC recall window via ctx.get and parses records", async () => {
    let requested = "";
    const ctx = {
      nowIso: () => "2026-06-20T00:00:00.000Z",
      get: async (url: string) => {
        requested = url;
        return { url, contentType: "application/json", body: JSON.stringify([recall()]) };
      },
    };
    const raws = await adapter.fetch(ctx);
    expect(requested).toContain("RecallDateStart=2025-06-20"); // 365 days before nowIso
    const records = raws.flatMap((r) => adapter.parse(r));
    expect(records[0].mpn).toBe("BR-120");
  });

  it("yields an empty run on a fetch error or non-array body (honest)", async () => {
    const boom = { nowIso: () => "2026-06-20T00:00:00.000Z", get: async () => { throw new Error("cpsc down"); } };
    expect(await adapter.fetch(boom)).toEqual([]);
    expect(adapter.parse({ url: "x", contentType: "application/json", body: '{"not":"array"}' })).toEqual([]);
    expect(adapter.parse({ url: "x", contentType: "application/json", body: "{bad" })).toEqual([]);
  });
});
