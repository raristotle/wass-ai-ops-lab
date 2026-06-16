import { describe, it, expect, afterEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { BarcodeScannerModal } from "@/features/product-finder/BarcodeScannerModal";
import { useProductFinder } from "@/lib/product-finder-store";

// The modal uses next/navigation's useRouter — mock it so it renders in jsdom.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => {
  useProductFinder.setState({ barcodeOpen: false });
});

describe("BarcodeScannerModal (#20)", () => {
  it("renders the manual-entry fallback with no WCAG violations", async () => {
    // jsdom has no BarcodeDetector → the not-supported + manual-entry path renders.
    useProductFinder.setState({ barcodeOpen: true });
    const { container, getByLabelText } = render(<BarcodeScannerModal />);
    expect(getByLabelText(/part number/i)).toBeTruthy();
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("Escape closes the scanner (WCAG 2.1.2)", () => {
    useProductFinder.setState({ barcodeOpen: true });
    render(<BarcodeScannerModal />);
    expect(useProductFinder.getState().barcodeOpen).toBe(true);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(useProductFinder.getState().barcodeOpen).toBe(false);
  });
});
