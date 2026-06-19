import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ProductImage } from "@/features/product-finder/ProductImage";
import type { CatalogProduct, ProductCategory, ProductSpec } from "@/features/product-finder/types";

/**
 * ProductImage is a thin presentational wrapper that forwards its props to
 * ProductArt (the deterministic SVG plate). It reads no Zustand store fields,
 * so coverage here comes from driving ProductArt's branches through the props
 * ProductImage exposes: category palette (known + unknown fallback), the
 * subcategory→glyph lookup, the showCallout/keySpecCallout path, and the
 * subcategory/brand/sku truncation branches.
 */
function prod(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "P1",
    sku: "SKU-1",
    name: "20A Circuit Breaker",
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

describe("ProductImage (render)", () => {
  it("render smoke: emits the SVG plate labeled with the product name and SKU", () => {
    const { container, getByLabelText, getByText } = render(<ProductImage product={prod()} />);
    // The SVG carries role="img" + aria-label = product.name.
    const svg = getByLabelText("20A Circuit Breaker");
    expect(svg.tagName.toLowerCase()).toBe("svg");
    // Key plate text: SKU line + the category band label.
    expect(getByText("SKU: SKU-1")).toBeInTheDocument();
    expect(getByText("ELECTRICAL")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("forwards className to the rendered SVG", () => {
    const { getByLabelText } = render(
      <ProductImage product={prod()} className="h-10 w-10 custom-plate" />,
    );
    const svg = getByLabelText("20A Circuit Breaker");
    expect(svg).toHaveClass("custom-plate");
  });

  it("renders the hyphenated category band label with the hyphen replaced by a space", () => {
    // Exercises product.category.toUpperCase().replace("-", " ") for a 2-word category.
    const { getByText } = render(
      <ProductImage product={prod({ category: "oem-electrical", subcategory: "Relays" })} />,
    );
    expect(getByText("OEM ELECTRICAL")).toBeInTheDocument();
  });

  it("falls back to the electrical palette for an unknown category", () => {
    // ProductArt: CATEGORY_COLORS[product.category] ?? CATEGORY_COLORS.electrical.
    // An out-of-enum category exercises the nullish fallback without throwing.
    const bogus = prod({ category: "made-up-category" as unknown as ProductCategory });
    const { getByLabelText } = render(<ProductImage product={bogus} />);
    // Still renders an SVG plate (does not throw); band label echoes the raw value.
    const svg = getByLabelText("20A Circuit Breaker");
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.querySelector("rect")).toBeTruthy();
  });

  it("falls back to the category glyph when the subcategory is unmapped", () => {
    // glyphIdFor: SUBCATEGORY_GLYPH[sub] ?? CATEGORY_GLYPH[cat] — unmapped sub
    // uses the category fallback glyph, so the plate still renders cleanly.
    const { getByLabelText, getByText } = render(
      <ProductImage product={prod({ subcategory: "Totally Unmapped Subcat" })} />,
    );
    expect(getByLabelText("20A Circuit Breaker").tagName.toLowerCase()).toBe("svg");
    expect(getByText("Totally Unmapped Subcat")).toBeInTheDocument();
  });

  it("does NOT render the key-spec callout by default (showCallout omitted)", () => {
    const specs: ProductSpec[] = [{ name: "Amperage", value: "20A" }];
    const { queryByText } = render(<ProductImage product={prod({ specs })} />);
    // showCallout defaults to false ⇒ keySpecCallout is never consulted.
    expect(queryByText("20A")).toBeNull();
  });

  it("renders the key-spec callout when showCallout is set and a qualifying spec exists", () => {
    const specs: ProductSpec[] = [
      { name: "Voltage", value: "120V" }, // lower priority than Amperage
      { name: "Amperage", value: "20A" }, // first present, short → wins
    ];
    const { getByText } = render(<ProductImage product={prod({ specs })} showCallout />);
    expect(getByText("20A")).toBeInTheDocument();
  });

  it("omits the callout group when showCallout is set but no spec qualifies", () => {
    // No priority spec is present (and the long value would fail the length gate
    // anyway), so keySpecCallout returns null and the callout <g> is skipped.
    const specs: ProductSpec[] = [
      { name: "Color", value: "Gray" },
      { name: "Amperage", value: "ridiculously-long-amperage-value" },
    ];
    const { queryByText, getByLabelText } = render(
      <ProductImage product={prod({ specs })} showCallout />,
    );
    expect(getByLabelText("20A Circuit Breaker").tagName.toLowerCase()).toBe("svg");
    expect(queryByText("ridiculously-long-amperage-value")).toBeNull();
  });

  it("truncates long subcategory, brand, and SKU with an ellipsis", () => {
    const { getByText, queryByText } = render(
      <ProductImage
        product={prod({
          subcategory: "An Extremely Long Subcategory Name That Exceeds Thirty Chars",
          brand: "A Very Long Manufacturer Brand Name",
          sku: "SKU-WITH-A-VERY-LONG-IDENTIFIER-1234567890",
        })}
      />,
    );
    // subcategory > 30 → slice(0,30) + ellipsis
    expect(getByText("An Extremely Long Subcategory …")).toBeInTheDocument();
    // brand > 22 → slice(0,22) + ellipsis
    expect(getByText("A Very Long Manufactur…")).toBeInTheDocument();
    // sku > 20 → "SKU: " + slice(0,20) + ellipsis
    expect(getByText("SKU: SKU-WITH-A-VERY-LONG…")).toBeInTheDocument();
    // The full, untruncated strings must not appear.
    expect(queryByText(/Exceeds Thirty Chars/)).toBeNull();
  });

  it("renders distinct plates across every known category without throwing", () => {
    const categories: ProductCategory[] = [
      "electrical",
      "datacom",
      "oem-electrical",
      "av",
      "security",
      "safety",
    ];
    for (const category of categories) {
      const { getByLabelText, unmount } = render(
        <ProductImage product={prod({ id: category, name: `Plate ${category}`, category })} />,
      );
      expect(getByLabelText(`Plate ${category}`).tagName.toLowerCase()).toBe("svg");
      unmount();
    }
  });
});
