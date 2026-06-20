import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { CatalogProduct } from "@/features/product-finder/types";
import type { CompanionItem } from "@/lib/product-finder-api";

const { apiCompanions } = vi.hoisted(() => ({
  apiCompanions: vi.fn<() => Promise<CompanionItem[]>>(),
}));
vi.mock("@/lib/product-finder-api", () => ({ apiCompanions }));

import { UpgradeCompletePanel } from "@/features/product-finder/UpgradeCompletePanel";
import { useProductFinder } from "@/lib/product-finder-store";

function prod(id: string, subcategory: string, unitPrice: number): CatalogProduct {
  return {
    id, sku: id, name: `Name ${id}`, brand: "Acme", category: "electrical", subcategory,
    description: "", unitPrice, uom: "EA", specs: [], preferred: false,
    branchStock: [], dcStock: [], externalSources: [], imageIcon: "x",
  };
}
function comp(id: string, subcategory: string, relation: CompanionItem["relation"]): CompanionItem {
  return { relation, attachScore: 70, reasons: [], sources: ["spec-rule"], product: prod(id, subcategory, 4) };
}

describe("UpgradeCompletePanel (component)", () => {
  beforeEach(() => {
    useProductFinder.setState({ cart: {} });
    apiCompanions.mockReset();
    apiCompanions.mockResolvedValue([]);
  });
  afterEach(() => useProductFinder.setState({ cart: {} }));

  it("renders nothing for a single product", () => {
    const { container } = render(<UpgradeCompletePanel products={[prod("A", "Receptacles & Outlets", 10)]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows companions the upgrade adds, excluding already-compared families", async () => {
    const base = prod("STD", "Receptacles & Outlets", 5);
    const upgrade = prod("GFCI", "Receptacles & Outlets", 25); // priciest → the upgrade
    // Upgrade's companions: a wall plate (already a compared family? no) + a weather cover.
    apiCompanions.mockResolvedValue([
      comp("WP", "Wall Plates & Covers", "required"),
      comp("WC", "Weather-Resistant Covers", "required"),
      comp("SELF", "Receptacles & Outlets", "recommended"), // same family as compared → dropped
    ]);

    render(<UpgradeCompletePanel products={[base, upgrade]} />);
    expect(await screen.findByText("Complete the upgrade")).toBeInTheDocument();
    expect(screen.getByText("Name WP")).toBeInTheDocument();
    expect(screen.getByText("Name WC")).toBeInTheDocument();
    // The Receptacles companion is filtered (family already represented).
    expect(screen.queryByText("Name SELF")).not.toBeInTheDocument();
  });

  it("adds an upgrade companion to the cart", async () => {
    const base = prod("STD", "Receptacles & Outlets", 5);
    const upgrade = prod("GFCI", "Receptacles & Outlets", 25);
    apiCompanions.mockResolvedValue([comp("WC", "Weather-Resistant Covers", "required")]);

    render(<UpgradeCompletePanel products={[base, upgrade]} />);
    const addBtn = await screen.findByRole("button", { name: "Add Name WC to basket" });
    fireEvent.click(addBtn);
    await waitFor(() => expect(useProductFinder.getState().cart["WC"]).toBeTruthy());
  });
});
