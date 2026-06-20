import { describe, it, expect } from "vitest";
import {
  segmentForBrand,
  makeManufacturerAdapter,
  parseEnvManufacturers,
  MANUFACTURER_REGISTRY,
} from "@/lib/ingest/adapters/manufacturer";

describe("segmentForBrand", () => {
  it("maps known brands (case-insensitive) to their Wesco segment", () => {
    expect(segmentForBrand("Eaton")).toBe("EES");
    expect(segmentForBrand("square d")).toBe("EES");
    expect(segmentForBrand("Panduit")).toBe("CSS");
    expect(segmentForBrand("Acuity Brands")).toBe("UBS");
  });
  it("defaults to cross-segment for an unknown brand", () => {
    expect(segmentForBrand("Totally Unknown Co")).toBe("cross-segment");
  });
});

describe("MANUFACTURER_REGISTRY", () => {
  it("keys are lowercase for case-insensitive lookup", () => {
    for (const k of Object.keys(MANUFACTURER_REGISTRY)) expect(k).toBe(k.toLowerCase());
  });
});

describe("makeManufacturerAdapter", () => {
  const adapter = makeManufacturerAdapter({ brand: "Eaton", urls: ["https://eaton.com/p/br120"] });

  it("builds a manufacturer:<slug> adapter with the brand's segment + image data type", () => {
    expect(adapter.id).toBe("manufacturer:eaton");
    expect(adapter.label).toBe("Eaton product pages");
    expect(adapter.segment).toBe("EES");
    expect(adapter.dataTypes).toContain("images");
    expect(adapter.license).toMatch(/product images/i);
  });

  it("parses a manufacturer page's JSON-LD, applies the brand fallback, and absolutizes the image", () => {
    const html = `<script type="application/ld+json">
      {"@type":"Product","name":"20A Breaker","mpn":"BR120",
       "image":["/img/placeholder.png","/img/br120.jpg"],
       "additionalProperty":[{"@type":"PropertyValue","name":"Amperage","value":"20 A"}]}
    </script>`;
    const records = adapter.parse({ url: "https://eaton.com/p/br120", contentType: "text/html", body: html });
    expect(records).toHaveLength(1);
    expect(records[0].brand).toBe("Eaton"); // fallback applied (JSON-LD had no brand)
    expect(records[0].mpn).toBe("BR120");
    // Placeholder skipped, relative resolved to absolute against the page.
    expect(records[0].imageUrl).toBe("https://eaton.com/img/br120.jpg");
    expect(records[0].attributes).toEqual([{ name: "Amperage", value: "20 A" }]);
  });

  it("honors a segment override", () => {
    expect(makeManufacturerAdapter({ brand: "ACME", urls: ["https://a/1"], segment: "safety" }).segment).toBe("safety");
  });
});

describe("parseEnvManufacturers", () => {
  it("parses valid configs and skips entries missing a brand or urls", () => {
    const raw = JSON.stringify([
      { brand: "Eaton", urls: ["https://eaton.com/p/1", "https://eaton.com/p/2"] },
      { brand: "", urls: ["https://x"] }, // skipped — no brand
      { brand: "Siemens", urls: [] }, // skipped — no urls
      { brand: "Leviton", urls: ["https://leviton.com/p/1"], segment: "EES" },
    ]);
    const cfgs = parseEnvManufacturers(raw);
    expect(cfgs.map((c) => c.brand)).toEqual(["Eaton", "Leviton"]);
    expect(cfgs[1].segment).toBe("EES");
  });

  it("returns [] for missing/blank/invalid JSON", () => {
    expect(parseEnvManufacturers(undefined)).toEqual([]);
    expect(parseEnvManufacturers("not json")).toEqual([]);
    expect(parseEnvManufacturers('{"not":"array"}')).toEqual([]);
  });
});
