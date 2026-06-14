import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrandSwitcher } from "@/features/product-finder/BrandSwitcher";
import { useProductFinder } from "@/lib/product-finder-store";

describe("BrandSwitcher (component)", () => {
  beforeEach(() => {
    useProductFinder.getState().setBrandId("meridian");
  });

  it("renders the configured brand options", () => {
    render(<BrandSwitcher />);
    expect(screen.getByRole("option", { name: "Meridian Supply Co." })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Wesco" })).toBeInTheDocument();
  });

  it("flips the active brand in the store when changed", () => {
    render(<BrandSwitcher />);
    const select = screen.getByLabelText("White-label brand");
    fireEvent.change(select, { target: { value: "wesco" } });
    expect(useProductFinder.getState().brandId).toBe("wesco");
  });
});
