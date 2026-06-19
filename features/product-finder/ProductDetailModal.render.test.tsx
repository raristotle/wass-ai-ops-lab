import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ProductDetailModal } from "@/features/product-finder/ProductDetailModal";
import { useProductFinder } from "@/lib/product-finder-store";
import { __resetPrefetchCache } from "@/lib/product-finder-prefetch";
import type { CatalogProduct, ProductSpec } from "@/features/product-finder/types";
import type { LifecycleStatus } from "@/lib/catalog/lifecycle";

// The modal mounts child panels (LiveDistributorPanel / OfferLadderPanel) and
// runs apiGoesWith + fetchProductDetailCached in effects — all of which hit
// fetch. Stub it so jsdom renders without a real network. The default body for
// each endpoint mirrors the empty, well-formed shape the real route returns
// (the panels read `.items` / `.ladder.length` etc. directly), so nothing
// throws while effects settle. A per-test `impl` can override any URL.
function defaultBody(url: string): unknown {
  if (/goeswith/.test(url)) return { items: [] };
  if (/\/offers$/.test(url)) return { ladder: [] };
  if (/\/live$/.test(url)) return { enabled: false };
  // detail route ( /api/products/:id ) — equivalents + coverage
  if (/\/api\/products\//.test(url)) return { equivalents: [], coverage: null };
  return {};
}

function stubFetch(impl?: (url: string) => unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const overridden = impl ? impl(url) : undefined;
      const body = overridden !== undefined ? overridden : defaultBody(url);
      return { ok: true, json: async () => body } as Response;
    }),
  );
}

function prod(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  const specs: ProductSpec[] = overrides.specs ?? [
    { name: "Amperage", value: "20A", isNonNeg: true },
    { name: "Poles", value: "1" },
  ];
  return {
    id: "P-1",
    sku: "SKU-1",
    name: "Square D QO120 Breaker",
    brand: "Square D",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "Single-pole 20A circuit breaker.",
    unitPrice: 12.5,
    uom: "ea",
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "⚡",
    ...overrides,
    specs,
  };
}

function inStock(): Pick<CatalogProduct, "branchStock"> {
  return {
    branchStock: [
      { branchId: "B-HOU-01", branchName: "Houston Downtown", city: "Houston", state: "TX", quantity: 8 },
    ],
  };
}

