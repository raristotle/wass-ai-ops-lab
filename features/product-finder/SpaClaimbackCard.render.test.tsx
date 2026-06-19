import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import { SpaClaimbackCard } from "@/features/product-finder/SpaClaimbackCard";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct, ProductCategory } from "@/features/product-finder/types";
import type { SavedQuote, QuoteStatus } from "@/lib/product-finder-quotes";

// Build a minimal-but-valid CatalogProduct (mirrors the helper in the other
// product-finder component tests). `brand` drives whether an SPA in
// lib/product-finder-spa.ts (SPA_REGISTRY) matches — "Square D"/"Eaton" match,
// "Acme" does not.
function prod(id: string, brand = "Square D", category: ProductCategory = "electrical"): CatalogProduct {
  return {
    id,
    sku: id,
    name: `${brand} ${id}`,
    brand,
    category,
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 100,
    uom: "ea",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "x",
  };
}

function quote(
  partial: Partial<SavedQuote> & Pick<SavedQuote, "number" | "lines" | "status">,
): SavedQuote {
  return {
    id: partial.id ?? partial.number,
    project: "",
    customer: "Gulf Coast Electric",
    customerId: null,
    total: 0,
    createdAt: 1_700_000_000_000,
    ...partial,
  } as SavedQuote;
}

describe("SpaClaimbackCard (component)", () => {
  beforeEach(() => useProductFinder.setState({ quotes: [] }));
  afterEach(() => useProductFinder.setState({ quotes: [] }));

  it("renders nothing when there are no quotes (lineCount === 0)", () => {
    const { container } = render(<SpaClaimbackCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when won quotes have no SPA-eligible brands", () => {
    // "Acme" is not in SPA_REGISTRY → no claimable lines → card hidden.
    useProductFinder.setState({
      quotes: [quote({ number: "Q-1", status: "won" as QuoteStatus, lines: [{ product: prod("X", "Acme"), qty: 5 }] })],
    });
    const { container } = render(<SpaClaimbackCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when SPA-eligible lines exist only on non-won quotes", () => {
    // Only WON quotes are summed; a sent quote with a Square D line must not show.
    useProductFinder.setState({
      quotes: [quote({ number: "Q-2", status: "sent" as QuoteStatus, lines: [{ product: prod("A"), qty: 3 }] })],
    });
    const { container } = render(<SpaClaimbackCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the claim-back summary for won quotes with SPA-eligible lines", () => {
    useProductFinder.setState({
      quotes: [
        quote({ number: "Q-100", status: "won" as QuoteStatus, lines: [{ product: prod("A", "Square D"), qty: 2 }] }),
        // A single-line manufacturer to exercise the singular "line" branch.
        quote({ number: "Q-101", status: "won" as QuoteStatus, lines: [{ product: prod("B", "Eaton"), qty: 1 }] }),
        // A non-won quote that must be ignored by the summary.
        quote({ number: "Q-102", status: "lost" as QuoteStatus, lines: [{ product: prod("C", "Square D"), qty: 9 }] }),
      ],
    });
    render(<SpaClaimbackCard />);

    const section = screen.getByRole("region", { name: "SPA rebate claim-back" });
    expect(within(section).getByText("SPA Rebate Claim-Back")).toBeInTheDocument();

    // Two eligible lines across the two won quotes (the lost quote is excluded).
    expect(within(section).getByText("Eligible lines")).toBeInTheDocument();
    expect(within(section).getByText("2")).toBeInTheDocument();

    // Per-manufacturer breakdown lists both brands; Eaton has exactly one line
    // → singular "1 line", Square D 2-qty single line → also "1 line".
    expect(within(section).getByText("Square D")).toBeInTheDocument();
    expect(within(section).getByText("Eaton")).toBeInTheDocument();
    expect(within(section).getAllByText("1 line").length).toBeGreaterThanOrEqual(2);

    // The headline total is a formatted USD value > $0.
    const total = section.querySelector("p.text-2xl");
    expect(total?.textContent ?? "").toMatch(/^\$\d/);
  });

  it("uses the plural 'lines' label when a manufacturer has multiple eligible lines", () => {
    useProductFinder.setState({
      quotes: [
        quote({
          number: "Q-200",
          status: "won" as QuoteStatus,
          lines: [
            { product: prod("A", "Square D"), qty: 2 },
            { product: prod("B", "Square D"), qty: 4 },
          ],
        }),
      ],
    });
    render(<SpaClaimbackCard />);
    const section = screen.getByRole("region", { name: "SPA rebate claim-back" });
    expect(within(section).getByText("2 lines")).toBeInTheDocument();
  });

  it("exports a claim-file CSV when the export button is clicked", () => {
    // jsdom lacks URL.createObjectURL / anchor download; stub them so downloadCsv
    // (lib/product-finder-csv) runs without throwing and we can assert it fired.
    const createObjectURL = vi.fn(() => "blob:spa");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL } as unknown as typeof URL);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    useProductFinder.setState({
      quotes: [
        quote({
          number: "Q-300",
          customer: "Gulf Coast Electric",
          status: "won" as QuoteStatus,
          lines: [{ product: prod("A", "Square D"), qty: 2 }],
        }),
      ],
    });
    render(<SpaClaimbackCard />);

    fireEvent.click(screen.getByRole("button", { name: "Export claim file (CSV)" }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("applies the customer-scoped SPA (CUST-001 Square D → higher rebate) over the brand rule", () => {
    // SPA_REGISTRY has a CUST-001-scoped Square D agreement at 12% that beats the
    // 8% brand rule. The same Square D line should yield a strictly larger claim
    // for CUST-001 than for a walk-in (null) customer.
    const line = { product: prod("A", "Square D"), qty: 3 };
    const totalFor = (customerId: string | null) => {
      act(() => {
        useProductFinder.setState({
          quotes: [quote({ number: `Q-${customerId ?? "WALKIN"}`, status: "won" as QuoteStatus, customerId, lines: [line] })],
        });
      });
      const { unmount } = render(<SpaClaimbackCard />);
      const text = screen.getByRole("region", { name: "SPA rebate claim-back" }).querySelector("p.text-2xl")?.textContent ?? "";
      unmount();
      return Number(text.replace(/[^0-9.]/g, ""));
    };

    const walkInTotal = totalFor(null);
    const scopedTotal = totalFor("CUST-001");
    expect(scopedTotal).toBeGreaterThan(walkInTotal);
  });
});
