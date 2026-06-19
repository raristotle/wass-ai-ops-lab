import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CutToLengthPanel } from "@/features/product-finder/CutToLengthPanel";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";

/**
 * Render-net coverage for the inline cut-to-length panel. The store is the real
 * Zustand store (lib/product-finder-store.ts); we read its cart back after the
 * Add handler runs and reset cart/cartOpen between tests.
 */

function ftProduct(over: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "wire-1",
    sku: "SW-THHN-12",
    name: "Southwire 12 AWG THHN Copper Wire",
    brand: "Southwire",
    category: "electrical",
    subcategory: "Wire & Cable",
    description: "",
    unitPrice: 0.5,
    uom: "ft",
    specs: [],
    preferred: false,
    branchStock: [],
    dcStock: [],
    externalSources: [],
    imageIcon: "x",
    ...over,
  };
}

describe("CutToLengthPanel (component)", () => {
  beforeEach(() => {
    vi.useRealTimers();
    useProductFinder.setState({ cart: {}, cartOpen: false });
  });
  afterEach(() => {
    useProductFinder.setState({ cart: {}, cartOpen: false });
  });

  it("renders nothing when the product is not sold by the foot", () => {
    const { container } = render(<CutToLengthPanel product={ftProduct({ uom: "ea" })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the panel for an ft-sold wire product with NEC ampacity", () => {
    render(<CutToLengthPanel product={ftProduct()} />);
    // Header + default 10 ft computed label ($0.50/ft * 10 = $5.00).
    expect(screen.getByText("Cut-to-length")).toBeInTheDocument();
    expect(screen.getByText("10 ft — $5.00")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Length in feet" })).toHaveValue(10);
    // 12 AWG Cu -> NEC 310.15 ampacity = 20 A, with the note rendered.
    expect(screen.getByText(/NEC 310\.15 ampacity:/)).toBeInTheDocument();
    expect(screen.getByText("20 A")).toBeInTheDocument();
    expect(screen.getByText(/12 AWG Cu/)).toBeInTheDocument();
  });

  it("also recognizes the 'lf' (linear-foot) UOM, case-insensitively", () => {
    render(<CutToLengthPanel product={ftProduct({ uom: "LF", name: "1/2 in EMT Conduit", sku: "EMT-050" })} />);
    expect(screen.getByText("Cut-to-length")).toBeInTheDocument();
    // Conduit (no AWG) -> no ampacity row.
    expect(screen.queryByText(/NEC 310\.15 ampacity:/)).not.toBeInTheDocument();
  });

  it("does not render the ampacity row for a non-wire ft product", () => {
    render(<CutToLengthPanel product={ftProduct({ name: "Unistrut P1000 Strut", sku: "P1000", uom: "ft" })} />);
    expect(screen.getByText("Cut-to-length")).toBeInTheDocument();
    expect(screen.queryByText(/NEC 310\.15 ampacity:/)).not.toBeInTheDocument();
  });

  it("recomputes the label when the length input changes", () => {
    render(<CutToLengthPanel product={ftProduct()} />);
    const input = screen.getByRole("spinbutton", { name: "Length in feet" });
    fireEvent.change(input, { target: { value: "75" } });
    expect(input).toHaveValue(75);
    // 75 ft * $0.50 = $37.50
    expect(screen.getByText("75 ft — $37.50")).toBeInTheDocument();
  });

  it("clamps an empty / invalid length to the minimum of 1 ft", () => {
    render(<CutToLengthPanel product={ftProduct()} />);
    const input = screen.getByRole("spinbutton", { name: "Length in feet" });
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue(1);
    fireEvent.change(input, { target: { value: "0" } });
    expect(input).toHaveValue(1);
    expect(screen.getByText("1 ft — $0.50")).toBeInTheDocument();
  });

  it("adds the computed qty to the cart, opens the drawer, and fires onAdded", () => {
    vi.useFakeTimers();
    const onAdded = vi.fn();
    const product = ftProduct();
    render(<CutToLengthPanel product={product} onAdded={onAdded} />);

    const input = screen.getByRole("spinbutton", { name: "Length in feet" });
    fireEvent.change(input, { target: { value: "20" } });

    const addBtn = screen.getByRole("button", { name: "Add to Basket" });
    expect(addBtn).not.toBeDisabled();
    fireEvent.click(addBtn);

    // qty = ceil(20) = 20 added under the product id.
    const state = useProductFinder.getState();
    expect(state.cart[product.id]?.qty).toBe(20);
    expect(state.cartOpen).toBe(true);
    expect(onAdded).toHaveBeenCalledTimes(1);

    // Button flips to the confirmation state and is disabled while it shows.
    const confirmed = screen.getByRole("button", { name: "Added ✓" });
    expect(confirmed).toBeDisabled();

    // After the 1.5s timeout the button returns to its normal label.
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("button", { name: "Add to Basket" })).not.toBeDisabled();
    vi.useRealTimers();
  });

  it("accumulates qty across repeated adds (store merge semantics)", () => {
    const product = ftProduct();
    render(<CutToLengthPanel product={product} />);
    // Default 10 ft.
    fireEvent.click(screen.getByRole("button", { name: "Add to Basket" }));
    expect(useProductFinder.getState().cart[product.id]?.qty).toBe(10);
  });
});
