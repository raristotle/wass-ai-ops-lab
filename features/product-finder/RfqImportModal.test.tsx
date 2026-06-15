import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RfqImportModal } from "@/features/product-finder/RfqImportModal";
import { useProductFinder } from "@/lib/product-finder-store";

describe("RfqImportModal (component)", () => {
  beforeEach(() => useProductFinder.setState({ rfqOpen: true }));
  afterEach(() => useProductFinder.setState({ rfqOpen: false }));

  it("renders the RFQ dialog with customer/project inputs and a disabled match button when empty", () => {
    render(<RfqImportModal />);
    expect(screen.getByRole("dialog", { name: "Inbound RFQ auto-quote" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Gulf Coast Industrial")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Warehouse fit-out")).toBeInTheDocument();
    // Match is disabled until a BOM is pasted.
    expect(screen.getByRole("button", { name: "Match BOM" })).toBeDisabled();
  });

  it("renders nothing when closed", () => {
    useProductFinder.setState({ rfqOpen: false });
    const { container } = render(<RfqImportModal />);
    expect(container).toBeEmptyDOMElement();
  });
});
