import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BomLineCard } from "@/features/product-finder/BomLineCard";
import type { BomLine, CatalogProduct, BranchStock, DCStock } from "@/features/product-finder/types";

// BomLineCard is a pure presentational component: it takes a `line` + an
// `onSelect` callback, reads nothing from the store and makes no network calls.
// So these tests just feed it realistic BomLine props and assert on the
// rendered output + the click handler.

// Collapse any whitespace (incl. the non-breaking space the chip uses) so we
// can match text that the component splits across several text nodes.
function normalize(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function prod(
  id: string,
  opts: { branch?: number; dc?: number } = {},
): CatalogProduct {
  const branchStock: BranchStock[] =
    opts.branch !== undefined
      ? [{ branchId: "b1", branchName: "Branch 1", city: "Pittsburgh", state: "PA", quantity: opts.branch }]
      : [];
  const dcStock: DCStock[] =
    opts.dc !== undefined
      ? [{ dcId: "d1", dcName: "DC 1", location: "Reno, NV", quantity: opts.dc }]
      : [];
  return {
    id,
    sku: `SKU-${id}`,
    name: `Product ${id}`,
    brand: "Acme",
    category: "electrical",
    subcategory: "Circuit Breakers",
    description: "",
    unitPrice: 20,
    uom: "ea",
    specs: [],
    preferred: false,
    branchStock,
    dcStock,
    externalSources: [],
    imageIcon: "ICON",
  };
}

function line(over: Partial<BomLine> = {}): BomLine {
  return {
    id: "L1",
    rawText: "2x 20A breaker",
    quantity: 2,
    description: "20A single-pole breaker",
    resolved: null,
    alternatives: [],
    ...over,
  };
}

describe("BomLineCard (render)", () => {
  it("renders quantity and description for an unresolved line and shows 'No match found'", () => {
    render(<BomLineCard line={line()} onSelect={vi.fn()} />);
    // Quantity chip renders the multiplication sign + qty (e.g. x2).
    expect(
      screen.getByText((_c, el) => normalize(el?.textContent) === "×2"),
    ).toBeInTheDocument();
    expect(screen.getByText("20A single-pole breaker")).toBeInTheDocument();
    // Unresolved branch: warning copy is shown and there is no Select button.
    expect(screen.getByText("No match found")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Select" })).toBeNull();
  });

  it("renders resolved product info + an 'In Stock' badge when branch stock is available", () => {
    const resolved = prod("A", { branch: 5 });
    render(<BomLineCard line={line({ resolved })} onSelect={vi.fn()} />);
    expect(screen.getByText("Product A")).toBeInTheDocument();
    expect(
      screen.getByText((_c, el) => normalize(el?.textContent).startsWith("SKU: SKU-A")),
    ).toBeInTheDocument();
    expect(screen.getByText("In Stock")).toBeInTheDocument();
    expect(screen.queryByText("No match found")).toBeNull();
    expect(screen.getByRole("button", { name: "Select" })).toBeInTheDocument();
  });

  it("shows 'DC Only' badge when there's no branch stock but DC stock exists", () => {
    const resolved = prod("B", { branch: 0, dc: 3 });
    render(<BomLineCard line={line({ resolved })} onSelect={vi.fn()} />);
    expect(screen.getByText("DC Only")).toBeInTheDocument();
  });

  it("shows 'Out of Stock' badge when neither branch nor DC stock exists", () => {
    const resolved = prod("C", { branch: 0, dc: 0 });
    render(<BomLineCard line={line({ resolved })} onSelect={vi.fn()} />);
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });

  it("renders a singular 'alt' chip for exactly one alternative", () => {
    const resolved = prod("A", { branch: 5 });
    render(
      <BomLineCard
        line={line({ resolved, alternatives: [prod("alt1", { branch: 1 })] })}
        onSelect={vi.fn()}
      />,
    );
    // 1 alternative -> singular "alt" (no trailing s). The chip splits its text
    // across nodes joined by a non-breaking space; normalize before matching.
    expect(
      screen.getByText((_c, el) => el?.tagName === "SPAN" && normalize(el.textContent) === "1 alt"),
    ).toBeInTheDocument();
  });

  it("renders a pluralized 'alts' chip for multiple alternatives", () => {
    const resolved = prod("A", { branch: 5 });
    render(
      <BomLineCard
        line={line({
          resolved,
          alternatives: [prod("alt1", { branch: 1 }), prod("alt2", { branch: 1 })],
        })}
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.getByText((_c, el) => el?.tagName === "SPAN" && normalize(el.textContent) === "2 alts"),
    ).toBeInTheDocument();
  });

  it("does NOT render the alts chip when there are zero alternatives", () => {
    const resolved = prod("A", { branch: 5 });
    render(<BomLineCard line={line({ resolved, alternatives: [] })} onSelect={vi.fn()} />);
    expect(
      screen.queryByText((_c, el) => el?.tagName === "SPAN" && /\balts?$/.test(normalize(el.textContent))),
    ).toBeNull();
  });

  it("invokes onSelect with the resolved product when Select is clicked", () => {
    const resolved = prod("A", { branch: 5 });
    const onSelect = vi.fn();
    render(<BomLineCard line={line({ resolved })} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    const calls = onSelect.mock.calls as unknown as [CatalogProduct][];
    expect(calls[0][0]).toBe(resolved);
  });
});
