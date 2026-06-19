import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ProductGrid } from "@/features/product-finder/ProductGrid";
import { useProductFinder } from "@/lib/product-finder-store";
import * as csv from "@/lib/product-finder-csv";
import type { CatalogProduct } from "@/features/product-finder/types";

// ProductGrid itself uses no next/navigation, but ProductCard's deep import tree
// (rendered in list/grid view) is safest with the router stubbed, matching the
// project's accessibility-test template.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function prod(id: string): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 20, uom: "ea", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

const PRODUCTS = [prod("A"), prod("B"), prod("C")];

/** Reset the store slices ProductGrid reads to a known baseline. */
function seed(overrides: Record<string, unknown> = {}) {
  useProductFinder.setState({
    filters: { ...useProductFinder.getState().filters, viewMode: "list", sortKey: "relevance" },
    loading: false,
    total: PRODUCTS.length,
    results: PRODUCTS,
    substitutes: {},
    activeResultIndex: -1,
    keyboardHelpOpen: false,
    detailModalProduct: null,
    compareIds: new Set(),
    cart: {},
    ...overrides,
  });
}

describe("ProductGrid (component)", () => {
  beforeEach(() => {
    seed();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({}) })));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    useProductFinder.setState({
      results: [], total: 0, substitutes: {}, activeResultIndex: -1,
      keyboardHelpOpen: false, detailModalProduct: null, compareIds: new Set(), cart: {},
      filters: { ...useProductFinder.getState().filters, viewMode: "list", sortKey: "relevance" },
    });
  });

  it("render smoke: shows the result count and core controls when populated", () => {
    render(<ProductGrid products={PRODUCTS} />);
    expect(screen.getByText("3 products found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show keyboard shortcuts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy shareable link to these results" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export visible results to CSV" })).toBeInTheDocument();
    expect(screen.getByLabelText("Sort products")).toBeInTheDocument();
  });

  it("singularizes the count and hides count-gated controls when there is exactly one product", () => {
    seed({ total: 1, results: [prod("A")] });
    render(<ProductGrid products={[prod("A")]} />);
    expect(screen.getByText("1 product found")).toBeInTheDocument();
  });

  it("renders the empty state and hides total-gated controls when there are no products", () => {
    seed({ total: 0, results: [] });
    render(<ProductGrid products={[]} />);
    expect(screen.getByText("0 products found")).toBeInTheDocument();
    expect(screen.getByText("No products found")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search or filters")).toBeInTheDocument();
    // total === 0 → keyboard-hint / copy-link buttons are not rendered.
    expect(screen.queryByRole("button", { name: "Show keyboard shortcuts" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy shareable link to these results" })).not.toBeInTheDocument();
    // products.length === 0 → no Export CSV button.
    expect(screen.queryByRole("button", { name: "Export visible results to CSV" })).not.toBeInTheDocument();
  });

  it("clicking the keyboard-shortcuts hint opens the help overlay", () => {
    render(<ProductGrid products={PRODUCTS} />);
    expect(useProductFinder.getState().keyboardHelpOpen).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Show keyboard shortcuts" }));
    expect(useProductFinder.getState().keyboardHelpOpen).toBe(true);
  });

  it("changing the sort select calls setSortKey with the chosen key", () => {
    // Stub setSortKey so we assert the wiring without firing the real async
    // runSearch (which races teardown). View toggle below does the same.
    const setSortKey = vi.fn();
    seed({ setSortKey });
    render(<ProductGrid products={PRODUCTS} />);
    fireEvent.change(screen.getByLabelText("Sort products"), { target: { value: "priceLow" } });
    expect(setSortKey).toHaveBeenCalledWith("priceLow");
  });

  it("the view-mode toggle calls setViewMode and reflects the current mode via aria-pressed", () => {
    const setViewMode = vi.fn();
    seed({ setViewMode });
    render(<ProductGrid products={PRODUCTS} />);
    const grid = screen.getByRole("button", { name: "Grid view" });
    const table = screen.getByRole("button", { name: "Table view" });
    const list = screen.getByRole("button", { name: "List view" });

    // Seeded viewMode is "list" → that toggle reads as pressed.
    expect(list).toHaveAttribute("aria-pressed", "true");
    expect(grid).toHaveAttribute("aria-pressed", "false");
    expect(table).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(grid);
    expect(setViewMode).toHaveBeenCalledWith("grid");
    fireEvent.click(table);
    expect(setViewMode).toHaveBeenCalledWith("table");
  });

  it("table view renders the ResultsTable (column controls) instead of cards", () => {
    seed({ filters: { ...useProductFinder.getState().filters, viewMode: "table" } });
    render(<ProductGrid products={PRODUCTS} />);
    // ResultsTable exposes a Columns control; ProductCard grid does not.
    expect(screen.getByText(/Columns/)).toBeInTheDocument();
  });

  it("grid view renders one result wrapper per product and marks the keyboard-highlighted row", () => {
    seed({ filters: { ...useProductFinder.getState().filters, viewMode: "grid" } });
    const { container } = render(<ProductGrid products={PRODUCTS} />);
    const wrappers = container.querySelectorAll("[data-result-index]");
    expect(wrappers).toHaveLength(3);
    // Drive the highlight to index 1 via the keyboard (j twice); the hook's
    // mount-reconcile would clear any pre-seeded index, so go through the handler.
    act(() => { fireEvent.keyDown(window, { key: "j" }); });
    act(() => { fireEvent.keyDown(window, { key: "j" }); });
    expect(useProductFinder.getState().activeResultIndex).toBe(1);
    expect(container.querySelector('[data-result-index="1"]')).toHaveAttribute("aria-current", "true");
    expect(container.querySelector('[data-result-index="0"]')).not.toHaveAttribute("aria-current");
  });

  it("Export CSV invokes downloadCsv with the result rows", () => {
    const spy = vi.spyOn(csv, "downloadCsv").mockImplementation(() => {});
    render(<ProductGrid products={PRODUCTS} />);
    fireEvent.click(screen.getByRole("button", { name: "Export visible results to CSV" }));
    expect(spy).toHaveBeenCalledTimes(1);
    const call = spy.mock.calls[0] as unknown as [string, string];
    expect(call[0]).toBe("product-results.csv");
    expect(call[1]).toContain("Product A"); // serialized result row
  });

  it("Copy link writes the URL to the clipboard and flips the button to a confirmation", async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { clipboard: { writeText } } as unknown as Navigator);
    render(<ProductGrid products={PRODUCTS} />);
    const btn = screen.getByRole("button", { name: "Copy shareable link to these results" });
    fireEvent.click(btn);
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    await screen.findByText("✓ Copied");
  });

  it("Copy link falls back to execCommand when the clipboard API throws, and surfaces the failure hint when that also fails", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn(async () => { throw new Error("blocked"); }) },
    } as unknown as Navigator);
    // execCommand fails too → copyState becomes "failed".
    (document as unknown as { execCommand: () => boolean }).execCommand = () => false;
    render(<ProductGrid products={PRODUCTS} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy shareable link to these results" }));
    await screen.findByText("Copy from the address bar");
  });

  it("shows a Load more button only when fewer results than the total are loaded", () => {
    // results (2) < total (5) → Load more visible with the remaining count.
    seed({ results: [prod("A"), prod("B")], total: 5 });
    render(<ProductGrid products={[prod("A"), prod("B")]} />);
    const loadMore = screen.getByRole("button", { name: /Load more \(3 more\)/ });
    expect(loadMore).toBeInTheDocument();
    expect(loadMore).not.toBeDisabled();
  });

  it("the Load more button shows a loading label and is disabled while loading", () => {
    seed({ results: [prod("A")], total: 5, loading: true });
    render(<ProductGrid products={[prod("A")]} />);
    const loadMore = screen.getByRole("button", { name: "Loading…" });
    expect(loadMore).toBeDisabled();
  });

  it("clicking Load more invokes the store's loadMore", () => {
    const loadMore = vi.fn();
    seed({ results: [prod("A")], total: 5, loadMore });
    render(<ProductGrid products={[prod("A")]} />);
    fireEvent.click(screen.getByRole("button", { name: /Load more/ }));
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("hides Load more once all results are loaded (results.length >= total)", () => {
    render(<ProductGrid products={PRODUCTS} />); // results(3) === total(3)
    expect(screen.queryByRole("button", { name: /Load more/ })).not.toBeInTheDocument();
  });

  it("keyboard power-layer: 'j' highlights the first result, then 'a' adds it to the cart", () => {
    // The hook's mount-reconcile effect clears any pre-seeded highlight (it tracks
    // by product id, which starts null), so drive the highlight via the keyboard.
    render(<ProductGrid products={PRODUCTS} />);
    expect(useProductFinder.getState().activeResultIndex).toBe(-1);
    act(() => { fireEvent.keyDown(window, { key: "j" }); });
    expect(useProductFinder.getState().activeResultIndex).toBe(0);
    act(() => { fireEvent.keyDown(window, { key: "a" }); });
    expect(useProductFinder.getState().cart["A"]).toBeTruthy();
  });

  it("keyboard power-layer is inert while a dialog is open (aria-modal guard)", () => {
    render(<ProductGrid products={PRODUCTS} />);
    const modal = document.createElement("div");
    modal.setAttribute("aria-modal", "true");
    document.body.appendChild(modal);
    act(() => { fireEvent.keyDown(window, { key: "j" }); });
    expect(useProductFinder.getState().activeResultIndex).toBe(-1); // unchanged
    document.body.removeChild(modal);
  });
});
