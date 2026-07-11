import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { FilterSidebar } from "@/features/product-finder/FilterSidebar";
import { useProductFinder } from "@/lib/product-finder-store";
import { emptyFilterState } from "@/lib/product-finder-url";
import { ALL_SUBCATEGORIES, ALL_BRANDS } from "@/lib/catalog/taxonomy";
import type { FilterState, Facet } from "@/features/product-finder/types";

// FilterSidebar's filter handlers all call store.runSearch() which fetches
// /api/products/search. Stub fetch so those handlers don't hit the network.
function stubSearchFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      // CatalogSourceStrip fetches its descriptor from the API (perf-audit-2026-07-10);
      // everything else here is the search shape.
      if (String(input).includes("/api/catalog/source")) {
        return {
          ok: true,
          json: async () => ({
            source: "PIM (simulated)",
            productCount: 1234,
            lastSyncedAt: new Date(0).toISOString(),
            attributeCompleteness: 90,
            categories: 5,
            subcategories: 20,
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({ items: [], total: 0, page: 0, pageSize: 24, facets: [] }),
      };
    }),
  );
}

function seedFilters(partial: Partial<FilterState> = {}) {
  useProductFinder.setState({ filters: { ...emptyFilterState(), ...partial } });
}

beforeEach(() => {
  stubSearchFetch();
  useProductFinder.setState({ filters: emptyFilterState(), facets: [] });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  useProductFinder.setState({ filters: emptyFilterState(), facets: [] });
});

