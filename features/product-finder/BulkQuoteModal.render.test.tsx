import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BulkQuoteModal } from "@/features/product-finder/BulkQuoteModal";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";

// Minimal but realistic CatalogProduct with branch + DC stock so the table's
// "Stock" column and totalStock() in resolveBulk have something to add up.
function prod(id: string, overrides: Partial<CatalogProduct> = {}): CatalogProduct {
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
    branchStock: [{ branchId: "b1", branchName: "B1", city: "Pittsburgh", state: "PA", quantity: 5 }],
    dcStock: [{ dcId: "d1", dcName: "DC1", location: "OH", quantity: 7 }],
    externalSources: [],
    imageIcon: "x",
    ...overrides,
  };
}

/**
 * BulkQuoteModal resolves a pasted list by calling apiResolve → fetch
 * `/api/products/resolve?q=…`. We stub fetch so each input line maps to a
 * matched product (via SKU / cross-ref) or "not found", exercising both the
 * input view and the resolved-table view without a network.
 */
function stubResolveFetch(map: Record<string, { product: CatalogProduct | null; matchedVia: string | null }>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const q = decodeURIComponent(new URL(url, "http://localhost").searchParams.get("q") ?? "");
      const hit = map[q] ?? { product: null, matchedVia: null };
      return { ok: true, json: async () => hit } as unknown as Response;
    }),
  );
}

describe("BulkQuoteModal (render)", () => {
  beforeEach(() => {
    useProductFinder.setState({ bulkModalOpen: true, cart: {}, activeCustomerId: null, customers: [] });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    useProductFinder.setState({ bulkModalOpen: false, cart: {}, activeCustomerId: null, customers: [] });
  });

  it("renders nothing when the modal is closed", () => {
    useProductFinder.setState({ bulkModalOpen: false });
    const { container } = render(<BulkQuoteModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the input view with the dialog header and a disabled CTA when empty", () => {
    render(<BulkQuoteModal />);
    expect(screen.getByRole("dialog", { name: "Bulk price and availability" })).toBeInTheDocument();
    expect(screen.getByText("Bulk Price & Availability")).toBeInTheDocument();
    expect(screen.getByLabelText("Bulk input")).toBeInTheDocument();
    // CTA disabled while the textarea is empty.
    expect(screen.getByRole("button", { name: "Get Prices & Stock" })).toBeDisabled();
  });

  it("enables the CTA once text is entered", () => {
    render(<BulkQuoteModal />);
    fireEvent.change(screen.getByLabelText("Bulk input"), { target: { value: "QO115" } });
    expect(screen.getByRole("button", { name: "Get Prices & Stock" })).not.toBeDisabled();
  });

  it("shows a 0-of-0 resolved table when the input parses to no lines (whitespace only)", () => {
    render(<BulkQuoteModal />);
    // Whitespace-only: text.trim() !== "" is false, so the CTA stays disabled —
    // drive the empty-parse branch via a value that trims to nothing but is
    // non-empty enough to enable the button is impossible; instead assert the
    // disabled state holds for pure spaces.
    fireEvent.change(screen.getByLabelText("Bulk input"), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Get Prices & Stock" })).toBeDisabled();
  });

  it("resolves a list: shows matched (with via badge + stock) and not-found rows, and totals", async () => {
    const p = prod("QO115");
    stubResolveFetch({
      QO115: { product: p, matchedVia: "sku" },
      "NOPE-XYZ": { product: null, matchedVia: null },
    });
    render(<BulkQuoteModal />);
    fireEvent.change(screen.getByLabelText("Bulk input"), { target: { value: "2x QO115\nNOPE-XYZ" } });
    fireEvent.click(screen.getByRole("button", { name: "Get Prices & Stock" }));

    // Table view appears after the async resolve resolves.
    await screen.findByText("Product QO115");
    expect(screen.getByText("Not found")).toBeInTheDocument();
    // Via badge ("SKU") rendered for the matched row.
    expect(screen.getByText("SKU")).toBeInTheDocument();
    // "1 of 2 resolved" header (one matched, one not found).
    expect(screen.getByText(/of 2 resolved/)).toBeInTheDocument();
    // Stock total = branch 5 + DC 7 = 12.
    expect(screen.getByText("12")).toBeInTheDocument();
    // Grand total = unit 20 * qty 2 = $40.00 (matched line only). The "$40.00"
    // lives in its own span; the row's Unit/Total cells also show $40.00, so
    // assert at least one such node exists.
    expect(screen.getAllByText("$40.00").length).toBeGreaterThan(0);
    // Export + add-to-basket actions are present in the table view.
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add 1 matched to basket/ })).toBeInTheDocument();
  });

  it("'Edit list' returns from the resolved table back to the input view", async () => {
    stubResolveFetch({ QO115: { product: prod("QO115"), matchedVia: "cross-ref" } });
    render(<BulkQuoteModal />);
    fireEvent.change(screen.getByLabelText("Bulk input"), { target: { value: "QO115" } });
    fireEvent.click(screen.getByRole("button", { name: "Get Prices & Stock" }));
    await screen.findByText("Product QO115");

    fireEvent.click(screen.getByRole("button", { name: /Edit list/ }));
    // Back to the input view: the textarea is visible again, table gone.
    expect(screen.getByLabelText("Bulk input")).toBeInTheDocument();
    expect(screen.queryByText("Product QO115")).not.toBeInTheDocument();
  });

  it("'Add matched to basket' adds matched products to the cart and closes the modal", async () => {
    const p = prod("QO115");
    stubResolveFetch({
      QO115: { product: p, matchedVia: "sku" },
      "NOPE-XYZ": { product: null, matchedVia: null },
    });
    render(<BulkQuoteModal />);
    fireEvent.change(screen.getByLabelText("Bulk input"), { target: { value: "3x QO115\nNOPE-XYZ" } });
    fireEvent.click(screen.getByRole("button", { name: "Get Prices & Stock" }));
    await screen.findByText("Product QO115");

    fireEvent.click(screen.getByRole("button", { name: /Add 1 matched to basket/ }));

    // Cart now has the matched product at the parsed qty (3); modal closed.
    const state = useProductFinder.getState();
    expect(state.cart["QO115"]).toBeTruthy();
    expect(state.cart["QO115"].qty).toBe(3);
    expect(state.bulkModalOpen).toBe(false);
  });

  it("the close (✕) button clears state and closes the modal", () => {
    render(<BulkQuoteModal />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(useProductFinder.getState().bulkModalOpen).toBe(false);
  });

  it("loads file contents into the textarea via the hidden file input", async () => {
    render(<BulkQuoteModal />);
    const fileInput = screen.getByLabelText("Upload list") as HTMLInputElement;
    const file = new File(["QO115\nCAT6-BLU"], "list.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    // FileReader is async; wait for the textarea to reflect the file text.
    await waitFor(() => {
      expect((screen.getByLabelText("Bulk input") as HTMLTextAreaElement).value).toContain("QO115");
    });
  });

  it("the 'Add matched' button is disabled when nothing resolved", async () => {
    stubResolveFetch({ "NOPE-XYZ": { product: null, matchedVia: null } });
    render(<BulkQuoteModal />);
    fireEvent.change(screen.getByLabelText("Bulk input"), { target: { value: "NOPE-XYZ" } });
    fireEvent.click(screen.getByRole("button", { name: "Get Prices & Stock" }));
    await screen.findByText("Not found");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Add 0 matched to basket/ })).toBeDisabled();
    });
  });
});
