import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ProductCard } from "@/features/product-finder/ProductCard";
import { useProductFinder, type ProductFinderState } from "@/lib/product-finder-store";
import type { CatalogProduct, BranchStock, ProductSpec } from "@/features/product-finder/types";

// ProductCard's children don't use next/navigation, but mock it defensively to
// match the project's component-test template (RiskSweepModal etc. need it).
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// ── Test product factory ──────────────────────────────────────────────────────
// A fully-formed in-stock electrical breaker. Override any field per-test.
function prod(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  const branchStock: BranchStock[] = [
    { branchId: "B-HOU-01", branchName: "Houston Downtown", city: "Houston", state: "TX", quantity: 42 },
    { branchId: "B-DAL-01", branchName: "Dallas North", city: "Dallas", state: "TX", quantity: 7 },
  ];
  const specs: ProductSpec[] = [
    { name: "Amperage", value: "15A", isNonNeg: true },
    { name: "Voltage", value: "120-240V", isNonNeg: true },
    { name: "Poles", value: "1-Pole", isNonNeg: true },
    { name: "Interrupting Rating", value: "10kA" },
  ];
  return {
    id: "P-1",
    sku: "QO115",
    name: "Square D QO115 Circuit Breaker",
    brand: "Square D",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "15A single-pole plug-on breaker for QO load centers.",
    unitPrice: 12.5,
    uom: "ea",
    specs,
    preferred: false,
    branchStock,
    dcStock: [{ dcId: "DC-1", dcName: "Central DC", location: "Dallas, TX", quantity: 200 }],
    externalSources: [],
    imageIcon: "breaker",
    ...overrides,
  };
}

// An out-of-stock product (no branch and no DC inventory).
function oosProd(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return prod({ id: "P-OOS", sku: "EOL-1", branchStock: [], dcStock: [], ...overrides });
}

// Reset the store to a clean, deterministic slice before each test.
function seed(partial: Partial<ProductFinderState> = {}) {
  useProductFinder.setState({
    user: null,
    activeCustomerId: null,
    compareIds: new Set<string>(),
    favorites: [],
    watches: [],
    cart: {},
    detailModalProduct: null,
    activeProduct: null,
    ...partial,
  });
}

