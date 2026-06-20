import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { SlimCompanion } from "@/lib/product-finder-api";

const { apiCompanionsAttach } = vi.hoisted(() => ({
  apiCompanionsAttach: vi.fn<() => Promise<SlimCompanion[]>>(),
}));
vi.mock("@/lib/product-finder-api", () => ({ apiCompanionsAttach }));

import { CustomerReorderNudge } from "@/features/product-finder/CustomerReorderNudge";
import { useProductFinder } from "@/lib/product-finder-store";

const NOW = "2026-06-01T00:00:00.000Z";

function nudge(id: string, name: string): SlimCompanion {
  return {
    relation: "recommended", attachScore: 50, reasons: ["Often added"],
    product: { id, sku: id, name, brand: "Acme", subcategory: "Wall Plates & Covers", unitPrice: 4, uom: "EA", imageIcon: "x", preferred: false, inStock: true },
  };
}

describe("CustomerReorderNudge (component)", () => {
  beforeEach(() => {
    useProductFinder.setState({ user: null });
    apiCompanionsAttach.mockReset();
    apiCompanionsAttach.mockResolvedValue([]);
    if (typeof localStorage !== "undefined") localStorage.clear();
  });
  afterEach(() => {
    if (typeof localStorage !== "undefined") localStorage.clear();
  });

  it("renders the subscription selector and previews the next reorder date when set", () => {
    render(<CustomerReorderNudge orderId="O1" skus={["CB-1"]} nowIso={NOW} />);
    const select = screen.getByLabelText("Subscribe to reorder") as HTMLSelectElement;
    expect(select.value).toBe(""); // off by default
    fireEvent.change(select, { target: { value: "monthly" } });
    // monthly = +30 days from 2026-06-01 → 2026-07-01
    expect(screen.getByText(/Next reorder 2026-07-01/)).toBeInTheDocument();
    // Persisted to localStorage.
    expect(localStorage.getItem("sub:O1")).toBe("monthly");
  });

  it("restores a saved cadence from localStorage", () => {
    localStorage.setItem("sub:O2", "weekly");
    render(<CustomerReorderNudge orderId="O2" skus={["CB-1"]} nowIso={NOW} />);
    expect((screen.getByLabelText("Subscribe to reorder") as HTMLSelectElement).value).toBe("weekly");
  });

  it("shows attach nudges from the companion rail", async () => {
    apiCompanionsAttach.mockResolvedValue([nudge("WP", "Wall Plate"), nudge("LB", "Cable Label")]);
    render(<CustomerReorderNudge orderId="O3" skus={["SW-1"]} nowIso={NOW} />);
    expect(await screen.findByText("Customers also add")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Wall Plate/ })).toBeInTheDocument();
  });
});
