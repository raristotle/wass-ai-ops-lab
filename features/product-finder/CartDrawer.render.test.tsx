import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { CartDrawer } from "@/features/product-finder/CartDrawer";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct, AuthUser } from "@/features/product-finder/types";
import type { SavedQuote } from "@/lib/product-finder-quotes";
import type { Order } from "@/lib/product-finder-store";

// Several drawer leaves (DepositButton / EsignButton / OrderTracking via the
// quote + order sections) read next/navigation indirectly through the app; mock
// it so nothing throws under jsdom, mirroring accessibility.test.tsx.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function prod(id: string): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 20, uom: "ea", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

const MANAGER: AuthUser = {
  name: "Dana Manager", email: "dana@meridian.test", role: "manager",
  branch: "Pittsburgh", branchId: "br-pgh",
};

function quote(overrides: Partial<SavedQuote> = {}): SavedQuote {
  return {
    id: "quote-1",
    number: "Q-20260101-0001",
    customer: "Northside Electric",
    project: "Plant retrofit",
    lines: [{ product: prod("A"), qty: 2, unitPrice: 20 }],
    total: 40,
    status: "sent",
    createdAt: 1_700_000_000_000,
    customerId: null,
    ...overrides,
  };
}

const order: Order = {
  id: "order-1",
  placedAt: 1_700_000_000_000,
  lines: [{ product: prod("A"), qty: 3 }, { product: prod("B"), qty: 1 }],
  total: 80,
  customerId: null,
  customerName: null,
};

// A clean slate for the many drawer-backed store fields between tests.
const RESET = {
  cartOpen: false,
  cart: {},
  priceOverrides: {},
  savedBaskets: [],
  jobTemplates: [],
  quotes: [],
  orders: [],
  activeCustomerId: null,
  user: null,
  revisingQuoteId: null,
  submittalOpen: false,
  cartSection: null,
  cartQuoteStatusFilter: null,
  cartOrderMonthFilter: null,
};

