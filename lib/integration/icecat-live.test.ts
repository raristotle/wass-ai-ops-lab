import { describe, it, expect, afterEach } from "vitest";
import { icecatConfigured, parseIcecatProduct } from "@/lib/integration/icecat-live";

afterEach(() => {
  delete process.env.ICECAT_USERNAME;
});

describe("icecat dormancy", () => {
  it("is dormant without ICECAT_USERNAME", () => {
    expect(icecatConfigured()).toBe(false);
  });
  it("activates once the username is set", () => {
    process.env.ICECAT_USERNAME = "openIcecat-live";
    expect(icecatConfigured()).toBe(true);
  });
});

describe("parseIcecatProduct", () => {
  it("extracts brand/mpn/title/gtins/datasheet/image + flattened specs", () => {
    const json = {
      data: {
        GeneralInfo: {
          Brand: "Sony",
          ProductCode: "CFI-1015A",
          Title: "PlayStation 5",
          GTIN: ["0711719709695", "0711719709701"],
          Description: { PDFURL: "https://x/ds.pdf", ManualPDFURL: "https://x/manual.pdf" },
        },
        Image: { HighPic: "https://x/hi.jpg", LowPic: "https://x/lo.jpg" },
        FeaturesGroups: [
          {
            Features: [
              { Feature: { Name: { Value: "Weight" } }, PresentationValue: "4.5 kg" },
              { Feature: { Name: { Value: "Color" } }, Value: "White" },
            ],
          },
        ],
      },
    };
    const p = parseIcecatProduct(json);
    expect(p).not.toBeNull();
    expect(p!.brand).toBe("Sony");
    expect(p!.mpn).toBe("CFI-1015A");
    expect(p!.gtins).toEqual(["0711719709695", "0711719709701"]);
    expect(p!.datasheetUrl).toBe("https://x/ds.pdf"); // PDFURL preferred over ManualPDFURL
    expect(p!.imageUrl).toBe("https://x/hi.jpg");
    expect(p!.specs).toEqual([
      { name: "Weight", value: "4.5 kg" },
      { name: "Color", value: "White" },
    ]);
  });
  it("returns null when there is no data section", () => {
    expect(parseIcecatProduct({})).toBeNull();
    expect(parseIcecatProduct(null)).toBeNull();
  });
  it("tolerates a product with no features", () => {
    const p = parseIcecatProduct({ data: { GeneralInfo: { Brand: "X" } } });
    expect(p!.specs).toEqual([]);
    expect(p!.gtins).toEqual([]);
  });
});
