import { describe, expect, it } from "vitest";
import { mapDigiKeyProducts, mapMouserParts } from "@/lib/integration/distributor-live";

describe("mapMouserParts", () => {
  const parts = [
    {
      ManufacturerPartNumber: "QO120",
      Manufacturer: "Square D",
      Description: "Miniature circuit breaker",
      DataSheetUrl: "https://www.mouser.com/ds/qo120.pdf",
      ProductDetailUrl: "https://www.mouser.com/p/qo120",
      Availability: "1,250 In Stock",
      PriceBreaks: [
        { Quantity: 1, Price: "$11.42" },
        { Quantity: 10, Price: "$10.18" },
      ],
    },
    {
      ManufacturerPartNumber: "TOTALLY-DIFFERENT",
      Manufacturer: "Other",
      Description: "Should be filtered out",
      Availability: "5 In Stock",
      PriceBreaks: [{ Quantity: 1, Price: "$1.00" }],
    },
  ];

  it("keeps only parts matching the requested MPN", () => {
    const quotes = mapMouserParts(parts, "QO120");
    expect(quotes).toHaveLength(1);
    expect(quotes[0].matchedPart).toBe("QO120");
  });

  it("parses currency strings and comma-grouped stock", () => {
    const [q] = mapMouserParts(parts, "qo-120"); // normalization ignores punctuation/case
    expect(q.unitPrice).toBe(11.42);
    expect(q.priceBreaks).toEqual([
      { qty: 1, price: 11.42 },
      { qty: 10, price: 10.18 },
    ]);
    expect(q.stock).toBe(1250);
    expect(q.datasheetUrl).toContain(".pdf");
  });
});

describe("mapDigiKeyProducts", () => {
  const products = [
    {
      ManufacturerProductNumber: "G2R-1-SND-DC24",
      Manufacturer: { Name: "Omron" },
      Description: { ProductDescription: "General purpose relay" },
      DatasheetUrl: "https://omronfs.omron.com/g2r.pdf",
      ProductUrl: "https://www.digikey.com/p/g2r",
      QuantityAvailable: 4321,
      UnitPrice: 4.56,
    },
    { ManufacturerProductNumber: "NOPE-123", QuantityAvailable: 1, UnitPrice: 1 },
  ];

  it("maps matching products with stock and price", () => {
    const quotes = mapDigiKeyProducts(products, "G2R-1-SND-DC24");
    expect(quotes).toHaveLength(1);
    expect(quotes[0]).toMatchObject({
      distributor: "Digi-Key",
      manufacturer: "Omron",
      unitPrice: 4.56,
      stock: 4321,
    });
  });

  it("returns empty for no match", () => {
    expect(mapDigiKeyProducts(products, "ZZZZ999")).toHaveLength(0);
  });
});
