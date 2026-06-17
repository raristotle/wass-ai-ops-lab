import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppliedFiltersBar } from "@/features/product-finder/AppliedFiltersBar";
import { useProductFinder } from "@/lib/product-finder-store";

// toggleBrand/clearFilters call runSearch() → apiSearch() → fetch; stub it so the
// async refresh is a no-op and doesn't reject in the test environment.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ products: [], total: 0 }), { status: 200 })),
  );
  const s = useProductFinder.getState();
  useProductFinder.setState({
    filters: { ...s.filters, brands: new Set(), categories: new Set(), specFilters: {}, specRanges: {} },
    appliedNlFilters: [],
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AppliedFiltersBar (component)", () => {
  it("renders nothing when no facets are active", () => {
    const { container } = render(<AppliedFiltersBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a removable chip per active facet and removes it on click", () => {
    const s = useProductFinder.getState();
    useProductFinder.setState({ filters: { ...s.filters, brands: new Set(["Eaton"]) } });

    render(<AppliedFiltersBar />);
    const chip = screen.getByRole("button", { name: "Remove filter Eaton" });
    expect(chip).toBeInTheDocument();

    fireEvent.click(chip);
    expect(useProductFinder.getState().filters.brands.has("Eaton")).toBe(false);
  });

  it("'Clear all' resets every active facet", () => {
    const s = useProductFinder.getState();
    useProductFinder.setState({
      filters: { ...s.filters, brands: new Set(["Eaton"]), onlyPreferred: true },
    });

    render(<AppliedFiltersBar />);
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

    const f = useProductFinder.getState().filters;
    expect(f.brands.size).toBe(0);
    expect(f.onlyPreferred).toBe(false);
  });
});
