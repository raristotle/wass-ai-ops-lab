import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchBar } from "@/features/product-finder/SearchBar";
import { useProductFinder } from "@/lib/product-finder-store";
import type { ParsedFilter, SuggestItem } from "@/features/product-finder/types";

// SearchBar's NL search + suggest both go through fetch (apiSearch / apiSuggest).
// A single ok-returning stub keeps every async path quiet under jsdom; individual
// tests that need suggestions to render override apiSuggest via the items payload.
function stubFetch(items: SuggestItem[] = []) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ items, total: 0, facets: [], refineFacets: [], substitutes: {} }),
    })),
  );
}

function suggestItem(id: string): SuggestItem {
  return { id, sku: id, name: `Product ${id}`, brand: "Acme", imageIcon: "x" };
}

// A minimal applied-filter chip so the SingleSearchPanel "Filters:" branch renders.
const nlFilter: ParsedFilter = { id: "f1", kind: "preferred", label: "Preferred", value: true };

describe("SearchBar (render)", () => {
  beforeEach(() => {
    stubFetch();
    useProductFinder.setState({ query: "", appliedNlFilters: [] });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    useProductFinder.setState({ query: "", appliedNlFilters: [], savedSearches: [] });
  });

  it("renders the search box, the Search button, and the quick-pick chips", () => {
    render(<SearchBar />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    // Quick-pick chips come from QUICK_PICKS — spot-check two.
    expect(screen.getByRole("button", { name: "Circuit Breakers" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cat6 Cable" })).toBeInTheDocument();
    // The action buttons that open modals are present.
    expect(screen.getByRole("button", { name: "Ask Meridian — AI assistant" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import List / BOM" })).toBeInTheDocument();
  });

  it("does not show the clear button when the query is empty (empty branch)", () => {
    render(<SearchBar />);
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
  });

  it("shows the clear button when the query is populated and clears it (populated branch)", () => {
    useProductFinder.setState({ query: "breaker" });
    render(<SearchBar />);
    const input = screen.getByRole("combobox") as HTMLInputElement;
    expect(input.value).toBe("breaker");
    const clearBtn = screen.getByRole("button", { name: "Clear search" });
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);
    expect(useProductFinder.getState().query).toBe("");
  });

  it("typing updates the store query and (after debounce) shows suggestions", async () => {
    stubFetch([suggestItem("A"), suggestItem("B")]);
    render(<SearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "prod" } });
    expect(useProductFinder.getState().query).toBe("prod");
    // The suggest fetch is debounced ~150ms; the dropdown opens once it resolves.
    const listbox = await screen.findByRole("listbox");
    expect(listbox).toBeInTheDocument();
    expect(screen.getByText("Product A")).toBeInTheDocument();
    // Selecting a suggestion writes its name back into the query.
    fireEvent.click(screen.getByText("Product A"));
    expect(useProductFinder.getState().query).toBe("Product A");
  });

  it("Search button and Enter key both run an NL search", () => {
    useProductFinder.setState({ query: "circuit breaker" });
    const spy = vi.spyOn(useProductFinder.getState(), "runNlSearch");
    render(<SearchBar />);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    expect(spy).toHaveBeenCalledWith("circuit breaker");
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it("a quick-pick chip runs an NL search with that chip text", () => {
    const spy = vi.spyOn(useProductFinder.getState(), "runNlSearch");
    render(<SearchBar />);
    fireEvent.click(screen.getByRole("button", { name: "Relays" }));
    expect(spy).toHaveBeenCalledWith("Relays");
    expect(useProductFinder.getState().query).toBe("Relays");
    spy.mockRestore();
  });

  it("each toolbar button opens its modal via the corresponding store action", () => {
    render(<SearchBar />);
    const cases: Array<[string, () => boolean]> = [
      ["Import List / BOM", () => useProductFinder.getState().bomModalOpen],
      ["Inbound RFQ auto-quote", () => useProductFinder.getState().rfqOpen],
      ["BOM intelligence", () => useProductFinder.getState().bomIqOpen],
      ["Job workspace", () => useProductFinder.getState().jobsOpen],
      ["Kits and assemblies", () => useProductFinder.getState().kitsOpen],
      ["Vendor-managed inventory", () => useProductFinder.getState().vmiOpen],
      ["Bulk price and availability", () => useProductFinder.getState().bulkModalOpen],
      ["Bulk cross-reference", () => useProductFinder.getState().bulkCrossOpen],
      ["Guided engineering selectors", () => useProductFinder.getState().guidedOpen],
      ["Ask Meridian — AI assistant", () => useProductFinder.getState().assistantOpen],
      ["Ask Meridian — Job Wizard", () => useProductFinder.getState().jobWizardOpen],
    ];
    for (const [label, read] of cases) {
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(read(), `${label} should toggle its store flag`).toBe(true);
    }
  });

  it("renders applied NL filter chips and removes one on click", async () => {
    useProductFinder.setState({ appliedNlFilters: [nlFilter] });
    const spy = vi.spyOn(useProductFinder.getState(), "removeNlFilter");
    render(<SearchBar />);
    expect(screen.getByText("Filters:")).toBeInTheDocument();
    const remove = screen.getByRole("button", { name: "Remove filter Preferred" });
    fireEvent.click(remove);
    expect(spy).toHaveBeenCalledWith("f1");
    spy.mockRestore();
  });

  it("opens the cross-reference modal and closes it again (local state branch)", () => {
    render(<SearchBar />);
    fireEvent.click(screen.getByRole("button", { name: "Cross-reference lookup" }));
    const dialog = screen.getByRole("dialog", { name: "Cross-reference lookup" });
    expect(dialog).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close cross-reference modal" }));
    expect(screen.queryByRole("dialog", { name: "Cross-reference lookup" })).not.toBeInTheDocument();
  });

  it("cross-reference: an unknown part number shows the no-documented-cross miss message", async () => {
    // The modal now resolves against the real /api/crosses/match endpoint (apiCrossMatch);
    // the default fetch stub omits `suggestions`, so it fails closed to a miss.
    render(<SearchBar />);
    fireEvent.click(screen.getByRole("button", { name: "Cross-reference lookup" }));
    const input = screen.getByLabelText("Competitor or legacy part number");
    fireEvent.change(input, { target: { value: "ZZZ-NOPE-9999" } });
    fireEvent.click(screen.getByRole("button", { name: "Find" }));
    expect(await screen.findByText(/No documented cross-reference to a stocked product/i)).toBeInTheDocument();
  });

  it("offers a scoped 'Search only in {label}' suggestion for a category-name query", async () => {
    // 'breaker' name-matches the Circuit Breakers subcategory → scope row appears.
    stubFetch([suggestItem("A")]);
    render(<SearchBar />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "breaker" } });
    await screen.findByRole("listbox");
    const scopeRow = await screen.findByText(/Search only in/i);
    expect(scopeRow).toBeInTheDocument();
    // Applying the scope clears the query box.
    fireEvent.click(scopeRow);
    await waitFor(() => expect(useProductFinder.getState().query).toBe(""));
  });
});
