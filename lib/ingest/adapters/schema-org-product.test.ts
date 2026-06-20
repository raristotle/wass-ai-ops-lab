import { describe, it, expect } from "vitest";
import {
  scoreSchemaProduct,
  schemaProductToRecord,
  makeSchemaOrgAdapter,
} from "@/lib/ingest/adapters/schema-org-product";
import { gateRecords } from "@/lib/ingest/source-adapter";
import type { SchemaProduct } from "@/lib/ingest/fetcher";

const VALID_GTIN = "0712345678904";
const INVALID_GTIN = "0712345678901";

const sp = (over: Partial<SchemaProduct> = {}): SchemaProduct => ({ attributes: [], images: [], certifications: [], ...over });

describe("scoreSchemaProduct", () => {
  it("scores mpn or VALID gtin at/above the floor, sku-only below it, name-only low", () => {
    expect(scoreSchemaProduct(sp({ mpn: "M1" }))).toBeGreaterThanOrEqual(95);
    expect(scoreSchemaProduct(sp({ gtin: VALID_GTIN }))).toBeGreaterThanOrEqual(95);
    expect(scoreSchemaProduct(sp({ sku: "S1" }))).toBeLessThan(95);
    expect(scoreSchemaProduct(sp({ name: "just a name" }))).toBeLessThan(95);
  });

  it("does NOT lift a record to authoritative on an invalid gtin alone", () => {
    expect(scoreSchemaProduct(sp({ gtin: INVALID_GTIN }))).toBeLessThan(95);
  });
});

describe("schemaProductToRecord + gate", () => {
  it("an invalid-gtin-only product is gated out (not invented as authoritative)", () => {
    const r = schemaProductToRecord(sp({ name: "Mystery", gtin: INVALID_GTIN }), "https://src/1");
    const { kept, dropped } = gateRecords([r]);
    expect(kept).toHaveLength(0);
    expect(dropped).toHaveLength(1);
  });

  it("a valid-gtin product survives and carries source + brand fallback", () => {
    const r = schemaProductToRecord(sp({ name: "Breaker", gtin: VALID_GTIN }), "https://src/2", "FallbackBrand");
    expect(r.brand).toBe("FallbackBrand");
    expect(r.sourceUrl).toBe("https://src/2");
    const { kept } = gateRecords([r]);
    expect(kept).toHaveLength(1);
    expect(kept[0].gtin).toBe(VALID_GTIN);
  });

  it("prefers the product's own url over the page url when present", () => {
    const r = schemaProductToRecord(sp({ url: "https://canonical/p", mpn: "M" }), "https://page/list");
    expect(r.sourceUrl).toBe("https://canonical/p");
  });

  it("appends a lifecycle attribute (D5) when the product carries one", () => {
    const r = schemaProductToRecord(sp({ mpn: "M", lifecycle: "Discontinued", attributes: [{ name: "Amperage", value: "20 A" }] }), "https://s/1");
    expect(r.attributes).toContainEqual({ name: "Lifecycle status", value: "Discontinued" });
    expect(r.attributes).toContainEqual({ name: "Amperage", value: "20 A" });
  });

  it("appends a certifications attribute (D6) when the product carries certifications", () => {
    const r = schemaProductToRecord(sp({ mpn: "M", certifications: ["UL Listed", "CSA"] }), "https://s/1");
    expect(r.attributes).toContainEqual({ name: "Certifications", value: "UL Listed, CSA" });
  });
});

describe("makeSchemaOrgAdapter", () => {
  it("fetches each url via ctx.get and parses JSON-LD products, skipping a failed url", async () => {
    const html = (mpn: string) =>
      `<script type="application/ld+json">{"@type":"Product","name":"P","mpn":"${mpn}","brand":"Acme"}</script>`;
    const adapter = makeSchemaOrgAdapter({
      id: "schema-org:test",
      label: "Test",
      segment: "EES",
      license: "public",
      urls: ["https://ok/1", "https://boom/2", "https://ok/3"],
      brandFallback: "Acme",
    });
    const ctx = {
      nowIso: () => "2026-06-20T00:00:00.000Z",
      get: async (url: string) => {
        if (url.includes("boom")) throw new Error("unreachable");
        return { url, contentType: "text/html", body: html(url.endsWith("1") ? "A-1" : "A-3") };
      },
    };
    const raws = await adapter.fetch(ctx);
    expect(raws).toHaveLength(2); // the boom url is skipped, batch survives
    const records = raws.flatMap((r) => adapter.parse(r));
    expect(records.map((r) => r.mpn).sort()).toEqual(["A-1", "A-3"]);
  });
});
