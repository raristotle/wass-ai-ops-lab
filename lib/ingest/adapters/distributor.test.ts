import { describe, it, expect } from "vitest";
import {
  liveQuoteToIdentityRecord,
  nexarEnrichmentToIdentityRecord,
  mergeIdentityRecords,
  makeDistributorAdapter,
} from "@/lib/ingest/adapters/distributor";
import { gateRecords } from "@/lib/ingest/source-adapter";
import type { LiveQuote } from "@/lib/integration/distributor-live";
import type { ProductEnrichment } from "@/lib/integration/nexar-live";

const quote = (over: Partial<LiveQuote> = {}): LiveQuote => ({
  distributor: "Mouser Electronics",
  matchedPart: "EX-BR120",
  manufacturer: "ExampleElec",
  description: "20A 1P breaker", // proprietary — must NOT be ingested
  unitPrice: 12.5, // proprietary — must NOT be ingested
  priceBreaks: [{ qty: 1, price: 12.5 }],
  stock: 500, // proprietary — must NOT be ingested
  datasheetUrl: "https://ex.com/ds/ex-br120.pdf",
  productUrl: "https://mouser.com/p/ex-br120",
  ...over,
});

const enrichment = (over: Partial<ProductEnrichment> = {}): ProductEnrichment => ({
  mpn: "EX-BR120",
  name: "Breaker",
  manufacturer: "ExampleElec",
  datasheetUrl: "https://nexar.com/ds/ex-br120.pdf",
  octopartUrl: "https://octopart.com/ex-br120",
  compliance: [],
  distributors: [],
  secondSources: [],
  ...over,
});

describe("liveQuoteToIdentityRecord", () => {
  it("keeps ONLY identity + datasheet link, never price/stock/description", () => {
    const r = liveQuoteToIdentityRecord(quote())!;
    expect(r).toEqual({
      mpn: "EX-BR120",
      brand: "ExampleElec",
      datasheetUrl: "https://ex.com/ds/ex-br120.pdf",
      sourceUrl: "https://mouser.com/p/ex-br120",
      confidence: 96,
    });
    // No proprietary catalog content leaked into the record.
    expect(JSON.stringify(r)).not.toMatch(/12\.5|500|breaker/i);
  });

  it("falls back to the distributor domain for sourceUrl and is null without an MPN", () => {
    expect(liveQuoteToIdentityRecord(quote({ productUrl: null, distributor: "Digi-Key" }))?.sourceUrl).toBe("https://www.digikey.com");
    expect(liveQuoteToIdentityRecord(quote({ matchedPart: "" }))).toBeNull();
  });
});

describe("nexarEnrichmentToIdentityRecord", () => {
  it("maps identity + datasheet and drops a placeholder manufacturer", () => {
    expect(nexarEnrichmentToIdentityRecord(enrichment())).toMatchObject({
      mpn: "EX-BR120",
      brand: "ExampleElec",
      datasheetUrl: "https://nexar.com/ds/ex-br120.pdf",
      sourceUrl: "https://octopart.com/ex-br120",
      confidence: 96,
    });
    expect(nexarEnrichmentToIdentityRecord(enrichment({ manufacturer: "—" }))?.brand).toBeUndefined();
  });
});

describe("mergeIdentityRecords", () => {
  it("merges same-MPN records, preferring the first non-empty brand/datasheet", () => {
    const merged = mergeIdentityRecords([
      { mpn: "EX-BR120", sourceUrl: "https://a", confidence: 96 }, // no datasheet/brand
      { mpn: "ex-br120", brand: "ExampleElec", datasheetUrl: "https://ds", sourceUrl: "https://b", confidence: 96 },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ brand: "ExampleElec", datasheetUrl: "https://ds", sourceUrl: "https://a" });
  });
});

describe("makeDistributorAdapter", () => {
  const adapter = makeDistributorAdapter({ id: "distributor:test", label: "Test", segment: "EES", mpns: ["EX-BR120"] });

  it("parse() turns a distributor payload into deduped identity records that pass the gate", () => {
    const raw = {
      url: "distributor-ingest://mpn/EX-BR120",
      contentType: "application/json",
      body: JSON.stringify({ mpn: "EX-BR120", quotes: [quote(), quote({ distributor: "Digi-Key", productUrl: "https://digikey.com/p" })], nexar: enrichment() }),
    };
    const records = adapter.parse(raw);
    expect(records).toHaveLength(1); // all three sources merge by MPN
    const { kept } = gateRecords(records);
    expect(kept).toHaveLength(1);
    expect(kept[0].attributes).toBeUndefined(); // no parametric specs ingested
  });

  it("parse() tolerates malformed JSON", () => {
    expect(adapter.parse({ url: "x", contentType: "application/json", body: "{not json" })).toEqual([]);
  });

  it("its license states the ToS boundary (no proprietary catalog content cached)", () => {
    expect(adapter.license).toMatch(/never cached or redistributed/i);
  });

  it("fetch() is dormant ($0) when no distributor keys are set — payloads carry empty results", async () => {
    const ctx = { get: async () => ({ url: "x", contentType: "", body: "" }), nowIso: () => "t" };
    const raws = await adapter.fetch(ctx);
    expect(raws).toHaveLength(1);
    const payload = JSON.parse(raws[0].body);
    expect(payload.quotes).toEqual([]);
    expect(payload.nexar).toBeNull();
    expect(adapter.parse(raws[0])).toEqual([]); // nothing to ingest while dormant
  });
});
