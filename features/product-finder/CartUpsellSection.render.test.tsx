import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { CatalogProduct } from "@/features/product-finder/types";
import type { CartUpsell } from "@/lib/product-finder-api";

const { apiCartUpsell } = vi.hoisted(() => ({
  apiCartUpsell: vi.fn<() => Promise<CartUpsell>>(),
}));
vi.mock("@/lib/product-finder-api", () => ({ apiCartUpsell }));

import { CartUpsellSection } from "@/features/product-finder/CartUpsellSection";
import { useProductFinder } from "@/lib/product-finder-store";

function p(id: string, subcategory: string, unitPrice: number, preferred = false, uom = "EA"): CatalogProduct {
  return {
    id, sku: id, name: `Name ${id}`, brand: preferred ? "Meridian" : "Commodity", category: "electrical", subcategory,
    description: "", unitPrice, uom, specs: [], preferred,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

describe("CartUpsellSection (component)", () => {
  beforeEach(() => {
    useProductFinder.setState({ cart: {}, user: null });
    apiCartUpsell.mockReset();
    apiCartUpsell.mockResolvedValue({ swaps: [], penetration: null, solution: null });
  });
  afterEach(() => useProductFinder.setState({ cart: {} }));

  it("renders nothing for an empty cart", () => {
    const { container } = render(<CartUpsellSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a Wesco service offer triggered by cart shape (pure, no fetch needed)", async () => {
    // A sold-by-the-foot wire line triggers the cut-to-length service locally.
    useProductFinder.setState({ cart: { W1: { product: p("W1", "Wire & Cable", 2, false, "FT"), qty: 500 } } });
    render(<CartUpsellSection />);
    expect(await screen.findByText("Add Wesco services")).toBeInTheDocument();
    expect(screen.getByText("Cut-to-length wire & cable")).toBeInTheDocument();
  });

  it("renders preferred swaps and swaps a line into the cart", async () => {
    const com = p("COM", "Circuit Breakers", 100, false);
    const pref = p("PREF", "Circuit Breakers", 95, true);
    useProductFinder.setState({ cart: { COM: { product: com, qty: 1 } } });
    apiCartUpsell.mockResolvedValue({
      swaps: [{ from: com, to: pref, qty: 1, unitPriceDelta: -5, marginDeltaPct: 0.08, lineMarginGain: 7.6 }],
      penetration: {
        before: { linePenetrationPct: 0, valuePenetrationPct: 0 },
        after: { linePenetrationPct: 100, valuePenetrationPct: 100 },
      },
      solution: null,
    });

    render(<CartUpsellSection />);
    expect(await screen.findByText("Preferred-brand swaps")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Swap" }));

    await waitFor(() => {
      const cart = useProductFinder.getState().cart;
      expect(cart["PREF"]).toBeTruthy(); // preferred added
      expect(cart["COM"]).toBeFalsy(); // commodity removed
    });
  });

  it("renders the segment package coverage with a gap add button", async () => {
    const seed = p("SW", "Switches", 3, false);
    const gap = p("WP", "Wall Plates & Covers", 1, true);
    useProductFinder.setState({ cart: { SW: { product: seed, qty: 1 } } });
    apiCartUpsell.mockResolvedValue({
      swaps: [],
      penetration: null,
      solution: {
        segment: { code: "EES", name: "Electrical & Electronic Solutions" },
        template: { id: "ees-branch-wiring", name: "Branch Wiring Package", description: "x" },
        coveragePct: 14, coveredCount: 1, totalCount: 7,
        gaps: [{ subcategory: "Wall Plates & Covers", product: gap }],
      },
    });

    render(<CartUpsellSection />);
    expect(await screen.findByText("Complete the Branch Wiring Package")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add Name WP to basket" }));
    await waitFor(() => expect(useProductFinder.getState().cart["WP"]).toBeTruthy());
  });
});
