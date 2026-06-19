import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { SpecCompareModal } from "@/features/product-finder/SpecCompareModal";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct, ProductSpec, AuthUser } from "@/features/product-finder/types";

// ─── Test product factory ───────────────────────────────────────────────────
// SpecCompareModal resolves compare ids via PRODUCT_MAP first, then falls back to
// the store's `results`. We seed `results` with our own products so the test owns
// every branch input (price, specs, lifecycle, crosses, stock, preferred).
function prod(id: string, over: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id,
    sku: id,
    name: `Product ${id}`,
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
    ...over,
  };
}

const spec = (name: string, value: string, isNonNeg?: boolean): ProductSpec =>
  isNonNeg ? { name, value, isNonNeg } : { name, value };

const user: AuthUser = {
  name: "Sarah Chen",
  email: "sales@meridiansupply.com",
  role: "sales",
  branch: "Houston Downtown",
  branchId: "B-HOU-01",
};

function seed(products: CatalogProduct[], extra: Record<string, unknown> = {}) {
  useProductFinder.setState({
    compareModalOpen: true,
    compareIds: new Set(products.map((p) => p.id)),
    results: products,
    cart: {},
    user: null,
    ...extra,
  });
}

function resetStore() {
  useProductFinder.setState({
    compareModalOpen: false,
    compareIds: new Set(),
    results: [],
    cart: {},
    user: null,
  });
}

beforeEach(() => {
  // window.print is undefined in jsdom — stub it so the PDF handler doesn't throw.
  vi.stubGlobal("print", vi.fn());
});
afterEach(() => {
  resetStore();
  vi.unstubAllGlobals();
});

