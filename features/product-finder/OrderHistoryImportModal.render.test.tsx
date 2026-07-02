import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { OrderHistoryManifest, OrderHistoryStatus, OrderHistoryImportResult } from "@/lib/product-finder-api";

const { apiOrderHistoryStatus, apiImportOrderHistory, apiClearOrderHistory } = vi.hoisted(() => ({
  apiOrderHistoryStatus: vi.fn<() => Promise<OrderHistoryStatus>>(),
  apiImportOrderHistory: vi.fn<() => Promise<OrderHistoryImportResult>>(),
  apiClearOrderHistory: vi.fn<() => Promise<boolean>>(),
}));
vi.mock("@/lib/product-finder-api", () => ({ apiOrderHistoryStatus, apiImportOrderHistory, apiClearOrderHistory }));

import { OrderHistoryImportModal } from "@/features/product-finder/OrderHistoryImportModal";
import { useProductFinder } from "@/lib/product-finder-store";

function manifest(over: Partial<OrderHistoryManifest> = {}): OrderHistoryManifest {
  return {
    version: 1, customer: "Gulf Coast Industrial", orders: 120, lines: 540, resolved: 500, unresolved: 40,
    distinctSkus: 88, distinctSubcategories: 14, rulesMined: 22,
    topPairs: [{ a: "Circuit Breakers", b: "Lugs & Wire Connectors", lift: 3.2, count: 41 }],
    importedAtIso: "2026-06-20T00:00:00.000Z", ...over,
  };
}

describe("OrderHistoryImportModal (component)", () => {
  beforeEach(() => {
    useProductFinder.setState({ orderHistoryOpen: false });
    apiOrderHistoryStatus.mockReset().mockResolvedValue({ durable: true, manifest: null });
    apiImportOrderHistory.mockReset();
    apiClearOrderHistory.mockReset().mockResolvedValue(true);
  });
  afterEach(() => useProductFinder.setState({ orderHistoryOpen: false }));

  it("is not rendered when closed", () => {
    const { container } = render(<OrderHistoryImportModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the empty state when nothing is imported", async () => {
    useProductFinder.setState({ orderHistoryOpen: true });
    render(<OrderHistoryImportModal />);
    expect(await screen.findByText(/No order history imported yet/)).toBeInTheDocument();
  });

  it("renders the active manifest + top pairs when history exists", async () => {
    apiOrderHistoryStatus.mockResolvedValue({ durable: true, manifest: manifest() });
    useProductFinder.setState({ orderHistoryOpen: true });
    render(<OrderHistoryImportModal />);
    expect(await screen.findByText(/Behavioral signal active/)).toBeInTheDocument();
    // The consequent is unique to the top-pair row (the antecedent "Circuit Breakers"
    // now also appears as a B8 "Explore …" deep-link button, so match on the pair's b + lift).
    expect(screen.getByText(/Lugs & Wire Connectors/)).toBeInTheDocument();
    expect(screen.getByText(/3.2× lift/)).toBeInTheDocument();
    // B8: the deep-link chip to the awakened surface renders the antecedent subcategory.
    expect(screen.getByRole("button", { name: /Explore Circuit Breakers/ })).toBeInTheDocument();
  });

  it("imports pasted CSV and shows the mining headline", async () => {
    apiImportOrderHistory.mockResolvedValue({ ok: true, persisted: "postgres", manifest: manifest(), headline: "Imported 120 orders → mined 22 co-purchase rules." });
    useProductFinder.setState({ orderHistoryOpen: true });
    render(<OrderHistoryImportModal />);

    const ta = await screen.findByLabelText("Order lines (CSV)");
    fireEvent.change(ta, { target: { value: "order,sku,qty\n1,CB-1,5\n1,WP-1,5" } });
    fireEvent.click(screen.getByRole("button", { name: /Import & mine/ }));

    await waitFor(() => expect(apiImportOrderHistory).toHaveBeenCalled());
    expect(await screen.findByText(/mined 22 co-purchase rules/)).toBeInTheDocument();
  });

  it("surfaces a server error without crashing", async () => {
    apiImportOrderHistory.mockResolvedValue({ error: "No SKU column found." });
    useProductFinder.setState({ orderHistoryOpen: true });
    render(<OrderHistoryImportModal />);
    fireEvent.change(await screen.findByLabelText("Order lines (CSV)"), { target: { value: "a,b\n1,2" } });
    fireEvent.click(screen.getByRole("button", { name: /Import & mine/ }));
    expect(await screen.findByText("No SKU column found.")).toBeInTheDocument();
  });
});
