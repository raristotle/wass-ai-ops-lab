import { describe, it, expect, afterEach } from "vitest";
import {
  wikidataConfigured,
  parseBrandOwnership,
  buildBrandQuery,
} from "@/lib/integration/wikidata-live";

afterEach(() => {
  delete process.env.WIKIDATA_USER_AGENT;
});

describe("wikidata dormancy", () => {
  it("is dormant without WIKIDATA_USER_AGENT", () => {
    expect(wikidataConfigured()).toBe(false);
  });
  it("activates once a User-Agent is set", () => {
    process.env.WIKIDATA_USER_AGENT = "MeridianProductFinder/1.0 (ops@example.com)";
    expect(wikidataConfigured()).toBe(true);
  });
});

describe("parseBrandOwnership", () => {
  it("merges multi-row bindings: scalars first, lists accumulate distinct", () => {
    const json = {
      results: {
        bindings: [
          {
            ownerLabel: { value: "Schneider Electric" },
            parentLabel: { value: "Schneider Electric SE" },
            officialName: { value: "Square D Company" },
            shortName: { value: "Square D" },
            gtin: { value: "00785901234560" },
            lei: { value: "F5WCUMTUM4RKZ1MAVA99" },
          },
          { shortName: { value: "SQD" }, gtin: { value: "00785901234560" } },
        ],
      },
    };
    const out = parseBrandOwnership("Square D", json);
    expect(out.owner).toBe("Schneider Electric");
    expect(out.parent).toBe("Schneider Electric SE");
    expect(out.officialName).toBe("Square D Company");
    expect(out.lei).toBe("F5WCUMTUM4RKZ1MAVA99");
    expect(out.shortNames.sort()).toEqual(["SQD", "Square D"]);
    expect(out.gtins).toEqual(["00785901234560"]); // deduped
  });
  it("returns an all-null record for empty bindings", () => {
    const out = parseBrandOwnership("Nothing", { results: { bindings: [] } });
    expect(out.owner).toBeNull();
    expect(out.shortNames).toEqual([]);
  });
});

describe("buildBrandQuery", () => {
  it("escapes embedded quotes so the SPARQL literal can't break out", () => {
    const q = buildBrandQuery('Acme "Pro" \\Line');
    expect(q).toContain('"Acme \\"Pro\\" \\\\Line"@en');
    expect(q).toContain("wdt:P127");
    expect(q).toContain("wdt:P749");
  });
});
