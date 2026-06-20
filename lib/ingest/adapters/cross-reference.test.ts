import { describe, it, expect } from "vitest";
import {
  enrichmentToCrossRecord,
  makeNexarCrossAdapter,
  SECOND_SOURCE_RELATION,
} from "@/lib/ingest/adapters/cross-reference";
import { gateRecords } from "@/lib/ingest/source-adapter";
import type { ProductEnrichment } from "@/lib/integration/nexar-live";

const enrichment = (over: Partial<ProductEnrichment> = {}): ProductEnrichment => ({
  mpn: "EX-BR120",
  name: "Breaker",
  manufacturer: "ExampleElec",
  datasheetUrl: null,
  octopartUrl: "https://octopart.com/ex-br120",
  compliance: [],
  distributors: [],
  secondSources: [
    { mpn: "EX-BR120", manufacturer: "ExampleElec", octopartUrl: null }, // the primary itself
    { mpn: "ALT-BR120", manufacturer: "AltCorp", octopartUrl: null },
    { mpn: "alt-br120", manufacturer: "AltCorp", octopartUrl: null }, // dup of ALT-BR120
    { mpn: "GEN-120", manufacturer: "GenericCo", octopartUrl: null },
  ],
  ...over,
});

describe("enrichmentToCrossRecord", () => {
  it("emits one cross per DISTINCT second source, excluding the primary + dupes", () => {
    const r = enrichmentToCrossRecord(enrichment())!;
    expect(r.mpn).toBe("EX-BR120");
    expect(r.brand).toBe("ExampleElec");
    expect(r.crosses).toEqual([
      { competitorSku: "ALT-BR120", relation: SECOND_SOURCE_RELATION },
      { competitorSku: "GEN-120", relation: SECOND_SOURCE_RELATION },
    ]);
    expect(r.confidence).toBe(96);
    // Passes the D1 gate (mpn identity + sourceUrl + confidence).
    expect(gateRecords([r]).kept).toHaveLength(1);
  });

  it("returns null when there is no primary MPN or no distinct second source", () => {
    expect(enrichmentToCrossRecord(enrichment({ mpn: "" }))).toBeNull();
    expect(enrichmentToCrossRecord(enrichment({ secondSources: [{ mpn: "EX-BR120", manufacturer: "x", octopartUrl: null }] }))).toBeNull();
    expect(enrichmentToCrossRecord(enrichment({ secondSources: [] }))).toBeNull();
  });
});

describe("makeNexarCrossAdapter", () => {
  const adapter = makeNexarCrossAdapter({ id: "cross-reference:test", label: "Test", segment: "cross-segment", mpns: ["EX-BR120"] });

  it("declares the cross-reference data type + a factual-relations license", () => {
    expect(adapter.dataTypes).toEqual(["cross-reference"]);
    expect(adapter.license).toMatch(/factual relations only/i);
  });

  it("parse() turns a payload's enrichment into a cross record", () => {
    const raw = { url: "x", contentType: "application/json", body: JSON.stringify({ mpn: "EX-BR120", nexar: enrichment() }) };
    const records = adapter.parse(raw);
    expect(records).toHaveLength(1);
    expect(records[0].crosses?.map((c) => c.competitorSku)).toEqual(["ALT-BR120", "GEN-120"]);
  });

  it("parse() yields [] for a dormant payload (no nexar) and tolerates bad JSON", () => {
    expect(adapter.parse({ url: "x", contentType: "application/json", body: JSON.stringify({ mpn: "M", nexar: null }) })).toEqual([]);
    expect(adapter.parse({ url: "x", contentType: "application/json", body: "{bad" })).toEqual([]);
  });

  it("fetch() is dormant ($0) when Nexar is unkeyed — payloads carry no enrichment", async () => {
    const ctx = { get: async () => ({ url: "x", contentType: "", body: "" }), nowIso: () => "t" };
    const raws = await adapter.fetch(ctx);
    expect(raws).toHaveLength(1);
    expect(JSON.parse(raws[0].body).nexar).toBeNull();
    expect(adapter.parse(raws[0])).toEqual([]);
  });
});
