import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ProductFinderShell } from "@/features/product-finder/ProductFinderShell";
import { useProductFinder } from "@/lib/product-finder-store";
import { getCustomerProvider } from "@/lib/integration/index";
import { getBrand } from "@/lib/brand";
import type { AuthUser, CatalogProduct } from "@/features/product-finder/types";

// CommandPalette + TourOverlay (rendered as overlays by the Shell) use
// next/navigation's useRouter — mock it so the tree renders under jsdom.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/product-finder",
  useSearchParams: () => new URLSearchParams(),
}));

function prod(id: string): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 20, uom: "ea", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

const salesUser: AuthUser = {
  name: "Sarah Chen",
  email: "sales@meridiansupply.com",
  role: "sales",
  branch: "Houston Downtown",
  branchId: "B-HOU-01",
};

const managerUser: AuthUser = {
  name: "Marcus Rivera",
  email: "manager@meridiansupply.com",
  role: "manager",
  branch: "Dallas North",
  branchId: "B-DAL-01",
};

// A clean slice of the store, so each test starts from the same baseline regardless
// of what the previous test left behind (the store is a module-level singleton).
function resetStore() {
  useProductFinder.setState({
    user: null,
    activeCustomerId: null,
    orders: [],
    cart: {},
    compareIds: new Set(),
    brandId: "meridian",
    customers: getCustomerProvider().list(),
    cartOpen: false,
    helpOpen: false,
    paletteOpen: false,
  });
}

