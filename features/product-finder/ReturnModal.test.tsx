import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReturnModal } from "@/features/product-finder/ReturnModal";
import { useProductFinder } from "@/lib/product-finder-store";
import type { CatalogProduct } from "@/features/product-finder/types";

function prod(id: string): CatalogProduct {
  return {
    id, sku: id, name: `Product ${id}`, brand: "Acme", category: "electrical", subcategory: "Circuit Breakers",
    description: "", unitPrice: 20, uom: "ea", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}

const order = {
  id: "order-1",
  placedAt: 1_700_000_000_000,
  lines: [{ product: prod("A"), qty: 3 }, { product: prod("B"), qty: 1 }],
  total: 80,
  customerId: null,
  customerName: null,
};

describe("ReturnModal (component)", () => {
  beforeEach(() => useProductFinder.setState({ orders: [order], returns: [], returnModalOrderId: "order-1" }));
  afterEach(() => useProductFinder.setState({ returnModalOrderId: null, orders: [], returns: [] }));

  it("renders the order's lines and disables Generate RMA until a line is chosen", () => {
    render(<ReturnModal />);
    expect(screen.getByRole("dialog", { name: "Start a return" })).toBeInTheDocument();
    expect(screen.getByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("Product B")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate RMA" })).toBeDisabled();
  });

  it("creates an RMA when a line is selected and submitted", () => {
    render(<ReturnModal />);
    fireEvent.click(screen.getAllByRole("checkbox")[0]); // select first line
    const btn = screen.getByRole("button", { name: "Generate RMA" });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    const returns = useProductFinder.getState().returns;
    expect(returns).toHaveLength(1);
    expect(returns[0].orderId).toBe("order-1");
    expect(returns[0].status).toBe("requested");
  });

  it("renders nothing when no order is targeted", () => {
    useProductFinder.setState({ returnModalOrderId: null });
    const { container } = render(<ReturnModal />);
    expect(container).toBeEmptyDOMElement();
  });
});