describe("SpecCompareModal (component)", () => {
  it("renders nothing when the modal is closed", () => {
    useProductFinder.setState({ compareModalOpen: false, compareIds: new Set(["A"]) });
    const { container } = render(<SpecCompareModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when open but no compare products resolve", () => {
    // Open, but compareIds reference ids absent from both PRODUCT_MAP and results.
    useProductFinder.setState({
      compareModalOpen: true,
      compareIds: new Set(["does-not-exist"]),
      results: [],
    });
    const { container } = render(<SpecCompareModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("smoke: renders header, products, cheapest 'Best' badge, lifecycle and crosses", () => {
    const a = prod("A", {
      unitPrice: 30,
      preferred: true,
      verifiedCrossCount: 4,
      lifecycleStatus: "EOL",
      branchStock: [{ branchId: "b1", branchName: "Houston", city: "Houston", state: "TX", quantity: 5 }],
      dcStock: [],
      specs: [spec("Amperage", "15A", true), spec("Voltage", "120V")],
    });
    const b = prod("B", {
      unitPrice: 12, // cheapest → gets the "Best" badge + green highlight
      verifiedCrossCount: 0,
      // lifecycleStatus omitted → defaults to "Active"
      branchStock: [],
      dcStock: [{ dcId: "dc1", dcName: "DC West", location: "Reno", quantity: 9 } as never],
      specs: [spec("Amperage", "20A", true)], // differs from A; B lacks "Voltage"
    });
    seed([a, b]);
    render(<SpecCompareModal />);

    // Dialog + header reflect the count.
    const dialog = screen.getByRole("dialog", { name: "Compare Products" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Compare Products (2 selected)")).toBeInTheDocument();

    // Both products + their SKUs render.
    expect(screen.getByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("Product B")).toBeInTheDocument();
    expect(screen.getByText("SKU: A")).toBeInTheDocument();

    // Preferred badge is shown for A only.
    expect(screen.getByText("Preferred")).toBeInTheDocument();

    // The cheapest unit price (B = $12) earns the "Best" tag.
    expect(screen.getByText("Best")).toBeInTheDocument();

    // Lifecycle row renders both statuses (A=EOL non-Active, B defaults to Active).
    expect(screen.getByText("EOL")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();

    // Documented crosses row renders both counts.
    expect(screen.getByText("Branch / DC Stock")).toBeInTheDocument();
    expect(screen.getByText("Documented crosses")).toBeInTheDocument();

    // The "Voltage" spec is present on A but missing on B → a "Not available" cell.
    expect(screen.getByLabelText("Not available")).toBeInTheDocument();

    // Non-negotiable spec carries its lock marker.
    expect(screen.getByLabelText("Non-negotiable spec")).toBeInTheDocument();
  });

  it("'show differences only' hides shared rows and reports the shared count", () => {
    // Both products share Voltage but differ on Amperage.
    const a = prod("A", { unitPrice: 10, specs: [spec("Amperage", "15A"), spec("Voltage", "120V")] });
    const b = prod("B", { unitPrice: 20, specs: [spec("Amperage", "20A"), spec("Voltage", "120V")] });
    seed([a, b]);
    render(<SpecCompareModal />);

    // The shared-spec hint is visible before collapsing.
    expect(screen.getByText(/shared spec/)).toBeInTheDocument();
    // Voltage (shared) is visible initially.
    expect(screen.getByText("Voltage")).toBeInTheDocument();

    const toggle = screen.getByRole("checkbox");
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();

    // After collapsing to differences only, the shared Voltage row is gone but the
    // differing Amperage row remains.
    expect(screen.queryByText("Voltage")).not.toBeInTheDocument();
    expect(screen.getByText("Amperage")).toBeInTheDocument();
    expect(screen.getByText(/hidden/)).toBeInTheDocument();
  });

  it("shows the empty-state row when every listed spec is shared and collapsed", () => {
    // Identical specs → all rows shared → collapsing leaves zero visible spec rows.
    const shared = [spec("Amperage", "15A"), spec("Voltage", "120V")];
    const a = prod("A", { specs: shared });
    const b = prod("B", { specs: shared });
    seed([a, b]);
    render(<SpecCompareModal />);

    fireEvent.click(screen.getByRole("checkbox"));
    expect(
      screen.getByText("These products share all listed specifications."),
    ).toBeInTheDocument();
  });

  it("renders the print header with rep + branch when a user is signed in", () => {
    const a = prod("A");
    seed([a], { user });
    render(<SpecCompareModal />);
    expect(screen.getByText("Product Comparison")).toBeInTheDocument();
    expect(screen.getByText(/Sarah Chen/)).toBeInTheDocument();
    expect(screen.getByText(/Houston Downtown/)).toBeInTheDocument();
  });

  it("adds a single product to the cart from its column 'Add to Basket'", () => {
    const a = prod("A");
    const b = prod("B");
    seed([a, b]);
    render(<SpecCompareModal />);

    const addButtons = screen.getAllByRole("button", { name: "Add to Basket" });
    expect(addButtons).toHaveLength(2);
    fireEvent.click(addButtons[0]);

    const cart = useProductFinder.getState().cart;
    expect(Object.keys(cart)).toEqual(["A"]);
    expect(cart["A"].qty).toBe(1);
  });

  it("'Add All to Basket' adds every compared product", () => {
    seed([prod("A"), prod("B"), prod("C")]);
    render(<SpecCompareModal />);

    fireEvent.click(screen.getByRole("button", { name: "Add All to Basket" }));
    const cart = useProductFinder.getState().cart;
    expect(Object.keys(cart).sort()).toEqual(["A", "B", "C"]);
  });

  it("'Download Comparison (PDF)' calls window.print", () => {
    seed([prod("A")]);
    render(<SpecCompareModal />);
    fireEvent.click(screen.getByRole("button", { name: "Download Comparison (PDF)" }));
    const printMock = window.print as unknown as ReturnType<typeof vi.fn>;
    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it("'Clear Compare' empties the compare set and closes the modal", () => {
    seed([prod("A"), prod("B")]);
    render(<SpecCompareModal />);
    fireEvent.click(screen.getByRole("button", { name: "Clear Compare" }));
    expect(useProductFinder.getState().compareIds.size).toBe(0);
    expect(useProductFinder.getState().compareModalOpen).toBe(false);
  });

  it("the close button closes the modal", () => {
    seed([prod("A")]);
    render(<SpecCompareModal />);
    fireEvent.click(screen.getByRole("button", { name: "Close compare modal" }));
    expect(useProductFinder.getState().compareModalOpen).toBe(false);
  });

  it("clicking the overlay (but not the sheet) closes the modal", () => {
    seed([prod("A")]);
    render(<SpecCompareModal />);
    const dialog = screen.getByRole("dialog", { name: "Compare Products" });

    // Clicking inside the sheet must NOT close it.
    const sheet = within(dialog).getByText("Product A");
    fireEvent.click(sheet);
    expect(useProductFinder.getState().compareModalOpen).toBe(true);

    // Clicking the overlay itself (event target === currentTarget) closes it.
    fireEvent.click(dialog);
    expect(useProductFinder.getState().compareModalOpen).toBe(false);
  });

  it("caps the comparison at 4 products even when more are selected", () => {
    const many = ["A", "B", "C", "D", "E", "F"].map((id) => prod(id));
    seed(many);
    render(<SpecCompareModal />);
    // Header reports the sliced count, and only 4 "Add to Basket" columns render.
    expect(screen.getByText("Compare Products (4 selected)")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add to Basket" })).toHaveLength(4);
  });
});