describe("ProductCard (component)", () => {
  beforeEach(() => {
    // Prefetch-on-hover fires fetch; stub it so handlers never hit the network.
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({}) })));
    seed();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    seed();
  });

  // ── Render smoke ────────────────────────────────────────────────────────────
  it("renders core product output without throwing", () => {
    render(<ProductCard product={prod()} />);
    expect(screen.getByText("Square D QO115 Circuit Breaker")).toBeInTheDocument();
    // SKU appears in both the meta line and the deterministic SVG plate; match the
    // brand/SKU <p> by its full normalized text (it spans several inline nodes).
    const card = screen.getByTestId("product-card-P-1");
    expect(
      within(card).getByText((_content, el) =>
        el?.tagName === "P" && (el.textContent ?? "").includes("SKU: QO115"),
      ),
    ).toBeInTheDocument();
    // In-stock unit price (no active customer → list price, no contract block).
    expect(screen.getByText("$12.50")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to Basket" })).toBeInTheDocument();
    // In stock → no "Notify when available" affordance.
    expect(screen.queryByRole("button", { name: /Notify when available/ })).not.toBeInTheDocument();
  });

  // ── Preferred + verified + lifecycle badges (populated header) ───────────────
  it("shows PREFERRED, verified-cross, and obsolescence badges for a flagged product", () => {
    const p = prod({
      preferred: true,
      dataSource: "verified",
      verifiedCrossCount: 2,
      lifecycleStatus: "EOL",
    });
    render(<ProductCard product={p} />);
    expect(screen.getByText("PREFERRED")).toBeInTheDocument();
    expect(screen.getByText(/2 VERIFIED CROSSES/)).toBeInTheDocument();
    expect(screen.getByText("✓ verified")).toBeInTheDocument();
    // EOL is obsolescent → lifecycle badge uses the short label "EOL".
    expect(screen.getByText(/EOL/)).toBeInTheDocument();
  });

  it("clicking the verified-cross badge opens the detail modal", () => {
    const p = prod({ verifiedCrossCount: 1 });
    render(<ProductCard product={p} />);
    fireEvent.click(screen.getByText(/1 VERIFIED CROSS/));
    expect(useProductFinder.getState().detailModalProduct?.id).toBe(p.id);
  });

  // ── Favorite toggle (handler mutates store) ──────────────────────────────────
  it("toggles favorite state and aria-pressed on click", () => {
    const p = prod();
    render(<ProductCard product={p} />);
    const favBtn = screen.getByRole("button", { name: /Add .* to favorites/ });
    expect(favBtn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(favBtn);
    expect(useProductFinder.getState().favorites).toContain(p.id);
    // After toggling, the label flips to "Remove …".
    expect(screen.getByRole("button", { name: /Remove .* from favorites/ })).toHaveAttribute("aria-pressed", "true");
  });

  // ── Compare toggle + max-reached gate ────────────────────────────────────────
  it("toggles compare selection on click", () => {
    const p = prod();
    render(<ProductCard product={p} />);
    fireEvent.click(screen.getByRole("button", { name: "Compare" }));
    expect(useProductFinder.getState().compareIds.has(p.id)).toBe(true);
    expect(screen.getByRole("button", { name: "✓ Comparing" })).toBeInTheDocument();
  });

  it("disables Compare when 4 other products are already being compared", () => {
    seed({ compareIds: new Set(["a", "b", "c", "d"]) });
    const p = prod({ id: "P-5" });
    render(<ProductCard product={p} />);
    const cmp = screen.getByRole("button", { name: "Compare" });
    expect(cmp).toBeDisabled();
    fireEvent.click(cmp); // handler early-returns; nothing added
    expect(useProductFinder.getState().compareIds.has("P-5")).toBe(false);
  });

  // ── Qty stepper + add-to-cart (handlers) ─────────────────────────────────────
  it("adds the product to the cart with the chosen quantity", () => {
    const p = prod();
    render(<ProductCard product={p} />);
    // Increase qty twice (1 → 3), then add.
    const inc = screen.getByRole("button", { name: "Increase quantity" });
    fireEvent.click(inc);
    fireEvent.click(inc);
    fireEvent.click(screen.getByRole("button", { name: "Add to Basket" }));
    const line = useProductFinder.getState().cart[p.id];
    expect(line).toBeDefined();
    expect(line.qty).toBe(3);
  });

  it("clamps quantity to a minimum of 1 via the decrease button", () => {
    const p = prod();
    render(<ProductCard product={p} />);
    const qtyInput = screen.getByRole("spinbutton", { name: "Quantity" }) as HTMLInputElement;
    expect(qtyInput.value).toBe("1");
    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(qtyInput.value).toBe("1"); // never drops below 1
    // Typing a bogus value falls back to 1 (parseInt(...) || 1).
    fireEvent.change(qtyInput, { target: { value: "abc" } });
    expect(qtyInput.value).toBe("1");
  });

  it("surfaces a volume-tier hint once qty crosses a price break", () => {
    const p = prod();
    render(<ProductCard product={p} />);
    const qtyInput = screen.getByRole("spinbutton", { name: "Quantity" });
    fireEvent.change(qtyInput, { target: { value: "10" } }); // 5% tier
    expect(screen.getByText(/Vol\. \$/)).toBeInTheDocument();
    expect(screen.getByText(/save 5%/)).toBeInTheDocument();
  });

  // ── Collapsible specs ────────────────────────────────────────────────────────
  it("expands the specs section on click and renders the spec rows", () => {
    const p = prod();
    render(<ProductCard product={p} />);
    const toggle = screen.getByRole("button", { name: /Specifications \(4\)/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Amperage:")).toBeInTheDocument();
    expect(screen.getByText("Interrupting Rating:")).toBeInTheDocument();
  });

  // ── Find Alternatives ────────────────────────────────────────────────────────
  it("sets the active product when Find Alternatives is clicked", () => {
    const p = prod();
    render(<ProductCard product={p} />);
    fireEvent.click(screen.getByRole("button", { name: "Find Alternatives" }));
    expect(useProductFinder.getState().activeProduct?.id).toBe(p.id);
  });

  it("opens the detail modal when View Details is clicked", () => {
    const p = prod();
    render(<ProductCard product={p} />);
    fireEvent.click(screen.getByRole("button", { name: "View Details" }));
    expect(useProductFinder.getState().detailModalProduct?.id).toBe(p.id);
  });

  // ── Out-of-stock branches: substitute + lead time + notify-when-available ─────
  it("renders the substitute suggestion and notify control for an out-of-stock product", () => {
    const sub = prod({ id: "P-SUB", name: "Eaton CH115 Breaker", brand: "Eaton", unitPrice: 11 });
    const p = oosProd();
    render(<ProductCard product={p} substitute={sub} />);
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.getByText("Eaton CH115 Breaker")).toBeInTheDocument();
    // Lead-time line shows for OOS items.
    expect(screen.getByText(/Lead time:/)).toBeInTheDocument();

    // Add the in-stock substitute to the cart.
    fireEvent.click(screen.getByRole("button", { name: /Add substitute .* to basket/ }));
    expect(useProductFinder.getState().cart[sub.id]?.product.id).toBe(sub.id);

    // View the substitute → detail modal targets the substitute.
    fireEvent.click(screen.getByRole("button", { name: /View substitute/ }));
    expect(useProductFinder.getState().detailModalProduct?.id).toBe(sub.id);
  });

  it("toggles the notify-when-available watch for an out-of-stock product", () => {
    const p = oosProd();
    render(<ProductCard product={p} />);
    const notify = screen.getByRole("button", { name: /Notify when available/ });
    expect(notify).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(notify);
    expect(useProductFinder.getState().watches.some((w) => w.id === p.id)).toBe(true);
    expect(screen.getByText(/We'll notify you/)).toBeInTheDocument();
  });

  // ── External-sources alert (OOS + external distributors) ─────────────────────
  it("expands the external-distributor alert when the product is OOS with external sources", () => {
    const p = oosProd({
      externalSources: [
        { distributor: "Grainger", url: "https://grainger.com/x", price: 14.99, quantity: 5, status: "in-stock", leadTime: "2 days" },
      ],
    });
    render(<ProductCard product={p} />);
    const alertToggle = screen.getByRole("button", { name: /external distributor/ });
    expect(alertToggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(alertToggle);
    expect(alertToggle).toHaveAttribute("aria-expanded", "true");
    const link = screen.getByRole("link", { name: "Grainger" });
    expect(link).toHaveAttribute("href", "https://grainger.com/x");
    expect(screen.getByText(/\$14\.99 · 5 units/)).toBeInTheDocument();
  });

  // ── Alternative context: interchangeable cross-ref vs similar ─────────────────
  it("shows a CROSS-REF badge for an interchangeable alternative vs its reference", () => {
    const reference = prod({ id: "REF", sku: "QO115" });
    // Same subcategory + identical canonical key specs (Amperage/Voltage/Poles) → interchangeable.
    const candidate = prod({ id: "ALT", sku: "CH115", name: "Eaton CH115", brand: "Eaton" });
    render(<ProductCard product={candidate} referenceProduct={reference} isAlternative />);
    expect(screen.getByText("✓ CROSS-REF")).toBeInTheDocument();
    // The recommendation explanation block renders when a (different) reference is present.
    expect(screen.getByText(candidate.name)).toBeInTheDocument();
  });

  it("shows a SIMILAR badge when an alternative is not a functional equivalent", () => {
    const reference = prod({ id: "REF2", subcategory: "Circuit Breakers" });
    // Different subcategory → not interchangeable → SIMILAR.
    const candidate = prod({ id: "ALT2", subcategory: "Wire & Cable", name: "THHN 12 AWG" });
    render(<ProductCard product={candidate} referenceProduct={reference} isAlternative />);
    expect(screen.getByText("SIMILAR")).toBeInTheDocument();
  });

  // ── Contract pricing via an active customer ──────────────────────────────────
  it("renders the contract-pricing block when an active customer has a contract", () => {
    const customers = useProductFinder.getState().customers;
    // The mock pricing provider applies a category contract discount for at least
    // one demo customer, so the contract block ("List $…") must appear for one.
    let rendered = false;
    for (const c of customers) {
      seed({ activeCustomerId: c.id });
      const { unmount, queryByText } = render(<ProductCard product={prod()} />);
      if (queryByText(/List \$/)) {
        expect(queryByText(/contract pricing — simulated/)).toBeInTheDocument();
        rendered = true;
        unmount();
        break;
      }
      unmount();
    }
    // At least one demo customer must exercise the contract branch.
    expect(rendered).toBe(true);
  });

  // ── Non-preferred default styling still renders the card container ────────────
  it("renders for a non-preferred product without a PREFERRED badge", () => {
    render(<ProductCard product={prod({ preferred: false })} />);
    expect(screen.queryByText("PREFERRED")).not.toBeInTheDocument();
    expect(screen.getByTestId("product-card-P-1")).toBeInTheDocument();
  });

  // ── Scoped assertion within the card container (substitute View vs main View) ─
  it("keeps the main View Details and substitute View as distinct controls", () => {
    const sub = prod({ id: "P-SUB2", name: "Sub Two" });
    render(<ProductCard product={oosProd()} substitute={sub} />);
    const card = screen.getByTestId("product-card-P-OOS");
    expect(within(card).getByRole("button", { name: "View Details" })).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: /View substitute/ })).toBeInTheDocument();
  });
});
