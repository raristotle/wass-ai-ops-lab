import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RefineByBar } from "@/features/product-finder/RefineByBar";
import { useProductFinder } from "@/lib/product-finder-store";

// toggleBrand → runSearch → apiSearch → fetch; stub it to a no-op response.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ items: [], total: 0, facets: [], refineFacets: [] }), { status: 200 })),
  );
  const s = useProductFinder.getState();
  useProductFinder.setState({
    filters: {
      ...s.filters,
      query: "",
      categories: new Set(),
      subcategories: new Set(),
      brands: new Set(),
      specFilters: {},
      onlyWithCrosses: false,
      onlyPreferred: false,
    },
    facets: [],
    refineFacets: [],
    total: 0,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RefineByBar (component)", () => {
  it("renders nothing on the cold landing (not engaged)", () => {
    const { container } = render(<RefineByBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when engaged but there are no facets", () => {
    const s = useProductFinder.getState();
    useProductFinder.setState({ filters: { ...s.filters, query: "breaker" }, total: 100 });
    const { container } = render(<RefineByBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders refine chips with counts and applies the filter on click", () => {
    const s = useProductFinder.getState();
    useProductFinder.setState({
      filters: { ...s.filters, query: "breaker" },
      total: 412,
      refineFacets: [
        { type: "enum", name: "Brand", values: [{ value: "Square D", count: 188 }, { value: "Eaton", count: 70 }] },
      ],
    });
    render(<RefineByBar />);

    const chip = screen.getByRole("button", { name: /Refine by Brand Square D \(188 matches\)/ });
    expect(chip).toBeInTheDocument();

    fireEvent.click(chip);
    expect(useProductFinder.getState().filters.brands.has("Square D")).toBe(true);
  });
});