describe("ProductDetailModal (component render)", () => {
  beforeEach(() => {
    __resetPrefetchCache();
    stubFetch();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    useProductFinder.setState({
      detailModalProduct: null,
      cart: {},
      watches: [],
      activeCustomerId: null,
      user: null,
    });
  });

  it("renders nothing when no product is selected", () => {
    useProductFinder.setState({ detailModalProduct: null });
    const { container } = render(<ProductDetailModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the dialog with name, SKU, price, and spec table for a basic product", () => {
    useProductFinder.setState({ detailModalProduct: prod() });
    render(<ProductDetailModal />);

    const dialog = screen.getByRole("dialog", { name: /Product details: Square D QO120 Breaker/ });
    expect(dialog).toBeInTheDocument();
    // Header name (h2) is present.
    expect(screen.getByRole("heading", { level: 2, name: "Square D QO120 Breaker" })).toBeInTheDocument();
    // Brand · SKU line. (Appears in both the screen header and the print-only
    // block — jsdom doesn't apply the Tailwind `hidden`/`print:` visibility, so
    // both nodes are in the DOM.)
    expect(screen.getAllByText(/Square D · SKU: SKU-1/).length).toBeGreaterThan(0);
    // Spec rows render (non-neg first, with a REQ chip). Scope to the spec-sheet
    // block — the value "20A" also surfaces in the ProductArt key-spec callout.
    const specSheet = document.getElementById("product-spec-sheet") as HTMLElement;
    expect(within(specSheet).getByText("Amperage")).toBeInTheDocument();
    expect(within(specSheet).getByText("20A")).toBeInTheDocument();
    expect(within(specSheet).getByText("REQ")).toBeInTheDocument();
    // The Add to Basket CTA is present.
    expect(screen.getByRole("button", { name: "Add to Basket" })).toBeInTheDocument();
    // Data-quality badge always renders ("⬡ Data <score>").
    expect(screen.getByText(/⬡ Data \d+/)).toBeInTheDocument();
  });

  it("shows the Preferred + Verified provenance badges for a verified preferred product", () => {
    useProductFinder.setState({
      detailModalProduct: prod({ preferred: true, dataSource: "verified" }),
    });
    render(<ProductDetailModal />);
    // "Preferred" renders in the header badge and again in the print-only block.
    expect(screen.getAllByText("Preferred").length).toBeGreaterThan(0);
    expect(screen.getByText(/Verified real product/)).toBeInTheDocument();
  });

  it("shows the 'Simulated demo item' badge for a simulated product", () => {
    useProductFinder.setState({ detailModalProduct: prod({ dataSource: "simulated" }) });
    render(<ProductDetailModal />);
    expect(screen.getByText("Simulated demo item")).toBeInTheDocument();
  });

  it("shows the obsolescence badge for an EOL product", () => {
    useProductFinder.setState({
      detailModalProduct: prod({ lifecycleStatus: "EOL" as LifecycleStatus }),
    });
    render(<ProductDetailModal />);
    // Badge text is "⚠ End of life".
    expect(screen.getByText(/End of life/)).toBeInTheDocument();
  });

  it("qty stepper increments and Add to Basket adds that quantity to the cart", () => {
    useProductFinder.setState({ detailModalProduct: prod({ id: "P-CART", ...inStock() }) });
    render(<ProductDetailModal />);

    // Bump quantity to 3 via the + control.
    const inc = screen.getByRole("button", { name: "Increase quantity" });
    fireEvent.click(inc);
    fireEvent.click(inc);
    const qtyInput = screen.getByRole("spinbutton", { name: "Quantity" });
    expect(qtyInput).toHaveValue(3);

    fireEvent.click(screen.getByRole("button", { name: "Add to Basket" }));
    const cart = useProductFinder.getState().cart;
    expect(cart["P-CART"]).toBeDefined();
    expect(cart["P-CART"].qty).toBe(3);
  });

  it("decrement clamps the quantity at 1", () => {
    useProductFinder.setState({ detailModalProduct: prod() });
    render(<ProductDetailModal />);
    const dec = screen.getByRole("button", { name: "Decrease quantity" });
    fireEvent.click(dec);
    fireEvent.click(dec);
    expect(screen.getByRole("spinbutton", { name: "Quantity" })).toHaveValue(1);
  });

  it("shows the OOS notify control and toggles a watch on click", () => {
    const p = prod({ id: "P-OOS" }); // no branchStock/dcStock → out of stock
    useProductFinder.setState({ detailModalProduct: p, watches: [] });
    render(<ProductDetailModal />);

    const notify = screen.getByRole("button", { name: "Notify when available" });
    expect(notify).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(notify);

    const watches = useProductFinder.getState().watches;
    expect(watches.some((w) => w.id === "P-OOS")).toBe(true);
    // The control now reflects the watched state.
    expect(screen.getByRole("button", { name: /We'll notify you/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("does NOT show the notify control for an in-stock product", () => {
    useProductFinder.setState({ detailModalProduct: prod({ id: "P-IN", ...inStock() }) });
    render(<ProductDetailModal />);
    expect(screen.queryByRole("button", { name: /Notify when available/ })).not.toBeInTheDocument();
  });

  it("close button clears the detail modal product", () => {
    useProductFinder.setState({ detailModalProduct: prod() });
    render(<ProductDetailModal />);
    fireEvent.click(screen.getByRole("button", { name: "Close product detail modal" }));
    expect(useProductFinder.getState().detailModalProduct).toBeNull();
  });

  it("clicking the overlay (outside the dialog) closes the modal", () => {
    useProductFinder.setState({ detailModalProduct: prod() });
    render(<ProductDetailModal />);
    const overlay = screen.getByRole("dialog");
    // Click directly on the overlay element (target === currentTarget).
    fireEvent.click(overlay);
    expect(useProductFinder.getState().detailModalProduct).toBeNull();
  });

  it("Find Alternatives closes the modal and sets the active product", () => {
    const p = prod({ id: "P-ALT" });
    useProductFinder.setState({ detailModalProduct: p });
    const setActiveSpy = vi.fn(async () => {});
    useProductFinder.setState({ setActiveProduct: setActiveSpy });
    render(<ProductDetailModal />);

    fireEvent.click(screen.getByRole("button", { name: "Find Alternatives" }));
    expect(useProductFinder.getState().detailModalProduct).toBeNull();
    expect(setActiveSpy).toHaveBeenCalledTimes(1);
    const calls = setActiveSpy.mock.calls as unknown as [CatalogProduct][];
    expect(calls[0][0].id).toBe("P-ALT");
  });

  it("renders a manufacturer spec-sheet link when specSheetUrl is present", () => {
    useProductFinder.setState({
      detailModalProduct: prod({ specSheetUrl: "https://example.com/datasheet.pdf" }),
    });
    render(<ProductDetailModal />);
    const link = screen.getByRole("link", { name: /Manufacturer Spec Sheet/ });
    expect(link).toHaveAttribute("href", "https://example.com/datasheet.pdf");
  });

  it("Download Spec Sheet (PDF) invokes window.print", () => {
    const printSpy = vi.fn();
    vi.stubGlobal("print", printSpy);
    useProductFinder.setState({ detailModalProduct: prod() });
    render(<ProductDetailModal />);
    fireEvent.click(screen.getByRole("button", { name: /Download Spec Sheet/ }));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it("renders the Where to Buy distributor rows (generic fallbacks always present)", () => {
    useProductFinder.setState({ detailModalProduct: prod() });
    render(<ProductDetailModal />);
    const whereToBuy = screen.getByRole("heading", { name: "Where to Buy" }).parentElement as HTMLElement;
    // Generic fallbacks: Grainger, Zoro, Home Depot.
    expect(within(whereToBuy).getByRole("link", { name: /Zoro/ })).toBeInTheDocument();
    expect(within(whereToBuy).getByRole("link", { name: /Home Depot/ })).toBeInTheDocument();
  });

  it("renders the active-successor callout and adds the successor to cart for an obsolescent part", async () => {
    const successor = prod({
      id: "SUCC-1",
      sku: "SKU-SUCC",
      name: "Active Replacement Breaker",
      lifecycleStatus: "Active" as LifecycleStatus,
    });
    // The detail endpoint feeds equivalents → pickActiveSuccessor. Other URLs
    // (goeswith/live/offers) fall through to the well-formed default body.
    stubFetch((url) => {
      if (/\/api\/products\/[^/]+(\?|$)/.test(url)) {
        return { equivalents: [successor], coverage: null };
      }
      return undefined;
    });
    useProductFinder.setState({
      detailModalProduct: prod({ id: "OBS-1", lifecycleStatus: "Discontinued" as LifecycleStatus }),
    });
    render(<ProductDetailModal />);

    // The successor callout resolves asynchronously after the detail fetch.
    const useActive = await screen.findByRole("button", { name: /Use active part — add to cart/ });
    fireEvent.click(useActive);
    expect(useProductFinder.getState().cart["SUCC-1"]).toBeDefined();
  });

  it("renders a 'Goes well with' rail from the goeswith endpoint and navigates on click", async () => {
    const goesWith = prod({ id: "GW-1", name: "Wire Connectors 100ct", unitPrice: 7.25 });
    stubFetch((url) => {
      if (/goeswith/.test(url)) return { items: [goesWith] };
      return undefined;
    });
    useProductFinder.setState({ detailModalProduct: prod({ id: "BASE-1" }) });
    render(<ProductDetailModal />);

    const gwButton = await screen.findByRole("button", { name: /View details for Wire Connectors 100ct/ });
    fireEvent.click(gwButton);
    // Clicking a goes-with item swaps the detail modal to that product.
    expect(useProductFinder.getState().detailModalProduct?.id).toBe("GW-1");
  });
});
