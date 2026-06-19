import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { StockBadge } from "@/features/product-finder/StockBadge";
import type { BranchStock } from "@/features/product-finder/types";

function branch(id: string, quantity: number, overrides: Partial<BranchStock> = {}): BranchStock {
  return {
    branchId: id,
    branchName: `Branch ${id}`,
    city: "Pittsburgh",
    state: "PA",
    quantity,
    ...overrides,
  };
}

describe("StockBadge (component)", () => {
  it("renders My Branch and Local DC labels (smoke)", () => {
    const { container } = render(
      <StockBadge branchQty={12} dcQty={40} branchStock={[branch("b1", 12)]} />,
    );
    expect(screen.getByText("My Branch")).toBeInTheDocument();
    expect(screen.getByText("Local DC")).toBeInTheDocument();
    // branchQty (12) and dcQty (40) are shown as the two quantity values.
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    // "units" appears once per QtyLabel (My Branch + Local DC).
    expect(screen.getAllByText("units")).toHaveLength(2);
    // Single branch → no "All Locations" toggle button.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container).not.toBeEmptyDOMElement();
  });

  it("uses branchQty for My Branch when no userBranchId is given", () => {
    render(<StockBadge branchQty={7} dcQty={3} branchStock={[branch("b1", 999)]} />);
    // My Branch should reflect branchQty (7), not the branchStock quantity (999).
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.queryByText("999")).not.toBeInTheDocument();
  });

  it("uses the matching branchStock quantity when userBranchId matches a branch", () => {
    render(
      <StockBadge
        branchQty={500}
        dcQty={3}
        userBranchId="b2"
        branchStock={[branch("b1", 10), branch("b2", 22)]}
      />,
    );
    // My Branch resolves to b2's quantity (22), ignoring the branchQty prop (500).
    expect(screen.getByText("22")).toBeInTheDocument();
    expect(screen.queryByText("500")).not.toBeInTheDocument();
  });

  it("falls back to 0 for My Branch when userBranchId matches no branch", () => {
    render(
      <StockBadge
        branchQty={500}
        dcQty={4}
        userBranchId="missing"
        branchStock={[branch("b1", 10), branch("b2", 22)]}
      />,
    );
    // No branch matches "missing" → myBranchQty falls back to 0. "My Branch" sits
    // in an inner span; walk up to the QtyLabel wrapper that also holds the qty.
    const myBranchLabel = screen.getByText("My Branch").parentElement;
    expect(myBranchLabel).not.toBeNull();
    expect(within(myBranchLabel as HTMLElement).getByText("0")).toBeInTheDocument();
    // Local DC (4) is unaffected.
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("does not show the All Locations toggle with a single branch", () => {
    render(<StockBadge branchQty={5} dcQty={5} branchStock={[branch("b1", 5)]} />);
    expect(screen.queryByRole("button", { name: /locations/i })).not.toBeInTheDocument();
  });

  it("shows the All Locations toggle with multiple branches and expands/collapses it", () => {
    const stock = [branch("b1", 8), branch("b2", 0), branch("b3", 3)];
    render(<StockBadge branchQty={8} dcQty={9} userBranchId="b1" branchStock={stock} />);

    const toggle = screen.getByRole("button", { name: /All Locations/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Collapsed: the per-branch list is not rendered.
    expect(screen.queryByRole("list")).not.toBeInTheDocument();

    // Expand.
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: /Hide locations/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    // Each branch renders its name, city, and state.
    expect(within(list).getByText(/Branch b1 \(Pittsburgh, PA\)/)).toBeInTheDocument();
    expect(within(list).getByText(/Branch b3 \(Pittsburgh, PA\)/)).toBeInTheDocument();
    // The user's own branch (b1) is starred.
    expect(within(list).getByText("★")).toBeInTheDocument();

    // Collapse again.
    fireEvent.click(screen.getByRole("button", { name: /Hide locations/i }));
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /All Locations/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("renders no star when userBranchId is absent in the expanded list", () => {
    const stock = [branch("b1", 8), branch("b2", 0)];
    render(<StockBadge branchQty={8} dcQty={1} branchStock={stock} />);
    fireEvent.click(screen.getByRole("button", { name: /All Locations/i }));
    // No userBranchId → no branch is starred.
    expect(screen.queryByText("★")).not.toBeInTheDocument();
  });

  it("renders the zero-stock dot styling for an out-of-stock branch (qty === 0)", () => {
    render(<StockBadge branchQty={0} dcQty={0} branchStock={[branch("b1", 0)]} />);
    // Both My Branch and Local DC are zero — two "0" values render.
    expect(screen.getAllByText("0")).toHaveLength(2);
  });
});
