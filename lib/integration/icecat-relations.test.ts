import { describe, it, expect, afterEach } from "vitest";
import { icecatRelationsToEdges, getIcecatRelations } from "@/lib/integration/icecat-relations";

describe("icecatRelationsToEdges (pure)", () => {
  it("maps ProductRelated entries to recommended companion edges", () => {
    const json = {
      data: {
        ProductRelated: [
          { ProductCode: "ACC-1", Brand: "Acme", Title: "Mounting kit", RelationType: "Accessory" },
          { Mpn: "BND-2", brand: "Acme", Name: "Starter bundle", Type: "bundle" },
        ],
      },
    };
    const edges = icecatRelationsToEdges(json);
    expect(edges).toHaveLength(2);
    expect(edges[0]).toMatchObject({ mpn: "ACC-1", brand: "Acme", kind: "accessory", relation: "recommended" });
    expect(edges[1]).toMatchObject({ mpn: "BND-2", kind: "bundle", relation: "recommended" });
  });

  it("collects from multiple relation arrays and dedupes by mpn", () => {
    const json = {
      data: {
        RelatedProducts: [{ ProductCode: "X" }],
        Accessories: [{ ProductCode: "X" }, { ProductCode: "Y", RelationType: "compatibility" }],
      },
    };
    const edges = icecatRelationsToEdges(json);
    expect(edges.map((e) => e.mpn).sort()).toEqual(["X", "Y"]);
    expect(edges.find((e) => e.mpn === "Y")!.kind).toBe("compatible");
  });

  it("unknown relation type falls back to 'related'; no mpn is skipped", () => {
    const edges = icecatRelationsToEdges({ data: { ProductRelated: [{ ProductCode: "Z", RelationType: "weird" }, { Title: "no code" }] } });
    expect(edges).toHaveLength(1);
    expect(edges[0].kind).toBe("related");
  });

  it("returns [] for unexpected shapes", () => {
    expect(icecatRelationsToEdges(null)).toEqual([]);
    expect(icecatRelationsToEdges({})).toEqual([]);
    expect(icecatRelationsToEdges({ data: { ProductRelated: "nope" } })).toEqual([]);
  });
});

describe("getIcecatRelations (dormant gate)", () => {
  const prev = process.env.ICECAT_USERNAME;
  afterEach(() => {
    if (prev === undefined) delete process.env.ICECAT_USERNAME;
    else process.env.ICECAT_USERNAME = prev;
  });

  it("is dormant when ICECAT_USERNAME is unset", async () => {
    delete process.env.ICECAT_USERNAME;
    expect(await getIcecatRelations({ gtin: "00012345678905" })).toEqual({ enabled: false });
  });

  it("requires a GTIN or brand+MPN when configured", async () => {
    process.env.ICECAT_USERNAME = "demoshop";
    expect(await getIcecatRelations({})).toEqual({ enabled: true, error: "Provide a GTIN or brand + MPN" });
  });
});
