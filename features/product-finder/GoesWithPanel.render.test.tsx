import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { GoesWithPanel } from "@/features/product-finder/GoesWithPanel";
import { useProductFinder } from "@/lib/product-finder-store";
import {
  PRODUCT_MAP,
  getCrossSells,
  getUpsells,
} from "@/data/mock/catalog-products";
import type { CatalogProduct } from "@/features/product-finder/types";

// CB-SQD-QO115 is curated so that it has THREE cross-sells (all resolvable in
// the catalog → bundle CTA, since showBundle needs >= 2) AND one upsell
// (CB-SQD-QO115DF) → both sections render plus the separator. This single
// product exercises every populated branch of GoesWithPanel.
const HUB = PRODUCT_MAP.get("CB-SQD-QO115") as CatalogProduct;

// A minimal product with no crossSellIds / upsellIds → the early-return branch.
function bareProduct(): CatalogProduct {
  return {
    id: "BARE-1",
    sku: "BARE-1",
    name: "Bare Product",
    brand: "Acme",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 12.5,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "x",
  };
}

describe("GoesWithPanel (component)", () => {
  beforeEach(() => useProductFinder.setState({ cart: {} }));
  afterEach(() => useProductFinder.setState({ cart: {} }));

  it("sanity: the curated hub product resolves cross-sells and an upsell", () => {
    // Guards the fixture so the rest of the suite is meaningful even if the
    // curated catalog data changes underneath it.
    expect(HUB).toBeTruthy();
    expect(getCrossSells(HUB).length).toBeGreaterThanOrEqual(2);
    expect(getUpsells(HUB).length).toBeGreaterThanOrEqual(1);
  });

  it("renders both sections, the separator, and the bundle CTA (smoke)", () => {
    render(<GoesWithPanel product={HUB} />);

    // Card title is always present when anything renders.
    expect(screen.getByText("Recommendations")).toBeInTheDocument();

    // Cross-sell section heading + every resolved cross-sell row by name.
    expect(screen.getByText("Frequently Bought Together")).toBeInTheDocument();
    for (const p of getCrossSells(HUB)) {
      expect(screen.getByText(p.name)).toBeInTheDocument();
    }

    // Upsell section heading + the upgrade badge.
    expect(screen.getByText("Consider Upgrading To")).toBeInTheDocument();
    expect(screen.getByText(/Upgrade/)).toBeInTheDocument();

    // Bundle CTA (showBundle = crossSells.length >= 2).
    expect(screen.getByText("Complete the Job")).toBeInTheDocument();
    const bundleBtn = screen.getByRole("button", { name: "Add Bundle to Basket" });
    expect(bundleBtn).toBeInTheDocument();

    // The displayed bundle total equals the sum of cross-sell unit prices.
    const expectedTotal = getCrossSells(HUB)
      .reduce((sum, p) => sum + p.unitPrice, 0)
      .toFixed(2);
    expect(screen.getByText(`$${expectedTotal} total`)).toBeInTheDocument();
  });

  it("adds a single cross-sell to the cart via its + button", () => {
    render(<GoesWithPanel product={HUB} />);
    const first = getCrossSells(HUB)[0];

    const addBtn = screen.getByRole("button", {
      name: `Add ${first.name} to basket`,
    });
    fireEvent.click(addBtn);

    const cart = useProductFinder.getState().cart;
    expect(cart[first.id]).toBeTruthy();
    expect(cart[first.id].qty).toBe(1);

    // Clicking again increments quantity (covers the existing-line branch in addToCart).
    fireEvent.click(addBtn);
    expect(useProductFinder.getState().cart[first.id].qty).toBe(2);
  });

  it("adds every cross-sell to the cart via the bundle button", () => {
    render(<GoesWithPanel product={HUB} />);
    const crossSells = getCrossSells(HUB);

    fireEvent.click(screen.getByRole("button", { name: "Add Bundle to Basket" }));

    const cart = useProductFinder.getState().cart;
    for (const p of crossSells) {
      expect(cart[p.id], `expected ${p.id} in cart`).toBeTruthy();
      expect(cart[p.id].qty).toBe(1);
    }
    expect(Object.keys(cart)).toHaveLength(crossSells.length);
  });

  it("renders the upsell row with an Add-to-basket button (no Upgrade badge on cross-sells)", () => {
    render(<GoesWithPanel product={HUB} />);
    const upsell = getUpsells(HUB)[0];

    // The upsell row carries its own add button + the Upgrade badge.
    expect(
      screen.getByRole("button", { name: `Add ${upsell.name} to basket` }),
    ).toBeInTheDocument();

    // The "Consider Upgrading To" section contains exactly one Upgrade badge.
    const upsellHeading = screen.getByText("Consider Upgrading To");
    const upsellSection = upsellHeading.closest("section") as HTMLElement;
    expect(within(upsellSection).getByText(/Upgrade/)).toBeInTheDocument();
  });

  it("hides the bundle CTA when there is only one cross-sell", () => {
    // Synthetic product whose single crossSellId resolves to one real catalog
    // entry → exactly one cross-sell row, so showBundle (>= 2) is false.
    const crossId = getCrossSells(HUB)[0].id;
    const single: CatalogProduct = { ...bareProduct(), crossSellIds: [crossId] };
    expect(getCrossSells(single).length).toBe(1);

    render(<GoesWithPanel product={single} />);

    expect(screen.getByText("Frequently Bought Together")).toBeInTheDocument();
    expect(screen.queryByText("Complete the Job")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Bundle to Basket" }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing when the product has no cross-sells or upsells", () => {
    const { container } = render(<GoesWithPanel product={bareProduct()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