describe("ProductFinderShell (component render)", () => {
  beforeEach(() => {
    // Any overlay child (e.g. PushSubscribeButton) that probes the network must
    // never hit a real fetch under jsdom.
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({}) })));
    resetStore();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    resetStore();
  });

  it("renders the header chrome and the children without throwing (smoke)", () => {
    render(
      <ProductFinderShell>
        <div data-testid="page-body">Results go here</div>
      </ProductFinderShell>,
    );
    // Children are projected into <main>.
    expect(screen.getByTestId("page-body")).toHaveTextContent("Results go here");
    // Header title + the default-brand logo mark.
    expect(screen.getByText("AI Product Recommender")).toBeInTheDocument();
    expect(screen.getByText(getBrand("meridian").logoMark)).toBeInTheDocument();
    // Core action buttons are always present.
    expect(screen.getByRole("button", { name: "Open help panel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open command palette" })).toBeInTheDocument();
  });

  it("shows the white-label brand mark for the active brand profile", () => {
    useProductFinder.setState({ brandId: "wesco" });
    render(
      <ProductFinderShell>
        <div />
      </ProductFinderShell>,
    );
    expect(screen.getByText(getBrand("wesco").logoMark)).toBeInTheDocument();
    expect(screen.queryByText(getBrand("meridian").logoMark)).not.toBeInTheDocument();
  });

  it("logged-out: hides user identity, Insights link, and Sign out", () => {
    render(
      <ProductFinderShell>
        <div />
      </ProductFinderShell>,
    );
    expect(screen.queryByText(salesUser.name)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Insights/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
  });

  it("sales role: shows the user but NOT the manager-only Insights link", () => {
    useProductFinder.setState({ user: salesUser });
    render(
      <ProductFinderShell>
        <div />
      </ProductFinderShell>,
    );
    expect(screen.getByText(salesUser.name)).toBeInTheDocument();
    expect(screen.getByText(salesUser.branch)).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Insights/ })).not.toBeInTheDocument();
  });

  it("manager role: reveals the gated Insights dashboard link", () => {
    useProductFinder.setState({ user: managerUser });
    render(
      <ProductFinderShell>
        <div />
      </ProductFinderShell>,
    );
    const link = screen.getByRole("link", { name: /Insights/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/product-finder/dashboard");
  });

  it("logout button invokes the store's logout action", () => {
    const logout = vi.fn();
    useProductFinder.setState({ user: salesUser, logout });
    render(
      <ProductFinderShell>
        <div />
      </ProductFinderShell>,
    );
    fireEvent.click(screen.getByText("Sign out"));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("cart FAB: empty basket shows no count badge, and opening the cart calls setCartOpen", () => {
    render(
      <ProductFinderShell>
        <div />
      </ProductFinderShell>,
    );
    const cartBtn = screen.getByRole("button", { name: /Open basket — 0 items/ });
    expect(cartBtn).toBeInTheDocument();
    fireEvent.click(cartBtn);
    expect(useProductFinder.getState().cartOpen).toBe(true);
  });

  it("cart FAB: populated basket renders the aggregated quantity badge", () => {
    useProductFinder.setState({
      cart: {
        A: { product: prod("A"), qty: 3 },
        B: { product: prod("B"), qty: 1 },
      },
    });
    render(
      <ProductFinderShell>
        <div />
      </ProductFinderShell>,
    );
    // 3 + 1 = 4 total items.
    const cartBtn = screen.getByRole("button", { name: /Open basket — 4 items/ });
    expect(within(cartBtn).getByText("4")).toBeInTheDocument();
  });

  it("cart FAB: a basket over 99 items clamps the badge to 99+", () => {
    useProductFinder.setState({
      cart: { A: { product: prod("A"), qty: 150 } },
    });
    render(
      <ProductFinderShell>
        <div />
      </ProductFinderShell>,
    );
    const cartBtn = screen.getByRole("button", { name: /Open basket — 150 items/ });
    expect(within(cartBtn).getByText("99+")).toBeInTheDocument();
  });

  it("help + command-palette buttons drive their store actions", () => {
    render(
      <ProductFinderShell>
        <div />
      </ProductFinderShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open help panel" }));
    expect(useProductFinder.getState().helpOpen).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Open command palette" }));
    expect(useProductFinder.getState().paletteOpen).toBe(true);
  });

  it("customer selector: lists every account and selecting one updates the active customer", () => {
    const customers = useProductFinder.getState().customers;
    expect(customers.length).toBeGreaterThan(0);
    render(
      <ProductFinderShell>
        <div />
      </ProductFinderShell>,
    );
    const select = screen.getByLabelText("Quoting for:") as HTMLSelectElement;
    // Placeholder + one option per customer.
    expect(within(select).getAllByRole("option")).toHaveLength(customers.length + 1);
    fireEvent.change(select, { target: { value: customers[0].id } });
    expect(useProductFinder.getState().activeCustomerId).toBe(customers[0].id);
  });

  it("customer health: an active account with a recent order surfaces its cadence chip", () => {
    const customers = useProductFinder.getState().customers;
    const target = customers[0];
    const now = Date.now();
    useProductFinder.setState({
      activeCustomerId: target.id,
      orders: [
        {
          id: "o-recent",
          placedAt: now - 2 * 86_400_000, // 2 days ago → "Healthy"
          lines: [{ product: prod("A"), qty: 1 }],
          total: 20,
          customerId: target.id,
          customerName: target.name,
        },
      ],
    });
    render(
      <ProductFinderShell>
        <div />
      </ProductFinderShell>,
    );
    // The health chip (HEALTH_LABEL.healthy = "Healthy") renders only when now is
    // resolved post-mount AND an active customer is set — exercising the useMemo
    // branch that returns a non-null activeHealth.
    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });

  it("reserves room for the compare tray only when the compare set is non-empty", () => {
    const { container, rerender } = render(
      <ProductFinderShell>
        <div />
      </ProductFinderShell>,
    );
    const mainEmpty = container.querySelector("main");
    expect(mainEmpty?.className).not.toContain("pb-16");

    useProductFinder.setState({ compareIds: new Set(["A", "B"]) });
    rerender(
      <ProductFinderShell>
        <div />
      </ProductFinderShell>,
    );
    const mainFull = container.querySelector("main");
    expect(mainFull?.className).toContain("pb-16");
  });
});