describe("FilterSidebar (render + branches)", () => {
  it("render-smoke: mounts with empty filters and shows core sections + catalog source strip", async () => {
    render(<FilterSidebar />);
    // Sidebar section headers are always rendered (open by default).
    expect(screen.getAllByText("Category").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Stock Availability").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Product Lifecycle").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Price Range").length).toBeGreaterThan(0);
    // CatalogSourceStrip provenance label — now async (fetched from /api/catalog/source).
    expect((await screen.findAllByText("Catalog source")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1,234 products/).length).toBeGreaterThan(0);
    // No active filters → "Clear All Filters" is NOT shown.
    expect(screen.queryByText("Clear All Filters")).not.toBeInTheDocument();
  });

  it("category chip reflects aria-pressed from store state and toggling invokes toggleCategory", () => {
    const spy = vi.spyOn(useProductFinder.getState(), "toggleCategory");
    render(<FilterSidebar />);
    // Two copies render (desktop aside + mobile drawer) — grab the first Electrical chip.
    const electrical = screen.getAllByRole("button", { name: /Electrical/ })[0];
    expect(electrical).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(electrical);
    expect(spy).toHaveBeenCalledWith("electrical");
  });

  it("populated filters: active category renders aria-pressed=true and Clear All Filters appears", () => {
    seedFilters({ categories: new Set(["electrical"]) });
    render(<FilterSidebar />);
    const electrical = screen.getAllByRole("button", { name: /Electrical/ })[0];
    expect(electrical).toHaveAttribute("aria-pressed", "true");
    // hasActiveFilters() true → Clear All Filters control is present.
    expect(screen.getAllByText("Clear All Filters").length).toBeGreaterThan(0);
  });

  it("Clear All Filters calls clearFilters", () => {
    seedFilters({ onlyBranchStock: true });
    const spy = vi.spyOn(useProductFinder.getState(), "clearFilters");
    render(<FilterSidebar />);
    fireEvent.click(screen.getAllByText("Clear All Filters")[0]);
    expect(spy).toHaveBeenCalled();
  });

  it("stock-availability checkboxes are wired to their setters", () => {
    const branchSpy = vi.spyOn(useProductFinder.getState(), "setOnlyBranchStock");
    const dcSpy = vi.spyOn(useProductFinder.getState(), "setOnlyDCStock");
    const prefSpy = vi.spyOn(useProductFinder.getState(), "setOnlyPreferred");
    const activeSpy = vi.spyOn(useProductFinder.getState(), "setOnlyActive");
    const crossSpy = vi.spyOn(useProductFinder.getState(), "setOnlyWithCrosses");
    render(<FilterSidebar />);

    fireEvent.click(screen.getAllByLabelText("In Stock at My Branch")[0]);
    fireEvent.click(screen.getAllByLabelText("In Stock at DC")[0]);
    fireEvent.click(screen.getAllByLabelText("Preferred Suppliers Only")[0]);
    fireEvent.click(screen.getAllByLabelText("Active products only")[0]);
    fireEvent.click(screen.getAllByLabelText("Documented crosses only")[0]);

    expect(branchSpy).toHaveBeenCalledWith(true);
    expect(dcSpy).toHaveBeenCalledWith(true);
    expect(prefSpy).toHaveBeenCalledWith(true);
    expect(activeSpy).toHaveBeenCalledWith(true);
    expect(crossSpy).toHaveBeenCalledWith(true);
  });

  it("Subcategory section: 'Show more' expands beyond the VISIBLE_LIMIT and toggling a sub calls toggleSubcategory", () => {
    const subSpy = vi.spyOn(useProductFinder.getState(), "toggleSubcategory");
    render(<FilterSidebar />);

    // Before expansion only the first 8 subs are visible (per aside).
    const firstSub = ALL_SUBCATEGORIES[0];
    expect(screen.getAllByLabelText(firstSub).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByLabelText(firstSub)[0]);
    expect(subSpy).toHaveBeenCalledWith(firstSub);

    if (ALL_SUBCATEGORIES.length > 8) {
      const beyond = ALL_SUBCATEGORIES[ALL_SUBCATEGORIES.length - 1];
      // The last subcategory is hidden until "Show N more" is clicked.
      expect(screen.queryByLabelText(beyond)).not.toBeInTheDocument();
      fireEvent.click(screen.getAllByText(/Show \d+ more/)[0]);
      expect(screen.getAllByLabelText(beyond).length).toBeGreaterThan(0);
      // Toggling back to "Show less" hides it again.
      fireEvent.click(screen.getAllByText("Show less")[0]);
    }
  });

  it("Brand section: 'Show more' expands and toggling a brand calls toggleBrand", () => {
    const brandSpy = vi.spyOn(useProductFinder.getState(), "toggleBrand");
    render(<FilterSidebar />);
    const firstBrand = ALL_BRANDS[0];
    fireEvent.click(screen.getAllByLabelText(firstBrand)[0]);
    expect(brandSpy).toHaveBeenCalledWith(firstBrand);

    if (ALL_BRANDS.length > 8) {
      const lastBrand = ALL_BRANDS[ALL_BRANDS.length - 1];
      expect(screen.queryByLabelText(lastBrand)).not.toBeInTheDocument();
      // There can be multiple "Show N more" (subs + brands); click the brand one.
      const moreButtons = screen.getAllByText(/Show \d+ more/);
      fireEvent.click(moreButtons[moreButtons.length - 1]);
      expect(screen.getAllByLabelText(lastBrand).length).toBeGreaterThan(0);
    }
  });

  it("price range: typing min/max and clicking Apply calls setPriceRange with parsed numbers", () => {
    const spy = vi.spyOn(useProductFinder.getState(), "setPriceRange");
    render(<FilterSidebar />);
    fireEvent.change(screen.getAllByPlaceholderText("Min $")[0], { target: { value: "10" } });
    fireEvent.change(screen.getAllByPlaceholderText("Max $")[0], { target: { value: "50" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Apply" })[0]);
    expect(spy).toHaveBeenCalledWith(10, 50);
  });

  it("price range: empty inputs pass null/null to setPriceRange", () => {
    const spy = vi.spyOn(useProductFinder.getState(), "setPriceRange");
    render(<FilterSidebar />);
    fireEvent.click(screen.getAllByRole("button", { name: "Apply" })[0]);
    expect(spy).toHaveBeenCalledWith(null, null);
  });

  it("collapsing a SidebarSection via its header hides the section body", () => {
    const { container } = render(<FilterSidebar />);
    // Scope to the desktop <aside> — the mobile drawer renders an identical copy,
    // so a document-wide query would still find the other section's checkbox.
    const aside = container.querySelector("aside") as HTMLElement;
    const header = within(aside).getByRole("button", { name: /Stock Availability/ });
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(within(aside).getByLabelText("In Stock at My Branch")).toBeInTheDocument();
    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(within(aside).queryByLabelText("In Stock at My Branch")).not.toBeInTheDocument();
  });

  it("enum spec facets render as checkbox groups with counts and toggle via toggleSpecFilter", () => {
    const facets: Facet[] = [
      { type: "enum", name: "Amperage", values: [{ value: "20A", count: 7 }, { value: "30A", count: 3 }] },
    ];
    useProductFinder.setState({ facets });
    const spy = vi.spyOn(useProductFinder.getState(), "toggleSpecFilter");
    const { container } = render(<FilterSidebar />);
    const aside = container.querySelector("aside") as HTMLElement;
    // Facet section header uses the facet name.
    expect(within(aside).getByText("Amperage")).toBeInTheDocument();
    // Count badge rendered next to a value.
    expect(within(aside).getByText("7")).toBeInTheDocument();
    // The checkbox's accessible name is "20A 7" (value + count span both inside
    // the <label>), so click via the row's <label> text rather than getByLabelText.
    const row = within(aside).getByText("20A").closest("label") as HTMLElement;
    fireEvent.click(within(row).getByRole("checkbox"));
    // toggleSpecFilter(name, value) — called with this facet's name + value.
    const calls = spy.mock.calls as unknown as [string, string][];
    expect(calls.some((c) => c[0] === "Amperage" && c[1] === "20A")).toBe(true);
  });

  it("range spec facets render Min/Max inputs labelled by spec name and apply on blur", () => {
    const facets: Facet[] = [
      { type: "range", name: "Voltage", unit: "V", min: 0, max: 600 },
    ];
    useProductFinder.setState({ facets });
    const spy = vi.spyOn(useProductFinder.getState(), "setSpecRange");
    render(<FilterSidebar />);
    // Range header includes the unit: "Voltage (V)".
    expect(screen.getAllByText("Voltage (V)").length).toBeGreaterThan(0);
    const minInput = screen.getAllByLabelText("Minimum Voltage")[0];
    fireEvent.change(minInput, { target: { value: "120" } });
    fireEvent.blur(minInput);
    const calls = spy.mock.calls as unknown as [string, { min?: number; max?: number }][];
    expect(calls[0][0]).toBe("Voltage");
    expect(calls[0][1].min).toBe(120);
  });

  it("mobile drawer: the FAB opens the bottom-sheet dialog and the badge counts active filters", () => {
    seedFilters({ categories: new Set(["electrical"]), onlyBranchStock: true });
    render(<FilterSidebar />);
    // The mobile dialog exists in the DOM (translate-y-full when closed); FAB toggles it.
    const fab = screen.getByRole("button", { name: "Open filters" });
    fireEvent.click(fab);
    const dialog = screen.getByRole("dialog", { name: "Filters" });
    expect(dialog).toBeInTheDocument();
    // Close via the X button.
    fireEvent.click(within(dialog).getByRole("button", { name: "Close filters" }));
  });
});