describe("CartDrawer (component render-net)", () => {
  beforeEach(() => {
    // The drawer fetches /api/quote-email on mount and /api/crosses/savings for
    // substitute-&-save; the deposit/e-sign leaves probe their own endpoints.
    // A single benign stub keeps every lane dormant ({configured:false}).
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () => "",
        json: async () => ({ configured: false, candidates: {} }),
      })),
    );
    useProductFinder.setState({ ...RESET });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    useProductFinder.setState({ ...RESET });
  });

  it("renders the empty-basket state with the dialog shell and zero count", () => {
    useProductFinder.setState({ cartOpen: true, cart: {} });
    render(<CartDrawer />);
    expect(screen.getByRole("dialog", { name: "Shopping basket" })).toBeInTheDocument();
    expect(screen.getByText("Your basket is empty")).toBeInTheDocument();
    // Header count says "items" (plural) at zero.
    expect(screen.getByText("Basket (0 items)")).toBeInTheDocument();
    // Empty basket → no footer CTAs (Generate Quote hidden until items exist).
    expect(screen.queryByRole("button", { name: /Generate Quote/ })).not.toBeInTheDocument();
  });

  it("renders a populated basket: line, subtotal, footer CTAs, and singular count", () => {
    useProductFinder.setState({ cartOpen: true, cart: { A: { product: prod("A"), qty: 1 } } });
    render(<CartDrawer />);
    expect(screen.getByText("Basket (1 item)")).toBeInTheDocument();
    // Line surfaces its name + SKU.
    expect(screen.getByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("SKU: A")).toBeInTheDocument();
    // Subtotal + footer actions appear once the basket is non-empty.
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate Quote (PDF)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeInTheDocument();
    // The procurement export buttons render.
    expect(screen.getByRole("button", { name: "cXML PunchOut" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "EDI 850 PO" })).toBeInTheDocument();
  });

  it("steps quantity up and down and removes a line through the store handlers", () => {
    useProductFinder.setState({ cartOpen: true, cart: { A: { product: prod("A"), qty: 2 } } });
    render(<CartDrawer />);
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity of Product A" }));
    expect(useProductFinder.getState().cart.A.qty).toBe(3);
    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity of Product A" }));
    expect(useProductFinder.getState().cart.A.qty).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "Remove Product A from basket" }));
    expect(useProductFinder.getState().cart.A).toBeUndefined();
  });

  it("toggles the Generate Quote sheet open and renders the quote table", () => {
    useProductFinder.setState({ cartOpen: true, cart: { A: { product: prod("A"), qty: 2 } } });
    render(<CartDrawer />);
    const cta = screen.getByRole("button", { name: "Generate Quote (PDF)" });
    fireEvent.click(cta);
    // Sheet opens: a QUOTE heading + a Customer label appear.
    expect(screen.getByRole("heading", { name: "QUOTE" })).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
    // Button flips to the hide label.
    expect(screen.getByRole("button", { name: "Hide Quote" })).toBeInTheDocument();
  });

  it("saves the current basket as a named saved basket via the store", () => {
    useProductFinder.setState({ cartOpen: true, cart: { A: { product: prod("A"), qty: 1 } } });
    render(<CartDrawer />);
    // Save button disabled until a name is typed.
    const region = screen.getByText("Saved Baskets").closest("div") as HTMLElement;
    const nameInput = within(region).getByLabelText("Saved basket name");
    fireEvent.change(nameInput, { target: { value: "Standard kit" } });
    fireEvent.click(within(region).getByRole("button", { name: "Save" }));
    const saved = useProductFinder.getState().savedBaskets;
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe("Standard kit");
  });

  it("shows manager approval controls for a below-margin pending quote (role-gated)", () => {
    useProductFinder.setState({
      cartOpen: true,
      cart: {},
      user: MANAGER,
      quotes: [quote({ status: "sent", approvalStatus: "pending" })],
    });
    render(<CartDrawer />);
    // The saved quote surfaces with its number + the manager-only sign-off row.
    expect(screen.getByText("Q-20260101-0001")).toBeInTheDocument();
    expect(screen.getByText("Below-margin — sign off?")).toBeInTheDocument();
    const approve = screen.getByRole("button", { name: "Approve" });
    fireEvent.click(approve);
    expect(useProductFinder.getState().quotes[0].approvalStatus).toBe("approved");
  });

  it("hides the manager approval controls for a non-manager (sales) user", () => {
    useProductFinder.setState({
      cartOpen: true,
      cart: {},
      user: { ...MANAGER, role: "sales" },
      quotes: [quote({ status: "sent", approvalStatus: "pending" })],
    });
    render(<CartDrawer />);
    expect(screen.getByText("Q-20260101-0001")).toBeInTheDocument();
    expect(screen.queryByText("Below-margin — sign off?")).not.toBeInTheDocument();
  });

  it("renders order history and reorders a past order into the cart", () => {
    useProductFinder.setState({ cartOpen: true, cart: {}, orders: [order] });
    render(<CartDrawer />);
    // Only one order is seeded, so its Reorder button is unambiguous at screen scope.
    const reorder = screen.getByRole("button", { name: /Reorder items from/ });
    fireEvent.click(reorder);
    // Reorder seeds the cart from the order lines (2 distinct products).
    expect(Object.keys(useProductFinder.getState().cart).sort()).toEqual(["A", "B"]);
  });

  it("clears all cart lines via Clear basket", () => {
    useProductFinder.setState({
      cartOpen: true,
      cart: { A: { product: prod("A"), qty: 1 }, B: { product: prod("B"), qty: 2 } },
    });
    render(<CartDrawer />);
    fireEvent.click(screen.getByRole("button", { name: "Clear basket" }));
    expect(Object.keys(useProductFinder.getState().cart)).toHaveLength(0);
  });
});
