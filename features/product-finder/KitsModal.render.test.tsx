import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { KitsModal } from "@/features/product-finder/KitsModal";
import { useProductFinder } from "@/lib/product-finder-store";
import { KIT_DEFS } from "@/lib/product-finder-kits";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Render/branch coverage for the Kits & Assemblies modal. The modal resolves
 * each kit line via apiSearch (-> fetch /api/products/search), then rolls the
 * resolved products up into a single priced + stock-checked kit. We stub fetch
 * so the resolver is deterministic, and seed the Zustand store's `kitsOpen`.
 */

// `branchQty` lets each test decide whether the resolved product is in stock
// (enough branch quantity to cover the line qty) or "Low/OOS".
function prod(id: string, unitPrice: number, branchQty: number): CatalogProduct {
  return {
    id,
    sku: id,
    name: `Product ${id}`,
    brand: "Acme",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice,
    uom: "ea",
    specs: [],
    preferred: false,
    branchStock:
      branchQty > 0
        ? [{ branchId: "b1", branchName: "Main", city: "Pittsburgh", state: "PA", quantity: branchQty }]
        : [],
    dcStock: [],
    externalSources: [],
    imageIcon: "x",
  };
}

function searchResponse(items: CatalogProduct[]) {
  return { ok: true, json: async () => ({ items, total: items.length, page: 0, pageSize: 1, facets: [] }) };
}

/** fetch stub that returns a single, deeply-stocked product for every line. */
function stubFetchInStock() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => searchResponse([prod("STOCKED", 12.5, 10_000)])),
  );
}

describe("KitsModal (component)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    act(() => {
      useProductFinder.setState({ kitsOpen: false, cart: {}, cartOpen: false });
    });
  });

  it("renders nothing when the modal is closed", () => {
    useProductFinder.setState({ kitsOpen: false });
    const { container } = render(<KitsModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the kit browser list when open and no kit is selected", () => {
    stubFetchInStock();
    useProductFinder.setState({ kitsOpen: true });
    render(<KitsModal />);

    expect(screen.getByRole("dialog", { name: "Kits and assemblies" })).toBeInTheDocument();
    expect(screen.getByText("Kits & Assemblies")).toBeInTheDocument();
    // Every curated kit shows as a selectable card.
    for (const kit of KIT_DEFS) {
      expect(screen.getByText(kit.name)).toBeInTheDocument();
    }
    // No "Back" affordance until a kit is opened.
    expect(screen.queryByRole("button", { name: "Back to kits list" })).not.toBeInTheDocument();
  });

  it("resolves a selected kit's lines and enables Add-to-cart when everything is in stock", async () => {
    stubFetchInStock();
    useProductFinder.setState({ kitsOpen: true });
    render(<KitsModal />);

    const kit = KIT_DEFS[0]; // GFCI Outlet Kit — all required, no optional lines
    fireEvent.click(screen.getByText(kit.name));

    // Header swaps to the kit name + a Back button appears.
    expect(await screen.findByRole("button", { name: "Back to kits list" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: kit.name })).toBeInTheDocument();

    const addBtn = await screen.findByRole("button", { name: "Add kit to cart" });
    await waitFor(() => expect(addBtn).not.toBeDisabled());

    // Each resolved line surfaces the stocked product + "In stock".
    expect(screen.getAllByText(/Product STOCKED · SKU STOCKED/).length).toBe(kit.lines.length);
    expect(screen.getAllByText("In stock").length).toBeGreaterThan(0);

    // Rollup total = sum(unitPrice * qty) over all lines.
    const expectedTotal = kit.lines.reduce((sum, l) => sum + 12.5 * l.qty, 0);
    expect(screen.getByText(`Kit total: $${expectedTotal.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText("All required components in stock")).toBeInTheDocument();
  });

  it("adds every resolved line to the cart and opens the cart on confirm", async () => {
    vi.useFakeTimers();
    stubFetchInStock();
    useProductFinder.setState({ kitsOpen: true });
    render(<KitsModal />);

    const kit = KIT_DEFS[0];
    fireEvent.click(screen.getByText(kit.name));

    // Flush the resolver promises (under fake timers, microtasks need a nudge).
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    const addBtn = screen.getByRole("button", { name: "Add kit to cart" });
    expect(addBtn).not.toBeDisabled();
    fireEvent.click(addBtn);

    // Button flips to the "Added" confirmation state immediately.
    expect(screen.getByRole("button", { name: "Added ✓" })).toBeInTheDocument();

    // All lines resolved to the same product id, so the cart has ONE line whose
    // qty is the SUM of the kit line quantities.
    const cart = useProductFinder.getState().cart;
    expect(Object.keys(cart)).toEqual(["STOCKED"]);
    const expectedQty = kit.lines.reduce((sum, l) => sum + l.qty, 0);
    expect(cart["STOCKED"].qty).toBe(expectedQty);

    // After the 800ms delay the modal closes and the cart drawer opens.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(useProductFinder.getState().kitsOpen).toBe(false);
    expect(useProductFinder.getState().cartOpen).toBe(true);

    vi.useRealTimers();
  });

  it("shows the no-stocked-match branch and keeps Add disabled when a required line can't be resolved", async () => {
    // Empty search results -> resolveKitLine returns null for every line.
    vi.stubGlobal("fetch", vi.fn(async () => searchResponse([])));
    useProductFinder.setState({ kitsOpen: true });
    render(<KitsModal />);

    const kit = KIT_DEFS[0];
    fireEvent.click(screen.getByText(kit.name));

    expect((await screen.findAllByText(/No stocked match/)).length).toBe(kit.lines.length);
    const addBtn = screen.getByRole("button", { name: "Add kit to cart" });
    expect(addBtn).toBeDisabled();
    expect(screen.getByText("One or more required components out of stock")).toBeInTheDocument();
  });

  it("treats a resolved-but-understocked line as Low/OOS and blocks Add", async () => {
    // Product resolves, but branch qty (1) is below the GFCI kit's 50ft wire line.
    vi.stubGlobal("fetch", vi.fn(async () => searchResponse([prod("THIN", 9, 1)])));
    useProductFinder.setState({ kitsOpen: true });
    render(<KitsModal />);

    fireEvent.click(screen.getByText(KIT_DEFS[0].name));

    expect(await screen.findByText("One or more required components out of stock")).toBeInTheDocument();
    expect(screen.getAllByText("Low/OOS").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Add kit to cart" })).toBeDisabled();
  });

  it("Back returns to the kit list, and the close button closes the modal", async () => {
    stubFetchInStock();
    useProductFinder.setState({ kitsOpen: true });
    render(<KitsModal />);

    fireEvent.click(screen.getByText(KIT_DEFS[0].name));
    const back = await screen.findByRole("button", { name: "Back to kits list" });
    fireEvent.click(back);
    // Back at the list: all kit cards visible again, no Back button.
    expect(screen.getByText(KIT_DEFS[1].name)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to kits list" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close kits modal" }));
    expect(useProductFinder.getState().kitsOpen).toBe(false);
  });

  it("clicking the backdrop (overlay) closes the modal", () => {
    stubFetchInStock();
    useProductFinder.setState({ kitsOpen: true });
    render(<KitsModal />);
    const dialog = screen.getByRole("dialog", { name: "Kits and assemblies" });
    fireEvent.click(dialog); // target === currentTarget -> close
    expect(useProductFinder.getState().kitsOpen).toBe(false);
  });
});
