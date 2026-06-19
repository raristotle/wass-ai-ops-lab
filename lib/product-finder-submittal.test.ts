import { describe, it, expect } from "vitest";
import { buildSubmittalHtml } from "@/lib/product-finder-submittal";
import type { SubmittalInput } from "@/lib/product-finder-submittal";

const BASE: SubmittalInput = {
  packageNumber: "SUB-20260618-001",
  dateLabel: "June 18, 2026",
  customer: "Gulf Coast Industrial",
  project: "Warehouse LED Retrofit",
  preparedBy: "Sarah Chen · Houston Downtown",
  lines: [
    {
      sku: "GE-LED-4FT",
      name: "GE LED T8 4ft 14W 4000K",
      qty: 24,
      uom: "ea",
      unitPrice: 12.50,
      specs: [{ name: "Lumens", value: "1800" }, { name: "Color Temp", value: "4000K" }],
      specSheetUrl: "https://example.com/spec.pdf",
    },
    {
      sku: "BYPASS-KIT",
      name: "T8 Bypass Driver Kit",
      qty: 24,
      uom: "ea",
      unitPrice: 4.00,
      specs: [],
    },
  ],
};

describe("buildSubmittalHtml", () => {
  it("is a valid HTML document", () => {
    const html = buildSubmittalHtml(BASE);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>");
    expect(html).toContain("</html>");
  });

  it("includes package number and customer in the cover", () => {
    const html = buildSubmittalHtml(BASE);
    expect(html).toContain("SUB-20260618-001");
    expect(html).toContain("Gulf Coast Industrial");
    expect(html).toContain("Warehouse LED Retrofit");
  });

  it("includes all product names and SKUs", () => {
    const html = buildSubmittalHtml(BASE);
    expect(html).toContain("GE LED T8 4ft 14W 4000K");
    expect(html).toContain("GE-LED-4FT");
    expect(html).toContain("T8 Bypass Driver Kit");
  });

  it("renders a spec-sheet link when present", () => {
    const html = buildSubmittalHtml(BASE);
    expect(html).toContain("https://example.com/spec.pdf");
  });

  it("does not include a spec-sheet link when absent", () => {
    const html = buildSubmittalHtml({ ...BASE, lines: [BASE.lines[1]!] });
    expect(html).not.toContain("Download spec sheet");
  });

  it("XML-escapes customer/project/name fields", () => {
    const html = buildSubmittalHtml({
      ...BASE,
      customer: "Acme & <Bros>",
      lines: [{ ...BASE.lines[0]!, name: 'Lamp "4K"' }],
    });
    expect(html).toContain("Acme &amp; &lt;Bros&gt;");
    expect(html).toContain("Lamp &quot;4K&quot;");
    expect(html).not.toContain("Acme & <Bros>");
  });

  it("uses the supplied brand name and falls back to Meridian", () => {
    const withBrand = buildSubmittalHtml({ ...BASE, brandName: "Wesco" });
    expect(withBrand).toContain("Wesco");
    const defaultBrand = buildSubmittalHtml(BASE);
    expect(defaultBrand).toContain("Meridian");
  });
});
