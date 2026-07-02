import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { CatalogProduct } from "@/features/product-finder/types";
import type { CompanionItem, CompanionsResult } from "@/lib/product-finder-api";

// The panel fetches companions over HTTP; mock that seam so the render test is
// deterministic and offline. `vi.hoisted` defines the spy before the hoisted
// vi.mock factory references it (otherwise the factory runs first → ReferenceError).
const { apiCompanionsWithMeta } = vi.hoisted(() => ({
  apiCompanionsWithMeta: vi.fn<(id: string, opts?: unknown) => Promise<CompanionsResult>>(),
}));
vi.mock("@/lib/product-finder-api", () => ({ apiCompanionsWithMeta }));

/** Wrap a companion list in the meta envelope the panel now consumes. */
function result(items: CompanionItem[], demo = false): CompanionsResult {
  return { items, demo, behavioral: items.some((c) => c.sources.includes("market-basket")) };
}

import { CompanionsPanel } from "@/features/product-finder/CompanionsPanel";
import { useProductFinder } from "@/lib/product-finder-store";

function product(id: string, name: string, relation: CompanionItem["relation"]): CompanionItem {
  const p: CatalogProduct = {
    id,
    sku: id,
    name,
    brand: "Acme",
    category: "electrical",
    subcategory: "Wall Plates & Covers",
    description: "",
    unitPrice: 4.25,
    uom: "EA",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "x",
  };
  return {
    relation,
    attachScore: relation === "required" ? 82 : 47,
    reasons: relation === "required" ? ["Required: device needs a wall plate"] : ["Often attached"],
    sources: ["spec-rule"],
    product: p,
  };
}

const SEED: CatalogProduct = {
  id: "SW-1",
  sku: "SW-1",
  name: "Toggle Switch",
  brand: "Acme",
  category: "electrical",
  subcategory: "Switches",
  description: "",
  unitPrice: 3.1,
  uom: "EA",
  specs: [],
  preferred: false,
  branchStock: [],
  dcStock: [],
  externalSources: [],
  imageIcon: "s",
};

describe("CompanionsPanel (component)", () => {
  beforeEach(() => {
    useProductFinder.setState({ cart: {} });
    apiCompanionsWithMeta.mockReset();
  });
  afterEach(() => useProductFinder.setState({ cart: {} }));

  it("renders nothing while loading and when there are no companions", async () => {
    apiCompanionsWithMeta.mockResolvedValue(result([]));
    const { container } = render(<CompanionsPanel product={SEED} />);
    // Empty result → the whole section stays out of the DOM.
    await waitFor(() => expect(apiCompanionsWithMeta).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("splits required vs recommended and shows the attach score", async () => {
    apiCompanionsWithMeta.mockResolvedValue(result([
      product("WP-1", "1-Gang Wall Plate", "required"),
      product("WP-2", "2-Gang Wall Plate", "required"),
      product("LB-1", "Cable Label", "recommended"),
    ]));
    render(<CompanionsPanel product={SEED} />);

    expect(await screen.findByText("Cross-sell companions")).toBeInTheDocument();
    expect(screen.getByText("Complete the assembly")).toBeInTheDocument();
    expect(screen.getByText("Frequently attached")).toBeInTheDocument();
    expect(screen.getByText("1-Gang Wall Plate")).toBeInTheDocument();
    expect(screen.getByText("Cable Label")).toBeInTheDocument();
    // Attach score for a required row is rendered.
    expect(screen.getAllByText("82").length).toBeGreaterThan(0);
  });

  it("'Add all required' adds every required companion to the cart", async () => {
    apiCompanionsWithMeta.mockResolvedValue(result([
      product("WP-1", "1-Gang Wall Plate", "required"),
      product("WP-2", "2-Gang Wall Plate", "required"),
      product("LB-1", "Cable Label", "recommended"),
    ]));
    render(<CompanionsPanel product={SEED} />);

    const btn = await screen.findByRole("button", { name: /Add all required \(2\)/ });
    fireEvent.click(btn);

    const cart = useProductFinder.getState().cart;
    expect(cart["WP-1"]).toBeTruthy();
    expect(cart["WP-2"]).toBeTruthy();
    // Recommended item is NOT swept in by the required CTA.
    expect(cart["LB-1"]).toBeFalsy();
  });

  it("a single + button adds just that companion", async () => {
    apiCompanionsWithMeta.mockResolvedValue(result([product("WP-1", "1-Gang Wall Plate", "required")]));
    render(<CompanionsPanel product={SEED} />);

    const addBtn = await screen.findByRole("button", { name: "Add 1-Gang Wall Plate to basket" });
    fireEvent.click(addBtn);
    expect(useProductFinder.getState().cart["WP-1"].qty).toBe(1);

    // No 2nd required item → the bulk CTA is hidden.
    expect(screen.queryByRole("button", { name: /Add all required/ })).not.toBeInTheDocument();
  });

  it("shows the B10 'demo co-purchase data' label only when the lift is from demo baskets", async () => {
    const items = [product("WP-1", "1-Gang Wall Plate", "required")];
    // demo:false → no label.
    apiCompanionsWithMeta.mockResolvedValueOnce(result(items, false));
    const { unmount } = render(<CompanionsPanel product={SEED} />);
    await screen.findByText("Cross-sell companions");
    expect(screen.queryByText(/demo co-purchase data/)).not.toBeInTheDocument();
    unmount();
    // demo:true → the label is shown.
    apiCompanionsWithMeta.mockResolvedValueOnce(result(items, true));
    render(<CompanionsPanel product={SEED} />);
    expect(await screen.findByText(/demo co-purchase data/)).toBeInTheDocument();
  });
});
