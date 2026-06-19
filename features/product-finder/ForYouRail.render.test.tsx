import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ForYouRail } from "@/features/product-finder/ForYouRail";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct, ProductSnapshot } from "@/features/product-finder/types";
import type { Order } from "@/lib/product-finder-store";

// ForYouRail reads no router, but its favorite/cross-sell handlers go through
// fetch (apiGetProduct / apiGoesWith). Every test stubs fetch; the default stub
// returns an empty "goes with" list so the cross-sell effect is inert unless a
// test opts into a richer response.
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

function snap(id: string, over: Partial<ProductSnapshot> = {}): ProductSnapshot {
  return { id, name: `Fav ${id}`, brand: "Acme", unitPrice: 12.5, imageIcon: "f", category: "electrical", ...over };
}

const NOW = 1_700_000_000_000;
const DAY = 86_400_000;

function order(id: string, lines: { product: CatalogProduct; qty: number }[], over: Partial<Order> = {}): Order {
  return {
    id,
    placedAt: NOW - 5 * DAY,
    lines,
    total: lines.reduce((t, l) => t + l.product.unitPrice * l.qty, 0),
    customerId: null,
    customerName: null,
    ...over,
  };
}

// Reset the store to the rail-relevant fields between tests so seeds don't leak.
function resetStore() {
  useProductFinder.setState({
    orders: [],
    activeCustomerId: null,
    cart: {},
    favorites: [],
    favoriteSnapshots: {},
    detailModalProduct: null,
    user: null,
  });
}

