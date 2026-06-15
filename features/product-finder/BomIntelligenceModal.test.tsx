import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BomIntelligenceModal } from "@/features/product-finder/BomIntelligenceModal";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(id: string): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 20, uom: "ea", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

const ROWS = {
  rows: [
    {
      sku: "A", qty: 4, product: { id: "A", sku: "A", name: "Product A", brand: "Acme", unitPrice: 20 },
      sourcingScore: 1,
      health: { grade: "C", score: 35, flags: ["EOL", "Single-source"], action: "Swap to the active successor we stock" },
      award: { switch: true, lineSavings: 12.5, rationale: "Stocked cross lands $12.50 cheaper.", best: { id: "B", label: "Acme B", kind: "cross", landedUnit: 16 }, currentLandedUnit: 21 },
    },
  ],
};

describe("BomIntelligenceModal (component)", () => {
  beforeEach(() => {
    useProductFinder.setState({ bomIqOpen: true, cart: { A: { product: prod("A"), qty: 4 } } });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ROWS })));
  });
  afterEach(() => {
    useProductFinder.setState({ bomIqOpen: false, cart: {} });
    vi.unstubAllGlobals();
  });

  it("renders the rollup and a graded line worklist from the analysis", async () => {
    render(<BomIntelligenceModal />);
    expect(screen.getByRole("dialog", { name: "BOM intelligence" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Product A/)).toBeInTheDocument());
    // Worklist action + landed-cost rationale surface.
    expect(screen.getByText(/Swap to the active successor/)).toBeInTheDocument();
    expect(screen.getByText(/cheaper/)).toBeInTheDocument();
  });

  it("prompts when the basket is empty", async () => {
    useProductFinder.setState({ cart: {} });
    render(<BomIntelligenceModal />);
    await waitFor(() => expect(screen.getByText(/basket is empty/)).toBeInTheDocument());
  });

  it("renders nothing when closed", () => {
    useProductFinder.setState({ bomIqOpen: false });
    const { container } = render(<BomIntelligenceModal />);
    expect(container).toBeEmptyDOMElement();
  });
});
