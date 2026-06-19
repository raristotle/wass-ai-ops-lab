import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ProductArt } from "@/features/product-finder/ProductArt";
import type { CatalogProduct, ProductCategory, ProductSpec } from "@/features/product-finder/types";

// Local product factory (mirrors the template's `prod` helper). ProductArt is a
// pure, deterministic SVG component: no store reads, no network, no
// next/navigation — so nothing to seed/mock here. We drive its branches purely
// through props.
function prod(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "P1",
    sku: "SKU-1",
    name: "Acme 20A Breaker",
    brand: "Acme",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 20,
    uom: "ea",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "x",
    ...overrides,
  };
}

function spec(name: string, value: string): ProductSpec {
  return { name, value };
}

describe("ProductArt (render)", () => {
  it("renders an accessible SVG image labelled by the product name", () => {
    const { getByRole } = render(<ProductArt product={prod({ name: "My Widget" })} />);
    const svg = getByRole("img", { name: "My Widget" });
    expect(svg).toBeInTheDocument();
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg).toHaveAttribute("viewBox", "0 0 320 240");
  });

  it("passes className through to the root svg", () => {
    const { getByRole } = render(<ProductArt product={prod()} className="h-10 w-10" />);
    expect(getByRole("img")).toHaveClass("h-10", "w-10");
  });

  it("uppercases the category band label and replaces the hyphen with a space", () => {
    const { getByText } = render(<ProductArt product={prod({ category: "oem-electrical" })} />);
    // "oem-electrical" -> toUpperCase().replace("-", " ") -> "OEM ELECTRICAL"
    expect(getByText("OEM ELECTRICAL")).toBeInTheDocument();
  });

  it("renders a plain (single-word) category label unchanged by the replace", () => {
    const { getByText } = render(<ProductArt product={prod({ category: "datacom" })} />);
    expect(getByText("DATACOM")).toBeInTheDocument();
  });

  it("falls back to the electrical palette for an unknown category (?? branch)", () => {
    // Cast through unknown to exercise the `?? CATEGORY_COLORS.electrical` guard
    // for a category that isn't a palette key — the component must still render.
    const bogus = prod({ category: "plumbing" as unknown as ProductCategory });
    const { getByRole, getByText } = render(<ProductArt product={bogus} />);
    expect(getByRole("img")).toBeInTheDocument();
    expect(getByText("PLUMBING")).toBeInTheDocument();
  });

  it("resolves a category-fallback glyph for an unrecognised subcategory", () => {
    // Unknown subcategory -> glyphIdFor falls back to the category glyph; the
    // component must still render without throwing.
    const { getByRole } = render(
      <ProductArt product={prod({ subcategory: "Totally Made Up Subcat" })} />,
    );
    expect(getByRole("img")).toBeInTheDocument();
  });

  describe("key-spec callout badge (showCallout)", () => {
    it("does NOT render a callout when showCallout is false (default)", () => {
      const { container } = render(
        <ProductArt product={prod({ specs: [spec("Amperage", "20A")] })} />,
      );
      // The callout's distinctive value text would be "20A"; absent by default.
      expect(container.textContent).not.toContain("20A");
    });

    it("renders the callout value when showCallout is true and a spec qualifies", () => {
      const { getByText } = render(
        <ProductArt
          showCallout
          product={prod({ specs: [spec("Amperage", "20A")] })}
        />,
      );
      expect(getByText("20A")).toBeInTheDocument();
    });

    it("renders no callout text when showCallout is true but no spec qualifies", () => {
      // Value longer than CALLOUT_MAX_LEN (8) => keySpecCallout returns null.
      const { container } = render(
        <ProductArt
          showCallout
          product={prod({ specs: [spec("Amperage", "this-value-is-way-too-long")] })}
        />,
      );
      expect(container.textContent).not.toContain("this-value-is-way-too-long");
    });
  });

  describe("display truncation", () => {
    it("truncates a long subcategory to 30 chars + ellipsis", () => {
      const longSub = "Super Long Subcategory Name That Exceeds Thirty Characters";
      const { getByText, queryByText } = render(
        <ProductArt product={prod({ subcategory: longSub })} />,
      );
      expect(getByText(longSub.slice(0, 30) + "…")).toBeInTheDocument();
      expect(queryByText(longSub)).not.toBeInTheDocument();
    });

    it("truncates a long brand to 22 chars + ellipsis", () => {
      const longBrand = "Extremely Long Brand Name Incorporated LLC";
      const { getByText } = render(<ProductArt product={prod({ brand: longBrand })} />);
      expect(getByText(longBrand.slice(0, 22) + "…")).toBeInTheDocument();
    });

    it("truncates a long SKU to 20 chars + ellipsis inside the SKU label", () => {
      const longSku = "SKU-ABCDEFGHIJKLMNOPQRSTUVWXYZ-1234567890";
      const { getByText } = render(<ProductArt product={prod({ sku: longSku })} />);
      // SKU label renders as `SKU: {displaySku}` across text node boundaries, so
      // match with a function matcher on the truncated, ellipsised value.
      const truncated = longSku.slice(0, 20) + "…";
      expect(
        getByText((_content, el) => el?.textContent === `SKU: ${truncated}`),
      ).toBeInTheDocument();
    });

    it("leaves short subcategory / brand / sku untouched (no ellipsis)", () => {
      const { getByText, container } = render(
        <ProductArt product={prod({ subcategory: "Switches", brand: "Acme", sku: "S-1" })} />,
      );
      expect(getByText("Switches")).toBeInTheDocument();
      expect(getByText("Acme")).toBeInTheDocument();
      expect(container.textContent).not.toContain("…");
    });
  });
});