describe("ForYouRail (component)", () => {
  beforeEach(() => {
    // Pin the clock the component reads (Date.now in its mount effect) WITHOUT
    // faking the timer queue — RTL's findBy*/waitFor polling needs real timers.
    vi.spyOn(Date, "now").mockReturnValue(NOW);
    // Default fetch: empty goeswith + a resolvable product detail for favorites.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (typeof url === "string" && url.includes("/goeswith")) {
          return { ok: true, json: async () => ({ items: [] }) };
        }
        // apiGetProduct → /api/products/<id>
        return { ok: true, json: async () => ({ product: prod("FAVDETAIL") }) };
      }),
    );
    resetStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    resetStore();
  });

  it("renders nothing when there are no suggestions and no favorites", () => {
    const { container } = render(<ForYouRail />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the reorder section with a populated order history (smoke)", async () => {
    useProductFinder.setState({ orders: [order("o1", [{ product: prod("A"), qty: 3 }])] });
    render(<ForYouRail />);
    // Header is the load-bearing key output of the rail.
    expect(await screen.findByText("For you")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Personalized recommendations" })).toBeInTheDocument();
    expect(screen.getByText("Time to reorder")).toBeInTheDocument();
    expect(screen.getByText("Product A")).toBeInTheDocument();
  });

  it("flags an old order as 'due' and shows the relative-age label", async () => {
    // Ordered 40 days ago → past the 30-day reorder threshold.
    useProductFinder.setState({
      orders: [order("o1", [{ product: prod("A"), qty: 2 }], { placedAt: NOW - 40 * DAY })],
    });
    render(<ForYouRail />);
    expect(await screen.findByText("due")).toBeInTheDocument();
    expect(screen.getByText(/40 days ago/)).toBeInTheDocument();
  });

  it("adds the suggested quantity to the cart when 'Add' is clicked", async () => {
    useProductFinder.setState({ orders: [order("o1", [{ product: prod("A"), qty: 4 }])] });
    render(<ForYouRail />);
    const addBtn = await screen.findByRole("button", { name: "Add 4 × Product A to basket" });
    fireEvent.click(addBtn);
    const cart = useProductFinder.getState().cart;
    expect(cart["A"]?.qty).toBe(4);
  });

  it("opens the product detail modal when a reorder card title is clicked", async () => {
    useProductFinder.setState({ orders: [order("o1", [{ product: prod("A"), qty: 1 }])] });
    render(<ForYouRail />);
    const viewBtn = await screen.findByRole("button", { name: "View Product A" });
    fireEvent.click(viewBtn);
    expect(useProductFinder.getState().detailModalProduct?.id).toBe("A");
  });

  it("scopes suggestions to the active customer's history", async () => {
    useProductFinder.setState({
      activeCustomerId: "cust-1",
      orders: [
        order("o1", [{ product: prod("A") , qty: 1 }], { customerId: "cust-1", customerName: "Northwind" }),
        order("o2", [{ product: prod("Z"), qty: 1 }], { customerId: "cust-2", customerName: "Other" }),
      ],
    });
    render(<ForYouRail />);
    expect(await screen.findByText("Product A")).toBeInTheDocument();
    // Product Z belongs to a different customer and must be filtered out.
    expect(screen.queryByText("Product Z")).not.toBeInTheDocument();
    // The customer chip from the most-recent order is rendered.
    expect(screen.getByText(/Northwind/)).toBeInTheDocument();
  });

  it("renders the favorites section and excludes in-cart favorites", async () => {
    useProductFinder.setState({
      favorites: ["F1", "F2"],
      favoriteSnapshots: { F1: snap("F1"), F2: snap("F2") },
      cart: { F2: { product: prod("F2"), qty: 1 } },
    });
    render(<ForYouRail />);
    expect(await screen.findByText("From your favorites")).toBeInTheDocument();
    expect(screen.getByText("Fav F1")).toBeInTheDocument();
    // F2 is in the cart → excluded by favoritePicks.
    expect(screen.queryByText("Fav F2")).not.toBeInTheDocument();
  });

  it("resolves a favorite to a product and adds it to the cart via fetch", async () => {
    useProductFinder.setState({ favorites: ["F1"], favoriteSnapshots: { F1: snap("F1") } });
    render(<ForYouRail />);
    const addBtn = await screen.findByRole("button", { name: "Add Fav F1 to basket" });
    fireEvent.click(addBtn);
    // The handler awaits apiGetProduct (fetch) then addToCart; flush microtasks.
    await waitFor(() => {
      expect(useProductFinder.getState().cart["FAVDETAIL"]?.qty).toBe(1);
    });
  });

  it("opens the detail modal for a favorite via fetch when its title is clicked", async () => {
    useProductFinder.setState({ favorites: ["F1"], favoriteSnapshots: { F1: snap("F1") } });
    render(<ForYouRail />);
    const viewBtn = await screen.findByRole("button", { name: "View Fav F1" });
    fireEvent.click(viewBtn);
    await waitFor(() => {
      expect(useProductFinder.getState().detailModalProduct?.id).toBe("FAVDETAIL");
    });
  });

  it("renders the data-driven 'Frequently ordered together' section from co-occurrence", async () => {
    // The "also bought" branch only fires when a co-occurring product is NOT
    // itself among the top-4 reorder suggestions. Construct: A is the strongest
    // (due + most-frequent) seed; P1-P3 are due fillers that take suggestion
    // slots 1-3; C co-occurs with A on a single RECENT (not-due) order so it
    // ranks below the four due products and is cut from suggestions — leaving it
    // free to surface under "Frequently ordered together".
    // Every order is OLD (past the 30-day threshold) so the due flag is uniform
    // and ranking falls through to frequency: A (3×) > P1/P2/P3 (2×) > C (1×).
    // C is cut from the top-4 suggestions but still co-occurs with the A seed.
    const old1 = NOW - 45 * DAY;
    const old2 = NOW - 50 * DAY;
    const old3 = NOW - 55 * DAY;
    useProductFinder.setState({
      orders: [
        // A ordered 3× (most frequent); its co-order with C is also old.
        order("a1", [{ product: prod("A"), qty: 1 }], { placedAt: old1 }),
        order("a2", [{ product: prod("A"), qty: 1 }], { placedAt: old2 }),
        order("a3", [{ product: prod("A"), qty: 1 }, { product: prod("C"), qty: 1 }], { placedAt: old3 }),
        // Three fillers (ordered 2× each) to occupy suggestion slots 1-3 above C.
        order("p1a", [{ product: prod("P1") }, { product: prod("P2") }, { product: prod("P3") }].map((l) => ({ ...l, qty: 1 })), { placedAt: old1 }),
        order("p1b", [{ product: prod("P1") }, { product: prod("P2") }, { product: prod("P3") }].map((l) => ({ ...l, qty: 1 })), { placedAt: old2 }),
      ],
    });
    render(<ForYouRail />);
    expect(await screen.findByText("Frequently ordered together")).toBeInTheDocument();
    expect(screen.getByText("Product C")).toBeInTheDocument();
    expect(screen.getByText(/ordered together 1×/)).toBeInTheDocument();
  });

  it("falls back to curated 'Goes well with your orders' when there is no co-occurrence", async () => {
    // Single-line orders → no co-occurrence → alsoBought empty → goesWith fallback.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (typeof url === "string" && url.includes("/goeswith")) {
          return { ok: true, json: async () => ({ items: [prod("GW1", { name: "Goes With 1" })] }) };
        }
        return { ok: true, json: async () => ({ product: prod("FAVDETAIL") }) };
      }),
    );
    useProductFinder.setState({ orders: [order("o1", [{ product: prod("A"), qty: 1 }])] });
    render(<ForYouRail />);
    expect(await screen.findByText("Goes well with your orders")).toBeInTheDocument();
    expect(screen.getByText("Goes With 1")).toBeInTheDocument();
    // Adding the cross-sell product seeds the cart.
    fireEvent.click(screen.getByRole("button", { name: "Add Goes With 1 to basket" }));
    expect(useProductFinder.getState().cart["GW1"]?.qty).toBe(1);
  });

  it("swallows a failed favorite resolve without throwing (fetch !ok)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (typeof url === "string" && url.includes("/goeswith")) {
          return { ok: true, json: async () => ({ items: [] }) };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );
    useProductFinder.setState({ favorites: ["F1"], favoriteSnapshots: { F1: snap("F1") } });
    render(<ForYouRail />);
    const addBtn = await screen.findByRole("button", { name: "Add Fav F1 to basket" });
    fireEvent.click(addBtn);
    // Give the rejected promise a tick; nothing should be added and no crash.
    await Promise.resolve();
    expect(Object.keys(useProductFinder.getState().cart)).toHaveLength(0);
  });
});
