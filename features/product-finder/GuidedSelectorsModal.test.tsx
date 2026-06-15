import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GuidedSelectorsModal } from "@/features/product-finder/GuidedSelectorsModal";
import { useProductFinder } from "@/lib/product-finder-store";

/**
 * Render + compute proof for the guided NEC selectors (the browser-equivalent
 * check, since the product-finder page is auth-gated). fetch is stubbed so the
 * resolve-to-product step completes without a network call.
 */
describe("GuidedSelectorsModal (component)", () => {
  beforeEach(() => {
    useProductFinder.setState({ guidedOpen: true });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ items: [], total: 0, page: 0, pageSize: 1, facets: [] }) })),
    );
  });
  afterEach(() => {
    useProductFinder.setState({ guidedOpen: false });
    vi.unstubAllGlobals();
  });

  it("renders the three calculators and the conduit-fill default inputs", () => {
    render(<GuidedSelectorsModal />);
    expect(screen.getByRole("dialog", { name: "Guided engineering selectors" })).toBeInTheDocument();
    expect(screen.getByText("Conduit fill")).toBeInTheDocument();
    expect(screen.getByText("Wire size")).toBeInTheDocument();
    expect(screen.getByText("Breaker sizing")).toBeInTheDocument();
  });

  it("computes a conduit-fill recommendation on Calculate (9×12 AWG → 1/2\" EMT)", async () => {
    render(<GuidedSelectorsModal />);
    // Default is 12 AWG / EMT; set count to 9.
    const count = screen.getByLabelText("Number of conductors");
    fireEvent.change(count, { target: { value: "9" } });
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
    // The answer span renders exactly "1/2\" EMT" (the explanation sentence is separate).
    await waitFor(() => expect(screen.getByText('1/2" EMT')).toBeInTheDocument());
  });

  it("renders nothing when closed", () => {
    useProductFinder.setState({ guidedOpen: false });
    const { container } = render(<GuidedSelectorsModal />);
    expect(container).toBeEmptyDOMElement();
  });
});
