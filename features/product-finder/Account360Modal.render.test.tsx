import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CatalogProduct } from "@/features/product-finder/types";

const { apiAdjacency } = vi.hoisted(() => ({
  apiAdjacency: vi.fn<() => Promise<Record<string, { to: string; required: boolean }[]>>>(),
}));
vi.mock("@/lib/product-finder-api", () => ({ apiAdjacency }));

import { Account360Modal } from "@/features/product-finder/Account360Modal";
import { useProductFinder } from "@/lib/product-finder-store";

function p(subcategory: string, unitPrice: number): CatalogProduct {
  return {
    id: subcategory, sku: subcategory, name: subcategory, brand: "Acme", category: "electrical", subcategory,
    description: "", unitPrice, uom: "EA", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const quote = (lines: { product: CatalogProduct; qty: number }[]): any => ({
  id: "Q1", number: "Q-1", customer: "Acme", customerId: null, lines, status: "draft", createdAt: 0,
});

describe("Account360Modal (component)", () => {
  beforeEach(() => {
    apiAdjacency.mockReset();
    apiAdjacency.mockResolvedValue({ "Circuit Breakers": [{ to: "Lugs & Wire Connectors", required: true }] });
    useProductFinder.setState({ account360Open: false, quotes: [], activeCustomerId: null });
  });
  afterEach(() => useProductFinder.setState({ account360Open: false, quotes: [] }));

  it("is not rendered when closed", () => {
    const { container } = render(<Account360Modal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the empty state when the account has no history", async () => {
    useProductFinder.setState({ account360Open: true, quotes: [] });
    render(<Account360Modal />);
    expect(await screen.findByText(/No quote history/)).toBeInTheDocument();
  });

  it("derives whitespace from purchased families via the adjacency graph", async () => {
    useProductFinder.setState({
      account360Open: true,
      quotes: [quote([{ product: p("Circuit Breakers", 200), qty: 5 }])],
    });
    render(<Account360Modal />);
    // Whitespace section surfaces the required companion family they don't buy.
    expect(await screen.findByText("Whitespace — pitch these")).toBeInTheDocument();
    expect(screen.getByText("Lugs & Wire Connectors")).toBeInTheDocument();
    expect(screen.getByText("What they buy")).toBeInTheDocument();
    expect(screen.getAllByText("Circuit Breakers").length).toBeGreaterThan(0); // family they buy
  });
});
